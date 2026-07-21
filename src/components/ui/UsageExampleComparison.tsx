"use client";

import type { SpeechRegister, UsageExample } from "@/types/learning";
import { RegisterBadge } from "@/components/ui/RegisterBadge";
import { useLanguage } from "@/hooks/useLanguage";
import { localizeContent } from "@/i18n/localizeContent";

export interface UsageExampleComparisonProps {
  /** Pass `vocab.usageExamples` directly — undefined/empty renders nothing, no error. */
  usageExamples: UsageExample[] | undefined;
  className?: string;
}

/** Casual always shown before polite, regardless of the source array's own order. */
const REGISTER_SORT_ORDER: Record<SpeechRegister, number> = {
  casual: 0,
  polite: 1,
  neutral: 2,
  honorific: 3,
  humble: 4,
};

interface ContrastGroup {
  key: string;
  examples: UsageExample[];
}

/** Groups examples by `contrastGroup` (falling back to the example's own id when absent,
 *  so an ungrouped example still renders on its own), then sorts each group casual-first. */
function groupByContrast(examples: UsageExample[]): ContrastGroup[] {
  const order: string[] = [];
  const byKey = new Map<string, UsageExample[]>();

  for (const example of examples) {
    const key = example.contrastGroup ?? example.id;
    if (!byKey.has(key)) {
      byKey.set(key, []);
      order.push(key);
    }
    byKey.get(key)?.push(example);
  }

  return order.map((key) => ({
    key,
    examples: [...(byKey.get(key) ?? [])].sort(
      (a, b) => (REGISTER_SORT_ORDER[a.register] ?? 99) - (REGISTER_SORT_ORDER[b.register] ?? 99)
    ),
  }));
}

/**
 * Side-by-side casual/polite comparison for one word's `usageExamples`, grouped by
 * `contrastGroup`. Safe to call with `undefined` or `[]` (renders nothing) — words
 * without register-tagged examples (Café/Reise, as of this pass) are simply not shown.
 */
export function UsageExampleComparison({ usageExamples, className }: UsageExampleComparisonProps) {
  if (!usageExamples || usageExamples.length === 0) return null;

  const groups = groupByContrast(usageExamples);

  return (
    <div className={["flex flex-col gap-3", className].filter(Boolean).join(" ")}>
      {groups.map((group) => (
        <div key={group.key} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {group.examples.map((example) => (
            <ExampleCard key={example.id} example={example} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ExampleCard({ example }: { example: UsageExample }) {
  const { locale, messages } = useLanguage();
  const blurb =
    example.register === "casual"
      ? messages.register.blurb.casual
      : example.register === "polite"
        ? messages.register.blurb.polite
        : undefined;

  return (
    <div className="soft-card flex min-w-0 flex-col gap-1.5 px-3 py-2.5">
      <RegisterBadge register={example.register} />
      {blurb ? <p className="text-xs break-words text-[var(--color-ink-soft)]">{blurb}</p> : null}
      <p className="mt-1 font-bold break-words text-[var(--color-ink)]">{example.japanese}</p>
      <p className="text-sm break-words text-[var(--color-ink-soft)]">{example.kana}</p>
      <p className="text-sm break-words text-[var(--color-ink-soft)]">{example.romaji}</p>
      <p className="text-sm break-words text-[var(--color-ink-soft)]">
        {localizeContent(example.german, locale)}
      </p>
      {example.contextGerman ? (
        <div className="mt-1">
          <p className="text-[10px] font-semibold tracking-wide text-[var(--color-ink-soft)] uppercase">
            {messages.vocabulary.situation}
          </p>
          <p className="text-xs break-words text-[var(--color-ink-soft)]">
            {localizeContent(example.contextGerman, locale)}
          </p>
        </div>
      ) : null}
      {example.noteGerman ? (
        <p className="text-xs break-words text-[var(--color-ink-soft)] italic">
          {localizeContent(example.noteGerman, locale)}
        </p>
      ) : null}
    </div>
  );
}
