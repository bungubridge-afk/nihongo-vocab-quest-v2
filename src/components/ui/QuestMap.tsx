import type { CategoryId } from "@/types/learning";
import { QuestNode } from "@/components/ui/QuestNode";
import type { QuestNodeStatus, QuestStageIcon } from "@/components/ui/QuestNode";

export interface QuestMapStage {
  id: CategoryId;
  title: string;
  status: QuestNodeStatus;
  icon: QuestStageIcon;
  isFinale?: boolean;
}

export interface QuestMapProps {
  stages: QuestMapStage[];
  selectedId: CategoryId | null;
  onSelect: (id: CategoryId) => void;
  className?: string;
}

/**
 * Horizontal lane positions (percent of row width) the winding road cycles through.
 * Repeating this 4-item cycle (instead of a strict left/right alternation) is what keeps
 * the path from looking mechanical as more stages are appended later, and — because it's
 * a cycle, not a hand-placed list — it never runs out no matter how many stages exist.
 */
const LANE_CYCLE = [24, 76, 40, 60];
const START_X = LANE_CYCLE[0];

function laneXFor(index: number, isFinale?: boolean): number {
  if (isFinale) return 50;
  return LANE_CYCLE[index % LANE_CYCLE.length];
}

/**
 * One continuous path per row: a curve from the incoming x (top edge, matching the
 * previous row's exit) into the node's fixed center point (laneX, 50), then a straight
 * drop to the row's bottom edge at the same x — which becomes the next row's entry. Node
 * placement is therefore always exactly on the road, regardless of how far apart two
 * consecutive lanes are.
 */
function rowRoadPath(entryX: number, laneX: number): string {
  return `M ${entryX} 0 C ${entryX} 25, ${laneX} 25, ${laneX} 50 L ${laneX} 100`;
}

/**
 * Renders the current world's stages as an ordinary vertical flow: one independent row
 * per stage, each with its own minimum height (see `.quest-row` in globals.css). Because
 * every stage owns its own row instead of sharing one giant absolutely-positioned canvas,
 * rows can never invade each other's space — the map's total height simply grows with the
 * number of stages, with zero manual height bookkeeping.
 */
export function QuestMap({ stages, selectedId, onSelect, className }: QuestMapProps) {
  const lanes = stages.map((stage, index) => laneXFor(index, stage.isFinale));

  return (
    <div className={["quest-map-scroll", className].filter(Boolean).join(" ")}>
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
        const reached =
          stage.status === "completed" || stage.status === "current" || stage.status === "review";

        return (
          <div key={stage.id} className="quest-row">
            <svg
              className="quest-row-path"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d={rowRoadPath(entryX, laneX)}
                fill="none"
                strokeWidth={5}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className={reached ? "quest-path-done" : "quest-path-todo"}
              />
            </svg>

            <div className="quest-row-node" style={{ left: `${laneX}%` }}>
              <QuestNode
                title={stage.title}
                status={stage.status}
                stageIcon={stage.icon}
                isFinale={stage.isFinale}
                isSelected={selectedId === stage.id}
                onSelect={() => onSelect(stage.id)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
