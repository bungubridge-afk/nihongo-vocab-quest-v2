import {
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
} from "@/i18n/config";
import type { AppLocale } from "@/i18n/types";
import { normalizeLocale } from "@/i18n/localeValidation";

/**
 * The one place that reads/writes the nvq_locale cookie on the client. The server
 * side reads the same cookie via `next/headers` in the root layout (see
 * src/app/layout.tsx) so SSR html lang / metadata and the client provider always
 * start from the identical value — no hydration language flip.
 *
 * The cookie holds exactly "en" or "de", nothing else, and is not HttpOnly on
 * purpose: the client must read it synchronously before React mounts. It carries
 * zero secrets and zero personal data.
 */

export function readLocaleCookie(): AppLocale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE_NAME}=`));
  if (!match) return null;
  // normalizeLocale rejects tampered/legacy values instead of trusting them.
  return normalizeLocale(decodeURIComponent(match.slice(LOCALE_COOKIE_NAME.length + 1)));
}

export function writeLocaleCookie(locale: AppLocale): void {
  if (typeof document === "undefined") return;
  // SameSite=Lax + Path=/ so the whole app (and the OAuth round-trip back to
  // /auth/callback, a top-level navigation) sees the same choice. `secure` is
  // added on https origins; localhost dev over http still works without it.
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}
