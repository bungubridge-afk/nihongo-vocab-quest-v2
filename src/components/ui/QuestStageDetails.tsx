import type { CSSProperties } from "react";
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
 * The sidebar's selected-stage panel. Kept intentionally concise — XP and card count are
 * already shown prominently on the map's own compact card (`QuestStageCompactCard`), so
 * this panel focuses on what the map card has no room for: the full description and the
 * primary action, without repeating the same two numbers twice on screen.
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
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2",
            CIRCLE_STATUS_CLASSES[status],
            isLocked ? "quest-node-mist" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <StageIcon icon={icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-bold text-[var(--color-ink)]">{displayName}</p>
          <p className="text-xs text-[var(--color-ink-soft)]">{category.stageTitle}</p>
        </div>
        <Badge variant={STATUS_BADGE_VARIANT[status]} className="ml-auto shrink-0">
          {STATUS_LABEL[status]}
        </Badge>
      </div>

      <p className="mt-3 text-sm text-[var(--color-ink-soft)]">{description}</p>

      {isLocked ? (
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          Schließe zuerst die vorherige Etappe ab.
        </p>
      ) : (
        <Button variant="primary" onClick={onStart} className="mt-3 w-full">
          {isCompleted ? "Wiederholen" : "Starten"}
        </Button>
      )}
    </Card>
  );
}

export interface QuestStageCompactCardProps {
  title: string;
  description: string;
  status: QuestNodeStatus;
  rewardXp: number;
  cardCount: number;
  isFinale?: boolean;
  isSelected?: boolean;
  /** Positioning hint the map passes through as a `data-side` attribute (see globals.css). */
  side: "left" | "right" | "center";
  onStart?: () => void;
  style?: CSSProperties;
}

/**
 * The map's own compact info card — small enough to sit right beside its landmark node,
 * inside that Etappe's own row. Everything a player needs to decide "do I start this?" at
 * a glance: name, one-line description, status, reward, and the actual action button.
 * Deeper description text lives in `QuestStageDetails` (the sidebar panel) instead.
 */
export function QuestStageCompactCard({
  title,
  description,
  status,
  rewardXp,
  cardCount,
  isFinale = false,
  isSelected = false,
  side,
  onStart,
  style,
}: QuestStageCompactCardProps) {
  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const isCurrent = status === "current";

  const cardClasses = [
    "quest-row-card rounded-2xl border-2 bg-white px-3 py-2.5 shadow-sm",
    isCurrent ? "quest-row-card-current" : "",
    isCompleted ? "quest-row-card-completed" : "",
    isLocked ? "quest-row-card-locked quest-node-mist" : "",
    isFinale && !isLocked ? "quest-row-card-finale" : "",
    isSelected ? "quest-row-card-selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClasses} data-side={side} style={style}>
      <p className="text-sm leading-tight font-bold text-[var(--color-ink)]">{title}</p>
      <p className="quest-row-card-desc mt-1 text-xs leading-snug text-[var(--color-ink-soft)]">
        {description}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
        <span className="text-[11px] font-semibold text-[var(--color-ink-soft)]">
          +{rewardXp} XP{cardCount > 0 ? ` · ${cardCount} Karten` : ""}
        </span>
      </div>
      {!isLocked ? (
        <Button
          variant={isCompleted ? "secondary" : "primary"}
          size="sm"
          onClick={onStart}
          className="mt-2 w-full"
        >
          {isCompleted ? "Wiederholen" : "Starten"}
        </Button>
      ) : null}
    </div>
  );
}
