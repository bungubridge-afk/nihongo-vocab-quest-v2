"use client";

import { useId } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { isSupportedLocale } from "@/i18n/localeValidation";
import { APP_LOCALES } from "@/i18n/config";

export interface LanguageSwitcherProps {
  /** "compact" = the header pill (EN/DE, minimal width); "full" = Account/Settings
   *  row with a visible label. Both use the same native <select> underneath. */
  variant?: "compact" | "full";
  className?: string;
}

/**
 * Language switch used in the header, on /login, /signup and /account (and reusable
 * in a future Settings screen). A native <select> on purpose: it gives correct
 * keyboard handling, Escape-to-close, focus return and screen-reader semantics for
 * free, on every platform, at zero layout cost on mobile. Switching is immediate —
 * no confirm dialog — and only changes the language; it never navigates or signs
 * out (LanguageProvider.setLocale keeps route, query, auth and progress intact).
 */
export function LanguageSwitcher({ variant = "compact", className }: LanguageSwitcherProps) {
  const { locale, setLocale, messages } = useLanguage();
  const selectId = useId();

  const label = messages.language.switcherLabel;
  const optionLabel: Record<(typeof APP_LOCALES)[number], string> = {
    en: messages.language.english,
    de: messages.language.german,
  };

  const select = (
    <div className="relative inline-flex items-center">
      <select
        id={selectId}
        value={locale}
        aria-label={variant === "compact" ? label : undefined}
        onChange={(event) => {
          const next = event.target.value;
          if (isSupportedLocale(next)) setLocale(next);
        }}
        className={[
          "min-h-11 cursor-pointer appearance-none rounded-xl border-2 border-[var(--color-secondary-border)]",
          "bg-white py-1.5 pr-8 pl-3 text-sm font-bold text-[var(--color-ink)]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
          "hover:border-[var(--color-primary)]",
        ].join(" ")}
      >
        {APP_LOCALES.map((code) => (
          <option key={code} value={code}>
            {variant === "compact" ? code.toUpperCase() : optionLabel[code]}
          </option>
        ))}
      </select>
      <ChevronIcon className="pointer-events-none absolute right-2.5 h-4 w-4 text-[var(--color-ink-soft)]" />
    </div>
  );

  if (variant === "compact") {
    return <div className={className}>{select}</div>;
  }

  return (
    <div className={["flex flex-col gap-1.5", className].filter(Boolean).join(" ")}>
      <label htmlFor={selectId} className="text-sm font-bold text-[var(--color-ink)]">
        {label}
      </label>
      {select}
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
