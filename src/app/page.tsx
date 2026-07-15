"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, ProgressPill, QuestNode } from "@/components/ui";
import type { QuestNodeStatus } from "@/components/ui";
import {
  getCollectedCards,
  getCompletedCategories,
  getLevel,
  getProfile,
  getUnlockedCategories,
  getWeakWords,
  getXP,
  saveProfile,
} from "@/lib/storage";
import { getNextCategory, getNextUnlockLabel } from "@/lib/levelSystem";
import { getQuestCategory } from "@/lib/questData";
import type { CategoryId, OnboardingProfile } from "@/types/learning";

const PROFILE_STORAGE_KEY = "nvq_profile";

const CATEGORY_ORDER: CategoryId[] = ["cafe", "reise", "schule", "freunde", "review"];

type OnboardingKey =
  | "motivation"
  | "startLevel"
  | "collectFocus"
  | "trainingStyle"
  | "questGoal";

interface OnboardingQuestion {
  key: OnboardingKey;
  title: string;
  options: string[];
}

const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    key: "motivation",
    title: "Was bringt dich zu Japanisch?",
    options: [
      "Japan-Reise",
      "Anime & Games",
      "Freunde / Partner",
      "Alltagssätze",
      "Kultur",
      "JLPT / Prüfung",
    ],
  },
  {
    key: "startLevel",
    title: "Wie gut ist dein Japanisch gerade?",
    options: [
      "Ich starte bei null",
      "Ich kenne Hiragana",
      "Ich kenne ein paar Wörter",
      "A1",
      "A2",
      "Ich weiß es nicht",
    ],
  },
  {
    key: "collectFocus",
    title: "Was möchtest du sammeln?",
    options: [
      "Reise-Wörter",
      "Café-Sätze",
      "Wörter für Freunde",
      "Schule & Lernen",
      "Alltag",
      "Mix",
    ],
  },
  {
    key: "trainingStyle",
    title: "Wie möchtest du üben?",
    options: [
      "Kurze Quiz",
      "Wortkarten sammeln",
      "Beispielsätze",
      "Schreiben",
      "Wiederholung",
      "Mix",
    ],
  },
  {
    key: "questGoal",
    title: "Was ist dein erstes Ziel?",
    options: [
      "Im Café bestellen",
      "Am Bahnhof zurechtkommen",
      "Einfache Sätze verstehen",
      "Mit Freunden sprechen",
      "Japanisch im Alltag nutzen",
    ],
  },
];

interface ProgressState {
  xp: number;
  level: number;
  collectedCards: string[];
  completedCategories: CategoryId[];
  unlockedCategories: CategoryId[];
  weakWords: string[];
}

function loadProgress(): ProgressState {
  return {
    xp: getXP(),
    level: getLevel(),
    collectedCards: getCollectedCards(),
    completedCategories: getCompletedCategories(),
    unlockedCategories: getUnlockedCategories(),
    weakWords: getWeakWords(),
  };
}

interface AppState {
  mounted: boolean;
  profile: OnboardingProfile | null;
  progress: ProgressState | null;
}

const INITIAL_APP_STATE: AppState = { mounted: false, profile: null, progress: null };

