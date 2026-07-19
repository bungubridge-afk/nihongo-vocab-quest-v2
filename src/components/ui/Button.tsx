import type { ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "locked";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  /** For toggle-style buttons (filter chips): exposes the pressed state to AT. */
  ariaPressed?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white border border-[var(--color-primary-dark)] hover:bg-[var(--color-primary-dark)]",
  secondary:
    "bg-[var(--color-secondary)] text-[var(--color-ink)] border border-[var(--color-secondary-border)] hover:bg-[var(--color-primary-soft)]",
  ghost:
    "bg-transparent text-[var(--color-ink)] border border-transparent hover:bg-[var(--color-locked-bg)]",
  danger:
    "bg-[var(--color-danger)] text-white border border-[var(--color-danger)] hover:brightness-95",
  locked:
    "bg-[var(--color-locked-bg)] text-[var(--color-locked)] border border-[var(--color-secondary-border)]",
};

/**
 * `min-h-11` (44px) guarantees a comfortable touch target without inflating the type
 * scale: the label keeps its own `text-*` size and the extra height is absorbed by the
 * flex centering, so `sm` still *looks* small while staying thumb-friendly on mobile.
 * `md`/`lg` already exceed 44px through their padding alone.
 */
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3 py-1.5 text-sm rounded-xl",
  md: "px-5 py-2.5 text-base rounded-2xl",
  lg: "px-7 py-3.5 text-lg rounded-2xl",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  className,
  onClick,
  type = "button",
  ariaPressed,
}: ButtonProps) {
  const isLocked = variant === "locked";
  const nonInteractive = disabled || isLocked;

  const classes = [
    "tap-scale inline-flex items-center justify-center gap-2 font-bold transition-colors",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    nonInteractive ? "cursor-not-allowed opacity-70" : "cursor-pointer",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      disabled={nonInteractive}
      onClick={onClick}
      className={classes}
      aria-pressed={ariaPressed}
    >
      {children}
    </button>
  );
}
