"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge, Button, Card, FeedbackPanel } from "@/components/ui";
import { getVocabById } from "@/lib/vocabData";
import { buildPracticeQuestions, getFeedbackPayload } from "@/lib/quizBuilder";
import { speakJapanese } from "@/lib/speech";
import {
  isSpeechRecognitionSupported,
  matchesAcceptedTranscripts,
  startJapaneseRecognition,
  type RecognitionFailure,
  type RecognitionHandle,
} from "@/lib/speechRecognition";
import {
  playCorrectSound,
  playFailedResultSound,
  playIncorrectSound,
  playNormalResultSound,
  playPerfectResultSound,
} from "@/lib/sound";
import {
  getCollectedCards,
  getKnownWords,
  getWeakWords,
  setKnownWords,
  setWeakWords,
} from "@/lib/storage";
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

function NotCollectedView({ onBack, onHome }: { onBack: () => void; onHome: () => void }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card variant="locked" className="w-full max-w-md text-center">
        <p className="text-lg font-bold text-[var(--color-ink)]">
          Diese Karte wurde noch nicht gesammelt.
        </p>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Schließe zuerst die passende Lektion ab, um diese Karte zu üben.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <Button variant="primary" onClick={onBack}>
            Zur Wortkarten-Sammlung
          </Button>
          <Button variant="secondary" onClick={onHome}>
            Zur Karte
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

function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const onBack = () => router.push("/vocabulary");
  const onHome = () => router.push("/");

  const wordId = searchParams.get("word");
  const vocab: VocabItem | undefined = wordId ? getVocabById(wordId) : undefined;

  const [access, setAccess] = useState<AccessState>(INITIAL_ACCESS_STATE);

  useEffect(() => {
    // One-time client-only read of localStorage after hydration; there is no server
    // snapshot to synchronize against, so useSyncExternalStore does not apply here.
    if (!vocab) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccess({ mounted: true, allowed: false });
      return;
    }
    const collected = getCollectedCards();
    const known = getKnownWords();
    const weak = getWeakWords();
    const allowed =
      collected.includes(vocab.id) || known.includes(vocab.id) || weak.includes(vocab.id);
    setAccess({ mounted: true, allowed });
  }, [vocab]);

  if (!wordId || !vocab) {
    return <NotFoundView onBack={onBack} />;
  }

  if (!access.mounted) {
    return <LoadingFallback />;
  }

  if (!access.allowed) {
    return <NotCollectedView onBack={onBack} onHome={onHome} />;
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

type SpeakingOutcome = "success" | "skipped";

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
    // initial render/hydration, so it cannot cause a hydration mismatch. (The speaking
    // question's empty choices array passes through unchanged.)
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
  const [speakingOutcome, setSpeakingOutcome] = useState<SpeakingOutcome | null>(null);
  const [showResult, setShowResult] = useState(false);

  if (!shuffledQuestions) {
    return <LoadingFallback />;
  }

  const questions = shuffledQuestions;
  const currentQuestion: QuizQuestion = questions[questionIndex];
  const isLastQuestion = questionIndex === questions.length - 1;
  const isSpeakingQuestion = currentQuestion.type === "speaking";

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

  /** Called from the Speaking Challenge's Weiter button after a correct utterance. */
  function handleSpeakingSuccess() {
    const updatedCorrectCount = correctCount + 1;
    setCorrectCount(updatedCorrectCount);
    setSpeakingOutcome("success");
    // Speaking attempted → grade against all 10 questions.
    recordPracticeResult(vocab.id, updatedCorrectCount === questions.length);
    setShowResult(true);
  }

  /** Called when the learner skips the Speaking Challenge — never counted as a mistake. */
  function handleSpeakingSkip() {
    const answeredTotal = questions.length - 1;
    setSpeakingOutcome("skipped");
    // Speaking skipped → grade against the 9 answered questions only.
    recordPracticeResult(vocab.id, correctCount === answeredTotal);
    setShowResult(true);
  }

  function handleRetry() {
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setIsCorrect(false);
    setCorrectCount(0);
    setSpeakingOutcome(null);
    setShowResult(false);
  }

  if (showResult) {
    const speakingSkipped = speakingOutcome === "skipped";
    const effectiveTotal = speakingSkipped ? questions.length - 1 : questions.length;
    return (
      <PracticeResultView
        vocab={vocab}
        correctCount={correctCount}
        total={effectiveTotal}
        speakingSkipped={speakingSkipped}
        onBack={onBack}
        onRetry={handleRetry}
      />
    );
  }

  const feedback = answered && !isSpeakingQuestion ? getFeedbackPayload(currentQuestion) : null;

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack}>
            Zur Sammlung
          </Button>
          <Badge variant="blue">Sub Quest</Badge>
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

        {isSpeakingQuestion ? (
          <SpeakingChallenge
            question={currentQuestion}
            onSuccess={handleSpeakingSuccess}
            onSkip={handleSpeakingSkip}
          />
        ) : (
          <>
            <Card variant="default">
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
          </>
        )}
      </div>
    </main>
  );
}

