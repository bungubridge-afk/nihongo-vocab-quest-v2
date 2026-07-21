import { getMessages } from "@/i18n/getMessages";
import type { AppLocale } from "@/i18n/types";

/**
 * Maps Postgres/Supabase errors from the profile RPCs to fixed messages in the
 * current app language. Raw error text (constraint names, SQLSTATE details,
 * PostgREST internals) is never shown to the user — every path collapses to one of
 * a small set of localized strings.
 *
 * Custom error codes are raised by the SQL functions in
 * supabase/migrations/20260720000001_user_identity_profiles.sql:
 *   P0101 invalid_display_name
 *   P0102 invalid_username
 *   P0103 username_taken
 *   P0104 profile_not_found
 * Postgres' own `23505` (unique_violation) is handled too, as a fallback in case a
 * write path ever reaches the unique index without going through the RPC's own
 * `unique_violation` handler.
 */

interface ProfileErrorLike {
  code?: string;
  message?: string;
}

export function mapProfileError(
  error: ProfileErrorLike | null,
  locale: AppLocale
): string {
  const m = getMessages(locale).profileErrors;
  if (error === null) return m.generic;
  switch (error.code) {
    case "P0101":
      return m.invalidDisplayName;
    case "P0102":
      return m.invalidUsername;
    case "P0103":
    case "23505":
      return m.usernameTaken;
    case "P0104":
      return m.generic;
    default:
      return m.generic;
  }
}
