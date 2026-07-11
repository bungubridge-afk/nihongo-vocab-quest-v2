export type ProgressPillVariant = "level" | "xp" | "cards" | "next" | "review";

export interface ProgressPillProps {
  label: string;
  value: string | number;
  subLabel?: string;
  variant?: ProgressPillVariant;
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
  className,
}: ProgressPillProps) {
  const classes = [
    "min-w-[86px] rounded-2xl border px-4 py-3 text-center",
    VARIANT_CLASSES[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <div className="text-lg leading-none font-extrabold text-[var(--color-ink)]">{value}</div>
      <div className="mt-1 text-[11px] font-semibold tracking-wide text-[var(--color-ink-soft)] uppercase">
        {label}
      </div>
      {subLabel ? (
        <div className="text-[11px] text-[var(--color-ink-soft)]">{subLabel}</div>
      ) : null}
    </div>
  );
}