type SpeakingPhase = "idle" | "listening" | "success" | "fail";

interface SpeakingChallengeProps {
  question: QuizQuestion;
  onSuccess: () => void;
  onSkip: () => void;
}

function SpeakingChallenge({ question, onSuccess, onSkip }: SpeakingChallengeProps) {
  // null = not yet determined (before the client-only effect ran; SSR-safe default).
  const [supported, setSupported] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<SpeakingPhase>("idle");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [heardTranscript, setHeardTranscript] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState<RecognitionFailure | null>(null);
  const recognitionRef = useRef<RecognitionHandle | null>(null);

  useEffect(() => {
    // Support check touches window, so it must run client-side only. The cleanup aborts
    // any in-flight recognition session when the component unmounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(isSpeechRecognitionSupported());
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  function startListening() {
    // Guard against double-start: a session is already running or already succeeded.
    if (phase === "listening" || phase === "success" || recognitionRef.current) return;

    setHeardTranscript(null);
    setFailureReason(null);
    setPhase("listening");

    const handle = startJapaneseRecognition({
      onResult: (transcripts) => {
        setHeardTranscript(transcripts[0] ?? null);
        const accepted = question.acceptedTranscripts ?? [];
        if (matchesAcceptedTranscripts(transcripts, accepted)) {
          playCorrectSound();
          setPhase("success");
        } else {
          playIncorrectSound();
          setFailedAttempts((count) => count + 1);
          setPhase("fail");
        }
      },
      onFailure: (reason) => {
        // No usable speech (silence, blocked mic, engine error) — show a hint but do not
        // count it as a failed pronunciation attempt or play the incorrect sound.
        setFailureReason(reason);
        setPhase("fail");
      },
      onEnd: () => {
        recognitionRef.current = null;
      },
    });

    if (!handle) {
      setSupported(false);
      setPhase("idle");
      return;
    }
    recognitionRef.current = handle;
  }

  const retriesExhausted = failedAttempts >= 3;
  const listening = phase === "listening";

  const failureMessage = (() => {
    if (phase !== "fail") return null;
    if (failureReason === "permission-denied") {
      return "Der Mikrofon-Zugriff ist blockiert. Du kannst die Übung überspringen.";
    }
    if (failureReason === "no-speech") {
      return "Ich habe nichts gehört. Versuch es noch einmal.";
    }
    if (failureReason === "unavailable") {
      return "Die Spracherkennung ist gerade nicht verfügbar. Du kannst die Übung überspringen.";
    }
    return "Noch nicht ganz. Versuch es noch einmal.";
  })();

  return (
    <Card variant="default">
      <div className="flex items-center justify-between">
        <Badge variant="yellow">Speaking Challenge</Badge>
        <button
          type="button"
          onClick={() => speakJapanese(question.speechText ?? "")}
          aria-label="Aussprache anhören"
          title="Aussprache anhören"
          className="tap-scale flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
        >
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
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </svg>
        </button>
      </div>

      <p className="mt-4 text-sm font-semibold text-[var(--color-ink-soft)]">
        Sprich den Satz laut aus.
      </p>
      <p className="mt-2 text-2xl font-extrabold text-[var(--color-ink)]">{question.speechText}</p>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{question.speechKana}</p>
      <p className="text-sm text-[var(--color-ink-soft)]">{question.speechRomaji}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{question.speechGerman}</p>

      {supported === false ? (
        <div className="mt-5 flex flex-col gap-3">
          <p className="rounded-xl bg-[var(--color-locked-bg)] px-4 py-3 text-sm font-semibold text-[var(--color-ink-soft)]">
            Spracherkennung wird in diesem Browser nicht unterstützt.
          </p>
          <Button variant="secondary" onClick={onSkip} className="w-full">
            Überspringen
          </Button>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {phase === "success" ? (
            <>
              <p className="rounded-xl bg-[var(--color-primary-soft)] px-4 py-3 text-sm font-bold text-[var(--color-primary-dark)]">
                Gut gesprochen!
              </p>
              {heardTranscript ? (
                <p className="text-xs text-[var(--color-ink-soft)]">Verstanden: {heardTranscript}</p>
              ) : null}
              <Button variant="primary" onClick={onSuccess} className="w-full">
                Weiter
              </Button>
            </>
          ) : (
            <>
              {listening ? (
                <p className="rounded-xl bg-[var(--color-blue-soft)] px-4 py-3 text-sm font-bold text-[var(--color-blue)]">
                  Ich höre zu...
                </p>
              ) : null}

              {failureMessage ? (
                <p className="rounded-xl bg-[var(--color-danger-soft)] px-4 py-3 text-sm font-bold text-[var(--color-danger)]">
                  {failureMessage}
                </p>
              ) : null}
              {phase === "fail" && heardTranscript ? (
                <p className="text-xs text-[var(--color-ink-soft)]">Verstanden: {heardTranscript}</p>
              ) : null}

              {retriesExhausted ? (
                <p className="text-sm font-semibold text-[var(--color-ink-soft)]">
                  Kein Problem – du kannst die Übung überspringen. Das zählt nicht als Fehler.
                </p>
              ) : (
                <Button
                  variant="primary"
                  onClick={startListening}
                  className="w-full"
                  disabled={listening}
                >
                  {phase === "fail" ? "Noch einmal sprechen" : "Sprechen"}
                </Button>
              )}

              <Button variant="secondary" onClick={onSkip} className="w-full" disabled={listening}>
                Überspringen
              </Button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

interface PracticeResultViewProps {
  vocab: VocabItem;
  correctCount: number;
  /** Effective total: 10 when Speaking was attempted, 9 when it was skipped. */
  total: number;
  speakingSkipped: boolean;
  onBack: () => void;
  onRetry: () => void;
}

function PracticeResultView({
  vocab,
  correctCount,
  total,
  speakingSkipped,
  onBack,
  onRetry,
}: PracticeResultViewProps) {
  const hasPlayedResultSoundRef = useRef(false);

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

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card variant="highlight" className="w-full max-w-md text-center">
        <p className="text-2xl font-extrabold text-[var(--color-ink)]">Sub Quest abgeschlossen</p>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          {vocab.kanji} · {vocab.german}
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Badge variant={correctCount === total ? "green" : "yellow"}>
            {correctCount} / {total} richtig
          </Badge>
          <Badge variant="gray">{total} Fragen abgeschlossen</Badge>
          {speakingSkipped ? <Badge variant="gray">Sprechen übersprungen</Badge> : null}
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
