import type { QuestCategory, QuizQuestion } from "@/types/learning";
import { getVocabById } from "@/lib/vocabData";
import { getSubQuestQuestions } from "@/lib/subQuestData";
import type { AppLocale } from "@/i18n/types";
import { localizeContent } from "@/i18n/localizeContent";

/**
 * Localizes the explanation-language fields of a question to `locale`, leaving all
 * Japanese content (kanji/kana/romaji, Japanese example/speech sentences, accepted
 * transcripts) untouched. `localizeContent` returns Japanese strings unchanged
 * (they simply have no dictionary entry), so passing `prompt`/`choices`/`answer`
 * through it is safe whether they hold a German gloss or a Japanese sentence.
 *
 * Crucially, `choices` and `answer` go through the SAME translation, so the
 * answer still matches its choice for the correctness check in the lesson/practice
 * pages — equality is preserved across locales.
 */
function localizeQuestion(question: QuizQuestion, locale: AppLocale): QuizQuestion {
  if (locale === "de") return question;
  return {
    ...question,
    instruction: localizeContent(question.instruction, locale),
    prompt: localizeContent(question.prompt, locale),
    choices: question.choices.map((choice) => localizeContent(choice, locale)),
    answer: localizeContent(question.answer, locale),
    label: question.label ? localizeContent(question.label, locale) : question.label,
    answerGerman: question.answerGerman
      ? localizeContent(question.answerGerman, locale)
      : question.answerGerman,
    exampleGerman: question.exampleGerman
      ? localizeContent(question.exampleGerman, locale)
      : question.exampleGerman,
    shortTip: question.shortTip ? localizeContent(question.shortTip, locale) : question.shortTip,
    detailTip: question.detailTip
      ? localizeContent(question.detailTip, locale)
      : question.detailTip,
    speechGerman: question.speechGerman
      ? localizeContent(question.speechGerman, locale)
      : question.speechGerman,
  };
}

/** Returns the fixed questions for a category, localized to `locale`. */
export function buildLessonQuestions(
  category: QuestCategory,
  locale: AppLocale
): QuizQuestion[] {
  return category.questions.map((question) => localizeQuestion(question, locale));
}

/**
 * Returns the 10-question Sub Quest for a vocab word, localized to `locale`: nine
 * hand-authored 4-choice questions plus the Q10 Speaking Challenge. All content lives
 * in `src/lib/subQuestData/`. Returns an empty array for unknown vocab ids.
 */
export function buildPracticeQuestions(
  vocabId: string,
  locale: AppLocale
): QuizQuestion[] {
  return (getSubQuestQuestions(vocabId) ?? []).map((question) =>
    localizeQuestion(question, locale)
  );
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

/**
 * Feedback is only ever computed after an answer is submitted, so kana/romaji never
 * leak into the question itself. The `question` passed in has already been localized
 * by `buildLessonQuestions`/`buildPracticeQuestions`, but its vocab-derived fallbacks
 * (word meaning, tips, example) come straight from `vocabData` and are localized here
 * via `localizeContent`. Japanese fields (kana/romaji/exampleJapanese) pass through.
 */
export function getFeedbackPayload(
  question: QuizQuestion,
  locale: AppLocale
): FeedbackPayload {
  const vocab = question.vocabId ? getVocabById(question.vocabId) : undefined;
  const vocabGerman = vocab ? localizeContent(vocab.german, locale) : "";
  const vocabExampleGerman = vocab ? localizeContent(vocab.exampleGerman, locale) : "";
  const vocabShortTip = vocab ? localizeContent(vocab.shortTip, locale) : "";
  const vocabDetailTip = vocab ? localizeContent(vocab.detailTip, locale) : "";

  if (question.type === "phrase-choice") {
    return {
      answer: question.answer,
      kana: question.answerKana ?? vocab?.kana ?? "",
      // Word-level vocab.romaji would misrepresent a full sentence (e.g. "mizu" instead
      // of "mizu o kudasai"), so an absent sentence-level romaji is shown as empty rather
      // than falling back to it.
      romaji: question.answerRomaji ?? "",
      german: question.answerGerman ?? vocabGerman,
      exampleJapanese: question.exampleJapanese ?? question.answer,
      exampleKana: question.exampleKana ?? question.answerKana ?? "",
      exampleGerman: question.exampleGerman ?? question.answerGerman ?? "",
      shortTip: question.shortTip ?? vocabShortTip,
      detailTip: question.detailTip ?? vocabDetailTip,
    };
  }

  return {
    answer: question.answer,
    kana: vocab?.kana ?? "",
    romaji: vocab?.romaji ?? "",
    german: vocabGerman,
    exampleJapanese: question.exampleJapanese ?? vocab?.exampleJapanese ?? "",
    exampleKana: question.exampleKana ?? vocab?.exampleKana ?? "",
    exampleGerman: question.exampleGerman ?? vocabExampleGerman,
    shortTip: question.shortTip ?? vocabShortTip,
    detailTip: question.detailTip ?? vocabDetailTip,
  };
}
