"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, UsageExampleComparison } from "@/components/ui";
import { vocabData } from "@/lib/vocabData";
import { getQuestCategory } from "@/lib/questData";
import { speakJapanese } from "@/lib/speech";
import { getRegisterLabel } from "@/lib/registerData";
import {
  buildVocabularySearchIndex,
  matchesNormalizedHaystack,
  normalizeVocabularySearchText,
} from "@/lib/vocabularySearch";
import {
  getCollectedCards,
  getCompletedCategories,
  getKnownWords,
  getLevel,
  getUnlockedCategories,
  getWeakWords,
  getXP,
} from "@/lib/storage";
import type { CardStatus, CategoryId, Rarity, SpeechRegister, VocabItem } from "@/types/learning";

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

const STATUS_LABEL: Record<CardStatus, string> = {
  locked: "Locked",
  sammelbar: "Sammelbar",
  gesammelt: "Gesammelt",
  ueben: "Üben",
  gelernt: "Gelernt",
};

const STATUS_BADGE_VARIANT: Record<CardStatus, "green" | "blue" | "yellow" | "gray" | "locked"> = {
  locked: "locked",
  sammelbar: "blue",
  gesammelt: "green",
  ueben: "yellow",
  gelernt: "gray",
};

const RARITY_LABEL: Record<Rarity, string> = {
  common: "Common",
  rare: "Rare",
  review: "Review",
};

const RARITY_BADGE_VARIANT: Record<Rarity, "gray" | "yellow" | "blue"> = {
  common: "gray",
  rare: "yellow",
  review: "blue",
};

interface ProgressSnapshot {
  xp: number;
  level: number;
  collectedCards: string[];
  completedCategories: CategoryId[];
  unlockedCategories: CategoryId[];
  knownWords: string[];
  weakWords: string[];
}

function loadProgress(): ProgressSnapshot {
  return {
    xp: getXP(),
    level: getLevel(),
    collectedCards: getCollectedCards(),
    completedCategories: getCompletedCategories(),
    unlockedCategories: getUnlockedCategories(),
    knownWords: getKnownWords(),
    weakWords: getWeakWords(),
  };
}

function getCardStatus(vocab: VocabItem, progress: ProgressSnapshot): CardStatus {
  if (progress.weakWords.includes(vocab.id)) return "ueben";
  if (progress.collectedCards.includes(vocab.id)) return "gesammelt";
  if (progress.knownWords.includes(vocab.id)) return "gelernt";
  if (
    progress.unlockedCategories.includes(vocab.categoryId) &&
    !progress.collectedCards.includes(vocab.id)
  ) {
    return "sammelbar";
  }
  return "locked";
}

/**
 * Locked and not-yet-collected ("sammelbar") cards hide every text field (kanji, kana,
 * romaji, German, examples) behind a `???` placeholder. A single source of truth for
 * "this card is hidden" so the search-index builder and the render filter agree exactly
 * on which cards must never have their text fields read. Note `getCardStatus` itself only
 * reads `vocab.id` and `vocab.categoryId` — never the hidden text fields — so deciding
 * "is this hidden?" never touches the protected content.
 */
function isHiddenStatus(status: CardStatus): boolean {
  return status === "locked" || status === "sammelbar";
}

