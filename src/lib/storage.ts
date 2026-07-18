import type { CategoryId, OnboardingProfile, QuestCategory } from "@/types/learning";
import {
  calculateLevelFromXp,
  getUnlockedCategoriesFromCompleted,
} from "@/lib/levelSystem";
import {
  getActiveProgress,
  updateActiveProgress,
} from "@/lib/progress/progressStore";
import { createInitialProgress } from "@/lib/progress/progressTypes";

/**
 * Progress facade used by every page. The function signatures are unchanged from the
 * original localStorage implementation — pages neither know nor care whether the data
 * behind them is the anonymous localStorage progress or the signed-in user's synced
 * cache. All reads/writes go through the active backend in
 * `src/lib/progress/progressStore.ts`.
 */

export function getProfile(): OnboardingProfile | null {
  return getActiveProgress().profile;
}

export function saveProfile(profile: OnboardingProfile): void {
  updateActiveProgress((current) => ({ ...current, profile }));
}

/** Replaces the previous direct `localStorage.removeItem("nvq_profile")` call. */
export function clearProfile(): void {
  updateActiveProgress((current) => ({ ...current, profile: null }));
}

export function getXP(): number {
  return getActiveProgress().xp;
}

export function setXP(xp: number): void {
  updateActiveProgress((current) => ({ ...current, xp }));
}

export function addXP(amount: number): number {
  return updateActiveProgress((current) => ({
    ...current,
    xp: current.xp + amount,
  })).xp;
}

export function getLevel(): number {
  return calculateLevelFromXp(getXP());
}

export function getCollectedCards(): string[] {
  return getActiveProgress().collectedCardIds;
}

export function setCollectedCards(ids: string[]): void {
  updateActiveProgress((current) => ({ ...current, collectedCardIds: ids }));
}

export function getCompletedCategories(): CategoryId[] {
  return getActiveProgress().completedCategories;
}

export function setCompletedCategories(ids: CategoryId[]): void {
  updateActiveProgress((current) => ({ ...current, completedCategories: ids }));
}

export function getUnlockedCategories(): CategoryId[] {
  return getActiveProgress().unlockedCategories;
}

export function setUnlockedCategories(ids: CategoryId[]): void {
  updateActiveProgress((current) => ({ ...current, unlockedCategories: ids }));
}

export function getKnownWords(): string[] {
  return getActiveProgress().knownWords;
}

export function setKnownWords(ids: string[]): void {
  updateActiveProgress((current) => ({ ...current, knownWords: ids }));
}

export function getWeakWords(): string[] {
  return getActiveProgress().weakWords;
}

export function setWeakWords(ids: string[]): void {
  updateActiveProgress((current) => ({ ...current, weakWords: ids }));
}

export function resetProgress(): void {
  updateActiveProgress(() => createInitialProgress());
}

export interface CategoryCompletionResult {
  firstClear: boolean;
  gainedXp: number;
  newCards: string[];
  unlockedCategories: CategoryId[];
  level: number;
  totalXp: number;
}

export function recordCategoryCompletion(
  category: QuestCategory
): CategoryCompletionResult {
  const completed = getCompletedCategories();
  const alreadyCompleted = completed.includes(category.id);

  if (alreadyCompleted) {
    return {
      firstClear: false,
      gainedXp: 0,
      newCards: [],
      unlockedCategories: getUnlockedCategories(),
      level: getLevel(),
      totalXp: getXP(),
    };
  }

  const collectedCards = getCollectedCards();
  const newCards = category.collectedCardIds.filter(
    (id) => !collectedCards.includes(id)
  );
  setCollectedCards([...collectedCards, ...newCards]);

  const totalXp = addXP(category.rewardXp);

  const updatedCompleted = [...completed, category.id];
  setCompletedCategories(updatedCompleted);

  const unlockedCategories = getUnlockedCategoriesFromCompleted(updatedCompleted);
  setUnlockedCategories(unlockedCategories);

  return {
    firstClear: true,
    gainedXp: category.rewardXp,
    newCards,
    unlockedCategories,
    level: calculateLevelFromXp(totalXp),
    totalXp,
  };
}
