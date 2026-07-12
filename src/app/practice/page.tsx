"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge, Button, Card, FeedbackPanel } from "@/components/ui";
import { getVocabById } from "@/lib/vocabData";
import { buildPracticeQuestions, getFeedbackPayload } from "@/lib/quizBuilder";
import { getKnownWords, getWeakWords, setKnownWords, setWeakWords } from "@/lib/storage";
import type { QuizQuestion, VocabItem } from "@/types/learning";

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

export default function PracticePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PracticeContent />
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

function NotFoundView({ onBack }: { onBack: () => void }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md text-center">
        <p className="text-lg font-bold text-[var(--color-ink)]">Wortkarte nicht gefunden.</p>
        <div className="mt-5">
          <Button variant="primary" onClick={onBack}>
            Zur Sammlung
          </Button>
        </div>
      </Card>
    </main>
  );
}

function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const onBack = () => router.push("/vocabulary");

  const wordId = searchParams.get("word");
  const vocab: VocabItem | undefined = wordId ? getVocabById(wordId) : undefined;

  if (!wordId || !vocab) {
    return <NotFoundView onBack={onBack} />;
  }

  return <PracticeSession vocab={vocab} onBack={onBack} />;
}

function recordPracticeResult(vocabId: string, allCorrect: boolean) {
  const known = getKnownWords();
  const weak = getWeakWords();

  if (allCorrect) {
    if (!known.includes(vocabId)) {
      setKnownWords([...known, vocabId]);
    }
    if (weak.includes(vocabId)) {
      setWeakWords(weak.filter((id) => id !== vocabId));
    }
  } else if (!weak.includes(vocabId)) {
    setWeakWords([...weak, vocabId]);
  }
}

interface PracticeSessionProps {
  vocab: VocabItem;
  onBack: () => void;
}

function PracticeSession({ vocab, onBack }: PracticeSessionProps) {
  const baseQuestions = useMemo(() => buildPracticeQuestions(vocab.id), [vocab.id]);
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[] | null>(null);

  useEffect(() => {
    // Choice order is randomized once per mount, entirely on the client, so the correct
    // answer isn't always in the same position. Shuffling happens only here, after the
    // initial render/hydration, so it cannot cause a hydration mismatch.
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
  const [correctCount, setCorrectCount] = useState(0);
  const [showResult, setShowResult] = useState(false);

  if (!shuffledQuestions) {
    return <LoadingFallback />;
  }

  const questions = shuffledQuestions;
  const currentQuestion: QuizQuestion = questions[questionIndex];
  const isLastQuestion = questionIndex === questions.length - 1;

  function handleSelectChoice(choice: string) {
    if (answered) return;
    setSelectedAnswer(choice);
    setIsCorrect(choice === currentQuestion.answer);
    setAnswered(true);
  }

  function handleNext() {
    const updatedCorrectCount = correctCount + (isCorrect ? 1 : 0);

    if (isLastQuestion) {
      setCorrectCount(updatedCorrectCount);
      recordPracticeResult(vocab.id, updatedCorrectCount === questions.length);
      setShowResult(true);
      return;
    }

    setCorrectCount(updatedCorrectCount);
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
    setCorrectCount(0);
    setShowResult(false);
  }

  if (showResult) {
    return (
      <PracticeResultView
        vocab={vocab}
        correctCount={correctCount}
        total={questions.length}
        onBack={onBack}
        onRetry={handleRetry}
      />
    );
  }

  const feedback = answered ? getFeedbackPayload(currentQuestion) : null;

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack}>
            Zur Sammlung
          </Button>
          <Badge variant="blue">Einzeltraining</Badge>
        </div>

        <div>
          <p className="text-xs font-bold tracking-wide text-[var(--color-primary-dark)] uppercase">
            {vocab.kanji}
          </p>
          <h1 className="text-2xl font-extrabold text-[var(--color-ink)]">{vocab.german}</h1>
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

        <Card variant="default">
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

interface PracticeResultViewProps {
  vocab: VocabItem;
  correctCount: number;
  total: number;
  onBack: () => void;
  onRetry: () => void;
}

function PracticeResultView({
  vocab,
  correctCount,
  total,
  onBack,
  onRetry,
}: PracticeResultViewProps) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card variant="highlight" className="w-full max-w-md text-center">
        <p className="text-2xl font-extrabold text-[var(--color-ink)]">Karte geübt</p>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          {vocab.kanji} · {vocab.german}
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Badge variant={correctCount === total ? "green" : "yellow"}>
            {correctCount} / {total} richtig
          </Badge>
          <Badge variant="gray">{total} Fragen abgeschlossen</Badge>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button variant="primary" onClick={onBack} className="w-full">
            Zur Sammlung
          </Button>
          <Button variant="secondary" onClick={onRetry} className="w-full">
            Noch einmal üben
          </Button>
        </div>
      </Card>
    </main>
  );
}
