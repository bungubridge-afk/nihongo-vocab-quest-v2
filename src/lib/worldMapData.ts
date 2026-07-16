import type { CategoryId } from "@/types/learning";
import type { QuestStageIcon } from "@/components/ui/QuestNode";

/**
 * Display-only metadata for the Quest Map / world overview. This file never holds lesson
 * content, XP values, or unlock rules — those stay the single source of truth in
 * `questData.ts` and `levelSystem.ts`. worldMapData only supplies presentation details
 * (icons, narrative blurbs, preview copy) that the map/detail UI reads alongside the real
 * progress data.
 */

/**
 * Which decorative background theme a world/area uses. Only "kyoto" has an actual
 * scenery implementation today (`MapScenery` in `QuestMap.tsx`); the other ids exist so a
 * future Area 2/3 can declare its theme here first and get a real background later without
 * touching this file's shape or any component's props again.
 */
export type AreaThemeId = "kyoto" | "tokyo" | "city" | "nature";

export interface AreaTheme {
  id: AreaThemeId;
  /** Motif names used purely for documentation/future scenery work — not rendered directly. */
  motifs: string[];
}

export interface WorldMeta {
  id: string;
  name: string;
  subtitle: string;
  theme: AreaTheme;
}

/** The one playable world today. Adding a second world later means adding an entry here
 *  plus its own route — not restructuring this file's shape. */
export const currentWorld: WorldMeta = {
  id: "erste-schritte-in-japan",
  name: "Erste Schritte in Japan",
  subtitle: "Deine Reise beginnt hier.",
  theme: {
    id: "kyoto",
    motifs: ["torii", "fuji", "lantern", "machiya", "sakura"],
  },
};

export interface StageMapMeta {
  /** Landmark icon shown on the map node and in the detail panel. */
  icon: QuestStageIcon;
  /**
   * Optional narrative blurb that replaces `QuestCategory.description` in the detail panel
   * when the plain functional description ("Wiederhole Wörter...") reads better as a
   * story beat (currently only the finale). Everything else falls back to questData's own
   * description — no duplicate copy to keep in sync.
   */
  flavorText?: string;
  /**
   * One short line naming *what* the player practices in this Etappe, shown only in the
   * sidebar's "Was du lernst" block — distinct from `description`/`flavorText` (which say
   * what the story beat is), so the sidebar has something the compact map card doesn't
   * already say instead of just repeating it in fewer words.
   */
  learningSummary: string;
}

export const stageMapMeta: Record<CategoryId, StageMapMeta> = {
  cafe: { icon: "cafe", learningSummary: "Bestellen, Essen und Trinken." },
  reise: { icon: "reise", learningSummary: "Orte, Verkehrsmittel und Wegfragen." },
  schule: { icon: "schule", learningSummary: "Schule, Lernen und der heutige Tag." },
  freunde: { icon: "freunde", learningSummary: "Treffen, Sprechen und Pläne." },
  review: {
    icon: "finale",
    flavorText: "Zeige, was du auf deiner ersten Reise gelernt hast.",
    learningSummary: "Wiederhole Wörter und Sätze aus deiner ersten Reise.",
  },
};

export interface AreaPreview {
  id: string;
  title: string;
  subtitle: string;
  status: string;
}

/**
 * Upcoming, not-yet-playable areas shown as a fogged preview below the current world's
 * map. An array (not a single object) so a second/third preview can be appended later
 * without touching the component that renders it.
 */
export const nextAreaPreviews: AreaPreview[] = [
  {
    id: "alltag-in-japan",
    title: "Alltag in Japan",
    subtitle: "Neue Orte, neue Gespräche und eine Hör-Quest.",
    status: "Demnächst",
  },
];