function getNextCollectibleCategoryLabel(unlockedCategories: CategoryId[]): string {
  const next = VOCAB_CATEGORY_ORDER.find((id) => !unlockedCategories.includes(id));
  if (!next) return "Alle freigeschaltet";
  const category = getQuestCategory(next);
  return category ? category.name : next;
}

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
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

  // Search index (word id → normalized haystack), built ONLY for cards the player has
  // actually collected. An uncollected/locked card's kanji/kana/romaji/German is never
  // read here — its hidden content never enters the index in the first place, rather than
  // being read and then filtered out of the results. The predicate decides eligibility
  // from collection status alone (getCardStatus reads only id/categoryId), so no hidden
  // text field is touched to build the index. Keyed on `state.progress`, so it rebuilds
  // when the collection changes — not on every keystroke, keeping typing cheap as the
  // word list grows.
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
  const visibleCards = vocabData.filter((vocab) => {
    const matchesCategory = categoryFilter === "all" || vocab.categoryId === categoryFilter;
    if (!matchesCategory) return false;

    const matchesRegister =
      registerFilter === "all" || hasRegisterExample(vocab, registerFilter);
    if (!matchesRegister) return false;

    // Collection protection: with no search active, hidden cards still render as `???`
    // (unchanged). Once a search is active, an uncollected/locked card is excluded outright
    // — and, because it was never added to `searchHaystacks` above, its hidden
    // kanji/kana/romaji/German was never even read to build the index. This explicit check
    // is belt-and-suspenders: even the empty-haystack fallback below would exclude it.
    if (normalizedQuery === "") return true;
    if (isHiddenStatus(getCardStatus(vocab, progress))) return false;

    const haystack = searchHaystacks.get(vocab.id) ?? "";
    return matchesNormalizedHaystack(haystack, normalizedQuery);
  });

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            Zur Karte
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-ink)] sm:text-3xl">
            Wortkarten-Sammlung
          </h1>
          <p className="mt-1 text-[var(--color-ink-soft)]">
            Sammle Wörter, übe einzelne Karten und schalte neue Kategorien frei.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card variant="default" className="text-center">
            <p className="text-2xl font-extrabold text-[var(--color-ink)]">
              {progress.collectedCards.length} / {vocabData.length}
            </p>
            <p className="text-xs font-semibold tracking-wide text-[var(--color-ink-soft)] uppercase">
              Karten
            </p>
          </Card>
          <Card variant="default" className="text-center">
            <p className="text-2xl font-extrabold text-[var(--color-ink)]">{progress.level}</p>
            <p className="text-xs font-semibold tracking-wide text-[var(--color-ink-soft)] uppercase">
              Level
            </p>
          </Card>
          <Card variant="default" className="text-center">
            <p className="text-2xl font-extrabold text-[var(--color-ink)]">{progress.xp}</p>
            <p className="text-xs font-semibold tracking-wide text-[var(--color-ink-soft)] uppercase">
              XP
            </p>
          </Card>
          <Card variant="default" className="text-center">
            <p className="text-lg font-extrabold text-[var(--color-ink)]">
              {getNextCollectibleCategoryLabel(progress.unlockedCategories)}
            </p>
            <p className="text-xs font-semibold tracking-wide text-[var(--color-ink-soft)] uppercase">
              Nächste Kategorie
            </p>
          </Card>
        </div>

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
              onClick={() => setRegisterFilter(filter.id)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <p aria-live="polite" className="text-sm font-semibold text-[var(--color-ink-soft)]">
          {formatResultCount(visibleCards.length)}
        </p>

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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCards.map((vocab) => (
              <VocabCard
                key={vocab.id}
                vocab={vocab}
                status={getCardStatus(vocab, progress)}
                onPractice={() => router.push(`/practice?word=${vocab.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
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

interface VocabCardProps {
  vocab: VocabItem;
  status: CardStatus;
  onPractice: () => void;
}

function VocabCard({ vocab, status, onPractice }: VocabCardProps) {
  const isLocked = status === "locked";
  const isSammelbar = status === "sammelbar";
  const isHidden = isLocked || isSammelbar;
  const category = getQuestCategory(vocab.categoryId);
  const [showComparison, setShowComparison] = useState(false);
  // Only ever read on a visible card — an uncollected/locked card's usageExamples are
  // never passed to UsageExampleComparison, so no register content can leak early.
  const hasUsageExamples = !isHidden && (vocab.usageExamples?.length ?? 0) > 0;
  const comparisonId = `usage-compare-${vocab.id}`;

  return (
    <Card variant={isHidden ? "locked" : "default"} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
        {category ? <Badge variant="gray">{category.name}</Badge> : null}
        <Badge variant={RARITY_BADGE_VARIANT[vocab.rarity]}>{RARITY_LABEL[vocab.rarity]}</Badge>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div>
          <p
            className={
              isHidden
                ? "text-2xl font-extrabold text-[var(--color-locked)]"
                : "text-2xl font-extrabold text-[var(--color-ink)]"
            }
          >
            {isHidden ? "???" : vocab.kanji}
          </p>
          {!isHidden ? (
            <p className="text-sm text-[var(--color-ink-soft)]">
              {vocab.kana} · {vocab.romaji} · {vocab.german}
            </p>
          ) : null}
        </div>
        {!isHidden ? (
          // 44x44 hit area (was 36); the speaker glyph stays h-4/w-4, so only the
          // tappable circle grows, not the icon.
          <button
            type="button"
            onClick={() => speakJapanese(vocab.kanji)}
            aria-label="Aussprache hören"
            title="Aussprache hören"
            className="tap-scale flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-secondary-border)] bg-white text-[var(--color-primary-dark)] hover:border-[var(--color-primary)]"
          >
            <SpeakerIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {isLocked ? (
        <p className="text-sm font-semibold text-[var(--color-locked)]">
          Noch gesperrt.
          <br />
          Wird später freigeschaltet.
        </p>
      ) : isSammelbar ? (
        <p className="text-sm font-semibold text-[var(--color-ink-soft)]">
          Noch nicht gesammelt.
          <br />
          Schließe diese Lektion ab, um die Karte zu sammeln.
        </p>
      ) : (
        <>
          <div className="soft-card px-3 py-2">
            <p className="text-xs font-semibold tracking-wide text-[var(--color-ink-soft)] uppercase">
              Beispiel
            </p>
            <p className="font-bold text-[var(--color-ink)]">{vocab.exampleJapanese}</p>
            <p className="text-sm text-[var(--color-ink-soft)]">{vocab.exampleKana}</p>
            <p className="text-sm text-[var(--color-ink-soft)]">{vocab.exampleGerman}</p>
          </div>

          <div className="text-sm text-[var(--color-ink-soft)]">
            <p>
              <span className="font-semibold text-[var(--color-ink)]">Beispiele: </span>
              {vocab.commonExamples.join(" / ")}
            </p>
            <p className="mt-1">
              <span className="font-semibold text-[var(--color-ink)]">Muster: </span>
              {vocab.commonPatterns.join(" / ")}
            </p>
            <p className="mt-1">
              <span className="font-semibold text-[var(--color-ink)]">Verwandt: </span>
              {vocab.relatedExpressions.join(" / ")}
            </p>
          </div>

          <p className="text-sm text-[var(--color-ink)]">{truncate(vocab.shortTip, 60)}</p>

          {hasUsageExamples ? (
            <div className="border-t border-[var(--color-secondary-border)] pt-3">
              <button
                type="button"
                onClick={() => setShowComparison((prev) => !prev)}
                aria-expanded={showComparison}
                aria-controls={comparisonId}
                className="tap-scale inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary-dark)] underline underline-offset-2"
              >
                {showComparison ? "Weniger anzeigen" : "Locker & Höflich vergleichen"}
              </button>
              {showComparison ? (
                <div id={comparisonId} className="mt-2">
                  <UsageExampleComparison usageExamples={vocab.usageExamples} />
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      <div className="mt-auto">
        <Button
          variant={isHidden ? "locked" : "primary"}
          size="sm"
          disabled={isHidden}
          onClick={onPractice}
          className="w-full"
        >
          Karte üben
        </Button>
      </div>
    </Card>
  );
}
