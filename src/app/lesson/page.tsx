"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge, Button, Card, FeedbackPanel } from "@/components/ui";
import { getQuestCategory } from "@/lib/questData";
import { buildLessonQuestions, getFeedbackPayload } from "@/lib/quizBuilder";
import { getLevel, recordCategoryCompletion } from "@/lib/storage";
import type { CategoryCompletionResult } from "@/lib/storage";
import type { CategoryId, QuestCategory, QuizQuestion } from "@/types/learning";

const VALID_CATEGORY_IDS: CategoryId[] = ["cafe", "reise", "schule", "freunde", "review"];

function isValidCategoryId(value: string): value is CategoryId {
  return (VALID_CATEGORY_IDS as string[]).includes(value);
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

function LessonContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawCategoryId = searchParams.get("category") ?? "cafe";
  const categoryId: CategoryId | null = isValidCategoryId(rawCategoryId) ? rawCategoryId : null;
  const category: QuestCategory | undefined = categoryId ? getQuestCategory(categoryId) : undefined;

  if (!category) {
    return <NotFoundView onHome={() => router.push("/")} />;
  }

  return <LessonSession category={category} onHome={() => router.push("/")} />;
}

interface LessonSessionProps {
  category: QuestCategory;
  onHome: () => void;
}

function LessonSession({ category, onHome }: LessonSessionProps) {
  const questions = useMemo(() => buildLessonQuestions(category), [category]);

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

  const currentQuestion: QuizQuestion = questions[questionIndex];
  const isLastQuestion = questionIndex === questions.length - 1;
  const isChallengeQuestion = Boolean(currentQuestion?.isChallenge) || isLastQuestion;

  function handleSelectChoice(choice: string) {
    if (answered) return;
    setSelectedAnswer(choice);
    setIsCorrect(choice === currentQuestion.answer);
    setAnswered(true);
  }

  function handleNext() {
    if (isLastQuestion) {
      if (isCorrect) {
        const levelBefore = getLevel();
        const result = recordCategoryCompletion(category);
        setPreviousLevel(levelBefore);
        setCompletionResult(result);
        setChallengeFailed(false);
      } else {
        setCompletionResult(null);
        setChallengeFailed(true);
      }
      setShowResult(true);
      return;
    }

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
  }

  if (showResult) {
    return (
      <ResultView
        category={category}
        completionResult={completionResult}
        challengeFailed={challengeFailed}
        previousLevel={previousLevel}
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
            {category.name}
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
          <p className="mt-2 text-2xl font-extrabold text-[var(--color-ink)]">
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
  onHome: () => void;
  onRetry: () => void;
}

function ResultView({
  category,
  completionResult,
  challengeFailed,
  previousLevel,
  onHome,
  onRetry,
}: ResultViewProps) {
  if (challengeFailed || !completionResult) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md text-center">
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
        <Card className="w-full max-w-md text-center">
          <p className="text-2xl font-extrabold text-[var(--color-ink)]">
            Wiederholung abgeschlossen
          </p>

          <div className="mt-5 flex justify-center gap-3">
            <Badge variant="gray">XP +0</Badge>
            <Badge variant="gray">Neue Karten 0</Badge>
          </div>

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

  const leveledUp = completionResult.level > previousLevel;
  const nextCategory = category.unlocksNext ? getQuestCategory(category.unlocksNext) : undefined;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card variant="highlight" className="w-full max-w-md text-center">
        <p className="text-2xl font-extrabold text-[var(--color-ink)]">
          {leveledUp ? `Level ${completionResult.level} erreicht!` : "Kategorie abgeschlossen!"}
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Badge variant="green">+{completionResult.gainedXp} XP</Badge>
          <Badge variant="blue">{completionResult.newCards.length} Karten gesammelt</Badge>
          {nextCategory ? (
            <Badge variant="yellow">{nextCategory.name} freigeschaltet</Badge>
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
