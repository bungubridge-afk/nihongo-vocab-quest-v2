import type { QuizQuestion } from "@/types/learning";
import { cafeSubQuests } from "./cafe";
import { reiseSubQuests } from "./reise";
import { schuleSubQuests } from "./schule";
import { freundeSubQuests } from "./freunde";

/** All hand-authored Sub Quests, keyed by vocab id (26 words × 10 questions). */
const allSubQuests: Record<string, QuizQuestion[]> = {
  ...cafeSubQuests,
  ...reiseSubQuests,
  ...schuleSubQuests,
  ...freundeSubQuests,
};

/**
 * Returns a fresh copy of the curated Sub Quest for `vocabId` (or undefined for unknown
 * ids). Copied per call so callers (e.g. the practice page's client-side choice shuffle)
 * can never mutate the shared module data.
 */
export function getSubQuestQuestions(vocabId: string): QuizQuestion[] | undefined {
  const questions = allSubQuests[vocabId];
  if (!questions) return undefined;
  return questions.map((question) => ({
    ...question,
    choices: [...question.choices],
    acceptedTranscripts: question.acceptedTranscripts
      ? [...question.acceptedTranscripts]
      : undefined,
  }));
}
