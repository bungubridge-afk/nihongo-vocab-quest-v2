import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME, SSR_FALLBACK_LOCALE } from "@/i18n/config";
import { normalizeLocale } from "@/i18n/localeValidation";
import type { AppLocale } from "@/i18n/types";

/**
 * Server-side locale used to render the shell: reads the nvq_locale cookie in the
 * root layout so `<html lang>`, `<title>`/description metadata, and the client
 * LanguageProvider all start from the SAME value — no language flip on hydration.
 *
 * Falls back to German (SSR_FALLBACK_LOCALE) when no valid cookie exists. That is
 * deliberate: every pre-i18n user is German, so an existing user whose cookie
 * hasn't been set yet must never flash English. A genuinely new browser with no
 * progress is redirected to the bilingual /language screen on the client, so it
 * never dwells on this fallback.
 */
export async function getServerLocale(): Promise<AppLocale> {
  const store = await cookies();
  const raw = store.get(LOCALE_COOKIE_NAME)?.value;
  return normalizeLocale(raw) ?? SSR_FALLBACK_LOCALE;
}
