"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, UsageExampleComparison } from "@/components/ui";
import { vocabData } from "@/lib/vocabData";
import { speakJapanese } from "@/lib/speech";
import { getRegisterLabel } from "@/lib/registerData";
import {
  formatCollectionNumber,
  getCategoryCollectionData,
  getCollectionEntry,
  vocabularyCategoryCollection,
} from "@/lib/vocabularyCollectionData";
import {
  buildVocabularySearchIndex,
  matchesNormalizedHaystack,
  normalizeVocabularySearchText,
} from "@/lib/vocabularySearch";
import { getCardStatus, getZukanStatus, isHiddenStatus } from "@/lib/zukanStatus";
import {
  getCollectedCards,
  getCompletedCategories,
  getKnownWords,
  getUnlockedCategories,
  getWeakWords,
} from "@/lib/storage";
import type { CardStatus, CategoryId, SpeechRegister, VocabItem } from "@/types/learning";
import type {
  VocabularyCategoryCollectionData,
  VocabularyCollectionEntry,
  ZukanStatus,
} from "@/types/vocabularyCollection";

const VOCAB_CATEGORY_ORDER: CategoryId[] = ["cafe", "reise", "schule", "freunde"];

const CATEGORY_FILTERS: { id: CategoryId | "all"; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "cafe", label: "Café" },
  { id: "reise", label: "Reise" },
  { id: "schule", label: "Schule" },
  { id: "freunde", label: "Freunde" },
];

type RegisterFilter = "all" | "casual" | "polite";

const REGISTER_FILTERS: { id: RegisterFilter; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "casual", label: getRegisterLabel("casual") },
  { id: "polite", label: getRegisterLabel("polite") },
];

/** True if this word has at least one register-tagged usage example matching `register`
 *  — words without `usageExamples` (Café/Reise, as of this pass) never match casual/polite. */
function hasRegisterExample(vocab: VocabItem, register: SpeechRegister): boolean {
  return (vocab.usageExamples ?? []).some((example) => example.register === register);
}

// ---------------------------------------------------------------------------
// Zukan status: the four learner-facing collection states. Mapped from the
// existing CardStatus values — progress data and practice logic are unchanged,
// only the display vocabulary is new.
// ---------------------------------------------------------------------------

const ZUKAN_STATUS_LABEL: Record<ZukanStatus, string> = {
  unentdeckt: "Unentdeckt",
  entdeckt: "Entdeckt",
  training: "Im Training",
  vertraut: "Vertraut",
};

/** Phase-19 copy — matches the real transitions in storage/practice exactly:
 *  quest completion collects cards; a practice run with mistakes adds the word to
 *  weakWords ("Im Training"); a fully correct run adds it to knownWords ("Vertraut"). */
const ZUKAN_STATUS_DESCRIPTION: Record<ZukanStatus, string> = {
  unentdeckt: "Noch nicht in einer Quest gesammelt.",
  entdeckt: "Gesammelt, aber noch nicht als sicher gelernt markiert.",
  training: "Dieses Wort solltest du noch einmal üben.",
  vertraut: "Dieses Wort hast du in der Übung sicher beantwortet.",
};

interface ProgressSnapshot {
  collectedCards: string[];
  completedCategories: CategoryId[];
  unlockedCategories: CategoryId[];
  knownWords: string[];
  weakWords: string[];
}

function loadProgress(): ProgressSnapshot {
  return {
    collectedCards: getCollectedCards(),
    completedCategories: getCompletedCategories(),
    unlockedCategories: getUnlockedCategories(),
    knownWords: getKnownWords(),
    weakWords: getWeakWords(),
  };
}

/** "0 Wortkarten" / "1 Wortkarte" / "10 Wortkarten" — German singular/plural. */
function formatResultCount(count: number): string {
  return count === 1 ? "1 Wortkarte" : `${count} Wortkarten`;
}

interface PageState {
  mounted: boolean;
  progress: ProgressSnapshot | null;
}

const INITIAL_STATE: PageState = { mounted: false, progress: null };

