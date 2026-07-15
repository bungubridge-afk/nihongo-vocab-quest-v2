import type { QuestCategory, QuizQuestion } from "@/types/learning";
import { getVocabById } from "@/lib/vocabData";
import { getSubQuestQuestions } from "@/lib/subQuestData";

/** Returns the fixed questions for a category. Wrapped in a function so a future shuffle can be added without changing callers. */
export function buildLessonQuestions(category: QuestCategory): QuizQuestion[] {
  return [...category.questions];
}

/**
 * Returns the 10-question Sub Quest for a vocab word: nine hand-authored 4-choice questions
 * plus the Q10 Speaking Challenge. All content lives in `src/lib/subQuestData/` — the old
 * generic template generation was retired in favor of explicitly curated questions per word.
 * Returns an empty array for unknown vocab ids.
 */
export function buildPracticeQuestions(vocabId: string): QuizQuestion[] {
  return getSubQuestQuestions(vocabId) ?? [];
}

export interface FeedbackPayload {
  answer: string;
  kana: string;
  romaji: string;
  german: string;
  exampleJapanese: string;
  exampleKana: string;
  exampleGerman: string;
  shortTip: string;
  detailTip: string;
}

/** Feedback is only ever computed after an answer is submitted, so kana/romaji never leak into the question itself. */
export function getFeedbackPayload(question: QuizQuestion): FeedbackPayload {
  const vocab = question.vocabId ? getVocabById(question.vocabId) : undefined;

  if (question.type === "phrase-choice") {
    return {
      answer: question.answer,
      kana: question.answerKana ?? vocab?.kana ?? "",
      // Word-level vocab.romaji would misrepresent a full sentence (e.g. "mizu" instead
      // of "mizu o kudasai"), so an absent sentence-level romaji is shown as empty rather
      // than falling back to it.
      romaji: question.answerRomaji ?? "",
      german: question.answerGerman ?? vocab?.german ?? "",
      exampleJapanese: question.exampleJapanese ?? question.answer,
      exampleKana: question.exampleKana ?? question.answerKana ?? "",
      exampleGerman: question.exampleGerman ?? question.answerGerman ?? "",
      shortTip: question.shortTip ?? vocab?.shortTip ?? "",
      detailTip: question.detailTip ?? vocab?.detailTip ?? "",
    };
  }

  return {
    answer: question.answer,
    kana: vocab?.kana ?? "",
    romaji: vocab?.romaji ?? "",
    german: vocab?.german ?? "",
    exampleJapanese: question.exampleJapanese ?? vocab?.exampleJapanese ?? "",
    exampleKana: question.exampleKana ?? vocab?.exampleKana ?? "",
    exampleGerman: question.exampleGerman ?? vocab?.exampleGerman ?? "",
    shortTip: question.shortTip ?? vocab?.shortTip ?? "",
    detailTip: question.detailTip ?? vocab?.detailTip ?? "",
  };
}
