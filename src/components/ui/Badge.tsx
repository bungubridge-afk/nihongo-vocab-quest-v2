import type { ReactNode } from "react";

export type BadgeVariant = "green" | "blue" | "yellow" | "red" | "gray" | "locked";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  green: "bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]",
  blue: "bg-[var(--color-blue-soft)] text-[var(--color-blue)]",
  yellow: "bg-[var(--color-gold-soft)] text-[var(--color-gold)]",
  red: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  gray: "bg-[var(--color-secondary-border)] text-[var(--color-ink-soft)]",
  locked: "bg-[var(--color-locked-bg)] text-[var(--color-locked)]",
};

export function Badge({ children, variant = "gray", className }: BadgeProps) {
  const classes = [
    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tracking-wide",
    VARIANT_CLASSES[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
}
