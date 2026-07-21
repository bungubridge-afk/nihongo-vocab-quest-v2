/**
 * The two identity concepts this app deliberately keeps separate (see
 * docs/USER_PROFILE_IDENTITY_SPEC.md):
 *
 * - displayName ("Anzeigename"): free-form, duplicates allowed across users.
 * - username ("Nutzer-ID"): unique handle, case-insensitive, shown as "@handle".
 *   Stored in the DB without the "@"; the UI adds it back for display.
 *
 * The Supabase internal auth.users UUID is never part of this type — it is never
 * shown to the user anywhere in the app.
 */
export interface AppUserProfile {
  displayName: string | null;
  /** Without the leading "@". Always lowercase when non-null. */
  username: string | null;
  /** True once both displayName and username have been set at least once. */
  isComplete: boolean;
  profileCompletedAt: string | null;
}

/** Local shape of the `user_profiles` row this app reads/writes (superset kept
 *  in sync with `src/types/database.ts` — see that file for the full Row type). */
export interface UserProfileIdentityRow {
  user_id: string;
  display_name: string | null;
  username: string | null;
  profile_completed_at: string | null;
  username_changed_at: string | null;
}

export function mapProfileRowToAppProfile(
  row: Pick<
    UserProfileIdentityRow,
    "display_name" | "username" | "profile_completed_at"
  >
): AppUserProfile {
  return {
    displayName: row.display_name,
    username: row.username,
    isComplete: row.profile_completed_at !== null,
    profileCompletedAt: row.profile_completed_at,
  };
}
