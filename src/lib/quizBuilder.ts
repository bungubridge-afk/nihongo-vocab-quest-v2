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

  return [
    buildMeaningChoiceQuestion(vocab, pool),
    buildJapaneseChoiceQuestion(vocab, pool),
    buildParticleChoiceQuestion(vocab),
    buildFillBlankQuestion(vocab),
    buildSentenceMeaningChoiceQuestion(vocab, pool, {
      idSuffix: "-drink",
      japanese: drinkJapanese,
      german: drinkGerman,
      kana: drinkKana,
    }),
    buildPhraseChoiceQuestion(vocab, pool),
    {
      id: "practice-water-phrase-drink",
      type: "phrase-choice",
      categoryId: vocab.categoryId,
      prompt: drinkGerman,
      instruction: "Wähle den natürlichen japanischen Satz.",
      choices: orderDeterministically(
        [drinkJapanese, vocab.exampleJapanese, "水を食べます。", "水に行きます。"],
        "water:phrase-drink"
      ),
      answer: drinkJapanese,
      vocabId: vocab.id,
      answerKana: drinkKana,
      answerRomaji: drinkRomaji,
      answerGerman: drinkGerman,
      exampleJapanese: drinkJapanese,
      exampleKana: drinkKana,
      exampleGerman: drinkGerman,
      shortTip: vocab.shortTip,
      detailTip: vocab.detailTip,
    },
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
      instruction: "Ergänze den Satz.",
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

const SPECIAL_PRACTICE_BUILDERS: Partial<
  Record<string, (vocab: VocabItem, pool: VocabItem[]) => QuizQuestion[]>
> = {
  water: buildWaterPracticeQuestions,
  station: buildStationPracticeQuestions,
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
