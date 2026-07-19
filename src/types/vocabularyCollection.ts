import type { CategoryId } from "@/types/learning";

/**
 * Display-only metadata for the "Kotoba-Zukan" (collection lexicon) view of the
 * Vocabulary page. Strictly presentational: nothing in these types feeds XP, level,
 * unlock, quiz generation or the search index — the learning data stays untouched in
 * `VocabItem` (src/types/learning.ts).
 */

/** One word's Zukan entry — keyed by the word's `VocabItem.id` in the data file. */
export interface VocabularyCollectionEntry {
  /** 1-based, unique across the whole collection, ordered by category then data order. */
  collectionNumber: number;
  /** 1–2 playful-but-accurate German sentences describing the word's "character". */
  dexDescriptionGerman: string;
  /** Where/when the learner actually uses the word (German). */
  usageRoleGerman: string;
  /** Short German memory hint: particle, pattern or form worth remembering. */
  memoryHookGerman: string;
}

/** The Zukan-panel presentation of one word category (Café, Reise, …). */
export interface VocabularyCategoryCollectionData {
  categoryId: CategoryId;
  titleGerman: string;
  subtitleGerman: string;
  /** Shown when the category is fully discovered ("Café komplett"-style flavor). */
  flavorGerman: string;
  /** Which of the page's inline SVG icons to render — never an external asset. */
  iconKey: "cup" | "torii" | "book" | "chat";
}

/**
 * The learner-facing collection state of a card. Mapped from the existing
 * `CardStatus` (locked/sammelbar/gesammelt/ueben/gelernt) — display vocabulary only,
 * the underlying progress data does not change.
 */
export type ZukanStatus = "unentdeckt" | "entdeckt" | "training" | "vertraut";
