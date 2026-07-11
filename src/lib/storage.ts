import type { CategoryId, OnboardingProfile, QuestCategory } from "@/types/learning";
import {
  calculateLevelFromXp,
  getInitialUnlockedCategories,
  getUnlockedCategoriesFromCompleted,
} from "@/lib/levelSystem";

const STORAGE_KEYS = {
  profile: "nvq_profile",
  xp: "nvq_xp",
  collectedCards: "nvq_collected_cards",
  completedCategories: "nvq_completed_categories",
  unlockedCategories: "nvq_unlocked_categories",
  knownWords: "nvq_known_words",
  weakWords: "nvq_weak_words",
} as const;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable (private mode, quota exceeded) — fail silently.
  }
}

export function getProfile(): OnboardingProfile | null {
  return readJSON<OnboardingProfile | null>(STORAGE_KEYS.profile, null);
}

export function saveProfile(profile: OnboardingProfile): void {
  writeJSON(STORAGE_KEYS.profile, profile);
}

export function getXP(): number {
  return readJSON<number>(STORAGE_KEYS.xp, 0);
}

export function setXP(xp: number): void {
  writeJSON(STORAGE_KEYS.xp, xp);
}

export function addXP(amount: number): number {
  const next = getXP() + amount;
  setXP(next);
  return next;
}

export function getLevel(): number {
  return calculateLevelFromXp(getXP());
}

export function getCollectedCards(): string[] {
  return readJSON<string[]>(STORAGE_KEYS.collectedCards, []);
}

export function setCollectedCards(ids: string[]): void {
  writeJSON(STORAGE_KEYS.collectedCards, ids);
}

export function getCompletedCategories(): CategoryId[] {
  return readJSON<CategoryId[]>(STORAGE_KEYS.completedCategories, []);
}

export function setCompletedCategories(ids: CategoryId[]): void {
  writeJSON(STORAGE_KEYS.completedCategories, ids);
}

export function getUnlockedCategories(): CategoryId[] {
  return readJSON<CategoryId[]>(
    STORAGE_KEYS.unlockedCategories,
    getInitialUnlockedCategories()
  );
}

export function setUnlockedCategories(ids: CategoryId[]): void {
  writeJSON(STORAGE_KEYS.unlockedCategories, ids);
}

export function getKnownWords(): string[] {
  return readJSON<string[]>(STORAGE_KEYS.knownWords, []);
}

export function setKnownWords(ids: string[]): void {
  writeJSON(STORAGE_KEYS.knownWords, ids);
}

export function getWeakWords(): string[] {
  return readJSON<string[]>(STORAGE_KEYS.weakWords, []);
}

export function setWeakWords(ids: string[]): void {
  writeJSON(STORAGE_KEYS.weakWords, ids);
}

export function resetProgress(): void {
  if (!isBrowser()) return;
  Object.values(STORAGE_KEYS).forEach((key) => {
    window.localStorage.removeItem(key);
  });
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
