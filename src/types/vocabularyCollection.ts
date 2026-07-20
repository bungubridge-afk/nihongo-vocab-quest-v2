import type { CategoryId } from "@/types/learning";

/**
 * Display-only metadata for the "Kotoba-Zukan" (collection lexicon) view of the
 * Vocabulary page. Strictly presentational: nothing in these types feeds XP, level,
 * unlock, quiz generation or the search index — the learning data stays untouched in
 * `VocabItem` (src/types/learning.ts).
 *
 * Hierarchy (see docs/VOCABULARY_COLLECTION_ARCHITECTURE.md):
 *   Area → Kategorie → Kapitel (Chapter) → Vocabulary Entry
 * This lets a category (e.g. Café) grow with future chapters — added orders, drinks,
 * payment, … — without ever being treated as "permanently complete".
 */

/** Content areas of the collection. `area1` = "Erste Schritte in Japan" today; future
 *  areas add `"area2"`, `"area3"`, … here. */
export type CollectionAreaId = "area1";

/** Top level of the hierarchy. Ordered by `order`. */
export interface VocabularyCollectionArea {
  id: CollectionAreaId;
  order: number;
  titleGerman: string;
  subtitleGerman: string;
}

/** A chapter groups a handful of entries inside one category of one area. New chapters
 *  can be appended to an existing category later — that is the whole point of this level. */
export interface VocabularyCollectionChapter {
  id: string;
  areaId: CollectionAreaId;
  categoryId: CategoryId;
  /** Order of this chapter within its category. */
  order: number;
  titleGerman: string;
  subtitleGerman: string;
  /** The vocab ids this chapter contains, in intended learning order. */
  entryIds: string[];
}

/** One word's Zukan entry — keyed by the word's `VocabItem.id` in the data file. */
export interface VocabularyCollectionEntry {
  /**
   * Stable, 1-based collection number. Assigned once and never changed, even when new
   * words are added later. It is the word's permanent "dex number" for display only —
   * it must NOT be used as the sort key (that is `area/category/chapter/entryOrder`).
   */
  collectionNumber: number;
  /** Which area this entry belongs to. */
  areaId: CollectionAreaId;
  /** Which chapter this entry belongs to (must be a chapter whose `entryIds` include it). */
  chapterId: string;
  /** 1-based position of this entry within its chapter — the real display-order key. */
  entryOrder: number;
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
  /**
   * @deprecated Category-wide "complete" flavor. Kept only for backward compatibility;
   * completion is now decided per chapter/area, never per category (a category can
   * always gain new chapters). Not rendered anywhere.
   */
  flavorGerman: string;
  /** Which of the page's inline SVG icons to render — never an external asset. */
  iconKey: "cup" | "torii" | "book" | "chat";
}

// ---------------------------------------------------------------------------
// Progress view models (Phase 6) — computed at render from existing progress,
// never stored. `total` counts only entries that exist today; a not-yet-shipped
// future chapter never inflates a total.
// ---------------------------------------------------------------------------

/** Discovery progress of a single chapter. */
export interface ChapterProgressView {
  chapterId: string;
  categoryId: CategoryId;
  titleGerman: string;
  discovered: number;
  total: number;
  remaining: number;
  /** True when every entry currently in this chapter is discovered (not hidden). */
  isCompleted: boolean;
}

/**
 * Collection view of one category. There is deliberately no `isCompleted` here — a
 * category is never "permanently complete"; instead callers read `completedChapters`
 * vs `availableChapters` for the chapters that exist right now.
 */
export interface CategoryCollectionView {
  categoryId: CategoryId;
  discoveredWords: number;
  totalWords: number;
  availableChapters: number;
  completedChapters: number;
  chapters: ChapterProgressView[];
}

/** Discovery progress of a whole area, aggregated over its currently-available chapters. */
export interface AreaProgressView {
  areaId: CollectionAreaId;
  discoveredWords: number;
  totalWords: number;
  availableChapters: number;
  completedChapters: number;
  /** True when every currently-available chapter of the area is completed. */
  isCompleted: boolean;
}

/**
 * The learner-facing collection state of a card. Mapped from the existing
 * `CardStatus` (locked/sammelbar/gesammelt/ueben/gelernt) — display vocabulary only,
 * the underlying progress data does not change.
 */
export type ZukanStatus = "unentdeckt" | "entdeckt" | "training" | "vertraut";
