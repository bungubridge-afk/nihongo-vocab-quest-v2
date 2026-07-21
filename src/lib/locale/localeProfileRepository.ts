import type { AppSupabaseClient } from "@/lib/supabase/client";
import type { AppLocale } from "@/i18n/types";
import { normalizeLocale } from "@/i18n/localeValidation";

/**
 * The seam between the locale system and the signed-in user's profile row.
 * `user_profiles.locale` already exists (paid-foundation migration) and is the
 * per-account source of truth for a logged-in user's language on any device.
 *
 * Both functions are defensive: a read never throws (returns null on any error so
 * the app falls back to cookie/legacy logic), and a write only ever touches the
 * caller's own row via RLS (`auth.uid() = user_id`), updating `locale` alone —
 * it never reads or writes user_progress, entitlements, XP or revision.
 */

/** Reads and validates the signed-in user's stored locale. Returns null if unset,
 *  invalid, or unreadable — the caller then uses the cookie/legacy fallback. */
export async function fetchProfileLocale(
  client: AppSupabaseClient
): Promise<AppLocale | null> {
  try {
    const { data, error } = await client
      .from("user_profiles")
      .select("locale")
      .maybeSingle();
    if (error || data === null) return null;
    return normalizeLocale((data as { locale?: unknown }).locale);
  } catch {
    return null;
  }
}

/**
 * Persists the chosen locale to the signed-in user's own profile row. Best-effort:
 * resolves to true on success, false on any failure (offline, RLS, transient
 * error) so the caller can surface a gentle "couldn't save to your account" note
 * without the cookie/UI change being rolled back. Updating only the `locale`
 * column leaves progress, entitlements and revision completely untouched.
 */
export async function saveProfileLocale(
  client: AppSupabaseClient,
  userId: string,
  locale: AppLocale
): Promise<boolean> {
  try {
    const { error } = await client
      .from("user_profiles")
      .update({ locale })
      .eq("user_id", userId);
    return !error;
  } catch {
    return false;
  }
}
