export type QuestionType =
  | "meaning-choice"
  | "japanese-choice"
  | "fill-blank"
  | "particle-choice"
  | "phrase-choice"
  | "typing"
  | "reorder";

export type CategoryId = "cafe" | "reise" | "schule" | "freunde" | "review";

export type CardStatus =
  | "locked"
  | "sammelbar"
  | "gesammelt"
  | "ueben"
  | "gelernt";

export type Rarity = "common" | "rare" | "review";

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
