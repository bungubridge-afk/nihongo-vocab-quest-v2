import { APP_LOCALES } from "@/i18n/config";
import type { AppLocale } from "@/i18n/types";

/**
 * Validation/normalization for every external locale source: the nvq_locale
 * cookie, user_profiles.locale from the DB, and the browser language (used only
 * as a pre-selection candidate on /language, never auto-committed). Nothing in
 * the app may treat a raw external string as an AppLocale without passing
 * through here first.
 */

/** Strict membership check — exact "en"/"de" only. */
export function isSupportedLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (APP_LOCALES as readonly string[]).includes(value);
}

/**
 * Lenient-but-safe normalization: trims, lowercases, and reduces a BCP-47-style
 * tag to its primary subtag ("EN" → "en", "de-AT" → "de", "en_US" → "en").
 * Everything else — "fr", "", "ja", nonsense, injection attempts — returns null.
 * Callers decide what null means (fall back, ask the user, ignore); this function
 * never invents a locale.
 */
export function normalizeLocale(value: unknown): AppLocale | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "" || trimmed.length > 35) return null;
  const primary = trimmed.split(/[-_]/, 1)[0];
  return isSupportedLocale(primary) ? primary : null;
}

/**
 * Pre-selection candidate for the /language screen, derived from the browser's
 * language list. Returns null when nothing matches — the screen then simply has
 * no pre-selected card. This value is NEVER persisted or auto-confirmed; only an
 * explicit user choice writes the cookie.
 */
export function getBrowserLocaleCandidate(
  languages: readonly string[] | undefined
): AppLocale | null {
  for (const language of languages ?? []) {
    const normalized = normalizeLocale(language);
    if (normalized !== null) return normalized;
  }
  return null;
}