export default function VocabularyPage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>(INITIAL_STATE);
  const [categoryFilter, setCategoryFilter] = useState<CategoryId | "all">("all");
  const [registerFilter, setRegisterFilter] = useState<RegisterFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedVocabId, setSelectedVocabId] = useState<string | null>(null);
  // The button that opened the detail entry — focus returns here after closing.
  const dialogTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Search index (word id → normalized haystack), built ONLY for cards the player has
  // actually discovered. An undiscovered/locked card's kanji/kana/romaji/German is never
  // read here — its hidden content never enters the index in the first place. The
  // predicate decides eligibility from collection status alone (getCardStatus reads only
  // id/categoryId), so no hidden text field is touched to build the index. Zukan
  // metadata (dex descriptions etc.) is deliberately NOT part of the haystack.
  const searchHaystacks = useMemo(() => {
    const currentProgress = state.progress;
    if (!currentProgress) return new Map<string, string>();
    return buildVocabularySearchIndex(
      vocabData,
      (vocab) => !isHiddenStatus(getCardStatus(vocab, currentProgress))
    );
  }, [state.progress]);

  const normalizedQuery = useMemo(() => normalizeVocabularySearchText(query), [query]);

  useEffect(() => {
    // One-time client-only read of localStorage after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ mounted: true, progress: loadProgress() });
  }, []);

  if (!state.mounted || !state.progress) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm font-semibold text-[var(--color-ink-soft)]">Lädt…</p>
      </main>
    );
  }

  const progress = state.progress;

  // Discovered = everything that is not hidden (collected, in training, or vertraut).
  // Pure derivation from existing progress — no new stored values.
  const statusById = new Map<string, CardStatus>(
    vocabData.map((vocab) => [vocab.id, getCardStatus(vocab, progress)])
  );
  const discoveredCount = vocabData.filter(
    (vocab) => !isHiddenStatus(statusById.get(vocab.id) ?? "locked")
  ).length;
  const totalCount = vocabData.length;
  const discoveredPercent =
    totalCount > 0 ? Math.round((discoveredCount / totalCount) * 100) : 0;

  const categoryCounts = new Map<CategoryId, { discovered: number; total: number }>();
  for (const categoryId of VOCAB_CATEGORY_ORDER) {
    categoryCounts.set(categoryId, { discovered: 0, total: 0 });
  }
  for (const vocab of vocabData) {
    const counts = categoryCounts.get(vocab.categoryId);
    if (!counts) continue;
    counts.total += 1;
    if (!isHiddenStatus(statusById.get(vocab.id) ?? "locked")) {
      counts.discovered += 1;
    }
  }

  const visibleCards = vocabData
    .filter((vocab) => {
      const matchesCategory =
        categoryFilter === "all" || vocab.categoryId === categoryFilter;
      if (!matchesCategory) return false;

      const matchesRegister =
        registerFilter === "all" || hasRegisterExample(vocab, registerFilter);
      if (!matchesRegister) return false;

      // Collection protection: with no search active, hidden cards still render as a
      // silhouette. Once a search is active, an undiscovered card is excluded outright
      // — and, because it was never added to `searchHaystacks`, its hidden
      // kanji/kana/romaji/German was never even read to build the index.
      if (normalizedQuery === "") return true;
      if (isHiddenStatus(statusById.get(vocab.id) ?? "locked")) return false;

      const haystack = searchHaystacks.get(vocab.id) ?? "";
      return matchesNormalizedHaystack(haystack, normalizedQuery);
    })
    .sort(
      (a, b) =>
        (getCollectionEntry(a.id)?.collectionNumber ?? 999) -
        (getCollectionEntry(b.id)?.collectionNumber ?? 999)
    );

  const selectedVocab =
    selectedVocabId !== null
      ? vocabData.find((vocab) => vocab.id === selectedVocabId) ?? null
      : null;
  const selectedStatus = selectedVocab
    ? statusById.get(selectedVocab.id) ?? "locked"
    : null;

  function openEntry(vocabId: string, trigger: HTMLButtonElement | null) {
    dialogTriggerRef.current = trigger;
    setSelectedVocabId(vocabId);
  }

  function closeEntry() {
    setSelectedVocabId(null);
    // The dialog unmounts on this state change; return focus on the next tick.
    window.setTimeout(() => dialogTriggerRef.current?.focus(), 0);
  }

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            Zur Karte
          </Button>
        </div>

        {/* 1+2: title + what this page is, understandable in seconds */}
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-ink)] sm:text-3xl">
            Dein Kotoba-Zukan
          </h1>
          <p className="mt-1 font-semibold text-[var(--color-ink)]">
            Dein Sammellexikon für japanische Wörter.
          </p>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-soft)]">
            Entdecke neue Wörter in Quests, sammle ihre Karten und trainiere sie, bis sie
            dir vertraut sind.
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            „Kotoba“ (言葉) heißt Wort · „Zukan“ (図鑑) heißt Sammellexikon.
          </p>
        </div>

        {/* 3: total collection progress */}
        <Card variant="default">
          <p className="text-lg font-extrabold text-[var(--color-ink)] sm:text-xl">
            {discoveredCount} / {totalCount} Wörter entdeckt
          </p>
          <div
            className="xp-bar-track mt-2"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={totalCount}
            aria-valuenow={discoveredCount}
            aria-label={`Zukan-Fortschritt: ${discoveredCount} von ${totalCount} Wörtern entdeckt`}
          >
            <div className="xp-bar-fill" style={{ width: `${discoveredPercent}%` }} />
          </div>
          <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink-soft)]">
            {discoveredPercent} % des Zukans vollständig
          </p>
        </Card>

        {/* 4: category Zukan panels (also act as the category filter) */}
        <section aria-labelledby="zukan-categories-heading">
          <h2
            id="zukan-categories-heading"
            className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase"
          >
            Kategorien
          </h2>
          <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {vocabularyCategoryCollection.map((category) => {
              const counts = categoryCounts.get(category.categoryId) ?? {
                discovered: 0,
                total: 0,
              };
              return (
                <CategoryPanel
                  key={category.categoryId}
                  category={category}
                  discovered={counts.discovered}
                  total={counts.total}
                  active={categoryFilter === category.categoryId}
                  onToggle={() =>
                    setCategoryFilter((current) =>
                      current === category.categoryId ? "all" : category.categoryId
                    )
                  }
                />
              );
            })}
          </div>
        </section>

        {/* 5: how collecting works + what the statuses mean */}
        <details className="soft-card px-4 py-2">
          <summary className="flex min-h-11 cursor-pointer items-center font-bold text-[var(--color-ink)]">
            Wie funktioniert die Sammlung?
          </summary>
          <ol className="mt-2 flex list-none flex-col gap-3 text-sm">
            <RuleStep
              number={1}
              title="Quest abschließen"
              text="Neue Wörter werden nach einer Etappe entdeckt."
            />
            <RuleStep
              number={2}
              title="Karte sammeln"
              text="Entdeckte Wörter erscheinen vollständig in deinem Zukan."
            />
            <RuleStep
              number={3}
              title="Wort trainieren"
              text="Durch Übung wird eine Karte von „Im Training“ zu „Vertraut“."
            />
            <RuleStep
              number={4}
              title="Zukan vervollständigen"
              text="Entdecke alle Wörter einer Kategorie."
            />
          </ol>
          <div className="mt-4 border-t border-[var(--color-secondary-border)] pt-3 pb-2">
            <p className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
              Was bedeuten die Status?
            </p>
            <ul className="mt-2 flex flex-col gap-2">
              {(Object.keys(ZUKAN_STATUS_LABEL) as ZukanStatus[]).map((status) => (
                <li key={status} className="flex flex-wrap items-center gap-2 text-sm">
                  <ZukanStatusBadge status={status} />
                  <span className="text-[var(--color-ink-soft)]">
                    {ZUKAN_STATUS_DESCRIPTION[status]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </details>

        {/* 6: search + filters (existing behavior, unchanged) */}
        <div>
          <label
            htmlFor="vocab-search"
            className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase"
          >
            Wortkarten durchsuchen
          </label>
          <div className="relative mt-2 max-w-md">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-soft)]" />
            <input
              id="vocab-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Japanisch, Kana, Romaji oder Deutsch"
              className="w-full rounded-xl border-2 border-[var(--color-secondary-border)] bg-white py-2.5 pr-11 pl-10 text-sm text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Suche löschen"
                className="tap-scale absolute top-1/2 right-0 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              >
                <ClearIcon className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
            Kategorie
          </span>
          {CATEGORY_FILTERS.map((filter) => (
            <Button
              key={filter.id}
              variant={categoryFilter === filter.id ? "primary" : "secondary"}
              size="sm"
              className="min-h-11"
              ariaPressed={categoryFilter === filter.id}
              onClick={() => setCategoryFilter(filter.id)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
            Sprachstil
          </span>
          {REGISTER_FILTERS.map((filter) => (
            <Button
              key={filter.id}
              variant={registerFilter === filter.id ? "primary" : "secondary"}
              size="sm"
              className="min-h-11"
              ariaPressed={registerFilter === filter.id}
              onClick={() => setRegisterFilter(filter.id)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <p aria-live="polite" className="text-sm font-semibold text-[var(--color-ink-soft)]">
          {formatResultCount(visibleCards.length)}
        </p>

        {/* 7: the card grid */}
        {visibleCards.length === 0 ? (
          <Card variant="default" className="text-center">
            <p className="text-[var(--color-ink-soft)]">Keine passenden Wortkarten gefunden.</p>
            {normalizedQuery ? (
              <>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                  Versuche einen anderen Suchbegriff oder ändere die Filter.
                </p>
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="min-h-11"
                    onClick={() => setQuery("")}
                  >
                    Suche löschen
                  </Button>
                </div>
              </>
            ) : null}
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {visibleCards.map((vocab) => {
              const status = statusById.get(vocab.id) ?? "locked";
              return isHiddenStatus(status) ? (
                <ZukanHiddenCard key={vocab.id} vocab={vocab} />
              ) : (
                <ZukanCard
                  key={vocab.id}
                  vocab={vocab}
                  zukanStatus={getZukanStatus(status)}
                  entry={getCollectionEntry(vocab.id)}
                  onOpen={(trigger) => openEntry(vocab.id, trigger)}
                />
              );
            })}
          </div>
        )}
      </div>

      {selectedVocab && selectedStatus !== null && !isHiddenStatus(selectedStatus) ? (
        <ZukanDetailDialog
          vocab={selectedVocab}
          entry={getCollectionEntry(selectedVocab.id)}
          zukanStatus={getZukanStatus(selectedStatus)}
          onClose={closeEntry}
          onPractice={() => router.push(`/practice?word=${selectedVocab.id}`)}
        />
      ) : null}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Category panel
// ---------------------------------------------------------------------------

interface CategoryPanelProps {
  category: VocabularyCategoryCollectionData;
  discovered: number;
  total: number;
  active: boolean;
  onToggle: () => void;
}

function CategoryPanel({ category, discovered, total, active, onToggle }: CategoryPanelProps) {
  const complete = total > 0 && discovered === total;
  const remaining = total - discovered;
  const percent = total > 0 ? Math.round((discovered / total) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={[
        "tap-scale flex min-h-11 flex-col gap-1.5 rounded-2xl border-2 p-3 text-left transition-colors",
        active
          ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
          : "border-[var(--color-secondary-border)] bg-white hover:border-[var(--color-primary)]",
      ].join(" ")}
    >
      <span className="flex items-center gap-2">
        <CategoryIcon iconKey={category.iconKey} className="h-5 w-5 shrink-0 text-[var(--color-primary-dark)]" />
        <span className="font-extrabold break-words text-[var(--color-ink)]">
          {category.titleGerman}
        </span>
      </span>
      <span className="text-sm font-semibold text-[var(--color-ink)]">
        {discovered} / {total} entdeckt
      </span>
      <span className="xp-bar-track" aria-hidden="true">
        <span className="xp-bar-fill block" style={{ width: `${percent}%` }} />
      </span>
      {complete ? (
        <span className="zukan-complete-stamp mt-0.5 self-start">
          <CheckIcon className="h-3 w-3" />
          Komplett
        </span>
      ) : (
        <span className="text-xs text-[var(--color-ink-soft)]">
          Noch {remaining} {remaining === 1 ? "Wort" : "Wörter"}
        </span>
      )}
    </button>
  );
}

function RuleStep({ number, title, text }: { number: number; title: string; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-xs font-extrabold text-[var(--color-primary-dark)]"
      >
        {number}
      </span>
      <span>
        <span className="font-bold text-[var(--color-ink)]">{title}</span>
        <br />
        <span className="text-[var(--color-ink-soft)]">{text}</span>
      </span>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Status badge — text + icon + color + aria description, never color alone.
// ---------------------------------------------------------------------------

const ZUKAN_STATUS_BADGE_CLASSES: Record<ZukanStatus, string> = {
  unentdeckt: "bg-[var(--color-locked-bg)] text-[var(--color-locked)]",
  entdeckt: "bg-[var(--color-blue-soft)] text-[var(--color-blue)]",
  training: "bg-[var(--color-gold-soft)] text-[var(--color-gold)]",
  vertraut: "bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]",
};

function ZukanStatusBadge({ status, className }: { status: ZukanStatus; className?: string }) {
  return (
    <span
      aria-label={`${ZUKAN_STATUS_LABEL[status]}: ${ZUKAN_STATUS_DESCRIPTION[status]}`}
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide whitespace-nowrap",
        ZUKAN_STATUS_BADGE_CLASSES[status],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ZukanStatusIcon status={status} className="h-3 w-3 shrink-0" />
      {ZUKAN_STATUS_LABEL[status]}
    </span>
  );
}

function ZukanStatusIcon({ status, className }: { status: ZukanStatus; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
  switch (status) {
    case "unentdeckt":
      return (
        <svg {...common}>
          <path d="M9 9a3 3 0 1 1 4.6 2.5c-1 .7-1.6 1.3-1.6 2.5" />
          <path d="M12 17.5h.01" />
        </svg>
      );
    case "entdeckt":
      return (
        <svg {...common}>
          <rect x="5" y="4" width="14" height="16" rx="2.5" />
          <path d="m9 12 2.2 2.2L15.5 10" />
        </svg>
      );
    case "training":
      return (
        <svg {...common}>
          <path d="M4 9a8 8 0 0 1 14-2l2 2.5" />
          <path d="M20 4v5h-5" />
          <path d="M20 15a8 8 0 0 1-14 2l-2-2.5" />
          <path d="M4 20v-5h5" />
        </svg>
      );
    case "vertraut":
      return (
        <svg {...common}>
          <path d="m12 3.5 2.5 5.2 5.7.7-4.2 3.9 1.1 5.6L12 16.2l-5.1 2.7 1.1-5.6-4.2-3.9 5.7-.7Z" />
        </svg>
      );
  }
}

// ---------------------------------------------------------------------------
// Category icons — original inline SVGs, decorative only.
// ---------------------------------------------------------------------------

function CategoryIcon({
  iconKey,
  className,
}: {
  iconKey: VocabularyCategoryCollectionData["iconKey"];
  className?: string;
}) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
  switch (iconKey) {
    case "cup":
      return (
        <svg {...common}>
          <path d="M5 9h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9Z" />
          <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" />
          <path d="M8 5.5c0-1 .8-1 .8-2M11.6 5.5c0-1 .8-1 .8-2" />
        </svg>
      );
    case "torii":
      return (
        <svg {...common}>
          <path d="M4 6.5q8-2 16 0" />
          <path d="M5.5 10.5h13" />
          <path d="M7.5 6.2V20M16.5 6.2V20" />
          <path d="M12 6.4v4.1" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M12 6.5C10.5 5 8 4.5 4.5 4.8V18c3.5-.3 6 .2 7.5 1.7 1.5-1.5 4-2 7.5-1.7V4.8C16 4.5 13.5 5 12 6.5Z" />
          <path d="M12 6.5V19.7" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M4 5.5h11a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H9l-3.5 3v-3H4A1.5 1.5 0 0 1 2.5 12V7A1.5 1.5 0 0 1 4 5.5Z" />
          <path d="M19 9.5h1a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-.5v2.5l-3-2.5H14" />
        </svg>
      );
  }
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

/** Minimal inline search icon — no icon library dependency. */
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/** Minimal inline "clear" (X) icon — no icon library dependency. */
function ClearIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/** Minimal inline speaker icon — no icon library dependency. */
function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Compact discovered card
// ---------------------------------------------------------------------------

interface ZukanCardProps {
  vocab: VocabItem;
  zukanStatus: ZukanStatus;
  entry: VocabularyCollectionEntry | undefined;
  onOpen: (trigger: HTMLButtonElement | null) => void;
}

function ZukanCard({ vocab, zukanStatus, entry, onOpen }: ZukanCardProps) {
  const category = getCategoryCollectionData(vocab.categoryId);
  const hasUsageExamples = (vocab.usageExamples?.length ?? 0) > 0;
  const openButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <Card variant="default" className="zukan-card-discovered flex flex-col gap-2">
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono text-xs font-bold text-[var(--color-ink-soft)]">
          {entry ? formatCollectionNumber(entry.collectionNumber) : "#—"}
        </span>
        <ZukanStatusBadge status={zukanStatus} />
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xl font-extrabold break-words text-[var(--color-ink)]">
            {vocab.kanji}
          </p>
          <p className="text-xs break-words text-[var(--color-ink-soft)]">
            {vocab.kana} · {vocab.romaji}
          </p>
          <p className="text-sm font-semibold break-words text-[var(--color-ink)]">
            {vocab.german}
          </p>
        </div>
        <button
          type="button"
          onClick={() => speakJapanese(vocab.kanji)}
          aria-label={`Aussprache von ${vocab.german} hören`}
          title="Aussprache hören"
          className="tap-scale flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-secondary-border)] bg-white text-[var(--color-primary-dark)] hover:border-[var(--color-primary)]"
        >
          <SpeakerIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-[var(--color-ink-soft)]">
        <span>{category?.titleGerman ?? vocab.categoryId}</span>
        {hasUsageExamples ? (
          <span className="rounded-full bg-[var(--color-teal-soft)] px-2 py-0.5 font-bold text-[var(--color-teal)]">
            Locker &amp; Höflich
          </span>
        ) : null}
      </div>

      <div className="mt-auto">
        <button
          ref={openButtonRef}
          type="button"
          onClick={() => onOpen(openButtonRef.current)}
          className="tap-scale inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[var(--color-secondary-border)] bg-[var(--color-secondary)] px-3 py-1.5 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-primary-soft)]"
        >
          Eintrag öffnen
        </button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Hidden (undiscovered) card — silhouette, zero content leakage.
// ---------------------------------------------------------------------------

function ZukanHiddenCard({ vocab }: { vocab: VocabItem }) {
  // Reads only categoryId — never kanji/kana/romaji/german or Zukan metadata.
  const category = getCategoryCollectionData(vocab.categoryId);

  return (
    <Card variant="locked" className="zukan-card-hidden flex flex-col gap-2">
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono text-xs font-bold text-[var(--color-locked)]">#???</span>
        <ZukanStatusBadge status="unentdeckt" />
      </div>

      <div className="zukan-silhouette h-16">
        <span aria-hidden="true" className="text-3xl font-extrabold">
          ?
        </span>
      </div>

      <p className="text-lg font-extrabold text-[var(--color-locked)]">???</p>
      <p className="text-xs font-semibold text-[var(--color-ink-soft)]">
        Schließe Quests ab, um diese Karte zu entdecken.
      </p>
      <p className="mt-auto text-[11px] font-semibold text-[var(--color-ink-soft)]">
        {category?.titleGerman ?? vocab.categoryId}
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Detail dialog (native <dialog>, accessible, mobile-first)
// ---------------------------------------------------------------------------

interface ZukanDetailDialogProps {
  vocab: VocabItem;
  entry: VocabularyCollectionEntry | undefined;
  zukanStatus: ZukanStatus;
  onClose: () => void;
  onPractice: () => void;
}

function ZukanDetailDialog({
  vocab,
  entry,
  zukanStatus,
  onClose,
  onPractice,
}: ZukanDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const category = getCategoryCollectionData(vocab.categoryId);
  const hasUsageExamples = (vocab.usageExamples?.length ?? 0) > 0;
  const titleId = "zukan-dialog-title";
  const descriptionId = "zukan-dialog-description";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    try {
      dialog.showModal();
    } catch {
      // Fallback for environments without showModal: open non-modally with the
      // dialog semantics intact; Esc still works via the document listener below.
      dialog.setAttribute("open", "");
    }

    // The page behind the entry must not scroll while it is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      try {
        dialog.close();
      } catch {
        dialog.removeAttribute("open");
      }
    };
  }, []);

  useEffect(() => {
    // Esc support for the non-showModal fallback (harmless duplicate when the
    // native dialog already handled it — onClose is idempotent).
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="zukan-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop region targets the <dialog> element itself.
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="zukan-dialog-body flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <h2 id={titleId} className="text-lg font-extrabold text-[var(--color-ink)]">
            Zukan-Eintrag {entry ? formatCollectionNumber(entry.collectionNumber) : ""}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Eintrag schließen"
            className="tap-scale -mt-1 -mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--color-ink-soft)] hover:bg-[var(--color-locked-bg)] hover:text-[var(--color-ink)]"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ZukanStatusBadge status={zukanStatus} />
          {category ? <Badge variant="gray">{category.titleGerman}</Badge> : null}
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-3xl font-extrabold break-words text-[var(--color-ink)]">
              {vocab.kanji}
            </p>
            <p className="mt-1 text-sm break-words text-[var(--color-ink-soft)]">
              {vocab.kana} · {vocab.romaji}
            </p>
            <p className="text-base font-bold break-words text-[var(--color-ink)]">
              {vocab.german}
            </p>
          </div>
          <button
            type="button"
            onClick={() => speakJapanese(vocab.kanji)}
            aria-label={`Aussprache von ${vocab.german} hören`}
            title="Aussprache hören"
            className="tap-scale flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-secondary-border)] bg-white text-[var(--color-primary-dark)] hover:border-[var(--color-primary)]"
          >
            <SpeakerIcon className="h-4 w-4" />
          </button>
        </div>

        {entry ? (
          <section>
            <h3 className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
              Zukan-Notiz
            </h3>
            <p id={descriptionId} className="mt-1 text-sm text-[var(--color-ink)] italic">
              {entry.dexDescriptionGerman}
            </p>
          </section>
        ) : null}

        <section className="soft-card px-3 py-2.5">
          <h3 className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
            Beispiel
          </h3>
          <p className="mt-1 font-bold break-words text-[var(--color-ink)]">
            {vocab.exampleJapanese}
          </p>
          <p className="text-sm break-words text-[var(--color-ink-soft)]">{vocab.exampleKana}</p>
          <p className="text-sm break-words text-[var(--color-ink-soft)]">{vocab.exampleGerman}</p>
        </section>

        {entry ? (
          <section>
            <h3 className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
              So setzt du es ein
            </h3>
            <p className="mt-1 text-sm text-[var(--color-ink)]">{entry.usageRoleGerman}</p>
          </section>
        ) : null}

        {entry ? (
          <section className="rounded-xl border border-[var(--color-gold-border)] bg-[var(--color-gold-soft)] px-3 py-2.5">
            <h3 className="text-xs font-bold tracking-wide text-[var(--color-gold)] uppercase">
              Merke
            </h3>
            <p className="mt-1 text-sm font-semibold break-words text-[var(--color-ink)]">
              {entry.memoryHookGerman}
            </p>
          </section>
        ) : null}

        <p className="text-sm text-[var(--color-ink)]">{vocab.shortTip}</p>

        {hasUsageExamples ? (
          <section>
            <h3 className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
              Locker &amp; Höflich
            </h3>
            <UsageExampleComparison usageExamples={vocab.usageExamples} className="mt-2" />
          </section>
        ) : null}

        <details className="rounded-xl border border-[var(--color-secondary-border)] px-3 py-1">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-bold text-[var(--color-ink)]">
            Mehr wissen
          </summary>
          <div className="flex flex-col gap-2 pt-1 pb-2 text-sm text-[var(--color-ink-soft)]">
            <p className="text-[var(--color-ink)]">{vocab.detailTip}</p>
            <p>
              <span className="font-semibold text-[var(--color-ink)]">Beispiele: </span>
              {vocab.commonExamples.join(" / ")}
            </p>
            <p>
              <span className="font-semibold text-[var(--color-ink)]">Muster: </span>
              {vocab.commonPatterns.join(" / ")}
            </p>
            <p>
              <span className="font-semibold text-[var(--color-ink)]">Verwandt: </span>
              {vocab.relatedExpressions.join(" / ")}
            </p>
          </div>
        </details>

        <Button variant="primary" onClick={onPractice} className="w-full">
          Karte üben
        </Button>
      </div>
    </dialog>
  );
}
