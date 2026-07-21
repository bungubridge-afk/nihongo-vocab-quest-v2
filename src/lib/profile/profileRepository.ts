import type { AppSupabaseClient } from "@/lib/supabase/client";
import type { UserProfileRow } from "@/types/database";
import type { AppUserProfile } from "@/types/userProfile";
import { mapProfileRowToAppProfile } from "@/types/userProfile";

/**
 * Remote persistence for the two identity fields. Thin, side-effect-free wrapper
 * around `user_profiles` reads and the profile RPCs — all validation policy lives in
 * `profileValidation.ts` (client-side, instant feedback) and the SQL functions
 * (server-side, final authority). Follows the same shape as
 * `progress/supabaseProgressRepository.ts`: plain functions, throw on error with
 * `error.code` preserved so callers can map it to German text.
 */

/**
 * Fetches the signed-in user's own profile. RLS guarantees this can never return
 * another user's row. Returns `null` only if the row itself is missing (should not
 * happen — the signup trigger creates it — but the repository stays defensive rather
 * than assuming).
 */
export async function fetchOwnProfile(
  client: AppSupabaseClient
): Promise<AppUserProfile | null> {
  const { data, error } = await client
    .from("user_profiles")
    .select("display_name, username, profile_completed_at")
    .maybeSingle();

  if (error) {
    throw new Error(`user_profiles fetch failed: ${error.code ?? "unknown"}`);
  }
  if (data === null) return null;

  return mapProfileRowToAppProfile(data);
}

export interface ProfileRpcError extends Error {
  code?: string;
}

function toRpcError(error: { code?: string; message?: string }): ProfileRpcError {
  const wrapped: ProfileRpcError = new Error(
    `profile RPC failed: ${error.code ?? "unknown"}`
  );
  wrapped.code = error.code;
  return wrapped;
}

/**
 * First-time profile setup. Throws a `ProfileRpcError` (with `.code` set to the
 * SQL function's custom error code) on validation failure or a taken username — the
 * caller maps that via `mapProfileErrorToGerman`.
 */
export async function completeUserProfile(
  client: AppSupabaseClient,
  displayName: string,
  username: string
): Promise<AppUserProfile> {
  const { data, error } = await client.rpc("complete_user_profile", {
    p_display_name: displayName,
    p_username: username,
  });
  if (error) throw toRpcError(error);
  return mapProfileRowToAppProfile(data as UserProfileRow);
}

/** Free-form display name change — no uniqueness, no reserved-word check. */
export async function updateDisplayName(
  client: AppSupabaseClient,
  displayName: string
): Promise<AppUserProfile> {
  const { data, error } = await client.rpc("update_display_name", {
    p_display_name: displayName,
  });
  if (error) throw toRpcError(error);
  return mapProfileRowToAppProfile(data as UserProfileRow);
}

/** Explicit, separate username change — re-validated and re-checked for uniqueness. */
export async function updateUsername(
  client: AppSupabaseClient,
  username: string
): Promise<AppUserProfile> {
  const { data, error } = await client.rpc("update_username", {
    p_username: username,
  });
  if (error) throw toRpcError(error);
  return mapProfileRowToAppProfile(data as UserProfileRow);
}

/**
 * Availability probe only — never a confirmed guarantee (someone else may claim the
 * name between this check and the actual save). The final authority is always the
 * DB unique index via `completeUserProfile`/`updateUsername`. Returns `null` (rather
 * than throwing) on a network/RPC error, since this is advisory UI feedback, not a
 * blocking operation — the caller shows a neutral "checking" state and lets the
 * real save attempt surface any error.
 */
export async function checkUsernameAvailable(
  client: AppSupabaseClient,
  username: string
): Promise<boolean | null> {
  const { data, error } = await client.rpc("is_username_available", {
    p_username: username,
  });
  if (error) return null;
  return data === true;
}
