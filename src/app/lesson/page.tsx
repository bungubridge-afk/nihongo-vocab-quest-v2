"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge, Button, Card, FeedbackPanel } from "@/components/ui";
import { getQuestCategory } from "@/lib/questData";
import { buildLessonQuestions, getFeedbackPayload } from "@/lib/quizBuilder";
import {
  playCorrectSound,
  playFailedResultSound,
  playIncorrectSound,
  playNormalResultSound,
  playPerfectResultSound,
} from "@/lib/sound";
import {
  getCompletedCategories,
  getLevel,
  getUnlockedCategories,
  getXP,
  recordCategoryCompletion,
} from "@/lib/storage";
import type { CategoryCompletionResult } from "@/lib/storage";
import { getEtappeDisplayName, getLevelProgress } from "@/lib/levelSystem";
import type { CategoryId, QuestCategory, QuizQuestion } from "@/types/learning";

const VALID_CATEGORY_IDS: CategoryId[] = ["cafe", "reise", "schule", "freunde", "review"];

function isValidCategoryId(value: string): value is CategoryId {
  return (VALID_CATEGORY_IDS as string[]).includes(value);
}

/**
 * Fisher-Yates shuffle. Must only ever be called from a client-side effect (never during
 * render), since Math.random() would otherwise produce different output on the server and
 * on the client's first render and trigger a hydration mismatch.
 */
function shuffleChoices<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function LessonPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LessonContent />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <p className="text-sm font-semibold text-[var(--color-ink-soft)]">Lädt…</p>
    </main>
  );
}

function NotFoundView({ onHome }: { onHome: () => void }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md text-center">
        <p className="text-lg font-bold text-[var(--color-ink)]">
          Diese Kategorie wurde nicht gefunden.
        </p>
        <div className="mt-5">
          <Button variant="primary" onClick={onHome}>
            Zurück zur Karte
          </Button>
        </div>
      </Card>
    </main>
  );
}

function LockedView({ onHome }: { onHome: () => void }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md text-center">
        <p className="text-lg font-bold text-[var(--color-ink)]">
          Diese Kategorie ist noch gesperrt.
        </p>
        <div className="mt-5">
          <Button variant="primary" onClick={onHome}>
            Zurück zur Karte
          </Button>
        </div>
      </Card>
    </main>
  );
}

interface AccessState {
  mounted: boolean;
  allowed: boolean;
}

const INITIAL_ACCESS_STATE: AccessState = { mounted: false, allowed: false };

function LessonContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const onHome = () => router.push("/");

  const rawCategoryId = searchParams.get("category") ?? "cafe";
  const categoryId: CategoryId | null = isValidCategoryId(rawCategoryId) ? rawCategoryId : null;
  const category: QuestCategory | undefined = categoryId ? getQuestCategory(categoryId) : undefined;

  const [access, setAccess] = useState<AccessState>(INITIAL_ACCESS_STATE);

  useEffect(() => {
    // One-time client-only read of localStorage after hydration; there is no server
    // snapshot to synchronize against, so useSyncExternalStore does not apply here.
    if (!category) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccess({ mounted: true, allowed: false });
      return;
    }
    const completed = getCompletedCategories();
    const unlocked = getUnlockedCategories();
    const allowed = completed.includes(category.id) || unlocked.includes(category.id);
    setAccess({ mounted: true, allowed });
  }, [category]);

  if (!category) {
    return <NotFoundView onHome={onHome} />;
  }

  if (!access.mounted) {
    return <LoadingFallback />;
  }

  if (!access.allowed) {
    return <LockedView onHome={onHome} />;
  }

  return <LessonSession category={category} onHome={onHome} />;
}

interface LessonSessionProps {
  category: QuestCategory;
  onHome: () => void;
}

