"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, ProgressPill, QuestMap, QuestStageDetails } from "@/components/ui";
import type { QuestMapStage, QuestNodeStatus } from "@/components/ui";
import { useLanguage } from "@/hooks/useLanguage";
import { localizeContent } from "@/i18n/localizeContent";
import { formatMessage, type Messages } from "@/i18n/getMessages";
import {
  clearProfile,
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

/** The onboarding flow, built from the current-language catalog. Question order and
 *  keys are fixed; only the displayed text is localized. The chosen option is stored
 *  in the profile as free-form display text (not used for any XP/quest logic), so it
 *  is safely in whatever language the user answered in. */
function getOnboardingQuestions(messages: Messages): OnboardingQuestion[] {
  const q = messages.onboarding.questions;
  return [
    { key: "motivation", title: q.motivation.title, options: q.motivation.options },
    { key: "startLevel", title: q.startLevel.title, options: q.startLevel.options },
    { key: "collectFocus", title: q.collectFocus.title, options: q.collectFocus.options },
    { key: "trainingStyle", title: q.trainingStyle.title, options: q.trainingStyle.options },
    { key: "questGoal", title: q.questGoal.title, options: q.questGoal.options },
  ];
}

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
  const { messages } = useLanguage();
  const [appState, setAppState] = useState<AppState>(INITIAL_APP_STATE);
  const { mounted, profile, progress } = appState;

  const onboardingQuestions = getOnboardingQuestions(messages);

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
    const key = onboardingQuestions[step].key;
    const nextAnswers = { ...answers, [key]: option };
    setAnswers(nextAnswers);

    window.setTimeout(() => {
      setSelected(null);
      if (step + 1 < onboardingQuestions.length) {
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
    clearProfile();
    setAppState((previous) => ({ ...previous, profile: null }));
    setStep(0);
    setAnswers({});
    setSelected(null);
  }

  if (!mounted || !progress) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm font-semibold text-[var(--color-ink-soft)]">
          {messages.common.loading}
        </p>
      </main>
    );
  }

  if (!profile) {
    const question = onboardingQuestions[step];
    const progressPercent = (step / onboardingQuestions.length) * 100;

    return (
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="w-full max-w-xl" variant="default">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide text-[var(--color-primary-dark)] uppercase">
              {messages.onboarding.kicker}
            </span>
            <span className="text-xs font-semibold text-[var(--color-ink-soft)]">
              {formatMessage(messages.onboarding.progress, {
                current: step + 1,
                total: onboardingQuestions.length,
              })}
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
              {messages.common.back}
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
  const { locale, messages } = useLanguage();
  const { xp, level, collectedCards, completedCategories, unlockedCategories, weakWords } =
    progress;

  const nextCategory = getNextCategory(completedCategories);
  const levelProgress = getLevelProgress(xp);

  // The stage list, computed once per render from the real unlock/completion truth. XP,
  // card count, and description all come straight from questData — worldMapData only
  // supplies the icon and (for the finale) the narrative blurb. Description text stays
  // in German here and is localized inside the quest cards (localizeContent).
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
      title: getEtappeDisplayName(categoryId, locale),
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
        <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <ProgressPill
              label={messages.home.levelLabel}
              value={level}
              variant="level"
              progressPercent={levelProgress.progressPercent}
              subLabel={formatMessage(messages.home.xpToNextLevel, {
                xp: levelProgress.xpRemaining,
                level: levelProgress.nextLevel,
              })}
            />
            <ProgressPill label={messages.home.xpTotalLabel} value={xp} variant="xp" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => router.push("/review")}>
              {messages.home.review}
            </Button>
            <Button variant="secondary" size="sm" onClick={onAdjustPlan}>
              {messages.home.adjustPlan}
            </Button>
          </div>
        </div>

        {/* Single Zukan entry point — replaces both the old "Karten" stat pill and the
            plain white "Wortkarten-Sammlung" button (one door, no duplicates). */}
        <ZukanEntryCard
          discoveredCount={collectedCards.length}
          onOpen={() => router.push("/vocabulary")}
        />

        <details className="mb-6 max-w-xl text-sm text-[var(--color-ink-soft)]">
          <summary className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-1 py-0.5 font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
            <span
              aria-hidden="true"
              className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px] font-bold"
            >
              i
            </span>
            {messages.home.whatAreXpSummary}
          </summary>
          <p className="mt-2 rounded-xl bg-white/70 px-3 py-2">{messages.home.whatAreXpBody}</p>
        </details>

        <div className="mb-6">
          <p className="text-xs font-bold tracking-wide text-[var(--color-primary-dark)] uppercase">
            {messages.home.journeyKicker}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-[var(--color-ink)] sm:text-3xl">
            {localizeContent(currentWorld.name, locale)}
          </h1>
          <p className="text-[var(--color-ink-soft)]">
            {localizeContent(currentWorld.subtitle, locale)}
          </p>
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
                <p className="font-bold text-[var(--color-ink)]">{messages.home.yourLevel}</p>
                <p className="mt-1 text-2xl font-extrabold text-[var(--color-ink)]">
                  {formatMessage(messages.home.levelValue, {
                    level: levelProgress.currentLevel,
                  })}
                </p>
                <div className="xp-bar-track mt-2" aria-hidden="true">
                  <div
                    className="xp-bar-fill"
                    style={{ width: `${levelProgress.progressPercent}%` }}
                  />
                </div>
                <p className="mt-1.5 text-sm font-semibold text-[var(--color-ink)]">
                  {formatMessage(messages.home.xpIntoLevel, {
                    into: levelProgress.xpIntoLevel,
                    required: levelProgress.xpRequiredForLevel,
                  })}
                </p>
                <p className="text-sm text-[var(--color-ink-soft)]">
                  {formatMessage(messages.home.xpToNextLevel, {
                    xp: levelProgress.xpRemaining,
                    level: levelProgress.nextLevel,
                  })}
                </p>
                <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
                  {formatMessage(messages.home.totalXp, { xp })}
                </p>
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
                <p className="font-bold text-[var(--color-ink)]">
                  {messages.home.journeyProgress}
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">
                  {formatMessage(messages.home.stagesCleared, {
                    done: completedCategories.length,
                  })}
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
                  {messages.home.smallSteps}
                </p>
              </Card>
            </div>

            <div className="home-area-training">
              <Card variant="default" onClick={() => router.push("/review")}>
                <p className="font-bold text-[var(--color-ink)]">{messages.home.trainingCamp}</p>
                <Badge variant={weakWords.length > 0 ? "yellow" : "gray"} className="mt-2">
                  {weakWords.length > 0
                    ? formatMessage(messages.home.weakWordsCount, { count: weakWords.length })
                    : messages.home.ready}
                </Badge>
                {weakWords.length === 0 ? (
                  <>
                    <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                      {messages.home.noWeakWordsTitle}
                    </p>
                    <p className="text-sm text-[var(--color-ink-soft)]">
                      {messages.home.noWeakWordsBody}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                    {formatMessage(messages.home.weakWordsToPractice, {
                      count: weakWords.length,
                    })}
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
 * The single entry point from Home into the Kotoba-Zukan. One tappable card (no nested
 * buttons): icon, discovered-word count and a CTA chip that is styled, not a separate
 * control. The count shows only what was discovered; no fixed grand total, since the
 * collection grows with future chapters.
 */
function ZukanEntryCard({
  discoveredCount,
  onOpen,
}: {
  discoveredCount: number;
  onOpen: () => void;
}) {
  const { messages } = useLanguage();
  const countLabel =
    discoveredCount === 1
      ? messages.home.zukanOneWordDiscovered
      : formatMessage(messages.home.zukanWordsDiscovered, { count: discoveredCount });

  return (
    <button
      type="button"
      onClick={onOpen}
      className="zukan-entry-card tap-scale mb-6 flex w-full max-w-xl flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-left sm:flex-nowrap sm:gap-4 sm:px-5"
    >
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20"
      >
        <ZukanBookIcon className="h-6 w-6 text-white" />
      </span>
      <span className="min-w-0 flex-1 basis-0">
        <span className="block text-[11px] font-bold tracking-wider text-white/85 uppercase">
          {messages.home.zukanCardKicker}
        </span>
        <span className="block text-lg font-extrabold text-white">{countLabel}</span>
        <span className="block text-xs text-white/85">{messages.home.zukanCardSubtitle}</span>
      </span>
      {/* On very narrow screens the chip wraps onto its own full-width row instead of
          squeezing the text into a tall multi-line column. */}
      <span className="flex min-h-11 w-full items-center justify-center rounded-full bg-white/20 px-3 py-2 text-sm font-bold whitespace-nowrap text-white sm:w-auto sm:shrink-0">
        {messages.home.zukanOpen}
      </span>
    </button>
  );
}

/** Small open-book mark for the Zukan entry card. Original inline SVG, decorative. */
function ZukanBookIcon({ className }: { className?: string }) {
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
      <path d="M12 6.5C10.5 5 8 4.5 4.5 4.8V18c3.5-.3 6 .2 7.5 1.7 1.5-1.5 4-2 7.5-1.7V4.8C16 4.5 13.5 5 12 6.5Z" />
      <path d="M12 6.5V19.7" />
      <path d="M8 9.5c.9 0 1.7.1 2.4.3M8 12.5c.9 0 1.7.1 2.4.3" />
    </svg>
  );
}

/**
 * The next, still-fogged region(s) below the current map — silhouettes, not clickable
 * cards. Reads from `nextAreaPreviews` (German text localized here) so a second/third
 * upcoming area later is just another array entry, not new markup.
 */
function NextAreaPreview({ finaleCompleted }: { finaleCompleted: boolean }) {
  const { locale, messages } = useLanguage();
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
            {messages.home.nextAreaKicker}
          </p>
          <p className="relative mt-1 text-lg font-extrabold text-[var(--color-locked)]">
            {localizeContent(area.title, locale)}
          </p>
          <p className="relative text-sm text-[var(--color-ink-soft)]">
            {localizeContent(area.subtitle, locale)}
          </p>
          <Badge variant="locked" className="relative mt-3">
            {localizeContent(area.status, locale)}
          </Badge>
        </div>
      ))}
    </>
  );
}
