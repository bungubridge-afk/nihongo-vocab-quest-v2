import type { CategoryId } from "@/types/learning";
import { getQuestCategory } from "@/lib/questData";
import type { AppLocale } from "@/i18n/types";
import { getMessages } from "@/i18n/getMessages";
import { localizeContent } from "@/i18n/localizeContent";

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

/**
 * Display-only breakdown of where `xp` sits between its level thresholds. Pure derivation
 * from the existing LEVEL_THRESHOLDS / EXTRA_XP_PER_LEVEL values — never changes level
 * math, only exposes it for progress bars and "Noch X XP bis Level Y" labels.
 */
export interface LevelProgress {
  currentLevel: number;
  currentLevelStartXp: number;
  nextLevel: number;
  nextLevelXp: number;
  xpIntoLevel: number;
  xpRequiredForLevel: number;
  xpRemaining: number;
  progressPercent: number;
  /** True once xp is past the last fixed threshold (450+), where levels repeat every 170 XP. */
  isMaxDefinedLevel: boolean;
}

function levelStartXp(level: number): number {
  if (level < LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[level];
  }
  const base = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  return base + (level - (LEVEL_THRESHOLDS.length - 1)) * EXTRA_XP_PER_LEVEL;
}

export function getLevelProgress(xp: number): LevelProgress {
  const safeXp = Math.max(0, xp);
  const currentLevel = calculateLevelFromXp(safeXp);
  const currentLevelStartXp = levelStartXp(currentLevel);
  const nextLevel = currentLevel + 1;
  const nextLevelXp = levelStartXp(nextLevel);
  const xpIntoLevel = safeXp - currentLevelStartXp;
  const xpRequiredForLevel = nextLevelXp - currentLevelStartXp;
  const xpRemaining = nextLevelXp - safeXp;
  const progressPercent =
    xpRequiredForLevel > 0
      ? Math.min(100, Math.round((xpIntoLevel / xpRequiredForLevel) * 100))
      : 100;

  return {
    currentLevel,
    currentLevelStartXp,
    nextLevel,
    nextLevelXp,
    xpIntoLevel,
    xpRequiredForLevel,
    xpRemaining,
    progressPercent,
    isMaxDefinedLevel: currentLevel >= LEVEL_THRESHOLDS.length - 1,
  };
}

const CATEGORY_ORDER: CategoryId[] = ["cafe", "reise", "schule", "freunde", "review"];

/**
 * User-facing stage name in the current app language. The internal ids and questData
 * entries stay untouched; only the shown label is localized — the review stage reads
 * as "Final Review"/"Finale Wiederholung" (a journey name, not the internal
 * "Abschluss-Review"), every other stage uses its localized category name.
 */
export function getEtappeDisplayName(categoryId: CategoryId, locale: AppLocale): string {
  if (categoryId === "review") return getMessages(locale).quest.finaleName;
  const category = getQuestCategory(categoryId);
  return category ? localizeContent(category.name, locale) : categoryId;
}

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

export function getNextUnlockLabel(completed: CategoryId[], locale: AppLocale): string {
  const unlocked = getUnlockedCategoriesFromCompleted(completed);
  const next = CATEGORY_ORDER.find((id) => !unlocked.includes(id));
  if (!next) {
    return getMessages(locale).quest.allStagesUnlocked;
  }
  return getEtappeDisplayName(next, locale);
}
