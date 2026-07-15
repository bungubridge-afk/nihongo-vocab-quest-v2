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
  station: "eki wa doko desu ka",
  hotel: "hoteru ni ikimasu",
  train: "densha de ikimasu",
  toilet: "toire wa doko desu ka",
  go: "hoteru ni ikimasu",
  where: "eki wa doko desu ka",
  excuseMe: "sumimasen, eki wa doko desu ka",
  right: "migi desu",
  left: "hidari desu",
  near: "eki wa chikai desu",
  far: "hoteru wa tooi desu",
  school: "gakkou ni ikimasu",
  teacher: "sensei ni kikimasu",
  japaneseLanguage: "nihongo o benkyou shimasu",
  study: "nihongo o benkyou shimasu",
  today: "kyou, gakkou ni ikimasu",
  friend: "tomodachi ni aimasu",
  meet: "tomodachi ni aimasu",
  talk: "tomodachi to hanashimasu",
  tomorrow: "ashita, tomodachi ni aimasu",
  like: "tomodachi ga suki desu",
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
    if (index === -1) continue;
    // A "で" at this position is the start of the polite copula "です", not a real
    // particle — matching it would blank out "です" into meaningless fragments
    // (e.g. "右です。" → "右____す。" with answer "で").
    if (particle === "で" && sentence.slice(index, index + 2) === "です") continue;
    if (found === null || index < found.index) {
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

/**
 * Builds the instruction line for a fill-blank/particle-choice question, embedding the
 * German meaning of the target sentence as a clue. Without this, a blank like "水を____。"
 * has multiple equally natural completions (ください vs 飲みます) with nothing in the prompt
 * to pick one over the other — the clue makes the intended answer the only one that matches.
 */
function buildBlankInstruction(germanClue: string): string {
  return `Ergänze den Satz für „${germanClue}“.`;
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
      instruction: buildBlankInstruction(vocab.exampleGerman),
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
    instruction: buildBlankInstruction(vocab.exampleGerman),
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
    instruction: buildBlankInstruction(vocab.exampleGerman),
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

interface SentenceMeaningOverrides {
  idSuffix?: string;
  instruction?: string;
  japanese?: string;
  german?: string;
  kana?: string;
}

/** Reverse of a phrase-choice question: shows a Japanese sentence and asks for its German meaning. */
function buildSentenceMeaningChoiceQuestion(
  vocab: VocabItem,
  pool: VocabItem[],
  overrides?: SentenceMeaningOverrides
): QuizQuestion {
  const japanese = overrides?.japanese ?? vocab.exampleJapanese;
  const german = overrides?.german ?? vocab.exampleGerman;
  const kana = overrides?.kana ?? vocab.exampleKana;

  const otherMeanings = pool.map((item) => item.exampleGerman);
  const distractors = pickDistractors(otherMeanings, german, 3);

  return {
    id: `practice-${vocab.id}-sentence-meaning${overrides?.idSuffix ?? ""}`,
    type: "sentence-meaning-choice",
    categoryId: vocab.categoryId,
    prompt: japanese,
    instruction: overrides?.instruction ?? "Was bedeutet dieser Satz?",
    choices: orderDeterministically(
      [german, ...distractors],
      `${vocab.id}:sentence-meaning${overrides?.idSuffix ?? ""}`
    ),
    answer: german,
    vocabId: vocab.id,
    exampleJapanese: japanese,
    exampleKana: kana,
    exampleGerman: german,
    shortTip: vocab.shortTip,
    detailTip: vocab.detailTip,
  };
}

interface SentenceSource {
  japanese: string;
  german: string;
  kana: string;
  romaji?: string;
}

/**
 * Finds a related word whose own example sentence directly mentions `vocab` (i.e. contains
 * its kanji), so a "related" sentence question still stays entirely about the selected word
 * instead of drifting into the related word's own topic.
 */
function findRelatedSentenceSource(vocab: VocabItem): SentenceSource | null {
  for (const id of vocab.relatedVocabIds ?? []) {
    const related = getVocabById(id);
    if (!related) continue;
    // Some related pairs share the exact same stored example sentence (e.g. hotel/go both
    // use "ホテルに行きます。"). Using it here would produce a Q7/Q8 that's byte-identical
    // to Q5/Q6 with a non-reworded instruction, reading as a glitch rather than
    // reinforcement — skip it and let the caller fall back to the reworded-instruction path.
    if (related.exampleJapanese === vocab.exampleJapanese) continue;
    if (related.exampleJapanese.includes(vocab.kanji)) {
      return {
        japanese: related.exampleJapanese,
        german: related.exampleGerman,
        kana: related.exampleKana,
        romaji: EXAMPLE_ROMAJI[related.id],
      };
    }
  }
  return null;
}

/**
 * Builds a reinforcing phrase-choice / sentence-meaning-choice pair from a second sentence
 * about `vocab` (a related word's sentence that mentions it, or `vocab`'s own sentence again
 * as a safe fallback). Keeps every question scoped to the selected word.
 */
function buildReinforcedSentenceQuestions(vocab: VocabItem, pool: VocabItem[]): QuizQuestion[] {
  const source = findRelatedSentenceSource(vocab);
  const japanese = source?.japanese ?? vocab.exampleJapanese;
  const german = source?.german ?? vocab.exampleGerman;
  const kana = source?.kana ?? vocab.exampleKana;
  const romaji = source?.romaji ?? EXAMPLE_ROMAJI[vocab.id];

  // Without a qualifying related sentence, the phrase/meaning pair falls back to reusing
  // vocab's own example (already asked in Q5/Q6) — reworded so it reads as reinforcement
  // rather than an apparent duplicate question.
  const phraseInstruction = source
    ? "Wähle den natürlichen japanischen Satz."
    : "Wähle noch einmal den passenden Satz.";
  const meaningInstruction = source
    ? "Was bedeutet dieser Satz?"
    : "Bestätige noch einmal: Was bedeutet dieser Satz?";

  const otherExamples = pool.map((item) => item.exampleJapanese);
  const distractors = pickDistractors(otherExamples, japanese, 3);

  const phraseQuestion: QuizQuestion = {
    id: `practice-${vocab.id}-phrase-2`,
    type: "phrase-choice",
    categoryId: vocab.categoryId,
    prompt: german,
    instruction: phraseInstruction,
    choices: orderDeterministically([japanese, ...distractors], `${vocab.id}:phrase-2`),
    answer: japanese,
    vocabId: vocab.id,
    answerKana: kana,
    answerRomaji: romaji,
    answerGerman: german,
    exampleJapanese: japanese,
    exampleKana: kana,
    exampleGerman: german,
    shortTip: vocab.shortTip,
    detailTip: vocab.detailTip,
  };

  const meaningQuestion = buildSentenceMeaningChoiceQuestion(vocab, pool, {
    idSuffix: "-2",
    japanese,
    german,
    kana,
    instruction: meaningInstruction,
  });

  return [phraseQuestion, meaningQuestion];
}

/**
 * Builds a "common mistake" question: the correct sentence vs. plausible near-miss sentences
 * made by swapping in a different predicate (e.g. „ください“ vs „飲みます“) for the same
 * lead-in — the exact kind of mix-up beginners make with the selected word.
 */
function buildCommonMistakeQuestion(vocab: VocabItem): QuizQuestion {
  const sentence = vocab.exampleJapanese;
  const found = findParticle(sentence);
  const hasTrailingPeriod = sentence.endsWith("。");
  const bodyEnd = hasTrailingPeriod ? sentence.length - 1 : sentence.length;
  const predicateStart = found ? found.index + found.particle.length : 0;
  const predicate = sentence.slice(predicateStart, bodyEnd) || sentence;
  const prefix = sentence.slice(0, predicateStart);
  const suffix = hasTrailingPeriod ? "。" : "";

  const alternatePredicates = pickDistractors(PREDICATE_POOL, predicate, 3);
  const distractorSentences = alternatePredicates.map((alt) => `${prefix}${alt}${suffix}`);

  return {
    id: `practice-${vocab.id}-mistake`,
    type: "mistake-choice",
    categoryId: vocab.categoryId,
    prompt: vocab.exampleGerman,
    instruction: "Achtung: Wähle den richtigen Satz (keine Verwechslung).",
    choices: orderDeterministically([sentence, ...distractorSentences], `${vocab.id}:mistake`),
    answer: sentence,
    vocabId: vocab.id,
  };
}

/** Mini-challenge reading check: given the kana, pick the matching kanji/katakana form. */
function buildKanaRecognitionQuestion(vocab: VocabItem, pool: VocabItem[]): QuizQuestion {
  const distractors = pickDistractors(pool.map((item) => item.kanji), vocab.kanji, 3);
  return {
    id: `practice-${vocab.id}-kana`,
    type: "kana-choice",
    categoryId: vocab.categoryId,
    prompt: vocab.kana,
    instruction: "Mini Challenge: Wie schreibt man das?",
    choices: orderDeterministically([vocab.kanji, ...distractors], `${vocab.id}:kana`),
    answer: vocab.kanji,
    vocabId: vocab.id,
  };
}

interface CustomSentencePair {
  japanese: string;
  german: string;
  kana?: string;
  romaji?: string;
}

/**
 * Builds a hand-written phrase-choice question (German prompt → Japanese sentence answer)
 * for hand-curated Sub Quest templates, where the sentence pair and distractors are
 * specified explicitly rather than derived from the distractor pool.
 */
function buildCustomPhraseQuestion(
  vocab: VocabItem,
  idSuffix: string,
  pair: CustomSentencePair,
  distractors: string[],
  instruction = "Wähle den natürlichen japanischen Satz."
): QuizQuestion {
  return {
    id: `practice-${vocab.id}-${idSuffix}`,
    type: "phrase-choice",
    categoryId: vocab.categoryId,
    prompt: pair.german,
    instruction,
    choices: orderDeterministically([pair.japanese, ...distractors], `${vocab.id}:${idSuffix}`),
    answer: pair.japanese,
    vocabId: vocab.id,
    answerKana: pair.kana,
    answerRomaji: pair.romaji,
    answerGerman: pair.german,
    exampleJapanese: pair.japanese,
    exampleKana: pair.kana,
    exampleGerman: pair.german,
    shortTip: vocab.shortTip,
    detailTip: vocab.detailTip,
  };
}

/**
 * Builds a hand-written sentence-meaning-choice question (Japanese sentence prompt → German
 * meaning answer) for hand-curated Sub Quest templates, the reverse direction of
 * `buildCustomPhraseQuestion`.
 */
function buildCustomMeaningQuestion(
  vocab: VocabItem,
  idSuffix: string,
  pair: CustomSentencePair,
  distractors: string[],
  instruction = "Was bedeutet dieser Satz?"
): QuizQuestion {
  return {
    id: `practice-${vocab.id}-${idSuffix}`,
    type: "sentence-meaning-choice",
    categoryId: vocab.categoryId,
    prompt: pair.japanese,
    instruction,
    choices: orderDeterministically([pair.german, ...distractors], `${vocab.id}:${idSuffix}`),
    answer: pair.german,
    vocabId: vocab.id,
    exampleJapanese: pair.japanese,
    exampleKana: pair.kana,
    exampleGerman: pair.german,
    shortTip: vocab.shortTip,
    detailTip: vocab.detailTip,
  };
}

/**
 * Builds a hand-written "common mistake" question from explicit choices, for hand-curated
 * templates that want to contrast the selected word's usage against a specific near-miss
 * (e.g. 会う vs 話す for the same "friend" topic) rather than the generic predicate-swap.
 */
function buildCustomMistakeQuestion(
  vocab: VocabItem,
  idSuffix: string,
  prompt: string,
  answer: string,
  choices: string[]
): QuizQuestion {
  return {
    id: `practice-${vocab.id}-${idSuffix}`,
    type: "mistake-choice",
    categoryId: vocab.categoryId,
    prompt,
    instruction: "Achtung: Wähle den richtigen Satz (keine Verwechslung).",
    choices: orderDeterministically(choices, `${vocab.id}:${idSuffix}`),
    answer,
    vocabId: vocab.id,
  };
}

/**
 * Generic 10-question Sub Quest for any vocab item: every question's prompt or answer is
 * either the word itself or a sentence that mentions it, so the selected word stays the
 * subject throughout — distractors may borrow related words, but never the correct answer.
 */
function buildGenericPracticeQuestions(vocab: VocabItem, pool: VocabItem[]): QuizQuestion[] {
  const [reinforcedPhrase, reinforcedMeaning] = buildReinforcedSentenceQuestions(vocab, pool);

  return [
    buildMeaningChoiceQuestion(vocab, pool),
    buildJapaneseChoiceQuestion(vocab, pool),
    buildParticleChoiceQuestion(vocab),
    buildFillBlankQuestion(vocab),
    buildPhraseChoiceQuestion(vocab, pool),
    buildSentenceMeaningChoiceQuestion(vocab, pool),
    reinforcedPhrase,
    reinforcedMeaning,
    buildCommonMistakeQuestion(vocab),
    buildKanaRecognitionQuestion(vocab, pool),
  ];
}

/**
 * Same shape as the generic template, but with a hand-picked, genuinely distinct sentence
 * (`variant`) swapped in for the Q7/Q8 reinforcement pair instead of `findRelatedSentenceSource`'s
 * fallback of repeating vocab's own sentence a second time. Used for a handful of words where a
 * natural second sentence exists but no related word's stored example literally contains the
 * target kanji, so the generic mechanism can't find it on its own.
 */
function buildVariantPracticeQuestions(
  vocab: VocabItem,
  pool: VocabItem[],
  variant: CustomSentencePair
): QuizQuestion[] {
  const phraseDistractors = pickDistractors(
    pool.map((item) => item.exampleJapanese),
    variant.japanese,
    3
  );
  const meaningDistractors = pickDistractors(
    pool.map((item) => item.exampleGerman),
    variant.german,
    3
  );

  return [
    buildMeaningChoiceQuestion(vocab, pool),
    buildJapaneseChoiceQuestion(vocab, pool),
    buildParticleChoiceQuestion(vocab),
    buildFillBlankQuestion(vocab),
    buildPhraseChoiceQuestion(vocab, pool),
    buildSentenceMeaningChoiceQuestion(vocab, pool),
    buildCustomPhraseQuestion(vocab, "phrase-2", variant, phraseDistractors),
    buildCustomMeaningQuestion(vocab, "sentence-meaning-2", variant, meaningDistractors),
    buildCommonMistakeQuestion(vocab),
    buildKanaRecognitionQuestion(vocab, pool),
  ];
}

function buildCoffeePracticeQuestions(vocab: VocabItem, pool: VocabItem[]): QuizQuestion[] {
  return buildVariantPracticeQuestions(vocab, pool, {
    japanese: "コーヒーを飲みます。",
    german: "Ich trinke Kaffee.",
    kana: "コーヒーをのみます。",
    romaji: "koohii o nomimasu",
  });
}

function buildDrinkPracticeQuestions(vocab: VocabItem, pool: VocabItem[]): QuizQuestion[] {
  return buildVariantPracticeQuestions(vocab, pool, {
    japanese: "コーヒーを飲みます。",
    german: "Ich trinke Kaffee.",
    kana: "コーヒーをのみます。",
    romaji: "koohii o nomimasu",
  });
}

function buildGoPracticeQuestions(vocab: VocabItem, pool: VocabItem[]): QuizQuestion[] {
  return buildVariantPracticeQuestions(vocab, pool, {
    japanese: "駅に行きます。",
    german: "Ich gehe zum Bahnhof.",
    kana: "えきにいきます。",
    romaji: "eki ni ikimasu",
  });
}

function buildExcuseMePracticeQuestions(vocab: VocabItem, pool: VocabItem[]): QuizQuestion[] {
  return buildVariantPracticeQuestions(vocab, pool, {
    japanese: "すみません、トイレはどこですか。",
    german: "Entschuldigung, wo ist die Toilette?",
    kana: "すみません、トイレはどこですか。",
    romaji: "sumimasen, toire wa doko desu ka",
  });
}

function buildNearPracticeQuestions(vocab: VocabItem, pool: VocabItem[]): QuizQuestion[] {
  return buildVariantPracticeQuestions(vocab, pool, {
    japanese: "ホテルは近いです。",
    german: "Das Hotel ist nah.",
    kana: "ホテルはちかいです。",
    romaji: "hoteru wa chikai desu",
  });
}

function buildFarPracticeQuestions(vocab: VocabItem, pool: VocabItem[]): QuizQuestion[] {
  return buildVariantPracticeQuestions(vocab, pool, {
    japanese: "駅は遠いです。",
    german: "Der Bahnhof ist weit.",
    kana: "えきはとおいです。",
    romaji: "eki wa tooi desu",
  });
}

/** Hand-curated 10-question Sub Quest for "water", following the natural sentences in the design brief. */
function buildWaterPracticeQuestions(vocab: VocabItem, pool: VocabItem[]): QuizQuestion[] {
  const drink = getVocabById("drink");
  const coffee = getVocabById("coffee");

  const drinkJapanese = drink?.exampleJapanese ?? "水を飲みます。";
  const drinkGerman = drink?.exampleGerman ?? "Ich trinke Wasser.";
  const drinkKana = drink?.exampleKana ?? "みずをのみます。";
  const drinkRomaji = EXAMPLE_ROMAJI.drink ?? "mizu o nomimasu";

  const comboJapanese = coffee ? `水と${coffee.kanji}をください。` : "水とコーヒーをください。";
  const comboGerman = coffee ? `Wasser und ${coffee.german} bitte.` : "Wasser und Kaffee bitte.";
  const comboRomaji = `mizu to ${coffee?.romaji ?? "koohii"} o kudasai`;

  return [
    buildMeaningChoiceQuestion(vocab, pool),
    buildJapaneseChoiceQuestion(vocab, pool),
    buildParticleChoiceQuestion(vocab),
    buildFillBlankQuestion(vocab),
    {
      // Same "水を____。" frame as buildFillBlankQuestion's Q4 above, but with a different
      // German clue pointing at a different verb (飲みます instead of ください) — two
      // separate, each-unambiguous questions instead of one question where both answers
      // would look equally correct with no clue to tell them apart.
      id: "practice-water-drink-blank",
      type: "fill-blank",
      categoryId: vocab.categoryId,
      prompt: "水を____。",
      instruction: buildBlankInstruction(drinkGerman),
      choices: orderDeterministically(
        ["飲みます", "ください", "食べます", "行きます"],
        "water:drink-blank"
      ),
      answer: "飲みます",
      vocabId: vocab.id,
      exampleJapanese: drinkJapanese,
      exampleKana: drinkKana,
      exampleGerman: drinkGerman,
      shortTip: vocab.shortTip,
      detailTip: vocab.detailTip,
    },
    buildSentenceMeaningChoiceQuestion(vocab, pool, {
      idSuffix: "-drink",
      japanese: drinkJapanese,
      german: drinkGerman,
      kana: drinkKana,
    }),
    buildPhraseChoiceQuestion(vocab, pool),
    {
      id: "practice-water-combo",
      type: "phrase-choice",
      categoryId: vocab.categoryId,
      prompt: comboGerman,
      instruction: "Wähle den natürlichen japanischen Satz.",
      choices: orderDeterministically(
        [comboJapanese, vocab.exampleJapanese, drinkJapanese, "水とパンを飲みます。"],
        "water:combo"
      ),
      answer: comboJapanese,
      vocabId: vocab.id,
      answerRomaji: comboRomaji,
      answerGerman: comboGerman,
      exampleJapanese: comboJapanese,
      exampleGerman: comboGerman,
      shortTip: vocab.shortTip,
      detailTip: vocab.detailTip,
    },
    {
      id: "practice-water-where",
      type: "meaning-choice",
      categoryId: vocab.categoryId,
      prompt: "水はどこですか。",
      instruction: "Wähle die richtige Übersetzung.",
      choices: orderDeterministically(
        ["Wo ist das Wasser?", "Wo ist der Bahnhof?", "Wo ist die Toilette?", "Wo ist das Hotel?"],
        "water:where"
      ),
      answer: "Wo ist das Wasser?",
      vocabId: vocab.id,
      exampleJapanese: "水はどこですか。",
      exampleGerman: "Wo ist das Wasser?",
      shortTip: vocab.shortTip,
      detailTip: vocab.detailTip,
    },
    {
      id: "practice-water-mini-challenge",
      type: "mistake-choice",
      categoryId: vocab.categoryId,
      prompt: vocab.exampleJapanese,
      instruction: "Mini Challenge: Wähle Kana, Romaji und Bedeutung.",
      choices: orderDeterministically(
        [
          `${vocab.exampleKana} · mizu o kudasai · ${vocab.exampleGerman}`,
          "コーヒーをください。 · koohii o kudasai · Einen Kaffee bitte.",
          "パンをください。 · pan o kudasai · Brot bitte.",
          `${drinkKana} · ${drinkRomaji} · ${drinkGerman}`,
        ],
        "water:mini-challenge"
      ),
      answer: `${vocab.exampleKana} · mizu o kudasai · ${vocab.exampleGerman}`,
      vocabId: vocab.id,
      exampleJapanese: vocab.exampleJapanese,
      exampleKana: vocab.exampleKana,
      exampleGerman: vocab.exampleGerman,
      shortTip: vocab.shortTip,
      detailTip: vocab.detailTip,
    },
  ];
}

/** Hand-curated 10-question Sub Quest for "station", following the natural sentences in the design brief. */
function buildStationPracticeQuestions(vocab: VocabItem, pool: VocabItem[]): QuizQuestion[] {
  const excuseMe = getVocabById("excuseMe");
  const near = getVocabById("near");

  const excuseMeJapanese = excuseMe?.exampleJapanese ?? "すみません、駅はどこですか。";
  const excuseMeGerman = excuseMe?.exampleGerman ?? "Entschuldigung, wo ist der Bahnhof?";
  const excuseMeKana = excuseMe?.exampleKana ?? "すみません、えきはどこですか。";
  const excuseMeRomaji = EXAMPLE_ROMAJI.excuseMe;

  const nearJapanese = near?.exampleJapanese ?? "駅は近いです。";
  const nearGerman = near?.exampleGerman ?? "Der Bahnhof ist nah.";
  const nearKana = near?.exampleKana ?? "えきはちかいです。";
  const nearRomaji = EXAMPLE_ROMAJI.near;

  const farJapanese = "駅は遠いです。";
  const farGerman = "Der Bahnhof ist weit.";
  const farKana = "えきはとおいです。";
  const farRomaji = "eki wa tooi desu";

  const rightJapanese = "駅は右です。";

  const goJapanese = "駅に行きます。";
  const goGerman = "Ich gehe zum Bahnhof.";
  const goKana = "えきにいきます。";

  const trainComboJapanese = "電車で駅に行きます。";
  const trainComboGerman = "Ich fahre mit dem Zug zum Bahnhof.";

  return [
    buildMeaningChoiceQuestion(vocab, pool),
    buildJapaneseChoiceQuestion(vocab, pool),
    buildParticleChoiceQuestion(vocab),
    {
      id: "practice-station-where-word",
      type: "fill-blank",
      categoryId: vocab.categoryId,
      prompt: "すみません、駅は____ですか。",
      instruction: buildBlankInstruction(excuseMeGerman),
      choices: orderDeterministically(["どこ", "だれ", "いつ", "なに"], "station:where-word"),
      answer: "どこ",
      vocabId: vocab.id,
      exampleJapanese: excuseMeJapanese,
      exampleKana: excuseMeKana,
      exampleGerman: excuseMeGerman,
      shortTip: vocab.shortTip,
      detailTip: vocab.detailTip,
    },
    buildPhraseChoiceQuestion(vocab, pool),
    {
      id: "practice-station-go",
      type: "sentence-meaning-choice",
      categoryId: vocab.categoryId,
      prompt: goJapanese,
      instruction: "Was bedeutet dieser Satz?",
      choices: orderDeterministically(
        [goGerman, "Ich gehe zum Hotel.", "Ich fahre mit dem Zug.", "Der Bahnhof ist nah."],
        "station:go"
      ),
      answer: goGerman,
      vocabId: vocab.id,
      exampleJapanese: goJapanese,
      exampleKana: goKana,
      exampleGerman: goGerman,
      shortTip: vocab.shortTip,
      detailTip: vocab.detailTip,
    },
    {
      id: "practice-station-near",
      type: "phrase-choice",
      categoryId: vocab.categoryId,
      prompt: nearGerman,
      instruction: "Wähle den natürlichen japanischen Satz.",
      choices: orderDeterministically(
        [nearJapanese, farJapanese, vocab.exampleJapanese, rightJapanese],
        "station:near"
      ),
      answer: nearJapanese,
      vocabId: vocab.id,
      answerKana: nearKana,
      answerRomaji: nearRomaji,
      answerGerman: nearGerman,
      exampleJapanese: nearJapanese,
      exampleKana: nearKana,
      exampleGerman: nearGerman,
      shortTip: vocab.shortTip,
      detailTip: vocab.detailTip,
    },
    {
      id: "practice-station-far",
      type: "phrase-choice",
      categoryId: vocab.categoryId,
      prompt: farGerman,
      instruction: "Wähle den natürlichen japanischen Satz.",
      choices: orderDeterministically(
        [farJapanese, nearJapanese, vocab.exampleJapanese, goJapanese],
        "station:far"
      ),
      answer: farJapanese,
      vocabId: vocab.id,
      answerKana: farKana,
      answerRomaji: farRomaji,
      answerGerman: farGerman,
      exampleJapanese: farJapanese,
      exampleKana: farKana,
      exampleGerman: farGerman,
      shortTip: vocab.shortTip,
      detailTip: vocab.detailTip,
    },
    {
      id: "practice-station-combo",
      type: "phrase-choice",
      categoryId: vocab.categoryId,
      prompt: trainComboGerman,
      instruction: "Wähle den natürlichen japanischen Satz.",
      choices: orderDeterministically(
        [trainComboJapanese, rightJapanese, farJapanese, nearJapanese],
        "station:combo"
      ),
      answer: trainComboJapanese,
      vocabId: vocab.id,
      answerRomaji: "densha de eki ni ikimasu",
      exampleJapanese: trainComboJapanese,
      exampleGerman: trainComboGerman,
      shortTip: vocab.shortTip,
      detailTip: vocab.detailTip,
    },
    {
      id: "practice-station-confirm",
      type: "phrase-choice",
      categoryId: vocab.categoryId,
      prompt: excuseMeGerman,
      instruction: "Mini Challenge: Wähle den vollständigen, höflichen Satz.",
      choices: orderDeterministically(
        [excuseMeJapanese, vocab.exampleJapanese, nearJapanese, farJapanese],
        "station:confirm"
      ),
      answer: excuseMeJapanese,
      vocabId: vocab.id,
      answerKana: excuseMeKana,
      answerRomaji: excuseMeRomaji,
      answerGerman: excuseMeGerman,
      exampleJapanese: excuseMeJapanese,
      exampleKana: excuseMeKana,
      exampleGerman: excuseMeGerman,
      shortTip: vocab.shortTip,
      detailTip: vocab.detailTip,
    },
  ];
}

interface DirectionWordConfig {
  opposite: string;
  oppositeGerman: string;
  oppositeRomaji: string;
  kana: string;
  romaji: string;
}

/**
 * Shared builder for "right"/"left" — both are bare direction words whose only stored
 * example is "[word]です。" with no real particle, which the generic template's
 * findParticle()/findFillBlank() logic can't safely turn into a fill-blank question. A
 * hand-curated template sidesteps that entirely and gives each word natural sentences.
 */
function buildDirectionWordPracticeQuestions(
  vocab: VocabItem,
  pool: VocabItem[],
  config: DirectionWordConfig
): QuizQuestion[] {
  const { opposite, oppositeGerman, oppositeRomaji, kana, romaji } = config;
  const directionChoices = [vocab.kanji, opposite, "近い", "遠い"];

  const stationSentence: CustomSentencePair = {
    japanese: `駅は${vocab.kanji}です。`,
    german: `Der Bahnhof ist ${vocab.german}.`,
    kana: `えきは${kana}です。`,
    romaji: `eki wa ${romaji} desu`,
  };
  const goSentence: CustomSentencePair = {
    japanese: `${vocab.kanji}に行きます。`,
    german: `Ich gehe nach ${vocab.german}.`,
    kana: `${kana}にいきます。`,
    romaji: `${romaji} ni ikimasu`,
  };
  const contrastSentence: CustomSentencePair = {
    japanese: `${opposite}ではありません。${vocab.kanji}です。`,
    german: `${vocab.german.charAt(0).toUpperCase()}${vocab.german.slice(1)}, nicht ${oppositeGerman}.`,
    kana: undefined,
    romaji: `${oppositeRomaji} dewa arimasen. ${romaji} desu.`,
  };
  const confirmSentence: CustomSentencePair = {
    japanese: `すみません、駅は${vocab.kanji}ですか。`,
    german: `Entschuldigung, ist der Bahnhof ${vocab.german}?`,
    kana: `すみません、えきは${kana}ですか。`,
    romaji: `sumimasen, eki wa ${romaji} desu ka`,
  };

  return [
    buildMeaningChoiceQuestion(vocab, pool),
    buildJapaneseChoiceQuestion(vocab, pool),
    {
      id: `practice-${vocab.id}-station-blank`,
      type: "fill-blank",
      categoryId: vocab.categoryId,
      prompt: "駅は____です。",
      instruction: buildBlankInstruction(stationSentence.german),
      choices: orderDeterministically(directionChoices, `${vocab.id}:station-blank`),
      answer: vocab.kanji,
      vocabId: vocab.id,
      exampleJapanese: stationSentence.japanese,
      exampleKana: stationSentence.kana,
      exampleGerman: stationSentence.german,
      shortTip: vocab.shortTip,
      detailTip: vocab.detailTip,
    },
    {
      id: `practice-${vocab.id}-go-blank`,
      type: "fill-blank",
      categoryId: vocab.categoryId,
      prompt: "____に行きます。",
      instruction: buildBlankInstruction(goSentence.german),
      choices: orderDeterministically(directionChoices, `${vocab.id}:go-blank`),
      answer: vocab.kanji,
      vocabId: vocab.id,
      exampleJapanese: goSentence.japanese,
      exampleKana: goSentence.kana,
      exampleGerman: goSentence.german,
      shortTip: vocab.shortTip,
      detailTip: vocab.detailTip,
    },
    buildCustomPhraseQuestion(vocab, "phrase-station", stationSentence, [
      `駅は${opposite}です。`,
      "駅は近いです。",
      "駅は遠いです。",
    ]),
    buildCustomPhraseQuestion(vocab, "phrase-go", goSentence, [
      `${opposite}に行きます。`,
      "駅に行きます。",
      "ホテルに行きます。",
    ]),
    buildCustomPhraseQuestion(vocab, "contrast", contrastSentence, [
      `${vocab.kanji}ではありません。${opposite}です。`,
      `${opposite}です。`,
      `${vocab.kanji}です。`,
    ]),
    {
      id: `practice-${vocab.id}-pair`,
      type: "meaning-choice",
      categoryId: vocab.categoryId,
      prompt: `${vocab.kanji}と${opposite}`,
      instruction: "Wähle die richtige Bedeutung.",
      choices: orderDeterministically(
        [`${vocab.german} und ${oppositeGerman}`, "nah und weit", "Bahnhof und Hotel", "Zug und Toilette"],
        `${vocab.id}:pair`
      ),
      answer: `${vocab.german} und ${oppositeGerman}`,
      vocabId: vocab.id,
      exampleJapanese: `${vocab.kanji}と${opposite}`,
      exampleGerman: `${vocab.german} und ${oppositeGerman}`,
      shortTip: vocab.shortTip,
      detailTip: vocab.detailTip,
    },
    buildCustomMeaningQuestion(vocab, "sentence-meaning-station", stationSentence, [
      `Der Bahnhof ist ${oppositeGerman}.`,
      "Der Bahnhof ist nah.",
      "Der Bahnhof ist weit.",
    ]),
    buildCustomPhraseQuestion(
      vocab,
      "confirm",
      confirmSentence,
      [`すみません、駅は${opposite}ですか。`, stationSentence.japanese, "すみません、駅はどこですか。"],
      "Mini Challenge: Wähle den vollständigen, höflichen Satz."
    ),
  ];
}

function buildRightPracticeQuestions(vocab: VocabItem, pool: VocabItem[]): QuizQuestion[] {
  return buildDirectionWordPracticeQuestions(vocab, pool, {
    opposite: "左",
    oppositeGerman: "links",
    oppositeRomaji: "hidari",
    kana: "みぎ",
    romaji: "migi",
  });
}

function buildLeftPracticeQuestions(vocab: VocabItem, pool: VocabItem[]): QuizQuestion[] {
  return buildDirectionWordPracticeQuestions(vocab, pool, {
    opposite: "右",
    oppositeGerman: "rechts",
    oppositeRomaji: "migi",
    kana: "ひだり",
    romaji: "hidari",
  });
}

/** Hand-curated 10-question Sub Quest for "hotel", avoiding the hotel/go example-sentence collision. */
function buildHotelPracticeQuestions(vocab: VocabItem, pool: VocabItem[]): QuizQuestion[] {
  const nearSentence: CustomSentencePair = {
    japanese: "ホテルは近いです。",
    german: "Das Hotel ist nah.",
    kana: "ホテルはちかいです。",
    romaji: "hoteru wa chikai desu",
  };
  const far = getVocabById("far");
  const farSentence: CustomSentencePair = {
    japanese: far?.exampleJapanese ?? "ホテルは遠いです。",
    german: far?.exampleGerman ?? "Das Hotel ist weit entfernt.",
    kana: far?.exampleKana ?? "ホテルはとおいです。",
    romaji: EXAMPLE_ROMAJI.far ?? "hoteru wa tooi desu",
  };
  const comboSentence: CustomSentencePair = {
    japanese: "電車でホテルに行きます。",
    german: "Ich fahre mit dem Zug zum Hotel.",
    kana: "でんしゃでホテルにいきます。",
    romaji: "densha de hoteru ni ikimasu",
  };
  const whereSentence: CustomSentencePair = {
    japanese: "ホテルはどこですか。",
    german: "Wo ist das Hotel?",
    kana: "ホテルはどこですか。",
    romaji: "hoteru wa doko desu ka",
  };
  const confirmSentence: CustomSentencePair = {
    japanese: "すみません、ホテルはどこですか。",
    german: "Entschuldigung, wo ist das Hotel?",
    kana: "すみません、ホテルはどこですか。",
    romaji: "sumimasen, hoteru wa doko desu ka",
  };

  return [
    buildMeaningChoiceQuestion(vocab, pool),
    buildJapaneseChoiceQuestion(vocab, pool),
    buildParticleChoiceQuestion(vocab),
    buildFillBlankQuestion(vocab),
    buildPhraseChoiceQuestion(vocab, pool),
    buildCustomPhraseQuestion(vocab, "phrase-near", nearSentence, [
      farSentence.japanese,
      "駅は近いです。",
      vocab.exampleJapanese,
    ]),
    buildCustomPhraseQuestion(vocab, "phrase-far", farSentence, [
      nearSentence.japanese,
      vocab.exampleJapanese,
      "駅は遠いです。",
    ]),
    buildCustomPhraseQuestion(vocab, "combo", comboSentence, [
      vocab.exampleJapanese,
      "電車で駅に行きます。",
      nearSentence.japanese,
    ]),
    {
      id: "practice-hotel-where",
      type: "meaning-choice",
      categoryId: vocab.categoryId,
      prompt: whereSentence.japanese,
      instruction: "Wähle die richtige Übersetzung.",
      choices: orderDeterministically(
        [whereSentence.german, "Wo ist der Bahnhof?", "Wo ist die Toilette?", "Wo ist das Wasser?"],
        "hotel:where"
      ),
      answer: whereSentence.german,
      vocabId: vocab.id,
      exampleJapanese: whereSentence.japanese,
      exampleKana: whereSentence.kana,
      exampleGerman: whereSentence.german,
      shortTip: vocab.shortTip,
      detailTip: vocab.detailTip,
    },
    buildCustomPhraseQuestion(
      vocab,
      "confirm",
      confirmSentence,
      [whereSentence.japanese, "すみません、駅はどこですか。", vocab.exampleJapanese],
      "Mini Challenge: Wähle den vollständigen, höflichen Satz."
    ),
  ];
}

/** Hand-curated 10-question Sub Quest for "where", avoiding the where/station example-sentence collision. */
function buildWherePracticeQuestions(vocab: VocabItem, pool: VocabItem[]): QuizQuestion[] {
  const hotelWhereSentence: CustomSentencePair = {
    japanese: "ホテルはどこですか。",
    german: "Wo ist das Hotel?",
    kana: "ホテルはどこですか。",
    romaji: "hoteru wa doko desu ka",
  };
  const toiletWhereSentence: CustomSentencePair = {
    japanese: "すみません、トイレはどこですか。",
    german: "Entschuldigung, wo ist die Toilette?",
    kana: "すみません、トイレはどこですか。",
    romaji: "sumimasen, toire wa doko desu ka",
  };
  const excuseMe = getVocabById("excuseMe");
  const confirmSentence: CustomSentencePair = {
    japanese: excuseMe?.exampleJapanese ?? "すみません、駅はどこですか。",
    german: excuseMe?.exampleGerman ?? "Entschuldigung, wo ist der Bahnhof?",
    kana: excuseMe?.exampleKana ?? "すみません、えきはどこですか。",
    romaji: EXAMPLE_ROMAJI.excuseMe ?? "sumimasen, eki wa doko desu ka",
  };

  return [
    buildMeaningChoiceQuestion(vocab, pool),
    buildJapaneseChoiceQuestion(vocab, pool),
    {
      id: "practice-where-station-blank",
      type: "fill-blank",
      categoryId: vocab.categoryId,
      prompt: "駅は____ですか。",
      instruction: buildBlankInstruction(vocab.exampleGerman),
      choices: orderDeterministically(["どこ", "だれ", "いつ", "なに"], "where:station-blank"),
      answer: "どこ",
      vocabId: vocab.id,
      exampleJapanese: vocab.exampleJapanese,
      exampleKana: vocab.exampleKana,
      exampleGerman: vocab.exampleGerman,
      shortTip: vocab.shortTip,
      detailTip: vocab.detailTip,
    },
    {
      id: "practice-where-hotel-blank",
      type: "fill-blank",
      categoryId: vocab.categoryId,
      prompt: "ホテルは____ですか。",
      instruction: buildBlankInstruction(hotelWhereSentence.german),
      choices: orderDeterministically(["どこ", "だれ", "いつ", "なに"], "where:hotel-blank"),
      answer: "どこ",
      vocabId: vocab.id,
      exampleJapanese: hotelWhereSentence.japanese,
      exampleKana: hotelWhereSentence.kana,
      exampleGerman: hotelWhereSentence.german,
      shortTip: vocab.shortTip,
      detailTip: vocab.detailTip,
    },
    buildPhraseChoiceQuestion(vocab, pool),
    buildCustomPhraseQuestion(vocab, "phrase-hotel", hotelWhereSentence, [
      vocab.exampleJapanese,
      "駅は近いです。",
      "ホテルに行きます。",
    ]),
    buildCustomPhraseQuestion(vocab, "phrase-toilet", toiletWhereSentence, [
      vocab.exampleJapanese,
      hotelWhereSentence.japanese,
      confirmSentence.japanese,
    ]),
    {
      id: "practice-where-short",
      type: "meaning-choice",
      categoryId: vocab.categoryId,
      prompt: "どこですか。",
      instruction: "Wähle die richtige Übersetzung.",
      choices: orderDeterministically(
        ["Wo ist es?", "Es ist rechts.", "Ich gehe.", "Es ist nah."],
        "where:short"
      ),
      answer: "Wo ist es?",
      vocabId: vocab.id,
      exampleJapanese: "どこですか。",
      exampleGerman: "Wo ist es?",
      shortTip: vocab.shortTip,
      detailTip: vocab.detailTip,
    },
    buildSentenceMeaningChoiceQuestion(vocab, pool, { idSuffix: "-own" }),
    buildCustomPhraseQuestion(
      vocab,
      "confirm",
      confirmSentence,
      [vocab.exampleJapanese, hotelWhereSentence.japanese, toiletWhereSentence.japanese],
      "Mini Challenge: Wähle den vollständigen, höflichen Satz."
    ),
  ];
}

/** Hand-curated 10-question Sub Quest for "friend", avoiding the friend/meet example-sentence collision. */
function buildFriendPracticeQuestions(vocab: VocabItem, pool: VocabItem[]): QuizQuestion[] {
  const talk = getVocabById("talk");
  const talkSentence: CustomSentencePair = {
    japanese: talk?.exampleJapanese ?? "友だちと話します。",
    german: talk?.exampleGerman ?? "Ich spreche mit einem Freund.",
    kana: talk?.exampleKana ?? "ともだちとはなします。",
    romaji: EXAMPLE_ROMAJI.talk ?? "tomodachi to hanashimasu",
  };
  const tomorrow = getVocabById("tomorrow");
  const tomorrowSentence: CustomSentencePair = {
    japanese: tomorrow?.exampleJapanese ?? "明日、友だちに会います。",
    german: tomorrow?.exampleGerman ?? "Morgen treffe ich einen Freund.",
    kana: tomorrow?.exampleKana ?? "あした、ともだちにあいます。",
    romaji: EXAMPLE_ROMAJI.tomorrow ?? "ashita, tomodachi ni aimasu",
  };
  const like = getVocabById("like");
  const likeSentence: CustomSentencePair = {
    japanese: like?.exampleJapanese ?? "友だちが好きです。",
    german: like?.exampleGerman ?? "Ich mag meine Freunde.",
    kana: like?.exampleKana ?? "ともだちがすきです。",
    romaji: EXAMPLE_ROMAJI.like ?? "tomodachi ga suki desu",
  };

  return [
    buildMeaningChoiceQuestion(vocab, pool),
    buildJapaneseChoiceQuestion(vocab, pool),
    buildParticleChoiceQuestion(vocab),
    {
      id: "practice-friend-talk-blank",
      type: "fill-blank",
      categoryId: vocab.categoryId,
      prompt: "友だちと____。",
      instruction: buildBlankInstruction(talkSentence.german),
      choices: orderDeterministically(["話します", "食べます", "飲みます", "行きます"], "friend:talk-blank"),
      answer: "話します",
      vocabId: vocab.id,
      exampleJapanese: talkSentence.japanese,
      exampleKana: talkSentence.kana,
      exampleGerman: talkSentence.german,
      shortTip: vocab.shortTip,
      detailTip: vocab.detailTip,
    },
    buildPhraseChoiceQuestion(vocab, pool),
    buildCustomPhraseQuestion(vocab, "phrase-talk", talkSentence, [
      vocab.exampleJapanese,
      likeSentence.japanese,
      tomorrowSentence.japanese,
    ]),
    buildCustomPhraseQuestion(vocab, "phrase-tomorrow", tomorrowSentence, [
      vocab.exampleJapanese,
      talkSentence.japanese,
      likeSentence.japanese,
    ]),
    buildCustomPhraseQuestion(vocab, "phrase-like", likeSentence, [
      vocab.exampleJapanese,
      talkSentence.japanese,
      tomorrowSentence.japanese,
    ]),
    buildCustomMistakeQuestion(
      vocab,
      "usage-contrast",
      "Ich treffe einen Freund.",
      vocab.exampleJapanese,
      [vocab.exampleJapanese, talkSentence.japanese, likeSentence.japanese, tomorrowSentence.japanese]
    ),
    buildCustomMeaningQuestion(
      vocab,
      "confirm",
      tomorrowSentence,
      ["Ich treffe einen Freund.", "Ich mag meine Freunde.", "Ich spreche mit einem Freund."],
      "Mini Challenge: Was bedeutet dieser Satz?"
    ),
  ];
}

/** Hand-curated 10-question Sub Quest for "meet", avoiding the meet/friend example-sentence collision. */
function buildMeetPracticeQuestions(vocab: VocabItem, pool: VocabItem[]): QuizQuestion[] {
  const talk = getVocabById("talk");
  const talkSentence: CustomSentencePair = {
    japanese: talk?.exampleJapanese ?? "友だちと話します。",
    german: talk?.exampleGerman ?? "Ich spreche mit einem Freund.",
    kana: talk?.exampleKana ?? "ともだちとはなします。",
    romaji: EXAMPLE_ROMAJI.talk ?? "tomodachi to hanashimasu",
  };
  const tomorrow = getVocabById("tomorrow");
  const tomorrowSentence: CustomSentencePair = {
    japanese: tomorrow?.exampleJapanese ?? "明日、友だちに会います。",
    german: tomorrow?.exampleGerman ?? "Morgen treffe ich einen Freund.",
    kana: tomorrow?.exampleKana ?? "あした、ともだちにあいます。",
    romaji: EXAMPLE_ROMAJI.tomorrow ?? "ashita, tomodachi ni aimasu",
  };
  const todaySentence: CustomSentencePair = {
    japanese: "今日、友だちに会います。",
    german: "Heute treffe ich einen Freund.",
    kana: "きょう、ともだちにあいます。",
    romaji: "kyou, tomodachi ni aimasu",
  };

  return [
    buildMeaningChoiceQuestion(vocab, pool),
    buildJapaneseChoiceQuestion(vocab, pool),
    buildParticleChoiceQuestion(vocab),
    {
      id: "practice-meet-tomorrow-blank",
      type: "fill-blank",
      categoryId: vocab.categoryId,
      prompt: "明日、友だちに____。",
      instruction: buildBlankInstruction(tomorrowSentence.german),
      choices: orderDeterministically(["会います", "話します", "食べます", "行きます"], "meet:tomorrow-blank"),
      answer: "会います",
      vocabId: vocab.id,
      exampleJapanese: tomorrowSentence.japanese,
      exampleKana: tomorrowSentence.kana,
      exampleGerman: tomorrowSentence.german,
      shortTip: vocab.shortTip,
      detailTip: vocab.detailTip,
    },
    buildPhraseChoiceQuestion(vocab, pool),
    buildCustomPhraseQuestion(vocab, "phrase-tomorrow", tomorrowSentence, [
      vocab.exampleJapanese,
      talkSentence.japanese,
      todaySentence.japanese,
    ]),
    buildCustomPhraseQuestion(vocab, "phrase-talk", talkSentence, [
      vocab.exampleJapanese,
      tomorrowSentence.japanese,
      todaySentence.japanese,
    ]),
    buildCustomMeaningQuestion(vocab, "today", todaySentence, [
      "Ich treffe einen Freund.",
      "Morgen treffe ich einen Freund.",
      "Ich spreche mit einem Freund.",
    ]),
    buildCustomMistakeQuestion(
      vocab,
      "usage-contrast",
      "Ich treffe einen Freund.",
      vocab.exampleJapanese,
      [vocab.exampleJapanese, talkSentence.japanese, todaySentence.japanese, tomorrowSentence.japanese]
    ),
    buildCustomPhraseQuestion(
      vocab,
      "confirm",
      todaySentence,
      [vocab.exampleJapanese, talkSentence.japanese, tomorrowSentence.japanese],
      "Mini Challenge: Wähle den natürlichen Satz."
    ),
  ];
}

/** Light hand-curated 10-question Sub Quest for "japaneseLanguage", avoiding the japaneseLanguage/study example-sentence collision. */
function buildJapaneseLanguagePracticeQuestions(vocab: VocabItem, pool: VocabItem[]): QuizQuestion[] {
  const todaySentence: CustomSentencePair = {
    japanese: "今日、日本語を勉強します。",
    german: "Heute lerne ich Japanisch.",
    kana: "きょう、にほんごをべんきょうします。",
    romaji: "kyou, nihongo o benkyou shimasu",
  };
  const languageSentence: CustomSentencePair = {
    japanese: "日本語は言語です。",
    german: "Japanisch ist eine Sprache.",
    kana: "にほんごはげんごです。",
    romaji: "nihongo wa gengo desu",
  };
  const speakSentence: CustomSentencePair = {
    japanese: "日本語を話します。",
    german: "Ich spreche Japanisch.",
    kana: "にほんごをはなします。",
    romaji: "nihongo o hanashimasu",
  };

  return [
    buildMeaningChoiceQuestion(vocab, pool),
    buildJapaneseChoiceQuestion(vocab, pool),
    buildParticleChoiceQuestion(vocab),
    buildFillBlankQuestion(vocab),
    buildPhraseChoiceQuestion(vocab, pool),
    buildCustomPhraseQuestion(vocab, "phrase-today", todaySentence, [
      vocab.exampleJapanese,
      speakSentence.japanese,
      languageSentence.japanese,
    ]),
    buildCustomPhraseQuestion(vocab, "phrase-language", languageSentence, [
      vocab.exampleJapanese,
      todaySentence.japanese,
      speakSentence.japanese,
    ]),
    buildCustomMeaningQuestion(vocab, "speak", speakSentence, [
      "Ich lerne Japanisch.",
      "Heute lerne ich Japanisch.",
      "Japanisch ist eine Sprache.",
    ]),
    buildCustomMistakeQuestion(
      vocab,
      "usage-contrast",
      "Ich lerne Japanisch.",
      vocab.exampleJapanese,
      [vocab.exampleJapanese, speakSentence.japanese, "日本語を食べます。", "日本語を飲みます。"]
    ),
    buildCustomMeaningQuestion(
      vocab,
      "confirm",
      todaySentence,
      ["Ich lerne Japanisch.", "Japanisch ist eine Sprache.", "Ich spreche Japanisch."],
      "Mini Challenge: Was bedeutet dieser Satz?"
    ),
  ];
}

const SPECIAL_PRACTICE_BUILDERS: Partial<
  Record<string, (vocab: VocabItem, pool: VocabItem[]) => QuizQuestion[]>
> = {
  water: buildWaterPracticeQuestions,
  station: buildStationPracticeQuestions,
  right: buildRightPracticeQuestions,
  left: buildLeftPracticeQuestions,
  hotel: buildHotelPracticeQuestions,
  where: buildWherePracticeQuestions,
  friend: buildFriendPracticeQuestions,
  meet: buildMeetPracticeQuestions,
  japaneseLanguage: buildJapaneseLanguagePracticeQuestions,
  coffee: buildCoffeePracticeQuestions,
  drink: buildDrinkPracticeQuestions,
  go: buildGoPracticeQuestions,
  excuseMe: buildExcuseMePracticeQuestions,
  near: buildNearPracticeQuestions,
  far: buildFarPracticeQuestions,
};

/**
 * Builds the distractor pool for a practice word: related words first (per
 * `relatedVocabIds`), then other words from the same category, then the rest of vocabData
 * as a last resort. Keeps distractors thematically close instead of pulling in unrelated
 * categories (e.g. picking "school"/"friend" as distractors for "water").
 *
 * Every tier is added in full (not capped) so that downstream per-question filtering — e.g.
 * phrase-choice deduplicating identical exampleJapanese sentences — always has enough
 * candidates left to still produce 3 distractors.
 */
function buildRelatedPool(vocab: VocabItem): VocabItem[] {
  const pool: VocabItem[] = [];
  const seen = new Set<string>([vocab.id]);

  function addCandidates(candidates: VocabItem[]) {
    for (const candidate of candidates) {
      if (seen.has(candidate.id)) continue;
      seen.add(candidate.id);
      pool.push(candidate);
    }
  }

  const related = (vocab.relatedVocabIds ?? [])
    .map((id) => getVocabById(id))
    .filter((item): item is VocabItem => Boolean(item));
  addCandidates(related);

  const sameCategory = vocabData.filter((item) => item.categoryId === vocab.categoryId);
  addCandidates(sameCategory);

  addCandidates(vocabData);

  return pool;
}

/**
 * Builds a 10-question Sub Quest scoped entirely to a single vocab item — no other word's
 * meaning is ever tested, and the selected word is the subject of every question (distractors
 * may borrow related words, but the correct answer never does). "water" and "station" use
 * hand-curated question sets for the most natural sentences; every other word falls back to
 * the generic template, which is built from the same vocabData fields.
 */
export function buildPracticeQuestions(vocabId: string): QuizQuestion[] {
  const vocab = getVocabById(vocabId);
  if (!vocab) return [];

  const pool = buildRelatedPool(vocab);
  const specialBuilder = SPECIAL_PRACTICE_BUILDERS[vocabId];
  if (specialBuilder) {
    return specialBuilder(vocab, pool);
  }

  return buildGenericPracticeQuestions(vocab, pool);
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