export default function Home() {
  const [appState, setAppState] = useState<AppState>(INITIAL_APP_STATE);
  const { mounted, profile, progress } = appState;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<OnboardingKey, string>>>({});
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    // One-time client-only read of localStorage after hydration; there is no server
    // snapshot to synchronize against, so useSyncExternalStore does not apply here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAppState({ mounted: true, profile: getProfile(), progress: loadProgress() });
  }, []);

  function handleSelectOption(option: string) {
    if (selected) return;
    setSelected(option);
    const key = ONBOARDING_QUESTIONS[step].key;
    const nextAnswers = { ...answers, [key]: option };
    setAnswers(nextAnswers);

    window.setTimeout(() => {
      setSelected(null);
      if (step + 1 < ONBOARDING_QUESTIONS.length) {
        setStep(step + 1);
      } else {
        completeOnboarding(nextAnswers);
      }
    }, 220);
  }

  function handleBack() {
    if (step === 0) return;
    setSelected(null);
    setStep(step - 1);
  }

  function completeOnboarding(finalAnswers: Partial<Record<OnboardingKey, string>>) {
    const newProfile: OnboardingProfile = {
      motivation: finalAnswers.motivation ?? "",
      startLevel: finalAnswers.startLevel ?? "",
      collectFocus: finalAnswers.collectFocus ?? "",
      trainingStyle: finalAnswers.trainingStyle ?? "",
      questGoal: finalAnswers.questGoal ?? "",
      createdAt: new Date().toISOString(),
    };
    saveProfile(newProfile);
    setAppState({ mounted: true, profile: newProfile, progress: loadProgress() });
    setStep(0);
    setAnswers({});
  }

  function handleAdjustPlan() {
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    setAppState((previous) => ({ ...previous, profile: null }));
    setStep(0);
    setAnswers({});
    setSelected(null);
  }

  if (!mounted || !progress) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm font-semibold text-[var(--color-ink-soft)]">Lädt…</p>
      </main>
    );
  }

  if (!profile) {
    const question = ONBOARDING_QUESTIONS[step];
    const progressPercent = (step / ONBOARDING_QUESTIONS.length) * 100;

    return (
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="w-full max-w-xl" variant="default">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide text-[var(--color-primary-dark)] uppercase">
              Quest-Setup
            </span>
            <span className="text-xs font-semibold text-[var(--color-ink-soft)]">
              Fortschritt {step + 1}/{ONBOARDING_QUESTIONS.length}
            </span>
          </div>

          <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-[var(--color-secondary-border)]">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <h1 className="mb-5 text-xl font-extrabold text-[var(--color-ink)] sm:text-2xl">
            {question.title}
          </h1>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {question.options.map((option) => (
              <Card
                key={option}
                variant={selected === option ? "highlight" : "default"}
                onClick={() => handleSelectOption(option)}
                className="text-center font-semibold"
              >
                {option}
              </Card>
            ))}
          </div>

          <div className="mt-6 flex justify-start">
            <Button variant="ghost" size="sm" onClick={handleBack} disabled={step === 0}>
              Zurück
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return <HomeQuestMap progress={progress} onAdjustPlan={handleAdjustPlan} />;
}

interface HomeQuestMapProps {
  progress: ProgressState;
  onAdjustPlan: () => void;
}

function HomeQuestMap({ progress, onAdjustPlan }: HomeQuestMapProps) {
  const router = useRouter();
  const { xp, level, collectedCards, completedCategories, unlockedCategories, weakWords } =
    progress;

  const nextCategory = getNextCategory(completedCategories);
  const nextCategoryData = nextCategory ? getQuestCategory(nextCategory) : undefined;
  const nextUnlockLabel = getNextUnlockLabel(completedCategories);

  let heading: string;
  let subtext: string;
  if (!nextCategoryData) {
    heading = "Alles geschafft!";
    subtext = "Du hast alle Kategorien abgeschlossen.";
  } else if (nextCategory === "cafe" && !completedCategories.includes("cafe")) {
    heading = "Dein erster Schritt";
    subtext = "Café: Erste Bestellung · Sammle deine ersten 5 Wortkarten.";
  } else {
    heading = `Weiter geht's: ${nextCategoryData.name}`;
    subtext = `${nextCategoryData.name}: ${nextCategoryData.stageTitle} · Sammle deine nächsten ${nextCategoryData.collectedCardIds.length} Wortkarten.`;
  }

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <ProgressPill label="Level" value={level} variant="level" />
            <ProgressPill label="XP" value={xp} variant="xp" />
            <ProgressPill label="Karten" value={collectedCards.length} variant="cards" />
            <ProgressPill
              label="Next Unlock"
              value={nextUnlockLabel}
              variant={nextUnlockLabel === "Abschluss-Review" ? "review" : "next"}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => router.push("/vocabulary")}>
              Wortkarten-Sammlung
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push("/review")}>
              Wiederholung
            </Button>
            <Button variant="secondary" size="sm" onClick={onAdjustPlan}>
              Lernplan anpassen
            </Button>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold text-[var(--color-ink)] sm:text-3xl">
            {heading}
          </h1>
          <Badge variant="green">Level {level}</Badge>
        </div>
        <p className="-mt-6 mb-8 text-[var(--color-ink-soft)]">{subtext}</p>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="flex-1">
            <div className="mb-5">
              <p className="text-xs font-bold tracking-wide text-[var(--color-primary-dark)] uppercase">
                Starter Quest
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-extrabold text-[var(--color-ink)]">Block 1</h2>
                <Badge variant="green">5 Units</Badge>
              </div>
              <p className="text-sm text-[var(--color-ink-soft)]">Erste Schritte in Japan</p>
            </div>

            <QuestMapList
              completedCategories={completedCategories}
              unlockedCategories={unlockedCategories}
              nextCategory={nextCategory}
              onStartCategory={(categoryId) => router.push(`/lesson?category=${categoryId}`)}
            />

            <Block2Preview />
          </div>

          <aside className="flex w-full flex-col gap-4 lg:w-72">
            <Card variant="default">
              <p className="font-bold text-[var(--color-ink)]">Block-Fortschritt</p>
              <p className="mt-2 text-sm text-[var(--color-ink)]">
                {completedCategories.length} / 5 Kategorien
              </p>
              <p className="text-sm text-[var(--color-ink-soft)]">
                Kleine Schritte, echte Sätze.
              </p>
            </Card>

            <Card variant="default" onClick={() => router.push("/review")}>
              <p className="font-bold text-[var(--color-ink)]">Trainingslager</p>
              <Badge variant={weakWords.length > 0 ? "yellow" : "gray"} className="mt-2">
                {weakWords.length > 0 ? `${weakWords.length} Wörter` : "Bereit"}
              </Badge>
              {weakWords.length === 0 ? (
                <>
                  <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                    Noch keine schwachen Wörter.
                  </p>
                  <p className="text-sm text-[var(--color-ink-soft)]">
                    Starte ein Quiz, um deine Wiederholungsliste zu bauen.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                  {weakWords.length} Wörter zum Üben
                </p>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Block2Preview() {
  return (
    <div className="mt-8">
      <p className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
        Nächster Block
      </p>
      <Card variant="locked" className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold text-[var(--color-locked)]">Block 2: Daily Life</p>
          <p className="text-sm text-[var(--color-locked)]">Mit Hör-Quest</p>
        </div>
        <Badge variant="locked">Demnächst</Badge>
      </Card>
    </div>
  );
}

interface QuestMapListProps {
  completedCategories: CategoryId[];
  unlockedCategories: CategoryId[];
  nextCategory: CategoryId | null;
  onStartCategory: (categoryId: CategoryId) => void;
}

function QuestMapList({
  completedCategories,
  unlockedCategories,
  nextCategory,
  onStartCategory,
}: QuestMapListProps) {
  return (
    <div className="flex flex-col items-stretch">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
          Start
        </div>
        <p className="text-sm font-semibold text-[var(--color-ink-soft)]">
          Dein Quest beginnt hier
        </p>
      </div>
      <div className="quest-map-line ml-[26px] h-6" />

      {CATEGORY_ORDER.map((categoryId, index) => {
        const category = getQuestCategory(categoryId);
        if (!category) return null;

        const isCompleted = completedCategories.includes(categoryId);
        const isUnlocked = unlockedCategories.includes(categoryId);
        const isReviewCategory = categoryId === "review";

        let status: QuestNodeStatus;
        if (isCompleted) {
          status = "completed";
        } else if (isReviewCategory) {
          status = isUnlocked ? "review" : "locked";
        } else if (categoryId === nextCategory && isUnlocked) {
          status = "current";
        } else if (isUnlocked) {
          status = "unlocked";
        } else {
          status = "locked";
        }

        const canStart = status !== "locked";
        const cardCount = category.collectedCardIds.length || undefined;
        const isFinale = isReviewCategory;

        return (
          <div key={category.id}>
            <QuestNode
              title={category.name}
              subtitle={category.stageTitle}
              status={status}
              rewardXp={category.rewardXp}
              cardCount={cardCount}
              onStart={canStart ? () => onStartCategory(category.id) : undefined}
              flip={index % 2 === 1}
              isFinale={isFinale}
            />
            {index < CATEGORY_ORDER.length - 1 ? (
              <div className="quest-map-line ml-[26px] h-6" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
