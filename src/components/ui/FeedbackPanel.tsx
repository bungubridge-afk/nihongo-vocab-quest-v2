"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export interface FeedbackPanelProps {
  isCorrect: boolean;
  answer: string;
  kana?: string;
  romaji?: string;
  german?: string;
  exampleJapanese?: string;
  exampleKana?: string;
  exampleGerman?: string;
  shortTip?: string;
  detailTip?: string;
  onNext?: () => void;
  nextLabel?: string;
}

export function FeedbackPanel({
  isCorrect,
  answer,
  kana,
  romaji,
  german,
  exampleJapanese,
  exampleKana,
  exampleGerman,
  shortTip,
  detailTip,
  onNext,
  nextLabel = "Weiter",
}: FeedbackPanelProps) {
  const [showDetail, setShowDetail] = useState(false);

  const readingLine = [kana, romaji, german].filter(Boolean).join(" · ");
  const hasExample = Boolean(exampleJapanese || exampleKana || exampleGerman);

  const panelClasses = [
    "feedback-panel animate-pop-in",
    isCorrect
      ? "bg-[var(--color-primary-soft)] border-[var(--color-primary-border)]"
      : "bg-[var(--color-danger-soft)] border-[var(--color-danger-border)]",
  ].join(" ");

  return (
    <div className={panelClasses}>
      <p
        className={
          isCorrect
            ? "text-lg font-extrabold text-[var(--color-primary-dark)]"
            : "text-lg font-extrabold text-[var(--color-danger)]"
        }
      >
        {isCorrect ? "Richtig!" : "Leider falsch"}
      </p>

      <div className="mt-2">
        <p className="text-xs font-semibold tracking-wide text-[var(--color-ink-soft)] uppercase">
          Richtige Antwort
        </p>
        <p className="text-base font-bold text-[var(--color-ink)]">{answer}</p>
      </div>

      {readingLine ? (
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{readingLine}</p>
      ) : null}

      {hasExample ? (
        <div className="soft-card mt-3 px-3 py-2">
          <p className="text-xs font-semibold tracking-wide text-[var(--color-ink-soft)] uppercase">
            Beispiel
          </p>
          {exampleJapanese ? (
            <p className="font-bold text-[var(--color-ink)]">{exampleJapanese}</p>
          ) : null}
          {exampleKana ? (
            <p className="text-sm text-[var(--color-ink-soft)]">{exampleKana}</p>
          ) : null}
          {exampleGerman ? (
            <p className="text-sm text-[var(--color-ink-soft)]">{exampleGerman}</p>
          ) : null}
        </div>
      ) : null}

      {shortTip ? <p className="mt-3 text-sm text-[var(--color-ink)]">{shortTip}</p> : null}

      {detailTip ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowDetail((prev) => !prev)}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary-dark)] underline underline-offset-2"
          >
            {showDetail ? "Weniger anzeigen" : "Mehr anzeigen"}
          </button>
          {showDetail ? (
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{detailTip}</p>
          ) : null}
        </div>
      ) : null}

      {onNext ? (
        <div className="mt-4">
          <Button variant="primary" onClick={onNext} className="w-full">
            {nextLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
