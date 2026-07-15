"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, ProgressPill, QuestNode } from "@/components/ui";
import type { QuestNodeSide, QuestNodeStatus, QuestStageIcon } from "@/components/ui";
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
import {
  getEtappeDisplayName,
  getLevelProgress,
  getNextCategory,
  getNextUnlockLabel,
} from "@/lib/levelSystem";
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
  // "Nächstes Ziel" = the stage the player can tackle next (unlocked by completing the
  // previous one — never by XP), not the next locked stage.
  const nextGoalLabel = nextCategory
    ? getEtappeDisplayName(nextCategory)
    : getNextUnlockLabel(completedCategories);
  const levelProgress = getLevelProgress(xp);

  let nextGoalTitle: string;
  let nextGoalText: string;
  if (!nextCategoryData || !nextCategory) {
    nextGoalTitle = "Alles geschafft!";
    nextGoalText = "Du hast alle Etappen deiner ersten Reise abgeschlossen.";
  } else if (nextCategory === "cafe" && !completedCategories.includes("cafe")) {
    nextGoalTitle = "Dein erster Schritt: Café";
    nextGoalText = "Erste Bestellung · Sammle deine ersten 5 Wortkarten.";
  } else {
    nextGoalTitle = `Weiter geht's: ${getEtappeDisplayName(nextCategory)}`;
    nextGoalText = `${nextCategoryData.stageTitle} · Sammle deine nächsten ${nextCategoryData.collectedCardIds.length} Wortkarten.`;
  }

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
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
            <ProgressPill label="Nächstes Ziel" value={nextGoalLabel} variant="next" />
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
          <summary className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-1 py-0.5 font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
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
            Erste Schritte in Japan
          </h1>
          <p className="text-[var(--color-ink-soft)]">Deine Reise beginnt hier.</p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <AdventureMap
              completedCategories={completedCategories}
              unlockedCategories={unlockedCategories}
              nextCategory={nextCategory}
              onStartCategory={(categoryId) => router.push(`/lesson?category=${categoryId}`)}
            />
            <NextAreaPreview />
          </div>

          <aside className="flex w-full flex-col gap-4 lg:w-72">
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
              <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
                Gesamt: {xp} XP
              </p>
            </Card>

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

            <Card variant="default">
              <p className="font-bold text-[var(--color-ink)]">Nächstes Ziel</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">{nextGoalTitle}</p>
              <p className="text-sm text-[var(--color-ink-soft)]">{nextGoalText}</p>
              {nextCategory ? (
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-3"
                  onClick={() => router.push(`/lesson?category=${nextCategory}`)}
                >
                  Starten
                </Button>
              ) : null}
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

/** One landmark's anchor on the winding road, in % of the map canvas. */
interface StagePoint {
  id: CategoryId;
  x: number;
  y: number;
  side: QuestNodeSide;
  icon: QuestStageIcon;
}

const STAGE_POINTS: StagePoint[] = [
  { id: "cafe", x: 24, y: 15, side: "right", icon: "cafe" },
  { id: "reise", x: 64, y: 30.5, side: "left", icon: "reise" },
  { id: "schule", x: 26, y: 46, side: "right", icon: "schule" },
  { id: "freunde", x: 64, y: 61, side: "left", icon: "freunde" },
  { id: "review", x: 44, y: 75, side: "center", icon: "finale" },
];

const START_POINT = { x: 20, y: 5 };

/** Smooth vertical S-curve between two road points (percent coordinate space). */
function roadSegment(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const midY = (from.y + to.y) / 2;
  return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
}

interface AdventureMapProps {
  completedCategories: CategoryId[];
  unlockedCategories: CategoryId[];
  nextCategory: CategoryId | null;
  onStartCategory: (categoryId: CategoryId) => void;
}

