import type { CSSProperties } from "react";
import type { CategoryId } from "@/types/learning";
import { QuestNode } from "@/components/ui/QuestNode";
import type { QuestNodeStatus, QuestStageIcon } from "@/components/ui/QuestNode";
import { QuestStageCompactCard } from "@/components/ui/QuestStageDetails";
import type { AreaThemeId } from "@/lib/worldMapData";

export interface QuestMapStage {
  id: CategoryId;
  title: string;
  status: QuestNodeStatus;
  icon: QuestStageIcon;
  isFinale?: boolean;
  rewardXp: number;
  cardCount: number;
  /** Short blurb shown on the map's own compact card (reuses `QuestCategory.description`). */
  description: string;
}

export interface QuestMapProps {
  stages: QuestMapStage[];
  selectedId: CategoryId | null;
  onSelect: (id: CategoryId) => void;
  /** Called from a compact card's own Starten/Wiederholen button (never from selecting). */
  onStart: (id: CategoryId) => void;
  theme?: AreaThemeId;
  className?: string;
}

/**
 * Horizontal lane positions (percent of row width) the winding road cycles through.
 * Repeating this 4-item cycle (instead of a strict left/right alternation) is what keeps
 * the path from looking mechanical as more stages are appended later, and — because it's
 * a cycle, not a hand-placed list — it never runs out no matter how many stages exist.
 */
const LANE_CYCLE = [26, 74, 38, 62];
const START_X = LANE_CYCLE[0];

function laneXFor(index: number, isFinale?: boolean): number {
  if (isFinale) return 50;
  return LANE_CYCLE[index % LANE_CYCLE.length];
}

/** Which side of the node the compact card opens to — opposite the node's own lean, so the
 *  card never has to cross over the road. Finale is always "center" (card sits below it). */
function sideFor(laneX: number, isFinale?: boolean): "left" | "right" | "center" {
  if (isFinale) return "center";
  return laneX <= 50 ? "right" : "left";
}

/**
 * One continuous path per row: a curve from the incoming x (top edge, matching the
 * previous row's exit) into the node's fixed center point, then a straight drop to the
 * row's bottom edge at the same x — which becomes the next row's entry. `targetY` differs
 * by breakpoint (the node sits at a fixed pixel offset on mobile, at 50% from sm+), so two
 * path variants are rendered and toggled with Tailwind's `sm:` display classes rather than
 * one path trying to hit two different targets.
 */
function rowRoadPath(entryX: number, laneX: number, targetY: number): string {
  const controlY = targetY * 0.6;
  return `M ${entryX} 0 C ${entryX} ${controlY}, ${laneX} ${controlY}, ${laneX} ${targetY} L ${laneX} 100`;
}

const ROAD_STATE_CLASS: Record<"done" | "upcoming" | "todo", string> = {
  done: "quest-path-done",
  upcoming: "quest-path-upcoming",
  todo: "quest-path-todo",
};

/** Small wayside decorations, cycling by row index — flavor only, never on top of the card. */
function RowDecoration({ index, sideAwayFrom }: { index: number; sideAwayFrom: "left" | "right" | "center" }) {
  // Sits on the opposite side from the card so it never competes with readable text.
  const x = sideAwayFrom === "right" ? 12 : sideAwayFrom === "left" ? 88 : sideAwayFrom === "center" ? 12 : 88;
  const motif = index % 2;

  if (motif === 0) {
    // Stone lantern (石灯籠) — a simple stacked silhouette.
    return (
      <g transform={`translate(${x}, 58)`} opacity="0.28" fill="var(--color-ink-soft)">
        <rect x="-2.6" y="-2" width="5.2" height="3.2" rx="0.6" />
        <rect x="-3.4" y="1" width="6.8" height="1.4" rx="0.5" />
        <path d="M-3.6 2.4h7.2l-1 2.4h-5.2z" />
        <rect x="-1.2" y="-5.4" width="2.4" height="3.6" rx="0.5" />
        <path d="M-2.2 -5.4 L0 -7.4 L2.2 -5.4 Z" />
      </g>
    );
  }
  // Sakura petals — a few small scattered shapes.
  return (
    <g transform={`translate(${x}, 55)`} opacity="0.3" fill="var(--color-danger-border)">
      <circle cx="0" cy="0" r="1.3" />
      <circle cx="2.6" cy="1.6" r="1.1" />
      <circle cx="-2.2" cy="2.4" r="1" />
      <circle cx="1" cy="-2.4" r="0.9" />
    </g>
  );
}

/**
 * Renders the current world's stages as an ordinary vertical flow: one independent row
 * per stage, each with its own minimum height (see `.quest-row` in globals.css). Because
 * every stage owns its own row instead of sharing one giant absolutely-positioned canvas,
 * rows can never invade each other's space — the map's total height simply grows with the
 * number of stages, with zero manual height bookkeeping. Each row also carries a compact
 * info card next to its landmark, and the whole canvas sits over a low-contrast themed
 * background (Kyoto motifs today; `theme` is read so a future Area 2 can swap it).
 */
