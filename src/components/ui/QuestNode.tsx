import { Badge } from "@/components/ui/Badge";
import type { BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export type QuestNodeStatus = "current" | "completed" | "unlocked" | "locked" | "review";

export interface QuestNodeProps {
  title: string;
  subtitle?: string;
  status: QuestNodeStatus;
  rewardXp?: number;
  cardCount?: number;
  onStart?: () => void;
  className?: string;
  /** Shifts the node to the opposite side on sm+ screens for a zigzag roadmap feel. Mobile always stays a straight column. */
  flip?: boolean;
  /** Marks the Block-Abschluss node (Abschluss-Review): bigger circle, gate-style card, extra tag — never labelled "Boss". */
  isFinale?: boolean;
}

const CIRCLE_CLASSES: Record<QuestNodeStatus, string> = {
  current:
    "bg-[var(--color-primary)] border-2 border-[var(--color-primary-dark)] text-white shadow-[0_0_0_5px_var(--color-primary-soft),0_10px_20px_-10px_var(--color-card-shadow)]",
  completed:
    "bg-[var(--color-primary-soft)] border-2 border-[var(--color-primary)] text-[var(--color-primary-dark)] shadow-[0_0_16px_-3px_var(--color-primary)]",
  unlocked:
    "bg-[var(--color-primary)] border-2 border-[var(--color-primary-dark)] text-white shadow-[0_0_0_5px_var(--color-primary-soft)]",
  locked:
    "bg-[var(--color-locked-bg)] border-2 border-[var(--color-secondary-border)] text-[var(--color-locked)]",
  review:
    "bg-[var(--color-gold-soft)] border-2 border-[var(--color-gold)] text-[var(--color-gold)] shadow-[0_0_16px_-3px_var(--color-gold)]",
};

const STATUS_ICON: Record<QuestNodeStatus, string> = {
  current: "▶",
  completed: "✓",
  unlocked: "▶",
  locked: "🔒",
  review: "★",
};

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

export function QuestNode({
  title,
  subtitle,
  status,
  rewardXp,
  cardCount,
  onStart,
  className,
  flip = false,
  isFinale = false,
}: QuestNodeProps) {
  const isLocked = status === "locked";
  const statusLabel = STATUS_LABEL[status];

  const wrapperClasses = [
    "flex items-center gap-4 rounded-2xl p-2",
    flip ? "sm:flex-row-reverse" : "",
    isLocked ? "quest-node-locked" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const circleClasses = [
    "flex shrink-0 items-center justify-center rounded-full font-bold",
    isFinale ? "h-16 w-16 text-2xl sm:h-20 sm:w-20 sm:text-3xl" : "h-14 w-14 text-xl",
    CIRCLE_CLASSES[status],
  ].join(" ");

  const cardClasses = [
    "soft-card flex flex-1 items-center justify-between gap-3 px-4 py-3",
    status === "review" ? "border-[var(--color-gold-border)]" : "",
    isFinale ? "border-2 px-5 py-4" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClasses}>
      <div className={circleClasses} aria-hidden="true">
        {STATUS_ICON[status]}
      </div>
      <div className={cardClasses}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className={isFinale ? "text-lg font-extrabold text-[var(--color-ink)]" : "font-bold text-[var(--color-ink)]"}>
              {title}
            </p>
            {isFinale ? <Badge variant="yellow">Block-Abschluss</Badge> : null}
          </div>
          {subtitle ? (
            <p className="text-sm text-[var(--color-ink-soft)]">{subtitle}</p>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_BADGE_VARIANT[status]}>{statusLabel}</Badge>
            {typeof rewardXp === "number" || typeof cardCount === "number" ? (
              <span className="flex gap-3 text-xs font-semibold text-[var(--color-ink-soft)]">
                {typeof rewardXp === "number" ? <span>+{rewardXp} XP</span> : null}
                {typeof cardCount === "number" ? <span>{cardCount} Karten</span> : null}
              </span>
            ) : null}
          </div>
        </div>
        {onStart ? (
          <Button
            variant={isLocked ? "locked" : status === "completed" ? "secondary" : "primary"}
            size="sm"
            disabled={isLocked}
            onClick={onStart}
          >
            {status === "completed" ? "Wiederholen" : "Starten"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
