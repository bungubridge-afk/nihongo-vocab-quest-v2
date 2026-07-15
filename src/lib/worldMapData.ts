import type { CategoryId } from "@/types/learning";
import type { QuestStageIcon } from "@/components/ui/QuestNode";

/**
 * Display-only metadata for the Quest Map / world overview. This file never holds lesson
 * content, XP values, or unlock rules — those stay the single source of truth in
 * `questData.ts` and `levelSystem.ts`. worldMapData only supplies presentation details
 * (icons, narrative blurbs, preview copy) that the map/detail UI reads alongside the real
 * progress data.
 */

export interface WorldMeta {
  id: string;
  name: string;
  subtitle: string;
}

/** The one playable world today. Adding a second world later means adding an entry here
 *  plus its own route — not restructuring this file's shape. */
export const currentWorld: WorldMeta = {
  id: "erste-schritte-in-japan",
  name: "Erste Schritte in Japan",
  subtitle: "Deine Reise beginnt hier.",
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
}

export const stageMapMeta: Record<CategoryId, StageMapMeta> = {
  cafe: { icon: "cafe" },
  reise: { icon: "reise" },
  schule: { icon: "schule" },
  freunde: { icon: "freunde" },
  review: {
    icon: "finale",
    flavorText: "Zeige, was du auf deiner ersten Reise gelernt hast.",
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
