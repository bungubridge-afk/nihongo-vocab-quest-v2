"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, ProgressPill, QuestMap, QuestStageDetails } from "@/components/ui";
import type { QuestMapStage, QuestNodeStatus } from "@/components/ui";
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
import { getEtappeDisplayName, getLevelProgress, getNextCategory } from "@/lib/levelSystem";
import { getQuestCategory } from "@/lib/questData";
import { currentWorld, nextAreaPreviews, stageMapMeta } from "@/lib/worldMapData";
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
  const levelProgress = getLevelProgress(xp);

  // The stage list, computed once per render from the real unlock/completion truth. XP,
  // card count, and description all come straight from questData — worldMapData only
  // supplies the icon and (for the finale) the narrative blurb.
  const stages: QuestMapStage[] = CATEGORY_ORDER.map((categoryId) => {
    const isCompleted = completedCategories.includes(categoryId);
    const isUnlocked = unlockedCategories.includes(categoryId);
    const isReviewCategory = categoryId === "review";
    const category = getQuestCategory(categoryId);
    const meta = stageMapMeta[categoryId];

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

    return {
      id: categoryId,
      title: getEtappeDisplayName(categoryId),
      status,
      icon: meta.icon,
      isFinale: isReviewCategory,
      rewardXp: category?.rewardXp ?? 0,
      cardCount: category?.collectedCardIds.length ?? 0,
      description: meta.flavorText ?? category?.description ?? "",
    };
  });

  // Selected stage: defaults to whatever the player can actually play next — Café on a
  // fresh profile, the in-progress stage otherwise, or the finale once everything else is
  // done. Only ever changed by clicking/keyboard-selecting a node afterwards.
  const [selectedId, setSelectedId] = useState<CategoryId>(nextCategory ?? "review");

  const selectedStage = stages.find((stage) => stage.id === selectedId) ?? stages[0];
  const selectedCategory = getQuestCategory(selectedStage.id);
  const selectedMeta = stageMapMeta[selectedStage.id];
  const finaleCompleted = stages.find((stage) => stage.isFinale)?.status === "completed";

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <ProgressPill
              label="Level"
              value={level}
              variant="level"
              progressPercent={levelProgress.progressPercent}
              subLabel={`Noch ${levelProgress.xpRemaining} XP bis Level ${levelProgress.nextLevel}`}
            />
            <ProgressPill label="XP gesamt" value={xp} variant="xp" />
            <ProgressPill
              label="Karten"
              value={collectedCards.length}
              variant="cards"
              subLabel="Zur Sammlung"
              onClick={() => router.push("/vocabulary")}
              ariaLabel="Wortkarten-Sammlung öffnen"
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

        <details className="mb-6 max-w-xl text-sm text-[var(--color-ink-soft)]">
          <summary className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-1 py-0.5 font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
            <span
              aria-hidden="true"
              className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px] font-bold"
            >
              i
            </span>
            Wofür sind XP?
          </summary>
          <p className="mt-2 rounded-xl bg-white/70 px-3 py-2">
            XP zeigen deinen gesamten Lernfortschritt und erhöhen dein Level. Neue Etappen
            werden durch abgeschlossene Quests freigeschaltet – nicht durch XP.
          </p>
        </details>

        <div className="mb-6">
          <p className="text-xs font-bold tracking-wide text-[var(--color-primary-dark)] uppercase">
            Deine Reise
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-[var(--color-ink)] sm:text-3xl">
            {currentWorld.name}
          </h1>
          <p className="text-[var(--color-ink-soft)]">{currentWorld.subtitle}</p>
        </div>

        <div className="home-grid">
          <div className="home-area-map">
            <QuestMap
              stages={stages}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onStart={(id) => router.push(`/lesson?category=${id}`)}
              theme={currentWorld.theme.id}
            />
            <NextAreaPreview finaleCompleted={finaleCompleted} />
          </div>

          <div className="home-sidebar">
            <div className="home-area-levelcard">
              <Card variant="default">
                <p className="font-bold text-[var(--color-ink)]">Dein Level</p>
                <p className="mt-1 text-2xl font-extrabold text-[var(--color-ink)]">
                  Level {levelProgress.currentLevel}
                </p>
                <div className="xp-bar-track mt-2" aria-hidden="true">
                  <div
                    className="xp-bar-fill"
                    style={{ width: `${levelProgress.progressPercent}%` }}
                  />
                </div>
                <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink)]">
                  {levelProgress.xpIntoLevel} / {levelProgress.xpRequiredForLevel} XP
                </p>
                <p className="text-sm text-[var(--color-ink-soft)]">
                  Noch {levelProgress.xpRemaining} XP bis Level {levelProgress.nextLevel}
                </p>
                <p className="mt-2 text-xs text-[var(--color-ink-soft)]">Gesamt: {xp} XP</p>
              </Card>
            </div>

            <div className="home-area-details">
              {selectedCategory ? (
                <QuestStageDetails
                  category={selectedCategory}
                  displayName={selectedStage.title}
                  status={selectedStage.status}
                  icon={selectedMeta.icon}
                  flavorText={selectedMeta.flavorText}
                  learningSummary={selectedMeta.learningSummary}
                  isFinale={selectedStage.isFinale}
                  onStart={
                    selectedStage.status !== "locked"
                      ? () => router.push(`/lesson?category=${selectedStage.id}`)
                      : undefined
                  }
                />
              ) : null}
            </div>

            <div className="home-area-progress">
              <Card variant="default">
                <p className="font-bold text-[var(--color-ink)]">Reisefortschritt</p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">
                  {completedCategories.length} / 5 Etappen geschafft
                </p>
                <div className="mt-2 flex gap-1.5" aria-hidden="true">
                  {CATEGORY_ORDER.map((id) => (
                    <span
                      key={id}
                      className={`h-2 flex-1 rounded-full ${
                        completedCategories.includes(id)
                          ? "bg-[var(--color-primary)]"
                          : "bg-[var(--color-secondary-border)]"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                  Kleine Schritte, echte Sätze.
                </p>
              </Card>
            </div>

            <div className="home-area-training">
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
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * The next, still-fogged region(s) below the current map — silhouettes, not clickable
 * cards. Reads from `nextAreaPreviews` so a second/third upcoming area later is just
 * another array entry, not new markup here. The dotted connector always sits centered
 * (50%) because the map's finale lane is always centered too. Once the finale itself is
 * completed, the connector picks up a faint green tint — "the road keeps going" — without
 * making the still-locked preview card itself look any more available than it is.
 */
function NextAreaPreview({ finaleCompleted }: { finaleCompleted: boolean }) {
  return (
    <>
      <div
        className={["next-area-connector", finaleCompleted ? "next-area-connector-active" : ""]
          .filter(Boolean)
          .join(" ")}
      />
      {nextAreaPreviews.map((area) => (
        <div
          key={area.id}
          className="relative mb-3 overflow-hidden rounded-3xl border border-[var(--color-secondary-border)] bg-gradient-to-b from-[#e6e9f1] to-[#dde1ec] px-5 pt-6 pb-6 text-center last:mb-0"
        >
          <svg
            className="pointer-events-none absolute inset-x-0 top-0 h-16 w-full opacity-25"
            viewBox="0 0 100 30"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <g fill="var(--color-locked)">
              <path d="M4 30 L16 14 L28 30 Z" />
              <path d="M24 30 L38 10 L54 30 Z" />
              <path d="M56 30 L68 16 L80 30 Z" />
              {/* Torii silhouette on the horizon */}
              <path d="M86 30v-9h1.6v9zM93 30v-9h1.6v9zM84.5 20.5q3.8 1 11.6 0v1.8q-7.8 1-11.6 0zM85.8 24h9v1.4h-9z" />
            </g>
          </svg>
          <p className="relative text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
            Als Nächstes
          </p>
          <p className="relative mt-1 text-lg font-extrabold text-[var(--color-locked)]">
            {area.title}
          </p>
          <p className="relative text-sm text-[var(--color-ink-soft)]">{area.subtitle}</p>
          <Badge variant="locked" className="relative mt-3">
            {area.status}
          </Badge>
        </div>
      ))}
    </>
  );
}
