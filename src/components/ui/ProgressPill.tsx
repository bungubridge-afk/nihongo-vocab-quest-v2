export type ProgressPillVariant = "level" | "xp" | "cards" | "next" | "review";

export interface ProgressPillProps {
  label: string;
  value: string | number;
  subLabel?: string;
  variant?: ProgressPillVariant;
  /** 0–100: renders a small progress bar under the value (e.g. Level progress). */
  progressPercent?: number;
  /** Makes the pill an interactive button (e.g. Karten → Sammlung). */
  onClick?: () => void;
  /** Accessible name when the pill is clickable and the visible text isn't enough. */
  ariaLabel?: string;
  className?: string;
}

const VARIANT_CLASSES: Record<ProgressPillVariant, string> = {
  level: "border-[var(--color-primary-border)] bg-[var(--color-primary-soft)]",
  xp: "border-[var(--color-gold-border)] bg-[var(--color-gold-soft)]",
  cards: "border-[var(--color-blue-border)] bg-[var(--color-blue-soft)]",
  next: "border-[var(--color-secondary-border)] bg-white",
  review: "border-[var(--color-gold-border)] bg-[var(--color-gold-soft)]",
};

export function ProgressPill({
  label,
  value,
  subLabel,
  variant = "next",
  progressPercent,
  onClick,
  ariaLabel,
  className,
}: ProgressPillProps) {
  const classes = [
    "min-w-[86px] rounded-2xl border px-4 py-3 text-center",
    VARIANT_CLASSES[variant],
    onClick ? "tap-scale cursor-pointer text-center hover:brightness-[0.98]" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <div className="text-lg leading-none font-extrabold text-[var(--color-ink)]">{value}</div>
      <div className="mt-1 text-[11px] font-semibold tracking-wide text-[var(--color-ink-soft)] uppercase">
        {label}
      </div>
      {typeof progressPercent === "number" ? (
        <div className="mx-auto mt-1.5 h-1.5 w-full max-w-[76px] overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
            style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
          />
        </div>
      ) : null}
      {subLabel ? (
        <div className="mt-1 text-[11px] leading-tight text-[var(--color-ink-soft)]">{subLabel}</div>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-label={ariaLabel} className={classes}>
        {content}
      </button>
    );
  }

  return <div className={classes}>{content}</div>;
}
