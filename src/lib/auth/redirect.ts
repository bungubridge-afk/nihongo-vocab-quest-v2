/**
 * Open-redirect protection for every post-auth redirect (`next` query params,
 * callback targets). Only app-internal absolute paths pass; everything else falls
 * back to a safe default.
 */

const DEFAULT_REDIRECT = "/account";

export function sanitizeInternalRedirect(
  value: unknown,
  fallback: string = DEFAULT_REDIRECT
): string {
  if (typeof value !== "string") return fallback;
  const candidate = value.trim();

  if (candidate === "" || candidate.length > 512) return fallback;
  // Must be an absolute in-app path: exactly one leading slash.
  if (!candidate.startsWith("/")) return fallback;
  // "//host" (protocol-relative) and "/\host" (browser quirk) escape the origin.
  if (candidate.startsWith("//") || candidate.startsWith("/\\")) return fallback;
  // No backslashes, control characters or embedded schemes anywhere.
  if (/[\\\r\n\t\0]/.test(candidate)) return fallback;
  if (candidate.includes(":")) return fallback;

  return candidate;
}
