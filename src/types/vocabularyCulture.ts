/**
 * Japan-Notiz: one short, factual culture note per Zukan word — "in Japan ist das
 * so", anchored in everyday life, signage, language habits or travel situations.
 *
 * Strictly display-only and strictly separate from the learning data: never used
 * for quiz generation, XP, unlocks or the search index, and never loaded/rendered
 * for a hidden (undiscovered) card. Accuracy beats humor: notes prefer stable
 * linguistic/orthographic facts over cultural generalizations, and hedge scope
 * with words like „oft“, „viele“, „meist“.
 */

export type CultureNoteType =
  | "daily-life"
  | "language"
  | "writing"
  | "travel"
  | "etymology";

export interface VocabularyCultureNote {
  vocabId: string;
  type: CultureNoteType;
  /** 1–3 German sentences. No stereotypes, no absolute claims, no fake etymology. */
  japanNoteGerman: string;
}
