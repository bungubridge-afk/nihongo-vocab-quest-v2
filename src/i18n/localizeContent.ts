import type { AppLocale } from "@/i18n/types";
import { contentTranslations } from "@/i18n/contentTranslations";

/**
 * Translation layer for learning-DATA explanation text (quest/sub-quest questions,
 * word meanings, tips, examples, Zukan notes, culture notes, category metadata).
 *
 * Why a source-keyed dictionary instead of inlining `{en,de}` into every data
 * entry: the German data files (vocabData, questData, subQuestData/*, …) remain the
 * single authored source and are never edited for translation, and the mapping from
 * each German string to its English counterpart lives in exactly one file
 * (contentTranslations.ts) — one source of truth, verifiable for completeness by a
 * script (see the automated validation). It also gives the "don't translate
 * Japanese" rule for free: Japanese-only strings (kanji/kana/romaji, Japanese
 * example sentences and answer choices) simply have no dictionary entry, so they
 * pass through unchanged.
 *
 * German (`de`) always returns the original string verbatim — zero indirection, so
 * the German experience is byte-for-byte what it was before i18n. English (`en`)
 * looks the string up; a missing entry falls back to the German source (never a
 * crash, never an empty string) and is caught by the coverage test rather than
 * shipped as a blank.
 */
export function localizeContent(germanText: string, locale: AppLocale): string {
  if (locale === "de") return germanText;
  return contentTranslations[germanText] ?? germanText;
}

/** True if every non-empty input has an English entry — used by the coverage test
 *  to assert the dictionary is complete for a given set of source strings. */
export function hasContentTranslation(germanText: string): boolean {
  return germanText.trim() === "" || germanText in contentTranslations;
}
