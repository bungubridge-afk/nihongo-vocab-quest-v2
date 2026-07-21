"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, UsageExampleComparison } from "@/components/ui";
import { useLanguage } from "@/hooks/useLanguage";
import { localizeContent } from "@/i18n/localizeContent";
import { formatMessage, type Messages } from "@/i18n/getMessages";
import { vocabData } from "@/lib/vocabData";
import { speakJapanese } from "@/lib/speech";
import {
  buildCategoryCollectionView,
  formatCollectionNumber,
  getAreaProgress,
  getCategoryCollectionData,
  getChapterById,
  getChapterProgress,
  getChaptersForArea,
  getCollectionEntry,
  sortCollectionEntries,
  vocabularyCollectionAreas,
  vocabularyCategoryCollection,
} from "@/lib/vocabularyCollectionData";
import {
  buildVocabularySearchIndex,
  matchesNormalizedHaystack,
  normalizeVocabularySearchText,
} from "@/lib/vocabularySearch";
import { getCardStatus, getZukanStatus, isHiddenStatus } from "@/lib/zukanStatus";
import { getCultureNote } from "@/lib/vocabularyCultureData";
import {
  getCollectedCards,
  getCompletedCategories,
  getKnownWords,
  getUnlockedCategories,
  getWeakWords,
} from "@/lib/storage";
import type { CardStatus, CategoryId, SpeechRegister, VocabItem } from "@/types/learning";
import type {
  CategoryCollectionView,
  ChapterProgressView,
  VocabularyCategoryCollectionData,
  VocabularyCollectionChapter,
  VocabularyCollectionEntry,
  ZukanStatus,
} from "@/types/vocabularyCollection";

const VOCAB_CATEGORY_ORDER: CategoryId[] = ["cafe", "reise", "schule", "freunde"];

/** Category filter chips — the German category name is a dictionary key, localized
 *  for display; "all" uses the catalog's filterAll label. */
const CATEGORY_FILTER_IDS: (CategoryId | "all")[] = [
  "all",
  "cafe",
  "reise",
  "schule",
  "freunde",
];
const CATEGORY_FILTER_LABEL: Record<CategoryId, string> = {
  cafe: "Café",
  reise: "Reise",
  schule: "Schule",
  freunde: "Freunde",
  review: "Review",
};

type RegisterFilter = "all" | "casual" | "polite";

/** True if this word has at least one register-tagged usage example matching `register`. */
function hasRegisterExample(vocab: VocabItem, register: SpeechRegister): boolean {
  return (vocab.usageExamples ?? []).some((example) => example.register === register);
}

const ZUKAN_STATUS_ORDER: ZukanStatus[] = ["unentdeckt", "entdeckt", "training", "vertraut"];

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

/** Localized "N word card(s)" count, choosing the singular/plural catalog key. */
function formatResultCount(count: number, messages: Messages): string {
  return count === 1
    ? messages.vocabulary.resultOne
    : formatMessage(messages.vocabulary.resultMany, { count });
}

interface PageState {
  mounted: boolean;
  progress: ProgressSnapshot | null;
}

const INITIAL_STATE: PageState = { mounted: false, progress: null };

