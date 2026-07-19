import type { CardStatus, CategoryId } from "@/types/learning";
import type { ZukanStatus } from "@/types/vocabularyCollection";

/**
 * Pure status logic for the Kotoba-Zukan view. Lives outside the page component so the
 * automated validation can exercise exactly the code the page runs.
 *
 * Privacy by construction: `getCardStatus` accepts only `{ id, categoryId }` — the
 * type signature makes it impossible for status decisions to read a hidden card's
 * kanji/kana/romaji/German. The search-index privacy on the Vocabulary page relies on
 * this invariant.
 */

/** The subset of progress the status decision needs — matches the storage facade. */
export interface ZukanProgressView {
  collectedCards: string[];
  knownWords: string[];
  weakWords: string[];
  unlockedCategories: CategoryId[];
}

export interface ZukanCardRef {
  id: string;
  categoryId: CategoryId;
}

/**
 * Check order: weak ("Im Training") wins over everything, then known ("Vertraut"),
 * then collected ("Entdeckt"). Known is deliberately checked before collected — a
 * practiced word is always still in collectedCards, and checking collected first
 * would make the "Vertraut" state unreachable.
 */
export function getCardStatus(card: ZukanCardRef, progress: ZukanProgressView): CardStatus {
  if (progress.weakWords.includes(card.id)) return "ueben";
  if (progress.knownWords.includes(card.id)) return "gelernt";
  if (progress.collectedCards.includes(card.id)) return "gesammelt";
  if (
    progress.unlockedCategories.includes(card.categoryId) &&
    !progress.collectedCards.includes(card.id)
  ) {
    return "sammelbar";
  }
  return "locked";
}

/** Locked and not-yet-collected cards are hidden: no text field may ever be read. */
export function isHiddenStatus(status: CardStatus): boolean {
  return status === "locked" || status === "sammelbar";
}

/** Maps the internal CardStatus onto the four learner-facing Zukan states. */
export function getZukanStatus(status: CardStatus): ZukanStatus {
  switch (status) {
    case "ueben":
      return "training";
    case "gelernt":
      return "vertraut";
    case "gesammelt":
      return "entdeckt";
    default:
      return "unentdeckt";
  }
}
