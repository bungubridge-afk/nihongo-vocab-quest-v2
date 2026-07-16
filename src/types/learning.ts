export type QuestionType =
  | "meaning-choice"
  | "japanese-choice"
  | "fill-blank"
  | "particle-choice"
  | "phrase-choice"
  | "sentence-meaning-choice"
  | "mistake-choice"
  | "kana-choice"
  | "typing"
  | "reorder"
  | "speaking";

export type CategoryId = "cafe" | "reise" | "schule" | "freunde" | "review";

export type CardStatus =
  | "locked"
  | "sammelbar"
  | "gesammelt"
  | "ueben"
  | "gelernt";

export type Rarity = "common" | "rare" | "review";

/**
 * How polite/formal a given *sentence* sounds — never the word by itself. Most vocabulary
 * (水, 学校, 今日, 日本語, …) is neither casual nor polite in isolation; politeness comes
 * from the sentence ending, the situation, and who you're talking to. `honorific`/`humble`
 * are reserved for a future 尊敬語/謙譲語 expansion and are not taught at A0–A1 — nothing
 * in this pass produces content tagged with either.
 */
export type SpeechRegister = "neutral" | "casual" | "polite" | "honorific" | "humble";

/** Who you're talking to / the social situation a `UsageExample` fits, used to decide which
 *  register is natural for that relationship. */
export type ConversationSituation =
  | "general"
  | "friend"
  | "family"
  | "classmate"
  | "teacher"
  | "stranger"
  | "staff"
  | "work";

/**
 * One concrete sentence showing a word in use, tagged with how polite it sounds and who
 * it's natural to say it to. This is the register/situation foundation: politeness is
 * attached here, per example, never to the `VocabItem` as a whole (see
 * `docs/REGISTER_SITUATION_FOUNDATION.md`).
 */
export interface UsageExample {
  /** Unique across the whole app — e.g. "school-going-today-casual". */
  id: string;
  japanese: string;
  kana: string;
  romaji: string;
  german: string;
  register: SpeechRegister;
  /** Who this phrasing is natural to say to. At least one entry. */
  suitableFor: ConversationSituation[];
  /** Short German scene-setter, e.g. "Du sprichst locker mit einem Freund." */
  contextGerman?: string;
  /** Short German note on *why* this phrasing fits (or doesn't fit) the situation. */
  noteGerman?: string;
  /**
   * Links this example to its casual/polite counterpart(s) with the same meaning — e.g.
   * both the 行く and 行きます sentences for "going to school today" share one
   * `contrastGroup` id, so a future UI can show them side by side.
   */
  contrastGroup?: string;
}

export interface VocabItem {
  id: string;
  kanji: string;
  kana: string;
  romaji: string;
  german: string;
  categoryId: CategoryId;
  stage: number;
  unlockLevel: number;
  xpReward: number;
  rarity: Rarity;
  exampleJapanese: string;
  exampleKana: string;
  exampleGerman: string;
  commonExamples: string[];
  commonPatterns: string[];
  relatedExpressions: string[];
  shortTip: string;
  detailTip: string;
  /** Ids of other VocabItems that are thematically related, used to scope Word Practice distractors. */
  relatedVocabIds?: string[];
  /**
   * Register/situation-tagged example sentences for this word. Optional and additive:
   * words without it behave exactly as before (this pass only populates it for the 5
   * Schule words). Never auto-derived from `exampleJapanese` — only explicitly authored
   * sentences carry a register, to avoid mis-tagging existing examples.
   */
  usageExamples?: UsageExample[];
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  categoryId: CategoryId;
  prompt: string;
  instruction: string;
  choices: string[];
  answer: string;
  vocabId?: string;
  isChallenge?: boolean;
  label?: string;
  answerKana?: string;
  answerRomaji?: string;
  answerGerman?: string;
  exampleJapanese?: string;
  exampleKana?: string;
  exampleGerman?: string;
  shortTip?: string;
  detailTip?: string;
  xpReward?: number;
  /** Speaking questions only: the Japanese sentence the learner should say aloud. */
  speechText?: string;
  speechKana?: string;
  speechRomaji?: string;
  speechGerman?: string;
  /**
   * Speaking questions only: transcripts (kanji and kana variants) that count as a correct
   * utterance after normalization — see `speechRecognition.ts`.
   */
  acceptedTranscripts?: string[];
  /** Speaking questions only: always true — the learner may skip without penalty. */
  canSkip?: boolean;
}

export interface QuestCategory {
  id: CategoryId;
  name: string;
  stageTitle: string;
  description: string;
  unlockLevel: number;
  rewardXp: number;
  collectedCardIds: string[];
  questions: QuizQuestion[];
  unlocksNext?: CategoryId;
  isReview?: boolean;
}

export interface OnboardingProfile {
  motivation: string;
  startLevel: string;
  collectFocus: string;
  trainingStyle: string;
  questGoal: string;
  createdAt: string;
}

export interface PlayerProgress {
  xp: number;
  level: number;
  collectedCards: string[];
  completedCategories: CategoryId[];
  unlockedCategories: CategoryId[];
  knownWords: string[];
  weakWords: string[];
}
