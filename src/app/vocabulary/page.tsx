"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card } from "@/components/ui";
import { vocabData } from "@/lib/vocabData";
import { getQuestCategory } from "@/lib/questData";
import {
  getCollectedCards,
  getCompletedCategories,
  getKnownWords,
  getLevel,
  getUnlockedCategories,
  getWeakWords,
  getXP,
} from "@/lib/storage";
import type { CardStatus, CategoryId, Rarity, VocabItem } from "@/types/learning";

const VOCAB_CATEGORY_ORDER: CategoryId[] = ["cafe", "reise", "schule", "freunde"];

const CATEGORY_FILTERS: { id: CategoryId | "all"; label: string }[] = [
  { id: "all", label: "Alle" },
  { id: "cafe", label: "Café" },
  { id: "reise", label: "Reise" },
  { id: "schule", label: "Schule" },
  { id: "freunde", label: "Freunde" },
];

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

function getPrecedingCategoryName(categoryId: CategoryId): string | null {
  const index = VOCAB_CATEGORY_ORDER.indexOf(categoryId);
  if (index <= 0) return null;
  const previous = getQuestCategory(VOCAB_CATEGORY_ORDER[index - 1]);
  return previous ? previous.name : null;
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

interface PageState {
  mounted: boolean;
  progress: ProgressSnapshot | null;
}

const INITIAL_STATE: PageState = { mounted: false, progress: null };

export default function VocabularyPage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>(INITIAL_STATE);
  const [categoryFilter, setCategoryFilter] = useState<CategoryId | "all">("all");

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
  const visibleCards =
    categoryFilter === "all"
      ? vocabData
      : vocabData.filter((vocab) => vocab.categoryId === categoryFilter);

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

        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((filter) => (
            <Button
              key={filter.id}
              variant={categoryFilter === filter.id ? "primary" : "secondary"}
              size="sm"
              onClick={() => setCategoryFilter(filter.id)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

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
      </div>
    </main>
  );
}

interface VocabCardProps {
  vocab: VocabItem;
  status: CardStatus;
  onPractice: () => void;
}

function VocabCard({ vocab, status, onPractice }: VocabCardProps) {
  const isLocked = status === "locked";
  const category = getQuestCategory(vocab.categoryId);

  return (
    <Card variant={isLocked ? "locked" : "default"} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
        {category ? <Badge variant="gray">{category.name}</Badge> : null}
        <Badge variant={RARITY_BADGE_VARIANT[vocab.rarity]}>{RARITY_LABEL[vocab.rarity]}</Badge>
      </div>

      <div>
        <p
          className={
            isLocked
              ? "text-2xl font-extrabold text-[var(--color-locked)]"
              : "text-2xl font-extrabold text-[var(--color-ink)]"
          }
        >
          {isLocked ? "???" : vocab.kanji}
        </p>
        {isLocked ? (
          <p className="text-sm text-[var(--color-locked)]">{vocab.german}</p>
        ) : (
          <p className="text-sm text-[var(--color-ink-soft)]">
            {vocab.kana} · {vocab.romaji} · {vocab.german}
          </p>
        )}
      </div>

      {isLocked ? (
        <p className="text-sm font-semibold text-[var(--color-locked)]">
          {getPrecedingCategoryName(vocab.categoryId)
            ? `Freigeschaltet nach ${getPrecedingCategoryName(vocab.categoryId)}`
            : "Freigeschaltet später"}
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
        </>
      )}

      <Button
        variant={isLocked ? "locked" : "primary"}
        size="sm"
        disabled={isLocked}
        onClick={onPractice}
        className="mt-auto w-full"
      >
        Karte üben
      </Button>
    </Card>
  );
}