function AdventureMap({
  completedCategories,
  unlockedCategories,
  nextCategory,
  onStartCategory,
}: AdventureMapProps) {
  const stages = STAGE_POINTS.map((point) => {
    const category = getQuestCategory(point.id);
    const isCompleted = completedCategories.includes(point.id);
    const isUnlocked = unlockedCategories.includes(point.id);
    const isReviewCategory = point.id === "review";

    let status: QuestNodeStatus;
    if (isCompleted) {
      status = "completed";
    } else if (isReviewCategory) {
      status = isUnlocked ? "review" : "locked";
    } else if (point.id === nextCategory && isUnlocked) {
      status = "current";
    } else if (isUnlocked) {
      status = "unlocked";
    } else {
      status = "locked";
    }

    // The road is "traveled" (green) up to every stage the player has reached: all
    // completed stages plus the one they are currently standing at.
    const reached = isCompleted || status === "current" || status === "review";

    return { point, category, status, reached };
  });

  return (
    <div className="quest-map h-[920px] sm:h-[880px]" data-testid="quest-map">
      <MapScenery />

      <svg
        className="quest-map-path"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {stages.map((stage, index) => {
          const from = index === 0 ? START_POINT : STAGE_POINTS[index - 1];
          return (
            <path
              key={stage.point.id}
              d={roadSegment(from, stage.point)}
              fill="none"
              strokeWidth={5}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className={stage.reached ? "quest-path-done" : "quest-path-todo"}
            />
          );
        })}
        {/* The road continues into the fog towards the next, unopened region. */}
        <path
          d="M 44 75 C 44 82, 48 85, 47 96"
          fill="none"
          strokeWidth={5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="quest-path-todo"
        />
      </svg>

      <StartMarker />

      {stages.map(({ point, category, status }) => {
        if (!category) return null;
        const isFinale = point.id === "review";
        return (
          <QuestNode
            key={point.id}
            title={getEtappeDisplayName(point.id)}
            subtitle={
              isFinale
                ? "Zeige, was du auf deiner ersten Reise gelernt hast."
                : category.stageTitle
            }
            status={status}
            rewardXp={category.rewardXp}
            cardCount={category.collectedCardIds.length || undefined}
            onStart={status !== "locked" ? () => onStartCategory(point.id) : undefined}
            stageIcon={point.icon}
            side={point.side}
            isFinale={isFinale}
            // Anchor on the road; QuestNode centers itself on this point.
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
          />
        );
      })}

      <div className="quest-map-fog h-[13%]" />
    </div>
  );
}

/** Sunrise start marker at the top of the road. */
function StartMarker() {
  return (
    <div
      className="absolute z-[2] flex -translate-x-1/2 -translate-y-1/2 items-center gap-2"
      style={{ left: `${START_POINT.x}%`, top: `${START_POINT.y}%` }}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--color-gold-border)] bg-[var(--color-gold-soft)] text-[var(--color-gold)] shadow-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <circle cx="12" cy="14" r="3.5" />
          <path d="M12 7V5M6.6 9.4 5.2 8M17.4 9.4 18.8 8M5 14H3M21 14h-2M4 18.5h16" />
        </svg>
      </span>
      <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-[var(--color-ink-soft)]">
        Start
      </span>
    </div>
  );
}

/** Background scenery: soft clouds and distant mountains, all inline SVG, no assets. */
function MapScenery() {
  return (
    <svg
      className="quest-map-deco"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Clouds near the sunrise */}
      <g fill="#ffffff" opacity="0.75">
        <ellipse cx="72" cy="6" rx="9" ry="1.6" />
        <ellipse cx="78" cy="8" rx="6" ry="1.2" />
        <ellipse cx="14" cy="24" rx="7" ry="1.3" />
        <ellipse cx="52" cy="41" rx="8" ry="1.4" />
        <ellipse cx="18" cy="58" rx="6" ry="1.2" />
      </g>
      {/* Distant mountain range behind the lower valley */}
      <g opacity="0.16" fill="var(--color-ink-soft)">
        <path d="M0 76 L12 66 L24 76 Z" />
        <path d="M16 78 L30 64 L46 78 Z" />
        <path d="M70 74 L84 62 L98 74 Z" />
      </g>
    </svg>
  );
}

/** The next, still fog-covered region below the map — a silhouette, not a clickable card. */
function NextAreaPreview() {
  return (
    <div className="relative -mt-4 overflow-hidden rounded-3xl border border-[var(--color-secondary-border)] bg-gradient-to-b from-[#e6e9f1] to-[#dde1ec] px-5 pt-8 pb-6 text-center">
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
        Alltag in Japan
      </p>
      <p className="relative text-sm text-[var(--color-ink-soft)]">
        Neue Orte, neue Gespräche und eine Hör-Quest.
      </p>
      <Badge variant="locked" className="relative mt-3">
        Demnächst
      </Badge>
    </div>
  );
}
