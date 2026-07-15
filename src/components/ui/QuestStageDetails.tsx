import { Badge } from "@/components/ui/Badge";
import type { BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StageIcon } from "@/components/ui/QuestNode";
import type { QuestNodeStatus, QuestStageIcon } from "@/components/ui/QuestNode";
import type { QuestCategory } from "@/types/learning";

export interface QuestStageDetailsProps {
  category: QuestCategory;
  /** User-facing name (e.g. "Finale Wiederholung" for the internal "Abschluss-Review"). */
  displayName: string;
  status: QuestNodeStatus;
  icon: QuestStageIcon;
  /** Narrative blurb overriding `category.description`, if the map's metadata has one. */
  flavorText?: string;
  isFinale?: boolean;
  /** Present only when the stage can actually be started (i.e. not locked). */
  onStart?: () => void;
}

const STATUS_LABEL: Record<QuestNodeStatus, string> = {
  current: "Bereit",
  completed: "Abgeschlossen",
  unlocked: "Bereit",
  locked: "Gesperrt",
  review: "Bereit",
};

const STATUS_BADGE_VARIANT: Record<QuestNodeStatus, BadgeVariant> = {
  current: "green",
  completed: "green",
  unlocked: "green",
  locked: "locked",
  review: "yellow",
};

const CIRCLE_STATUS_CLASSES: Record<QuestNodeStatus, string> = {
  current: "bg-[var(--color-primary)] border-[var(--color-primary-dark)] text-white",
  completed: "bg-[var(--color-primary)] border-[var(--color-primary-dark)] text-white",
  unlocked: "bg-[var(--color-primary)] border-[var(--color-primary-dark)] text-white",
  locked:
    "bg-[var(--color-locked-bg)] border-[var(--color-secondary-border)] text-[var(--color-locked)]",
  review: "bg-[var(--color-gold-soft)] border-[var(--color-gold)] text-[var(--color-gold)]",
};

/**
 * The single place a selected stage's full information lives: description, reward, card
 * count, and the actual Starten/Wiederholen action. The map itself only ever shows a
 * landmark + short label — everything else funnels through here, reached by selecting a
 * node. Locked stages show why, but never a start action.
 */
export function QuestStageDetails({
  category,
  displayName,
  status,
  icon,
  flavorText,
  isFinale = false,
  onStart,
}: QuestStageDetailsProps) {
  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const description = flavorText ?? category.description;

  return (
    <Card variant={isFinale && !isLocked ? "highlight" : "default"}>
      <div className="flex items-center gap-3">
        <span
          className={[
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2",
            CIRCLE_STATUS_CLASSES[status],
            isLocked ? "quest-node-mist" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <StageIcon icon={icon} className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="font-bold text-[var(--color-ink)]">{displayName}</p>
          <p className="text-xs text-[var(--color-ink-soft)]">{category.stageTitle}</p>
        </div>
      </div>

      <p className="mt-3 text-sm text-[var(--color-ink-soft)]">{description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
        <span className="text-xs font-semibold text-[var(--color-ink-soft)]">
          +{category.rewardXp} XP
          {category.collectedCardIds.length > 0
            ? ` · ${category.collectedCardIds.length} Karten`
            : ""}
        </span>
      </div>

      {isLocked ? (
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          Schließe zuerst die vorherige Etappe ab.
        </p>
      ) : (
        <Button variant="primary" onClick={onStart} className="mt-4 w-full">
          {isCompleted ? "Wiederholen" : "Starten"}
        </Button>
      )}
    </Card>
  );
}