function LessonSession({ category, onHome }: LessonSessionProps) {
  const baseQuestions = useMemo(() => buildLessonQuestions(category), [category]);
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[] | null>(null);

  useEffect(() => {
    // Choice order is randomized once per mount, entirely on the client, so the correct
    // answer isn't always in the same position. This never runs during SSR/first render,
    // so it cannot cause a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShuffledQuestions(
      baseQuestions.map((question) => ({
        ...question,
        choices: shuffleChoices(question.choices),
      }))
    );
  }, [baseQuestions]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const [showResult, setShowResult] = useState(false);
  const [challengeFailed, setChallengeFailed] = useState(false);
  const [completionResult, setCompletionResult] = useState<CategoryCompletionResult | null>(
    null
  );
  const [previousLevel, setPreviousLevel] = useState(0);
  const [previousXp, setPreviousXp] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

  if (!shuffledQuestions) {
    return <LoadingFallback />;
  }

  const questions = shuffledQuestions;
  const currentQuestion: QuizQuestion = questions[questionIndex];
  const isLastQuestion = questionIndex === questions.length - 1;
  const isChallengeQuestion = Boolean(currentQuestion?.isChallenge) || isLastQuestion;

  function handleSelectChoice(choice: string) {
    if (answered) return;
    const correct = choice === currentQuestion.answer;
    if (correct) {
      playCorrectSound();
    } else {
      playIncorrectSound();
    }
    setSelectedAnswer(choice);
    setIsCorrect(correct);
    setAnswered(true);
  }

  function handleNext() {
    const updatedCorrectAnswersCount = correctAnswersCount + (isCorrect ? 1 : 0);

    if (isLastQuestion) {
      setCorrectAnswersCount(updatedCorrectAnswersCount);
      if (isCorrect) {
        const levelBefore = getLevel();
        const xpBefore = getXP();
        const result = recordCategoryCompletion(category);
        setPreviousLevel(levelBefore);
        setPreviousXp(xpBefore);
        setCompletionResult(result);
        setChallengeFailed(false);
      } else {
        setCompletionResult(null);
        setChallengeFailed(true);
      }
      setShowResult(true);
      return;
    }

    setCorrectAnswersCount(updatedCorrectAnswersCount);
    setQuestionIndex((index) => index + 1);
    setSelectedAnswer(null);
    setAnswered(false);
    setIsCorrect(false);
  }

  function handleRetry() {
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setIsCorrect(false);
    setShowResult(false);
    setChallengeFailed(false);
    setCompletionResult(null);
    setCorrectAnswersCount(0);
  }

  if (showResult) {
    return (
      <ResultView
        category={category}
        completionResult={completionResult}
        challengeFailed={challengeFailed}
        previousLevel={previousLevel}
        previousXp={previousXp}
        correctCount={correctAnswersCount}
        total={questions.length}
        onHome={onHome}
        onRetry={handleRetry}
      />
    );
  }

  const feedback = answered ? getFeedbackPayload(currentQuestion) : null;

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onHome}>
            Abbrechen
          </Button>
          <Badge variant="yellow">insgesamt +{category.rewardXp} XP</Badge>
        </div>

        <div>
          <p className="text-xs font-bold tracking-wide text-[var(--color-primary-dark)] uppercase">
            {getEtappeDisplayName(category.id)}
          </p>
          <h1 className="text-2xl font-extrabold text-[var(--color-ink)]">
            {category.stageTitle}
          </h1>
          <p className="mt-1 text-sm font-semibold text-[var(--color-ink-soft)]">
            {questionIndex + 1} / {questions.length}
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-secondary-border)]">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300"
              style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <Card variant={isChallengeQuestion ? "challenge" : "default"}>
          {isChallengeQuestion ? (
            <Badge variant="yellow" className="mb-3">
              Abschluss-Challenge
            </Badge>
          ) : null}

          <p className="text-sm font-semibold text-[var(--color-ink-soft)]">
            {currentQuestion.instruction}
          </p>
          <p className="mt-2 text-2xl font-extrabold whitespace-pre-line text-[var(--color-ink)]">
            {currentQuestion.prompt}
          </p>

          <div className="mt-5 flex flex-col gap-3">
            {currentQuestion.choices.map((choice) => {
              const isChoiceCorrect = choice === currentQuestion.answer;
              const isChoiceSelected = choice === selectedAnswer;

              let choiceClasses =
                "tap-scale rounded-xl border-2 px-4 py-3 text-left font-semibold transition-colors ";
              if (!answered) {
                choiceClasses +=
                  "border-[var(--color-secondary-border)] bg-white text-[var(--color-ink)] hover:border-[var(--color-primary)] cursor-pointer";
              } else if (isChoiceCorrect) {
                choiceClasses +=
                  "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)] cursor-not-allowed";
              } else if (isChoiceSelected) {
                choiceClasses +=
                  "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)] cursor-not-allowed";
              } else {
                choiceClasses +=
                  "border-[var(--color-secondary-border)] bg-white text-[var(--color-ink-soft)] opacity-60 cursor-not-allowed";
              }

              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => handleSelectChoice(choice)}
                  disabled={answered}
                  className={choiceClasses}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        </Card>

        {feedback ? (
          <FeedbackPanel
            isCorrect={isCorrect}
            answer={feedback.answer}
            kana={feedback.kana}
            romaji={feedback.romaji}
            german={feedback.german}
            exampleJapanese={feedback.exampleJapanese}
            exampleKana={feedback.exampleKana}
            exampleGerman={feedback.exampleGerman}
            shortTip={feedback.shortTip}
            detailTip={feedback.detailTip}
            onNext={handleNext}
            nextLabel="Weiter"
          />
        ) : null}
      </div>
    </main>
  );
}

interface ResultViewProps {
  category: QuestCategory;
  completionResult: CategoryCompletionResult | null;
  challengeFailed: boolean;
  previousLevel: number;
  previousXp: number;
  correctCount: number;
  total: number;
  onHome: () => void;
  onRetry: () => void;
}

