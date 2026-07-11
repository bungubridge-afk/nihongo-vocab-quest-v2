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
}

const CIRCLE_CLASSES: Record<QuestNodeStatus, string> = {
  current:
    "quest-node-current bg-white border-2 border-[var(--color-primary)] text-[var(--color-primary-dark)]",
  completed: "quest-node-completed border-2",
  unlocked: "bg-white border-2 border-[var(--color-secondary-border)] text-[var(--color-ink)]",
  locked:
    "quest-node-locked bg-[var(--color-locked-bg)] border-2 border-[var(--color-secondary-border)] text-[var(--color-locked)]",
  review: "bg-[var(--color-gold-soft)] border-2 border-[var(--color-gold)] text-[var(--color-gold)]",
};

const STATUS_ICON: Record<QuestNodeStatus, string> = {
  current: "▶",
  completed: "✓",
  unlocked: "●",
  locked: "🔒",
  review: "★",
};

export function QuestNode({
  title,
  subtitle,
  status,
  rewardXp,
  cardCount,
  onStart,
  className,
}: QuestNodeProps) {
  const isLocked = status === "locked";

  const wrapperClasses = [
    "flex items-center gap-4 rounded-2xl p-2",
    isLocked ? "quest-node-locked" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const circleClasses = [
    "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold",
    CIRCLE_CLASSES[status],
  ].join(" ");

  const cardClasses = [
    "soft-card flex flex-1 items-center justify-between gap-3 px-4 py-3",
    status === "review" ? "border-[var(--color-gold-border)]" : "",
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
          <p className="font-bold text-[var(--color-ink)]">{title}</p>
          {subtitle ? (
            <p className="text-sm text-[var(--color-ink-soft)]">{subtitle}</p>
          ) : null}
          {typeof rewardXp === "number" || typeof cardCount === "number" ? (
            <div className="mt-1 flex gap-3 text-xs font-semibold text-[var(--color-ink-soft)]">
              {typeof rewardXp === "number" ? <span>+{rewardXp} XP</span> : null}
              {typeof cardCount === "number" ? <span>{cardCount} Karten</span> : null}
            </div>
          ) : null}
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
