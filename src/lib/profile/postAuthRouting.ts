import { sanitizeInternalRedirect } from "@/lib/auth/redirect";
import { isProfileComplete } from "@/lib/profile/profileValidation";
import type { AppUserProfile } from "@/types/userProfile";

/**
 * Single choke point for "where does this user land right after signing in" — used
 * by the email+password login page, the signup page's immediate-session path, and
 * the shared /auth/callback route (email confirmation + Google OAuth). Having every
 * auth entry point call this same pure function is what guarantees the
 * incomplete-profile redirect can never be forgotten on one path but not another.
 *
 * A missing profile (fetch failed, or the row genuinely doesn't exist yet) is
 * treated as incomplete — this fails toward asking for setup, never toward silently
 * skipping it.
 */
export function resolvePostAuthDestination(
  profile: Pick<
    AppUserProfile,
    "displayName" | "username" | "profileCompletedAt"
  > | null,
  rawNext: unknown
): string {
  const safeNext = sanitizeInternalRedirect(rawNext);
  if (profile === null || !isProfileComplete(profile)) {
    return `/profile/setup?next=${encodeURIComponent(safeNext)}`;
  }
  return safeNext;
}