function ResultView({
  category,
  completionResult,
  challengeFailed,
  previousLevel,
  previousXp,
  correctCount,
  total,
  onHome,
  onRetry,
}: ResultViewProps) {
  const hasPlayedResultSoundRef = useRef(false);

  const isFirstClear = Boolean(completionResult?.firstClear);
  const totalXpAfter = completionResult?.totalXp ?? previousXp;
  const progressBefore = getLevelProgress(previousXp);
  const progressAfter = getLevelProgress(totalXpAfter);
  const leveledUp = isFirstClear && (completionResult?.level ?? previousLevel) > previousLevel;

  // The XP bar starts at the pre-quest position (0 when a level boundary was crossed) and
  // grows to the new position right after mount — a pure CSS width transition.
  const [xpBarPercent, setXpBarPercent] = useState(() =>
    leveledUp ? 0 : progressBefore.progressPercent
  );

  useEffect(() => {
    if (hasPlayedResultSoundRef.current) return;
    hasPlayedResultSoundRef.current = true;
    if (total <= 0) return;
    if (correctCount === total) {
      playPerfectResultSound();
    } else if (correctCount === 0) {
      playFailedResultSound();
    } else {
      playNormalResultSound();
    }
  }, [correctCount, total]);

  useEffect(() => {
    if (!isFirstClear) return;
    const timer = window.setTimeout(() => {
      setXpBarPercent(progressAfter.progressPercent);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [isFirstClear, progressAfter.progressPercent]);

  const displayName = getEtappeDisplayName(category.id);

  if (challengeFailed || !completionResult) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="animate-pop-in w-full max-w-md text-center">
          <p className="text-2xl font-extrabold text-[var(--color-ink)]">Fast geschafft</p>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Abschluss-Challenge noch einmal üben
          </p>

          <div className="mt-5 flex justify-center gap-3">
            <Badge variant="gray">XP +0</Badge>
            <Badge variant="gray">0 Karten</Badge>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Button variant="primary" onClick={onRetry}>
              Noch einmal
            </Button>
            <Button variant="secondary" onClick={onHome}>
              Zurück zur Karte
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  if (!completionResult.firstClear) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="animate-pop-in w-full max-w-md text-center">
          <p className="text-2xl font-extrabold text-[var(--color-ink)]">
            Wiederholung abgeschlossen
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{displayName}</p>

          <div className="mt-5 rounded-2xl border border-[var(--color-secondary-border)] bg-white/80 p-4 text-left">
            <p className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
              XP erhalten
            </p>
            <div className="mt-2 flex items-center justify-between text-sm font-bold text-[var(--color-ink)]">
              <span>Wiederholung</span>
              <span>+0 XP</span>
            </div>
          </div>

          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
            Wiederholungen stärken dein Wissen, geben aber aktuell keine zusätzlichen XP.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Button variant="secondary" onClick={onHome}>
              Zurück zur Karte
            </Button>
            <Button variant="ghost" onClick={onRetry}>
              Noch einmal
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  const nextCategoryId = category.unlocksNext;
  const nextCategory = nextCategoryId ? getQuestCategory(nextCategoryId) : undefined;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card variant="highlight" className="animate-pop-in w-full max-w-md text-center">
        <p
          className={[
            "text-2xl font-extrabold text-[var(--color-ink)]",
            leveledUp ? "result-sparkle levelup-pop" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {leveledUp ? `Level ${completionResult.level} erreicht!` : "Etappe abgeschlossen!"}
        </p>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          {displayName} · {category.stageTitle}
        </p>

        <div className="mt-5 rounded-2xl border border-[var(--color-secondary-border)] bg-white/80 p-4 text-left">
          <p className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
            XP erhalten
          </p>
          <div className="mt-2 flex items-center justify-between text-sm text-[var(--color-ink)]">
            <span>Etappenabschluss</span>
            <span className="font-bold">+{completionResult.gainedXp} XP</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-[var(--color-secondary-border)] pt-2 text-sm font-bold text-[var(--color-ink)]">
            <span>Gesamt</span>
            <span>+{completionResult.gainedXp} XP</span>
          </div>
        </div>

        <div className="mt-4 text-left">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-ink-soft)]">
            <span>Vorher: {previousXp} XP</span>
            <span>Jetzt: {totalXpAfter} XP</span>
          </div>
          <div className="xp-bar-track mt-1.5" aria-hidden="true">
            <div className="xp-bar-fill" style={{ width: `${xpBarPercent}%` }} />
          </div>
          <p className="mt-1.5 text-xs font-semibold text-[var(--color-ink-soft)]">
            {leveledUp
              ? `Level ${previousLevel} → Level ${completionResult.level}`
              : `Level ${progressAfter.currentLevel}`}
            {" · "}
            Noch {progressAfter.xpRemaining} XP bis Level {progressAfter.nextLevel}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Badge variant="blue">{completionResult.newCards.length} Karten gesammelt</Badge>
          {nextCategory && nextCategoryId ? (
            <Badge variant="yellow" className="unlock-shine">
              {getEtappeDisplayName(nextCategoryId)} freigeschaltet
            </Badge>
          ) : null}
        </div>

        <div className="mt-6">
          <Button variant="primary" onClick={onHome} className="w-full">
            Zurück zur Karte
          </Button>
        </div>
      </Card>
    </main>
  );
}
