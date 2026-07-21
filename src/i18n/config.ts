import type { AppLocale } from "@/i18n/types";

/**
 * Single source of truth for which explanation locales exist. Adding a third
 * language later means extending this tuple (and the compiler will then point at
 * every catalog/content file that must grow a variant).
 */
export const APP_LOCALES = ["en", "de"] as const;

/**
 * The locale assumed for anything that existed before the language selection was
 * introduced: all legacy users are German users (the app shipped German-only), so
 * missing locale information for an account/browser WITH existing progress always
 * resolves to "de" — never to a guess from the browser language. A brand-new
 * browser with no progress is instead sent to /language to choose explicitly.
 */
export const LEGACY_LOCALE: AppLocale = "de";

/**
 * The locale used to server-render the shell when no cookie exists yet. German on
 * purpose: every pre-i18n user is German (see LEGACY_LOCALE), so an existing user
 * whose cookie hasn't been written yet must never see an English flash. A truly
 * new browser is redirected to the bilingual /language screen immediately anyway.
 */
export const SSR_FALLBACK_LOCALE: AppLocale = "de";

/** Cookie that persists the chosen locale ("en" | "de") across visits. Shared by
 *  the server layout (SSR `<html lang>`, metadata) and the client provider. */
export const LOCALE_COOKIE_NAME = "nvq_locale";

/** One year — long enough to survive between learning sessions, refreshed on every
 *  explicit change. No secret lives in this cookie; it only ever holds "en"/"de". */
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** The route of the initial language-selection screen. */
export const LANGUAGE_SELECT_PATH = "/language";
