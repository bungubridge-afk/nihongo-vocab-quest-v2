import type { QuestCategory, QuizQuestion, VocabItem } from "@/types/learning";
import { getVocabById, vocabData } from "@/lib/vocabData";

/**
 * Sentence-level romaji for each vocab item's `exampleJapanese`, keyed by vocab id.
 * VocabItem only carries word-level romaji, which would misrepresent a full sentence
 * (e.g. "mizu" instead of "mizu o kudasai") — so phrase-choice questions look this up
 * instead of falling back to the word-level value. Words without an entry here simply
 * omit answerRomaji rather than showing a misleading word-level romaji.
 */
const EXAMPLE_ROMAJI: Partial<Record<string, string>> = {
  coffee: "koohii o kudasai",
  water: "mizu o kudasai",
  bread: "pan o kudasai",
  drink: "mizu o nomimasu",
  eat: "pan o tabemasu",
};

const PARTICLES = ["を", "に", "と", "で", "が", "は"];
const PREDICATE_POOL = [
  "食べます",
  "飲みます",
  "行きます",
  "好きです",
  "ください",
  "会います",
  "話します",
  "勉強します",
];

/**
 * Deterministically reorders `items` based on `seed` (e.g. a vocab/question id).
 * Used instead of Math.random-based shuffling so the order is identical on the
 * server-rendered HTML and the client's first render, avoiding hydration mismatches.
 */
function orderDeterministically<T>(items: T[], seed: string): T[] {
  if (items.length <= 1) return items;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const offset = hash % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function pickDistractors(values: string[], exclude: string, count: number): string[] {
  const unique = Array.from(new Set(values.filter((value) => value !== exclude)));
  return unique.slice(0, count);
}

function findParticle(sentence: string): { particle: string; index: number } | null {
  let found: { particle: string; index: number } | null = null;
  for (const particle of PARTICLES) {
    const index = sentence.indexOf(particle);
    if (index !== -1 && (found === null || index < found.index)) {
      found = { particle, index };
    }
  }
  return found;
}

function buildMeaningChoiceQuestion(vocab: VocabItem, pool: VocabItem[]): QuizQuestion {
  const distractors = pickDistractors(pool.map((item) => item.german), vocab.german, 3);
  return {
    id: `practice-${vocab.id}-meaning`,
    type: "meaning-choice",
    categoryId: vocab.categoryId,
    prompt: vocab.kanji,
    instruction: "Wähle die richtige Bedeutung.",
    choices: orderDeterministically([vocab.german, ...distractors], `${vocab.id}:meaning`),
    answer: vocab.german,
    vocabId: vocab.id,
  };
}

function buildJapaneseChoiceQuestion(vocab: VocabItem, pool: VocabItem[]): QuizQuestion {
  const distractors = pickDistractors(pool.map((item) => item.kanji), vocab.kanji, 3);
  return {
    id: `practice-${vocab.id}-japanese`,
    type: "japanese-choice",
    categoryId: vocab.categoryId,
    prompt: vocab.german,
    instruction: "Wähle die passende Wortkarte.",
    choices: orderDeterministically([vocab.kanji, ...distractors], `${vocab.id}:japanese`),
    answer: vocab.kanji,
    vocabId: vocab.id,
  };
}

function buildParticleChoiceQuestion(vocab: VocabItem): QuizQuestion {
  const sentence = vocab.exampleJapanese;
  const found = findParticle(sentence);

  if (!found) {
    const fallbackChoices = PARTICLES.slice(0, 4);
    return {
      id: `practice-${vocab.id}-particle`,
      type: "particle-choice",
      categoryId: vocab.categoryId,
      prompt: sentence,
      instruction: "Ergänze den Satz.",
      choices: fallbackChoices,
      answer: fallbackChoices[0],
      vocabId: vocab.id,
    };
  }

  const { particle, index } = found;
  const blanked = `${sentence.slice(0, index)}____${sentence.slice(index + particle.length)}`;
  const distractors = pickDistractors(PARTICLES, particle, 3);

  return {
    id: `practice-${vocab.id}-particle`,
    type: "particle-choice",
    categoryId: vocab.categoryId,
    prompt: blanked,
    instruction: "Ergänze den Satz.",
    choices: orderDeterministically([particle, ...distractors], `${vocab.id}:particle`),
    answer: particle,
    vocabId: vocab.id,
  };
}

function buildFillBlankQuestion(vocab: VocabItem): QuizQuestion {
  const sentence = vocab.exampleJapanese;
  const found = findParticle(sentence);
  const hasTrailingPeriod = sentence.endsWith("。");
  const bodyEnd = hasTrailingPeriod ? sentence.length - 1 : sentence.length;
  const predicateStart = found ? found.index + found.particle.length : 0;
  const predicate = sentence.slice(predicateStart, bodyEnd) || sentence;
  const blanked = `${sentence.slice(0, predicateStart)}____${hasTrailingPeriod ? "。" : ""}`;
  const distractors = pickDistractors(PREDICATE_POOL, predicate, 3);

  return {
    id: `practice-${vocab.id}-predicate`,
    type: "fill-blank",
    categoryId: vocab.categoryId,
    prompt: blanked,
    instruction: "Ergänze den Satz.",
    choices: orderDeterministically([predicate, ...distractors], `${vocab.id}:predicate`),
    answer: predicate,
    vocabId: vocab.id,
  };
}

function buildPhraseChoiceQuestion(vocab: VocabItem, pool: VocabItem[]): QuizQuestion {
  const correct = vocab.exampleJapanese;
  const otherExamples = pool
    .map((item) => item.exampleJapanese)
    .filter((example) => example !== correct);
  const distractors = pickDistractors(otherExamples, correct, 3);

  return {
    id: `practice-${vocab.id}-phrase`,
    type: "phrase-choice",
    categoryId: vocab.categoryId,
    prompt: vocab.exampleGerman,
    instruction: "Wähle den natürlichen japanischen Satz.",
    choices: orderDeterministically([correct, ...distractors], `${vocab.id}:phrase`),
    answer: correct,
    vocabId: vocab.id,
    answerKana: vocab.exampleKana,
    answerRomaji: EXAMPLE_ROMAJI[vocab.id],
    answerGerman: vocab.exampleGerman,
    exampleJapanese: vocab.exampleJapanese,
    exampleKana: vocab.exampleKana,
    exampleGerman: vocab.exampleGerman,
    shortTip: vocab.shortTip,
    detailTip: vocab.detailTip,
  };
}

/** Returns the fixed questions for a category. Wrapped in a function so a future shuffle can be added without changing callers. */
export function buildLessonQuestions(category: QuestCategory): QuizQuestion[] {
  return [...category.questions];
}

/** Builds 5 questions scoped entirely to a single vocab item — no other word's meaning is ever tested. */
export function buildPracticeQuestions(vocabId: string): QuizQuestion[] {
  const vocab = getVocabById(vocabId);
  if (!vocab) return [];

  const pool = vocabData.filter((item) => item.id !== vocab.id);

  return [
    buildMeaningChoiceQuestion(vocab, pool),
    buildJapaneseChoiceQuestion(vocab, pool),
    buildParticleChoiceQuestion(vocab),
    buildFillBlankQuestion(vocab),
    buildPhraseChoiceQuestion(vocab, pool),
  ];
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