export function QuestMap({ stages, selectedId, onSelect, onStart, theme = "kyoto", className }: QuestMapProps) {
  const lanes = stages.map((stage, index) => laneXFor(index, stage.isFinale));

  return (
    <div className={["quest-map-scroll", className].filter(Boolean).join(" ")}>
      <MapScenery theme={theme} />

      <div className="quest-start-row">
        <div className="quest-start-connector" style={{ left: `${START_X}%` }} aria-hidden="true" />
        <div className="quest-start-marker" style={{ left: `${START_X}%` }}>
          <span className="quest-start-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <circle cx="12" cy="14" r="3.5" />
              <path d="M12 7V5M6.6 9.4 5.2 8M17.4 9.4 18.8 8M5 14H3M21 14h-2M4 18.5h16" />
            </svg>
          </span>
          <span className="quest-start-label">Start</span>
        </div>
      </div>

      {stages.map((stage, index) => {
        const entryX = index === 0 ? START_X : lanes[index - 1];
        const laneX = lanes[index];
        const side = sideFor(laneX, stage.isFinale);
        const previousStatus = index === 0 ? null : stages[index - 1].status;

        let roadState: "done" | "upcoming" | "todo";
        if (stage.status === "completed" || stage.status === "current" || stage.status === "review") {
          roadState = "done";
        } else if (previousStatus === "current") {
          roadState = "upcoming";
        } else {
          roadState = "todo";
        }

        const cardStyle = stage.isFinale
          ? undefined
          : ({
              // Offset from the node's lane center, not just its circle radius — the node
              // button's label text can render wider than the circle itself (long titles
              // like "Finale Wiederholung" aside, even "Abgeschlossen" status text under a
              // short title can push the button's bounding box past the circle), so the gap
              // has to clear the whole button, not just the visible circle.
              "--card-x": side === "right" ? `calc(${laneX}% + 66px)` : `calc(${laneX}% - 66px)`,
            } as CSSProperties);

        return (
          <div
            key={stage.id}
            className={["quest-row", stage.isFinale ? "quest-row-finale" : ""].filter(Boolean).join(" ")}
          >
            <svg className="quest-row-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path
                d={rowRoadPath(entryX, laneX, stage.isFinale ? 44 : 30)}
                fill="none"
                strokeWidth={5}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className={`sm:hidden ${ROAD_STATE_CLASS[roadState]}`}
              />
              <path
                d={rowRoadPath(entryX, laneX, 50)}
                fill="none"
                strokeWidth={5}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className={`hidden sm:block ${ROAD_STATE_CLASS[roadState]}`}
              />
              <RowDecoration index={index} sideAwayFrom={side} />
            </svg>

            <div
              className={["quest-row-node", stage.isFinale ? "quest-row-node-finale" : ""]
                .filter(Boolean)
                .join(" ")}
              style={{ left: `${laneX}%` }}
            >
              <QuestNode
                title={stage.title}
                status={stage.status}
                stageIcon={stage.icon}
                isFinale={stage.isFinale}
                isSelected={selectedId === stage.id}
                onSelect={() => onSelect(stage.id)}
              />
            </div>

            <QuestStageCompactCard
              title={stage.title}
              description={stage.description}
              status={stage.status}
              rewardXp={stage.rewardXp}
              cardCount={stage.cardCount}
              isFinale={stage.isFinale}
              isSelected={selectedId === stage.id}
              side={side}
              onStart={() => onStart(stage.id)}
              style={cardStyle}
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Low-contrast themed background, drawn once behind every row. Only "kyoto" is
 * implemented today (Area 1); any other theme id falls back to a minimal generic scenery
 * so a future Area 2 doesn't render nothing while its own motifs are still unbuilt.
 */
function MapScenery({ theme }: { theme: AreaThemeId }) {
  if (theme !== "kyoto") {
    return (
      <svg className="quest-map-deco" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <g fill="#ffffff" opacity="0.5">
          <ellipse cx="20" cy="4" rx="8" ry="1.4" />
          <ellipse cx="72" cy="8" rx="7" ry="1.3" />
        </g>
      </svg>
    );
  }

  return (
    <svg className="quest-map-deco" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {/* Soft clouds */}
      <g fill="#ffffff" opacity="0.6">
        <ellipse cx="74" cy="3" rx="9" ry="1.5" />
        <ellipse cx="80" cy="5" rx="6" ry="1.1" />
        <ellipse cx="12" cy="16" rx="7" ry="1.2" />
        <ellipse cx="55" cy="34" rx="8" ry="1.3" />
        <ellipse cx="16" cy="48" rx="6" ry="1.1" />
        <ellipse cx="70" cy="66" rx="7" ry="1.2" />
      </g>

      {/* Distant mountains, one Fuji-like peak with a faint snow cap — small, not centered. */}
      <g opacity="0.12" fill="var(--color-ink-soft)">
        <path d="M0 20 L10 12 L20 20 Z" />
        <path d="M62 22 L76 8 L92 22 Z" />
      </g>
      <path d="M67 15.5 L76 8 L85 15.5 Z" opacity="0.22" fill="#ffffff" />

      {/* Torii silhouette near the start of the journey, off to one side. */}
      <g transform="translate(10, 8)" opacity="0.16" fill="var(--color-danger)">
        <path d="M-4 0h8v0.9h-8zM-3.4 1.2h6.8v0.7h-6.8z" />
        <rect x="-3" y="1.9" width="1" height="4.4" />
        <rect x="2" y="1.9" width="1" height="4.4" />
      </g>

      {/* Faint machiya rooftop skyline running along the right edge. */}
      <g opacity="0.1" fill="var(--color-ink-soft)">
        <path d="M96 30 l4 -3 l4 3 v6 h-8 z" />
        <path d="M95 55 l3.5 -2.6 l3.5 2.6 v5 h-7 z" />
        <path d="M97 80 l3 -2.2 l3 2.2 v4.5 h-6 z" />
      </g>
    </svg>
  );
}
