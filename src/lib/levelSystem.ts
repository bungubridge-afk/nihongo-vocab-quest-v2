import type { CategoryId } from "@/types/learning";
import { getQuestCategory } from "@/lib/questData";

const LEVEL_THRESHOLDS = [0, 50, 150, 280, 450];
const EXTRA_XP_PER_LEVEL = 170;

export function calculateLevelFromXp(xp: number): number {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i;
      break;
    }
  }
  if (xp >= LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]) {
    const base = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const baseLevel = LEVEL_THRESHOLDS.length - 1;
    level = baseLevel + Math.floor((xp - base) / EXTRA_XP_PER_LEVEL);
  }
  return level;
}

export function xpForNextLevel(currentXp: number): number {
  const level = calculateLevelFromXp(currentXp);
  let nextThreshold: number;
  if (level + 1 < LEVEL_THRESHOLDS.length) {
    nextThreshold = LEVEL_THRESHOLDS[level + 1];
  } else {
    const base = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const levelsAboveBase = level - (LEVEL_THRESHOLDS.length - 1);
    nextThreshold = base + (levelsAboveBase + 1) * EXTRA_XP_PER_LEVEL;
  }
  return Math.max(0, nextThreshold - currentXp);
}

const CATEGORY_ORDER: CategoryId[] = ["cafe", "reise", "schule", "freunde", "review"];

export function getInitialUnlockedCategories(): CategoryId[] {
  return ["cafe"];
}

export function getUnlockedCategoriesFromCompleted(
  completed: CategoryId[]
): CategoryId[] {
  const unlocked: CategoryId[] = ["cafe"];
  for (let i = 0; i < CATEGORY_ORDER.length - 1; i++) {
    const current = CATEGORY_ORDER[i];
    const next = CATEGORY_ORDER[i + 1];
    if (completed.includes(current) && !unlocked.includes(next)) {
      unlocked.push(next);
    }
  }
  return unlocked;
}

export function getNextCategory(completed: CategoryId[]): CategoryId | null {
  for (const id of CATEGORY_ORDER) {
    if (!completed.includes(id)) {
      return id;
    }
  }
  return null;
}

export function getNextUnlockLabel(completed: CategoryId[]): string {
  const unlocked = getUnlockedCategoriesFromCompleted(completed);
  const next = CATEGORY_ORDER.find((id) => !unlocked.includes(id));
  if (!next) {
    return "Alle Kategorien freigeschaltet";
  }
  const category = getQuestCategory(next);
  return category ? category.name : next;
}
