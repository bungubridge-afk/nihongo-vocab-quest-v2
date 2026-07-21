"use client";

import type { ReactElement } from "react";
import type { SpeechRegister } from "@/types/learning";
import { useLanguage } from "@/hooks/useLanguage";

export interface RegisterBadgeProps {
  register: SpeechRegister;
  className?: string;
}

/**
 * Colour alone never carries the meaning here — every badge also renders its German
 * label (getRegisterLabel) as real text, so screen readers and colour-blind users get
 * the same information as everyone else. Casual/polite intentionally use different hues
 * from the app's existing "correct answer" green, so a Höflich badge next to a quiz
 * question is never mistaken for a correctness signal.
 */
const REGISTER_BADGE_CLASSES: Record<SpeechRegister, string> = {
  neutral: "bg-[var(--color-secondary-border)] text-[var(--color-ink-soft)]",
  casual: "bg-[var(--color-blue-soft)] text-[var(--color-blue)]",
  polite: "bg-[var(--color-teal-soft)] text-[var(--color-teal)]",
  honorific: "bg-[var(--color-gold-soft)] text-[var(--color-gold)]",
  humble: "bg-[var(--color-secondary-border)] text-[var(--color-ink-soft)]",
};

/** Small speech-bubble mark for the casual/"Locker" register. Purely decorative. */
function CasualIcon() {
  return (
    <svg viewBox="0 0 20 20" width="12" height="12" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M2.5 4.5A2 2 0 0 1 4.5 2.5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8.6l-3.4 2.7a.5.5 0 0 1-.8-.4v-2.3h-.9a2 2 0 0 1-2-2v-6Z" />
    </svg>
  );
}

/** Small bowing-figure mark for the polite/"Höflich" register. Purely decorative. */
function PoliteIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="10" cy="4.3" r="1.6" fill="currentColor" stroke="none" />
      <path d="M4.5 15.5c1.4-6 3.6-8.7 5.5-8.7s4.1 2.7 5.5 8.7" />
    </svg>
  );
}

const REGISTER_ICON: Partial<Record<SpeechRegister, () => ReactElement>> = {
  casual: CasualIcon,
  polite: PoliteIcon,
};

/**
 * Small, reusable register badge. Always renders the register's German label as visible
 * text (getRegisterLabel) — colour and the optional icon are decoration on top of that,
 * never the only signal.
 */
export function RegisterBadge({ register, className }: RegisterBadgeProps) {
  const { messages } = useLanguage();
  const label = messages.register.label[register];
  const Icon = REGISTER_ICON[register];

  const classes = [
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tracking-wide",
    REGISTER_BADGE_CLASSES[register],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      {Icon ? <Icon /> : null}
      {label}
    </span>
  );
}
