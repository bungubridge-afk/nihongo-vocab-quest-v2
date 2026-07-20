import { sanitizeInternalRedirect } from "@/lib/auth/redirect";

/**
 * Builds the absolute callback URL passed to Supabase's `signInWithOAuth`
 * `redirectTo` option. The `next` param is re-sanitized here (defense in depth,
 * on top of whatever the caller already sanitized) so an OAuth start can never be
 * used to smuggle an external/open redirect through the provider round-trip.
 */
export function buildOAuthCallbackUrl(origin: string, nextParam: unknown): string {
  const safeNext = sanitizeInternalRedirect(nextParam);
  return `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
