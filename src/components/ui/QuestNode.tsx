export type QuestNodeStatus = "current" | "completed" | "unlocked" | "locked" | "review";

export type QuestStageIcon = "cafe" | "reise" | "schule" | "freunde" | "finale";

export interface QuestNodeProps {
  title: string;
  status: QuestNodeStatus;
  /** Landmark icon for this stage (cup, suitcase, book, speech bubbles, gate). */
  stageIcon: QuestStageIcon;
  /** The final destination (Finale Wiederholung): bigger gate landmark, gold framing. */
  isFinale?: boolean;
  /** Whether this node's details are currently shown in the side/detail panel. */
  isSelected?: boolean;
  /** Selecting a node only switches the detail panel — it never navigates by itself. */
  onSelect: () => void;
  className?: string;
}

const STATUS_LABEL: Record<QuestNodeStatus, string> = {
  current: "Bereit",
  completed: "Abgeschlossen",
  unlocked: "Bereit",
  locked: "Gesperrt",
  review: "Bereit",
};

const CIRCLE_STATUS_CLASSES: Record<QuestNodeStatus, string> = {
  current:
    "bg-[var(--color-primary)] border-[var(--color-primary-dark)] text-white quest-node-pulse",
  completed:
    "bg-[var(--color-primary)] border-[var(--color-primary-dark)] text-white quest-node-glow",
  unlocked: "bg-[var(--color-primary)] border-[var(--color-primary-dark)] text-white",
  locked:
    "bg-[var(--color-locked-bg)] border-[var(--color-secondary-border)] text-[var(--color-locked)]",
  review:
    "bg-[var(--color-gold-soft)] border-[var(--color-gold)] text-[var(--color-gold)] quest-node-glow-gold",
};

export function StageIcon({ icon, className }: { icon: QuestStageIcon; className?: string }) {
  const shared = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (icon) {
    case "cafe":
      // Kaffeetasse mit Dampf
      return (
        <svg {...shared}>
          <path d="M4 10h12v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
          <path d="M16 11h2a2.5 2.5 0 0 1 0 5h-2" />
          <path d="M8 6c0-1 .6-1.4.6-2.4M12 6c0-1 .6-1.4.6-2.4" />
        </svg>
      );
    case "reise":
      // Koffer
      return (
        <svg {...shared}>
          <rect x="4" y="8" width="16" height="11" rx="2" />
          <path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          <path d="M9 12v3M15 12v3" />
        </svg>
      );
    case "schule":
      // Aufgeschlagenes Buch
      return (
        <svg {...shared}>
          <path d="M2 5h6a4 4 0 0 1 4 4v11a3 3 0 0 0-3-3H2z" />
          <path d="M22 5h-6a4 4 0 0 0-4 4v11a3 3 0 0 1 3-3h7z" />
        </svg>
      );
    case "freunde":
      // Zwei Sprechblasen
      return (
        <svg {...shared}>
          <path d="M3 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9l-4 3v-3a2 2 0 0 1-2-2z" />
          <path d="M18 9h1a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1v3l-3-3h-3" />
        </svg>
      );
    case "finale":
      // Torii-Tor als finales Ziel
      return (
        <svg {...shared}>
          <path d="M3 5q9 2.4 18 0" />
          <path d="M6 5.8V20M18 5.8V20" />
          <path d="M4.5 10h15" />
        </svg>
      );
  }
}

function CheckMiniBadge() {
  return (
    <span className="quest-node-mini quest-node-mini-check" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3 w-3"
      >
        <path d="M4 12.5l5 5L20 6.5" />
      </svg>
    </span>
  );
}

function LockMiniBadge() {
  return (
    <span className="quest-node-mini quest-node-mini-lock" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3 w-3"
      >
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    </span>
  );
}

function HereMarker() {
  return (
    <div className="quest-node-here" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5"
      >
        <path d="M5 21V4" />
        <path d="M5 4h11l-2.5 3.5L16 11H5" fill="currentColor" stroke="none" />
      </svg>
      <span>Du bist hier</span>
    </div>
  );
}

/**
 * A landmark button on the adventure map: a stage circle with its icon plus a short
 * name/status label underneath. That's it — no description, no reward numbers, no
 * Starten button. Those live in `QuestStageDetails`, reached by selecting this node.
 * A plain `<button>` gets keyboard activation (Enter/Space) for free.
 */
export function QuestNode({
  title,
  status,
  stageIcon,
  isFinale = false,
  isSelected = false,
  onSelect,
  className,
}: QuestNodeProps) {
  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const statusLabel = STATUS_LABEL[status];

  const circleClasses = [
    "quest-node-circle flex items-center justify-center rounded-full border-2",
    isFinale ? "h-[4.6rem] w-[4.6rem] sm:h-20 sm:w-20" : "h-14 w-14 sm:h-16 sm:w-16",
    CIRCLE_STATUS_CLASSES[status],
    isFinale && isCompleted ? "quest-node-finale-done" : "",
    isLocked ? "quest-node-mist" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const buttonClasses = [
    "quest-node-button tap-scale flex cursor-pointer flex-col items-center gap-1 rounded-2xl px-2 py-1 text-center",
    isSelected ? "quest-node-selected" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`${title} – ${statusLabel}`}
      className={buttonClasses}
    >
      {status === "current" ? <HereMarker /> : null}

      <div className={circleClasses}>
        <StageIcon icon={stageIcon} className={isFinale ? "h-9 w-9" : "h-7 w-7"} />
        {isCompleted ? <CheckMiniBadge /> : null}
        {isLocked ? <LockMiniBadge /> : null}
      </div>

      <p className="max-w-[6.5rem] text-xs leading-tight font-bold text-[var(--color-ink)] sm:text-sm">
        {title}
      </p>
      <p className="text-[11px] font-semibold text-[var(--color-ink-soft)]">{statusLabel}</p>
    </button>
  );
}
