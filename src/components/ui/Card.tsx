import type { ReactNode } from "react";

export type CardVariant = "default" | "soft" | "locked" | "highlight" | "challenge";

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
  onClick?: () => void;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: "soft-card",
  soft: "bg-[var(--color-primary-soft)] border border-[var(--color-primary-border)] rounded-2xl",
  locked: "locked-card rounded-2xl",
  highlight:
    "bg-white border-2 border-[var(--color-primary)] rounded-2xl shadow-[0_10px_24px_-14px_var(--color-card-shadow)]",
  challenge:
    "bg-[var(--color-gold-soft)] border border-[var(--color-gold-border)] rounded-2xl",
};

export function Card({ children, variant = "default", className, onClick }: CardProps) {
  const interactive = typeof onClick === "function";

  const classes = [
    "p-4",
    VARIANT_CLASSES[variant],
    interactive ? "tap-scale cursor-pointer transition-transform hover:-translate-y-0.5" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
}
