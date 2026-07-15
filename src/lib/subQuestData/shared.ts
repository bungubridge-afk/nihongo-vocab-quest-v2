import type { CategoryId, QuestionType, QuizQuestion } from "@/types/learning";

/**
 * One hand-authored Sub Quest question (Q1–Q9). Content — prompt, choices, answer,
 * feedback sentences — is always written explicitly per word in the category files;
 * this spec only saves the per-question boilerplate (id, categoryId, vocabId).
 */
export interface SubQuestQuestionSpec {
  /** Short id suffix describing the question's angle, e.g. "meaning", "particle", "mini". */
  step: string;
  type: QuestionType;
  instruction: string;
  prompt: string;
  choices: [string, string, string, string];
  answer: string;
  answerKana?: string;
  answerRomaji?: string;
  answerGerman?: string;
  exampleJapanese?: string;
  exampleKana?: string;
  exampleGerman?: string;
}

/** The Q10 Speaking Challenge for one word. */
export interface SpeakingSpec {
  /** The Japanese sentence to say aloud — must contain / center on the quest's word. */
  speechText: string;
  speechKana: string;
  speechRomaji: string;
  speechGerman: string;
  /** Kanji and kana spellings that count as correct after normalization (min. 2 entries). */
  acceptedTranscripts: string[];
}

/**
 * Assembles a complete 10-question Sub Quest: nine explicit 4-choice questions followed by
 * the Speaking Challenge. Choice order as authored is irrelevant at runtime — the practice
 * page reshuffles choices client-side on every mount.
 */
export function defineSubQuest(
  vocabId: string,
  categoryId: CategoryId,
  questions: SubQuestQuestionSpec[],
  speaking: SpeakingSpec
): QuizQuestion[] {
  const quiz: QuizQuestion[] = questions.map((spec, index) => ({
    id: `practice-${vocabId}-q${index + 1}-${spec.step}`,
    type: spec.type,
    categoryId,
    vocabId,
    prompt: spec.prompt,
    instruction: spec.instruction,
    choices: [...spec.choices],
    answer: spec.answer,
    answerKana: spec.answerKana,
    answerRomaji: spec.answerRomaji,
    answerGerman: spec.answerGerman,
    exampleJapanese: spec.exampleJapanese,
    exampleKana: spec.exampleKana,
    exampleGerman: spec.exampleGerman,
  }));

  quiz.push({
    id: `practice-${vocabId}-q10-speaking`,
    type: "speaking",
    categoryId,
    vocabId,
    prompt: speaking.speechText,
    instruction: "Sprich den Satz laut aus.",
    choices: [],
    answer: speaking.speechText,
    speechText: speaking.speechText,
    speechKana: speaking.speechKana,
    speechRomaji: speaking.speechRomaji,
    speechGerman: speaking.speechGerman,
    acceptedTranscripts: [...speaking.acceptedTranscripts],
    canSkip: true,
  });

  return quiz;
}
