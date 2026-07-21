/**
 * Core locale types for the bilingual (English/German) app.
 *
 * `AppLocale` is deliberately a closed union of exactly two values — every other
 * string (browser languages like "en-US", tampered cookies, unexpected DB values)
 * must pass through `normalizeLocale`/`isSupportedLocale` in
 * `src/i18n/localeValidation.ts` before it may ever be treated as a locale.
 *
 * Japanese is the LEARNING language, never an explanation locale — kanji, kana,
 * romaji, Japanese example sentences and Japanese answer choices are shared,
 * untranslated content across both locales.
 */

export type AppLocale = "en" | "de";

/**
 * One piece of explanation-language text, authored in both app locales. Used by the
 * localized content data (word meanings, tips, Zukan notes, chapter titles, …) so
 * a missing translation is a TypeScript error at the data definition, not a runtime
 * fallback. UI strings live in the message catalogs instead (src/i18n/messages/).
 */
export interface LocalizedText {
  en: string;
  de: string;
}

/** Picks one language variant out of a LocalizedText. The only sanctioned way to
 *  collapse localized content into a display string. */
export function pickText(text: LocalizedText, locale: AppLocale): string {
  return text[locale];
}