export default function VocabularyPage() {
  const router = useRouter();
  const { locale, messages } = useLanguage();
  const [state, setState] = useState<PageState>(INITIAL_STATE);
  const [categoryFilter, setCategoryFilter] = useState<CategoryId | "all">("all");
  const [registerFilter, setRegisterFilter] = useState<RegisterFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedVocabId, setSelectedVocabId] = useState<string | null>(null);
  // The button that opened the detail entry — focus returns here after closing.
  const dialogTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Search index (word id → normalized haystack), built ONLY for cards the player has
  // actually discovered. An undiscovered/locked card's kanji/kana/romaji/meaning is never
  // read here — its hidden content never enters the index in the first place. The meaning
  // is localized to the current language (localizeContent) INSIDE the index builder, only
  // after the discovery predicate passes, so an English learner searches English meanings,
  // a German learner searches German meanings, and no hidden text is read either way.
  const searchHaystacks = useMemo(() => {
    const currentProgress = state.progress;
    if (!currentProgress) return new Map<string, string>();
    return buildVocabularySearchIndex(
      vocabData,
      (vocab) => !isHiddenStatus(getCardStatus(vocab, currentProgress)),
      (vocab) => localizeContent(vocab.german, locale)
    );
  }, [state.progress, locale]);

  const normalizedQuery = useMemo(() => normalizeVocabularySearchText(query), [query]);

  useEffect(() => {
    // One-time client-only read of localStorage after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ mounted: true, progress: loadProgress() });
  }, []);

  if (!state.mounted || !state.progress) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm font-semibold text-[var(--color-ink-soft)]">
          {messages.common.loading}
        </p>
      </main>
    );
  }

  const progress = state.progress;

  const statusById = new Map<string, CardStatus>(
    vocabData.map((vocab) => [vocab.id, getCardStatus(vocab, progress)])
  );
  const isDiscovered = (vocabId: string): boolean =>
    !isHiddenStatus(statusById.get(vocabId) ?? "locked");

  const area = vocabularyCollectionAreas[0];
  const areaProgress = getAreaProgress(area.id, isDiscovered);
  const areaPercent =
    areaProgress.totalWords > 0
      ? Math.round((areaProgress.discoveredWords / areaProgress.totalWords) * 100)
      : 0;

  const categoryViews = new Map<CategoryId, CategoryCollectionView>();
  for (const categoryId of VOCAB_CATEGORY_ORDER) {
    categoryViews.set(categoryId, buildCategoryCollectionView(categoryId, isDiscovered));
  }

  const orderRank = new Map<string, number>(
    sortCollectionEntries(vocabData.map((vocab) => vocab.id)).map((id, index) => [id, index])
  );

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
      // — and, because it was never added to `searchHaystacks`, its hidden content was
      // never even read to build the index.
      if (normalizedQuery === "") return true;
      if (isHiddenStatus(statusById.get(vocab.id) ?? "locked")) return false;

      const haystack = searchHaystacks.get(vocab.id) ?? "";
      return matchesNormalizedHaystack(haystack, normalizedQuery);
    })
    .sort(
      (a, b) =>
        (orderRank.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (orderRank.get(b.id) ?? Number.MAX_SAFE_INTEGER)
    );

  interface ChapterSection {
    chapter: VocabularyCollectionChapter;
    progressView: ChapterProgressView;
    cards: VocabItem[];
  }
  const chapterSections: ChapterSection[] =
    normalizedQuery === ""
      ? getChaptersForArea(area.id)
          .map((chapter) => ({
            chapter,
            progressView: getChapterProgress(chapter, isDiscovered),
            cards: visibleCards.filter(
              (vocab) => getCollectionEntry(vocab.id)?.chapterId === chapter.id
            ),
          }))
          .filter((section) => section.cards.length > 0)
      : [];

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

  function renderZukanCard(vocab: VocabItem) {
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
  }

  function closeEntry() {
    setSelectedVocabId(null);
    // The dialog unmounts on this state change; return focus on the next tick.
    window.setTimeout(() => dialogTriggerRef.current?.focus(), 0);
  }

  const categoryFilters = CATEGORY_FILTER_IDS.map((id) => ({
    id,
    label:
      id === "all"
        ? messages.vocabulary.filterAll
        : localizeContent(CATEGORY_FILTER_LABEL[id], locale),
  }));

  const registerFilters: { id: RegisterFilter; label: string }[] = [
    { id: "all", label: messages.vocabulary.filterAll },
    { id: "casual", label: messages.register.label.casual },
    { id: "polite", label: messages.register.label.polite },
  ];

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            {messages.vocabulary.toMap}
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-ink)] sm:text-3xl">
            {messages.vocabulary.title}
          </h1>
          <p className="mt-1 font-semibold text-[var(--color-ink)]">{messages.vocabulary.lead}</p>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-soft)]">
            {messages.vocabulary.intro}
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{messages.vocabulary.glossary}</p>
        </div>

        {/* area-scoped collection progress — no "whole Zukan complete" claims */}
        <Card variant="default">
          <p className="text-xs font-bold tracking-wide text-[var(--color-primary-dark)] uppercase">
            {formatMessage(messages.vocabulary.areaLabel, {
              title: localizeContent(area.titleGerman, locale),
            })}
          </p>
          <p className="mt-1 text-lg font-extrabold text-[var(--color-ink)] sm:text-xl">
            {formatMessage(messages.vocabulary.areaEntriesDiscovered, {
              discovered: areaProgress.discoveredWords,
              total: areaProgress.totalWords,
            })}
          </p>
          <div
            className="xp-bar-track mt-2"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={areaProgress.totalWords}
            aria-valuenow={areaProgress.discoveredWords}
            aria-label={formatMessage(messages.vocabulary.areaProgressAria, {
              discovered: areaProgress.discoveredWords,
              total: areaProgress.totalWords,
            })}
          >
            <div className="xp-bar-fill" style={{ width: `${areaPercent}%` }} />
          </div>
          <p className="mt-1.5 text-sm text-[var(--color-ink-soft)]">
            {messages.vocabulary.areaGrows}
          </p>
        </Card>

        {/* category Zukan panels (also act as the category filter) */}
        <section aria-labelledby="zukan-categories-heading">
          <h2
            id="zukan-categories-heading"
            className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase"
          >
            {messages.vocabulary.categoriesHeading}
          </h2>
          <div className="mt-2 grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 lg:grid-cols-4">
            {vocabularyCategoryCollection.map((category) => {
              const view =
                categoryViews.get(category.categoryId) ??
                buildCategoryCollectionView(category.categoryId, () => false);
              return (
                <CategoryPanel
                  key={category.categoryId}
                  category={category}
                  view={view}
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

        {/* how collecting works + what the statuses mean */}
        <details className="soft-card px-4 py-2">
          <summary className="flex min-h-11 cursor-pointer items-center font-bold text-[var(--color-ink)]">
            {messages.vocabulary.howItWorks}
          </summary>
          <ol className="mt-2 flex list-none flex-col gap-3 text-sm">
            <RuleStep number={1} title={messages.vocabulary.rule1Title} text={messages.vocabulary.rule1Text} />
            <RuleStep number={2} title={messages.vocabulary.rule2Title} text={messages.vocabulary.rule2Text} />
            <RuleStep number={3} title={messages.vocabulary.rule3Title} text={messages.vocabulary.rule3Text} />
            <RuleStep number={4} title={messages.vocabulary.rule4Title} text={messages.vocabulary.rule4Text} />
          </ol>
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
            {messages.vocabulary.chaptersNote}
          </p>
          <div className="mt-4 border-t border-[var(--color-secondary-border)] pt-3 pb-2">
            <p className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
              {messages.vocabulary.statusesMeaning}
            </p>
            <ul className="mt-2 flex flex-col gap-2">
              {ZUKAN_STATUS_ORDER.map((status) => (
                <li key={status} className="flex flex-wrap items-center gap-2 text-sm">
                  <ZukanStatusBadge status={status} />
                  <span className="text-[var(--color-ink-soft)]">
                    {messages.vocabulary.statusDescription[status]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </details>

        {/* search + filters */}
        <div>
          <label
            htmlFor="vocab-search"
            className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase"
          >
            {messages.vocabulary.searchLabel}
          </label>
          <div className="relative mt-2 max-w-md">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-soft)]" />
            <input
              id="vocab-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={messages.vocabulary.searchPlaceholder}
              className="w-full rounded-xl border-2 border-[var(--color-secondary-border)] bg-white py-2.5 pr-11 pl-10 text-sm text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={messages.vocabulary.clearSearch}
                className="tap-scale absolute top-1/2 right-0 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              >
                <ClearIcon className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
            {messages.vocabulary.categoryFilterLabel}
          </span>
          {categoryFilters.map((filter) => (
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
            {messages.vocabulary.registerFilterLabel}
          </span>
          {registerFilters.map((filter) => (
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
          {formatResultCount(visibleCards.length, messages)}
        </p>

        {/* the entries — grouped by chapter, or one flat list while searching */}
        {visibleCards.length === 0 ? (
          <Card variant="default" className="text-center">
            <p className="text-[var(--color-ink-soft)]">{messages.vocabulary.noResultsTitle}</p>
            {normalizedQuery ? (
              <>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                  {messages.vocabulary.noResultsBody}
                </p>
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="min-h-11"
                    onClick={() => setQuery("")}
                  >
                    {messages.vocabulary.clearSearch}
                  </Button>
                </div>
              </>
            ) : null}
          </Card>
        ) : normalizedQuery !== "" ? (
          <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {visibleCards.map((vocab) => renderZukanCard(vocab))}
          </div>
        ) : (
          <div className="flex flex-col gap-7">
            {chapterSections.map(({ chapter, progressView, cards }) => {
              const sectionCategory = getCategoryCollectionData(chapter.categoryId);
              const headingId = `chapter-heading-${chapter.id}`;
              return (
                <section key={chapter.id} aria-labelledby={headingId}>
                  <div className="mb-3 border-l-4 border-[var(--color-primary-border)] pl-3">
                    <p className="text-xs font-bold tracking-wide text-[var(--color-primary-dark)] uppercase">
                      {formatMessage(messages.vocabulary.chapterKicker, {
                        category: localizeContent(
                          sectionCategory?.titleGerman ?? chapter.categoryId,
                          locale
                        ),
                        chapter: chapter.order,
                      })}
                    </p>
                    <h2
                      id={headingId}
                      className="text-lg font-extrabold text-[var(--color-ink)]"
                    >
                      {localizeContent(chapter.titleGerman, locale)}
                    </h2>
                    <p className="text-sm text-[var(--color-ink-soft)]">
                      {localizeContent(chapter.subtitleGerman, locale)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--color-ink)]">
                        {formatMessage(messages.vocabulary.discoveredOfTotal, {
                          discovered: progressView.discovered,
                          total: progressView.total,
                        })}
                      </span>
                      {progressView.isCompleted ? (
                        <span className="zukan-complete-stamp">
                          <CheckIcon className="h-3 w-3" />
                          {messages.vocabulary.chapterComplete}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {cards.map((vocab) => renderZukanCard(vocab))}
                  </div>
                </section>
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
  view: CategoryCollectionView;
  active: boolean;
  onToggle: () => void;
}

function CategoryPanel({ category, view, active, onToggle }: CategoryPanelProps) {
  const { locale, messages } = useLanguage();
  const { discoveredWords, availableChapters, chapters } = view;
  const currentChapter =
    chapters.find((chapter) => !chapter.isCompleted) ?? chapters[chapters.length - 1];
  const chapterPercent =
    currentChapter && currentChapter.total > 0
      ? Math.round((currentChapter.discovered / currentChapter.total) * 100)
      : 0;
  const chapterNumber = currentChapter
    ? getChapterById(currentChapter.chapterId)?.order ?? 1
    : 1;

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
          {localizeContent(category.titleGerman, locale)}
        </span>
      </span>
      <span className="text-sm font-semibold text-[var(--color-ink)]">
        {discoveredWords === 1
          ? formatMessage(messages.vocabulary.wordDiscovered, { count: discoveredWords })
          : formatMessage(messages.vocabulary.wordsDiscovered, { count: discoveredWords })}
      </span>
      {currentChapter ? (
        <>
          <span className="text-xs break-words text-[var(--color-ink-soft)]">
            {formatMessage(messages.vocabulary.chapterOfTotal, {
              chapter: chapterNumber,
              total: availableChapters,
              title: localizeContent(currentChapter.titleGerman, locale),
            })}
          </span>
          <span className="xp-bar-track" aria-hidden="true">
            <span className="xp-bar-fill block" style={{ width: `${chapterPercent}%` }} />
          </span>
          {currentChapter.isCompleted ? (
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-[var(--color-ink)]">
                {formatMessage(messages.vocabulary.discoveredOfTotal, {
                  discovered: currentChapter.discovered,
                  total: currentChapter.total,
                })}
              </span>
              <span className="zukan-complete-stamp self-start">
                <CheckIcon className="h-3 w-3" />
                {messages.vocabulary.chapterComplete}
              </span>
            </span>
          ) : (
            <span className="text-xs font-semibold text-[var(--color-ink)]">
              {formatMessage(messages.vocabulary.discoveredOfTotal, {
                discovered: currentChapter.discovered,
                total: currentChapter.total,
              })}
            </span>
          )}
        </>
      ) : null}
      <span className="text-[11px] text-[var(--color-ink-soft)] italic">
        {messages.vocabulary.moreChaptersToCome}
      </span>
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
  const { messages } = useLanguage();
  return (
    <span
      aria-label={formatMessage(messages.vocabulary.statusAria, {
        label: messages.vocabulary.statusLabel[status],
        description: messages.vocabulary.statusDescription[status],
      })}
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide whitespace-nowrap",
        ZUKAN_STATUS_BADGE_CLASSES[status],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ZukanStatusIcon status={status} className="h-3 w-3 shrink-0" />
      {messages.vocabulary.statusLabel[status]}
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

/** Small paper-lantern mark for the Japan note section. Original inline SVG, decorative. */
function LanternIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 3.5h4M10.5 20.5h3" />
      <path d="M12 5.5c3.6 0 5.5 3 5.5 6.5s-1.9 6.5-5.5 6.5-5.5-3-5.5-6.5 1.9-6.5 5.5-6.5Z" />
      <path d="M9 6.6c-.8 1.5-1.2 3.3-1.2 5.4s.4 3.9 1.2 5.4M15 6.6c.8 1.5 1.2 3.3 1.2 5.4s-.4 3.9-1.2 5.4" />
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
  const { locale, messages } = useLanguage();
  const category = getCategoryCollectionData(vocab.categoryId);
  const chapter = entry ? getChapterById(entry.chapterId) : undefined;
  const hasUsageExamples = (vocab.usageExamples?.length ?? 0) > 0;
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const meaning = localizeContent(vocab.german, locale);

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
          <p className="text-sm font-semibold break-words text-[var(--color-ink)]">{meaning}</p>
        </div>
        <button
          type="button"
          onClick={() => speakJapanese(vocab.kanji)}
          aria-label={formatMessage(messages.vocabulary.listenAria, { word: meaning })}
          title={messages.vocabulary.listenTitle}
          className="tap-scale flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-secondary-border)] bg-white text-[var(--color-primary-dark)] hover:border-[var(--color-primary)]"
        >
          <SpeakerIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-[var(--color-ink-soft)]">
        <span>
          {localizeContent(category?.titleGerman ?? vocab.categoryId, locale)}
          {chapter
            ? ` · ${formatMessage(messages.vocabulary.chapterShort, { chapter: chapter.order })}`
            : ""}
        </span>
        {hasUsageExamples ? (
          <span className="rounded-full bg-[var(--color-teal-soft)] px-2 py-0.5 font-bold text-[var(--color-teal)]">
            {messages.vocabulary.casualPoliteTag}
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
          {messages.vocabulary.openEntry}
        </button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Hidden (undiscovered) card — silhouette, zero content leakage.
// ---------------------------------------------------------------------------

function ZukanHiddenCard({ vocab }: { vocab: VocabItem }) {
  const { locale, messages } = useLanguage();
  // Reads only categoryId and the chapter position — never kanji/kana/romaji/meaning
  // or the entry's texts. Chapter membership is public structure, so nothing leaks.
  const category = getCategoryCollectionData(vocab.categoryId);
  const hiddenEntry = getCollectionEntry(vocab.id);
  const chapter = hiddenEntry ? getChapterById(hiddenEntry.chapterId) : undefined;

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

      <p className="text-lg font-extrabold text-[var(--color-locked)]">
        {messages.vocabulary.hiddenTitle}
      </p>
      <p className="text-xs font-semibold text-[var(--color-ink-soft)]">
        {messages.vocabulary.hiddenHint}
      </p>
      <p className="mt-auto text-[11px] font-semibold text-[var(--color-ink-soft)]">
        {localizeContent(category?.titleGerman ?? vocab.categoryId, locale)}
        {chapter ? ` · ${chapter.order}` : ""}
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
  const { locale, messages } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const category = getCategoryCollectionData(vocab.categoryId);
  // Culture data is looked up ONLY here — the dialog opens exclusively for
  // discovered cards, so a hidden card's Japan note is never read or rendered.
  const cultureNote = getCultureNote(vocab.id);
  const hasUsageExamples = (vocab.usageExamples?.length ?? 0) > 0;
  const titleId = "zukan-dialog-title";
  const descriptionId = "zukan-dialog-description";
  const meaning = localizeContent(vocab.german, locale);

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
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="zukan-dialog-body flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <h2 id={titleId} className="text-lg font-extrabold text-[var(--color-ink)]">
            {formatMessage(messages.vocabulary.dialogEntryTitle, {
              number: entry ? formatCollectionNumber(entry.collectionNumber) : "",
            })}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={messages.vocabulary.closeEntry}
            className="tap-scale -mt-1 -mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--color-ink-soft)] hover:bg-[var(--color-locked-bg)] hover:text-[var(--color-ink)]"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ZukanStatusBadge status={zukanStatus} />
          {category ? (
            <Badge variant="gray">{localizeContent(category.titleGerman, locale)}</Badge>
          ) : null}
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-3xl font-extrabold break-words text-[var(--color-ink)]">
              {vocab.kanji}
            </p>
            <p className="mt-1 text-sm break-words text-[var(--color-ink-soft)]">
              {vocab.kana} · {vocab.romaji}
            </p>
            <p className="text-base font-bold break-words text-[var(--color-ink)]">{meaning}</p>
          </div>
          <button
            type="button"
            onClick={() => speakJapanese(vocab.kanji)}
            aria-label={formatMessage(messages.vocabulary.listenAria, { word: meaning })}
            title={messages.vocabulary.listenTitle}
            className="tap-scale flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-secondary-border)] bg-white text-[var(--color-primary-dark)] hover:border-[var(--color-primary)]"
          >
            <SpeakerIcon className="h-4 w-4" />
          </button>
        </div>

        {entry ? (
          <section>
            <h3 className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
              {messages.vocabulary.zukanNote}
            </h3>
            <p id={descriptionId} className="mt-1 text-sm text-[var(--color-ink)] italic">
              {localizeContent(entry.dexDescriptionGerman, locale)}
            </p>
          </section>
        ) : null}

        {cultureNote ? (
          <section className="rounded-xl border border-[var(--color-teal-border)] bg-[var(--color-teal-soft)] px-3 py-2.5">
            <h3 className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-[var(--color-teal)] uppercase">
              <LanternIcon className="h-3.5 w-3.5 shrink-0" />
              {messages.vocabulary.japanNote} · {messages.cultureNoteType[cultureNote.type]}
            </h3>
            <p className="mt-1 text-sm break-words text-[var(--color-ink)]">
              {localizeContent(cultureNote.japanNoteGerman, locale)}
            </p>
          </section>
        ) : null}

        <section className="soft-card px-3 py-2.5">
          <h3 className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
            {messages.vocabulary.exampleHeading}
          </h3>
          <p className="mt-1 font-bold break-words text-[var(--color-ink)]">
            {vocab.exampleJapanese}
          </p>
          <p className="text-sm break-words text-[var(--color-ink-soft)]">{vocab.exampleKana}</p>
          <p className="text-sm break-words text-[var(--color-ink-soft)]">
            {localizeContent(vocab.exampleGerman, locale)}
          </p>
        </section>

        {entry ? (
          <section>
            <h3 className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
              {messages.vocabulary.howToUse}
            </h3>
            <p className="mt-1 text-sm text-[var(--color-ink)]">
              {localizeContent(entry.usageRoleGerman, locale)}
            </p>
          </section>
        ) : null}

        {entry ? (
          <section className="rounded-xl border border-[var(--color-gold-border)] bg-[var(--color-gold-soft)] px-3 py-2.5">
            <h3 className="text-xs font-bold tracking-wide text-[var(--color-gold)] uppercase">
              {messages.vocabulary.remember}
            </h3>
            <p className="mt-1 text-sm font-semibold break-words text-[var(--color-ink)]">
              {localizeContent(entry.memoryHookGerman, locale)}
            </p>
          </section>
        ) : null}

        <p className="text-sm text-[var(--color-ink)]">{localizeContent(vocab.shortTip, locale)}</p>

        {hasUsageExamples ? (
          <section>
            <h3 className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
              {messages.vocabulary.casualPoliteHeading}
            </h3>
            <UsageExampleComparison usageExamples={vocab.usageExamples} className="mt-2" />
          </section>
        ) : null}

        <details className="rounded-xl border border-[var(--color-secondary-border)] px-3 py-1">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-bold text-[var(--color-ink)]">
            {messages.vocabulary.knowMore}
          </summary>
          <div className="flex flex-col gap-2 pt-1 pb-2 text-sm text-[var(--color-ink-soft)]">
            <p className="text-[var(--color-ink)]">{localizeContent(vocab.detailTip, locale)}</p>
            <p>
              <span className="font-semibold text-[var(--color-ink)]">
                {messages.vocabulary.examplesLabel}:{" "}
              </span>
              {vocab.commonExamples.join(" / ")}
            </p>
            <p>
              <span className="font-semibold text-[var(--color-ink)]">
                {messages.vocabulary.patternsLabel}:{" "}
              </span>
              {vocab.commonPatterns.join(" / ")}
            </p>
            <p>
              <span className="font-semibold text-[var(--color-ink)]">
                {messages.vocabulary.relatedLabel}:{" "}
              </span>
              {vocab.relatedExpressions.join(" / ")}
            </p>
          </div>
        </details>

        <Button variant="primary" onClick={onPractice} className="w-full">
          {messages.vocabulary.practiceCard}
        </Button>
      </div>
    </dialog>
  );
}
