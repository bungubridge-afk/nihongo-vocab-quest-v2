import type { AppUserProfile } from "@/types/userProfile";
import type { AppLocale } from "@/i18n/types";
import { formatMessage, getMessages } from "@/i18n/getMessages";

/**
 * Pure validation/normalization for the two identity fields ("Anzeigename" /
 * "Nutzer-ID"). Every rule here is mirrored in the SQL migration
 * (supabase/migrations/20260720000001_user_identity_profiles.sql) — the DB is the
 * final authority, this module exists so the UI can give instant, specific
 * feedback (in the current app language) without a round trip.
 *
 * Length note: all length checks use `[...value].length` (Unicode codepoint count via
 * array spread), NOT `value.length` (UTF-16 code units). Postgres `char_length()` also
 * counts codepoints, so this keeps client and server validation in agreement — see
 * docs/USERNAME_POLICY.md.
 */

// ---------------------------------------------------------------------------
// Username ("Nutzer-ID")
// ---------------------------------------------------------------------------

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

/** Same shape as the DB CHECK constraint: 3-20 chars, lowercase a-z0-9_, first and
 *  last character alphanumeric. A 3-char username ("abc") satisfies this: the
 *  1-18-char middle group can be as short as one character. */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_]{1,18}[a-z0-9]$/;

/** Mirrors `reserved_usernames` in the SQL migration — keep both lists in sync. */
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  "admin",
  "administrator",
  "support",
  "help",
  "official",
  "nihongo",
  "nihongoquest",
  "moderator",
  "system",
  "root",
  "api",
  "account",
  "login",
  "signup",
  "settings",
  "profile",
]);

/**
 * Strips an optional leading "@" (users may paste "@mada_jp"), trims, and
 * lowercases. Does not validate — call `validateUsername` for that.
 */
export function normalizeUsername(raw: string): string {
  const withoutAt = raw.trim().replace(/^@+/, "");
  return withoutAt.trim().toLowerCase();
}

export function isReservedUsername(normalizedUsername: string): boolean {
  return RESERVED_USERNAMES.has(normalizedUsername);
}

/** "@" + username, for display only. Expects an already-normalized username. */
export function formatUsername(username: string): string {
  return `@${username}`;
}

/**
 * Validates a raw (not-yet-normalized) username input and returns a German error
 * message, or `null` if the normalized form is valid and not reserved. Availability
 * (is anyone else already using it) is a separate, async concern — see
 * `profileRepository.ts` / `is_username_available`.
 */
export function validateUsername(raw: string, locale: AppLocale): string | null {
  const m = getMessages(locale).profileErrors;
  const normalized = normalizeUsername(raw);

  if (normalized === "") {
    return m.emptyUsername;
  }
  if (/\s/.test(normalized)) {
    return m.usernameNoSpaces;
  }
  if (normalized.includes("-")) {
    return m.usernameNoHyphens;
  }

  const length = [...normalized].length;
  if (length < USERNAME_MIN_LENGTH) {
    return formatMessage(m.usernameTooShort, { min: USERNAME_MIN_LENGTH });
  }
  if (length > USERNAME_MAX_LENGTH) {
    return formatMessage(m.usernameTooLong, { max: USERNAME_MAX_LENGTH });
  }
  if (normalized.startsWith("_")) {
    return m.usernameNoLeadingUnderscore;
  }
  if (normalized.endsWith("_")) {
    return m.usernameNoTrailingUnderscore;
  }
  if (!USERNAME_PATTERN.test(normalized)) {
    return m.usernameInvalidChars;
  }
  if (isReservedUsername(normalized)) {
    return m.usernameReserved;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Display name ("Anzeigename")
// ---------------------------------------------------------------------------

export const DISPLAY_NAME_MIN_LENGTH = 1;
export const DISPLAY_NAME_MAX_LENGTH = 30;

/**
 * True if `value` contains any C0 control character (codepoint 0-31, e.g. newline,
 * tab, carriage return) or DEL (127), anywhere in the string. Implemented as a
 * numeric codepoint comparison — deliberately NOT a regex character class — so the
 * ranges are unambiguous plain numbers (0x20, 0x7f) in the source rather than literal
 * control bytes or escape sequences that are easy to mis-type or mis-render.
 */
function containsControlCharacter(value: string): boolean {
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) {
      return true;
    }
  }
  return false;
}

/**
 * Validates a raw display name. Control characters (including newlines) are
 * rejected outright rather than silently stripped, so what the user typed is what
 * gets judged. Plain leading/trailing spaces are trimmed before the emptiness/length
 * checks (not an error by themselves). HTML-looking text like "<b>" is valid input
 * and safe: React renders it as plain text, never as markup (no
 * dangerouslySetInnerHTML is ever used for a display name).
 */
export function validateDisplayName(raw: string, locale: AppLocale): string | null {
  const m = getMessages(locale).profileErrors;
  if (containsControlCharacter(raw)) {
    return m.displayNameControlChars;
  }

  const trimmed = raw.trim();
  if (trimmed === "") {
    return m.displayNameEmpty;
  }

  const length = [...trimmed].length;
  if (length > DISPLAY_NAME_MAX_LENGTH) {
    return formatMessage(m.displayNameTooLong, { max: DISPLAY_NAME_MAX_LENGTH });
  }
  return null;
}

// ---------------------------------------------------------------------------
// OAuth metadata prefill (Google today, other providers later)
// ---------------------------------------------------------------------------

/**
 * Best-effort display-name candidate from OAuth provider metadata (e.g. Google's
 * `full_name`/`name` claims). Purely a prefill suggestion for the setup form's text
 * field — the user still has to confirm (and can change) it before it is ever
 * written to the DB via `complete_user_profile`. Never derives a name from the email
 * address: the local-part before "@" is not a name and must not be guessed as one.
 */
export function getDisplayNameCandidateFromMetadata(
  metadata: Record<string, unknown> | null | undefined
): string {
  if (!metadata) return "";
  const candidate = metadata.full_name ?? metadata.name;
  if (typeof candidate !== "string") return "";
  const trimmed = candidate.trim();
  if (trimmed === "" || containsControlCharacter(trimmed)) return "";
  // Defensively truncate to the max length so a long OAuth-provided name doesn't
  // immediately fail validation the moment the setup form prefills it.
  return [...trimmed].slice(0, DISPLAY_NAME_MAX_LENGTH).join("");
}

// ---------------------------------------------------------------------------
// Completeness
// ---------------------------------------------------------------------------

/**
 * A profile is "complete" only when all three conditions hold. Checking
 * displayName/username directly (not just profileCompletedAt) is defense in depth
 * against any future DB state where they could diverge from the timestamp.
 */
export function isProfileComplete(
  profile: Pick<AppUserProfile, "displayName" | "username" | "profileCompletedAt">
): boolean {
  return (
    profile.profileCompletedAt !== null &&
    profile.displayName !== null &&
    profile.displayName.trim() !== "" &&
    profile.username !== null &&
    profile.username.trim() !== ""
  );
}
