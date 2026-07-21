"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui";
import { useLanguage } from "@/hooks/useLanguage";
import { getMessages } from "@/i18n/getMessages";
import { sanitizeInternalRedirect } from "@/lib/auth/redirect";
import { getBrowserLocaleCandidate } from "@/i18n/localeValidation";
import type { AppLocale } from "@/i18n/types";

/**
 * First-run language selection. Bilingual by design (English + German side by side)
 * so it is understandable BEFORE any language is chosen. It never talks about
 * countries or regions ("English"/"Deutsch", not "USA"/"Germany") — the choice is
 * the explanation language, not where you live.
 *
 * Reached only by genuinely new visitors: the client bootstrap
 * (LanguageRedirectGate, wired on Home) sends a browser here only when there's no
 * locale cookie AND no legacy progress. The browser language is used solely to
 * pre-highlight a card; it is never auto-committed — the user must press Continue.
 */
export default function LanguagePage() {
  return (
    <Suspense fallback={<LanguageFallback />}>
      <LanguageSelectContent />
    </Suspense>
  );
}

function LanguageFallback() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <p className="text-sm font-semibold text-[var(--color-ink-soft)]">Lädt… · Loading…</p>
    </main>
  );
}

function LanguageSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale: currentLocale, setLocale, messages } = useLanguage();

  const nextPath = sanitizeInternalRedirect(searchParams.get("next"), "/");

  // Pre-selected card: browser-language guess if it maps to en/de, else the current
  // provider locale. Only a highlight — nothing is saved until Continue is pressed.
  const [selected, setSelected] = useState<AppLocale>(currentLocale);

  useEffect(() => {
    const candidate = getBrowserLocaleCandidate(
      typeof navigator !== "undefined" ? navigator.languages : undefined
    );
    if (candidate !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(candidate);
    }
  }, []);

  function handleContinue() {
    setLocale(selected);
    router.replace(nextPath);
  }

  // Headings/subheadings are shown in BOTH languages so the screen reads before a
  // choice exists. The selected language's copy leads, the other follows in muted text.
  const primary = getMessages(selected);
  const other = getMessages(selected === "en" ? "de" : "en");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-extrabold text-[var(--color-ink)]">
          {primary.language.selectTitle}
        </h1>
        <p className="text-sm font-semibold text-[var(--color-ink-soft)]">
          {other.language.selectTitle}
        </p>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          {primary.language.selectSubtitle} · {other.language.selectSubtitle}
        </p>

        <div
          role="radiogroup"
          aria-label={`${primary.language.selectTitle} · ${other.language.selectTitle}`}
          className="mt-5 flex flex-col gap-3"
        >
          <LanguageOption
            locale="en"
            title={messages.language.english}
            description={getMessages("en").language.englishCardDescription}
            selected={selected === "en"}
            onSelect={() => setSelected("en")}
          />
          <LanguageOption
            locale="de"
            title={messages.language.german}
            description={getMessages("de").language.germanCardDescription}
            selected={selected === "de"}
            onSelect={() => setSelected("de")}
          />
        </div>

        <button
          type="button"
          onClick={handleContinue}
          className="tap-scale mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 font-bold text-white hover:bg-[var(--color-primary-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          {/* CTA is in the language currently selected, so it previews the choice. */}
          {primary.language.continue}
        </button>
      </Card>
    </main>
  );
}

function LanguageOption({
  locale,
  title,
  description,
  selected,
  onSelect,
}: {
  locale: AppLocale;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      lang={locale}
      onClick={onSelect}
      className={[
        "tap-scale flex min-h-11 flex-col gap-0.5 rounded-2xl border-2 px-4 py-3 text-left transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
        selected
          ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
          : "border-[var(--color-secondary-border)] bg-white hover:border-[var(--color-primary)]",
      ].join(" ")}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-base font-extrabold text-[var(--color-ink)]">{title}</span>
        <span
          aria-hidden="true"
          className={[
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
            selected
              ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
              : "border-[var(--color-secondary-border)] bg-white",
          ].join(" ")}
        >
          {selected ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3"
            >
              <path d="m5 12.5 4.5 4.5L19 7" />
            </svg>
          ) : null}
        </span>
      </span>
      <span className="text-sm text-[var(--color-ink-soft)]">{description}</span>
    </button>
  );
}
