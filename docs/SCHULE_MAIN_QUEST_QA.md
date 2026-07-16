# Schule Main Quest QA

## Summary

- Questions before: 5 (4 regular + 1 Abschluss-Challenge)
- Questions after: 10 (9 regular + 1 Abschluss-Challenge, `isChallenge: true` unchanged as
  the array's last element)
- Reward XP: 100 (unchanged)
- Cards: `["school", "teacher", "japaneseLanguage", "study", "today"]` (unchanged, same 5)
- Unlock target: `unlocksNext: "freunde"` (unchanged)
- Build: `npm run build` — success, 0 errors
- Lint: `npm run lint` — 0 errors, 0 warnings
- Automated audit (10 questions + full-app regression): `OK: no failures found.`

## Learning Goals

- 学校 (Schule), 先生 (Lehrer/Lehrerin), 日本語 (Japanisch), 勉強する (lernen), 今日 (heute)
  — all 5 existing words, no new vocabulary card added.
- Particles, one per question wherever possible:
  - に = Ziel (wohin) — Q3
  - で = Ort der Handlung (wo) — Q4
  - を = Lerninhalt (was) — Q5
  - は = Thema-Marker für Zeitangaben (今日は) — Q6
  - と = Begleitung ("mit jemandem") — Q8
- Q9 explicitly contrasts に vs. で as a combined mini challenge; Q10 (Challenge) combines
  は/で/を/勉強します into one full sentence.

## Question Review

### Q1 (`schule-q1`)
- Type: `meaning-choice`
- Prompt: `学校`
- Answer: `Schule`
- Learning goal: base meaning of 学校.
- Ambiguity check: single correct meaning, 3 unrelated distractors (Lehrer/Lehrerin,
  Japanisch, heute) — no overlap.
- German quality: natural, single-word choices.
- Japanese quality: single word, standard.
- Kana/romaji: not applicable to this type (meaning-choice pulls kana/romaji from
  `vocabData.school` via the existing `getFeedbackPayload` fallback — verified non-empty).
- Result: pass. Added `shortTip`/`detailTip` (previously absent on this question).

### Q2 (`schule-q2`)
- Type: `japanese-choice`
- Prompt: `Lehrer/Lehrerin`
- Answer: `先生`
- Learning goal: recall 先生 from its German meaning (previously this slot tested
  勉強する instead — moved to align each word with its own dedicated recall question).
- Ambiguity check: 3 clearly distinct distractors (学校, 今日, 日本語).
- German quality: matches `vocabData.teacher.german` exactly ("Lehrer/Lehrerin").
- Japanese quality: single word, standard.
- Kana/romaji: falls back to `vocabData.teacher` (せんせい / sensei) — verified present.
- Result: pass.

### Q3 (`schule-q3`)
- Type: `fill-blank`
- Prompt: `„Ich gehe zur Schule.“\n学校____行きます。`
- Answer: `に`
- Learning goal: に = destination with movement verbs.
- Ambiguity check: choices に/で/を/は — only に is semantically valid for "gehe zur
  Schule" given the German clue; で would mean "by means of the school" (nonsensical), を
  and は don't fit grammatically as a destination marker here. Single correct answer.
- German quality: clue embedded in the prompt body (not just the small instruction line),
  matching the app's existing two-line fill-blank convention.
- Japanese quality: natural, standard beginner sentence.
- Kana/romaji: がっこうにいきます / gakkou ni ikimasu — matches `vocabData.school`'s own
  example fields exactly.
- Result: pass.

### Q4 (`schule-q4`)
- Type: `fill-blank`
- Prompt: `„Ich lerne in der Schule.“\n学校____勉強します。`
- Answer: `で`
- Learning goal: で = location where an action happens — directly contrasted against Q3's
  に in the same surrounding sentence frame (学校＿＿).
- Ambiguity check: choices で/に/を/と — only で fits "lerne in der Schule" (location);
  に would wrongly imply Schule as a destination of 勉強します (ungrammatical here without
  a movement verb), を/と don't fit the location role. Single correct answer.
- German quality: clue in prompt body.
- Japanese quality: natural.
- Kana/romaji: がっこうでべんきょうします / gakkou de benkyou shimasu.
- Result: pass.

### Q5 (`schule-q5`)
- Type: `fill-blank`
- Prompt: `„Ich lerne Japanisch.“\n日本語____勉強します。`
- Answer: `を`
- Learning goal: を = the thing being studied.
- Ambiguity check: choices を/に/で/は — only を marks 日本語 as the object of
  勉強します; に/で don't fit (日本語 is neither a destination nor a location), は would
  make 日本語 the topic rather than the object, changing the sentence's role. Single
  correct answer.
- German quality: clue in prompt body.
- Japanese quality: natural, this is the app's core recurring pattern for this word.
- Kana/romaji: にほんごをべんきょうします / nihongo o benkyou shimasu.
- Result: pass.

### Q6 (`schule-q6`)
- Type: `phrase-choice`
- Prompt: `Heute gehe ich zur Schule.`
- Answer: `今日は学校に行きます。`
- Learning goal: 今日 + は as a topic-marked time expression at the sentence's start.
- Ambiguity check: 3 distractors, each a distinct, deliberate mistake: 今日**を**学校に
  行きます (wrong particle on 今日 — topic vs. object), 今日は学校**で**行きます (に/で
  mix-up on the destination), 明日は学校に行きます (vocabulary swap — 明日/"morgen" is
  not yet taught in Schule; used only as a distractor per the brief's own example, never
  as an answer or a required teaching item). Only the answer matches the German prompt's
  exact meaning. Single correct answer.
- German quality: natural, simple.
- Japanese quality: natural A1-level sentence.
- Kana/romaji: きょうはがっこうにいきます / kyou wa gakkou ni ikimasu.
- Result: pass.

### Q7 (`schule-q7`)
- Type: `phrase-choice`
- Prompt: `Ich lerne Japanisch.`
- Answer: `日本語を勉強します。`
- Learning goal: 日本語 + を + 勉強します as one fixed pattern (reinforces Q5 at the
  full-sentence level instead of the bare-particle level).
- Ambiguity check: 3 distractors: 日本語**に**勉強します (particle mistake, ungrammatical),
  学校**を**勉強します (wrong object — "studying the school itself" doesn't match the
  prompt), 日本語を**飲みます** (wrong verb — "drink Japanese" is nonsensical). Single
  correct answer, no overlap with the meaning of the prompt.
- German quality: natural.
- Japanese quality: natural.
- Kana/romaji: にほんごをべんきょうします / nihongo o benkyou shimasu.
- Result: pass.

### Q8 (`schule-q8`)
- Type: `phrase-choice`
- Prompt: `Ich lerne mit dem Lehrer Japanisch.`
- Answer: `先生と日本語を勉強します。`
- Learning goal: と = "together with" a companion.
- Ambiguity check: 3 distractors: 先生**に**日本語を勉強します (ungrammatical — に
  doesn't mark a companion), 先生と**学校に行きます** ("go to school with the teacher" —
  grammatically valid Japanese, but a *different* meaning than the German prompt, which is
  specifically about learning), 先生と日本語を**話します** ("speak Japanese with the
  teacher" — again valid Japanese, different verb/meaning). Only one choice matches the
  prompt's exact meaning (learning, not going or speaking). Single correct answer.
- German quality: natural.
- Japanese quality: natural.
- Kana/romaji: せんせいとにほんごをべんきょうします / sensei to nihongo o benkyou
  shimasu.
- Result: pass.

### Q9 (`schule-q9`) — Mini Challenge
- Type: `phrase-choice` (per instructions: no new question type introduced; implemented
  as phrase-choice with a two-sentence combination as the answer, same technique already
  used by `schule-challenge` for joining two short sentences)
- Prompt: `Welche Kombination ist richtig?`
- Answer: `学校に行きます。学校で勉強します。`
- Learning goal: directly contrasts に (Ziel) and で (Ort der Handlung) by requiring the
  correct *pairing* rather than a single blank — a genuine step up in difficulty from
  Q3/Q4 individually, reusing their two sentences together by design (see Remaining
  Issues for the note on this intentional repetition).
- Ambiguity check: the 3 distractors are the same two base sentences with particles
  swapped or duplicated (で/に swapped; both に; both で) — each is either ungrammatical
  (学校で行きます, 学校に勉強します) or wrong in combination (both same particle). Only
  the correct pairing is doubly grammatical and matches both individual meanings. Single
  correct answer.
- German quality: `answerGerman` gives both sentence meanings together.
- Japanese quality: both halves individually natural (already used in Q3/Q4).
- Kana/romaji: がっこうにいきます。がっこうでべんきょうします。/ gakkou ni ikimasu.
  gakkou de benkyou shimasu.
- Result: pass.

### Q10 (`schule-challenge`) — Abschluss-Challenge
- Type: `phrase-choice`, `isChallenge: true` (last array element — `lesson/page.tsx`'s
  existing `isLastQuestion` check gives it the challenge styling regardless, but the
  explicit flag is kept for clarity/consistency with the other three categories).
- Prompt: `Heute lerne ich in der Schule Japanisch.`
- Answer: `今日は学校で日本語を勉強します。`
- Learning goal: combine 今日は (Zeit/Thema) + 学校で (Ort) + 日本語を (Lerninhalt) +
  勉強します (Handlung) into one natural sentence — the capstone of all 5 preceding
  particle lessons.
- Ambiguity check: 3 distractors, each isolating one mistake category: 今日は学校**に**
  日本語を勉強します (に/で mix-up on the location), 今日は学校**を**日本語**で**勉強し
  ます (を attached to the wrong noun — 学校を勉強します would mean "study the school
  itself", で attached to 日本語 would mean "by means of Japanese [as a medium]"; the
  result doesn't match the prompt's meaning and reads as garbled, not as a second valid
  natural sentence), 今日は学校で日本語を**話します** (different verb — "speak", not
  "learn"). None of the three distractors independently reproduce the prompt's exact
  meaning; verified specifically that the third one isn't just a word-reordering of the
  correct sentence (Japanese permits particle-marked scrambling, which would risk a second
  valid answer) — it's a genuine particle-noun mismatch instead. Single correct answer.
- German quality: matches the prompt directly (existing convention for challenge
  questions in this app).
- Japanese quality: natural, ties together every particle taught in this Etappe.
- Kana/romaji: きょうはがっこうでにほんごをべんきょうします /
  kyou wa gakkou de nihongo o benkyou shimasu — romaji conventions checked: は → `wa`, を
  → `o`, 学校 → `gakkou`, 今日 → `kyou`, 勉強 → `benkyou` (all matching `vocabData`'s own
  romaji fields, doubled-vowel style, no macrons).
- Result: pass. `detailTip` breaks the sentence into its four blocks (今日は / 学校で /
  日本語を / 勉強します) as requested.

## Tip Improvements

- **school**: now explains に (Ziel) vs. で (Ort der Handlung) as a pair, names the
  common beginner mix-up, and gives both example sentences.
- **teacher**: keeps the "polite address, not just for teachers" note, narrowed to the
  beginner-relevant scope (doctors as the one example, not an open-ended list), and adds
  "you never call yourself 先生" as the one common-mistake note.
- **japaneseLanguage**: explicitly contrasts 日本 (the country) vs. 日本語 (the
  language), explains that 語 marks "language" across many language names, and gives two
  mini examples (勉強します / 好きです).
- **study**: states the German meaning ("lernen"/"studieren") up front, gives the
  [Fach/Sprache] + を + 勉強します pattern with two examples, and flags that German
  doesn't require an equivalent object marker.
- **today**: gives the reading (きょう), two example sentences, notes the sentence-initial
  position, and calls out は → "wa" pronunciation as a classic beginner trap.
- **Question-specific tips**: added (previously missing) to `schule-q1`/`q2`; rewritten
  for the reworked `schule-q3`–`q9`; `schule-challenge`'s `detailTip` restructured into
  the four-block breakdown requested in the brief.
- All tips are German prose with Japanese fragments used only as quoted examples — no tip
  ends in Japanese-only text.

**Side effect (expected, not a bug):** `quizBuilder.ts`'s `getFeedbackPayload` falls back
to `vocab.shortTip`/`vocab.detailTip` whenever a question doesn't set its own — and Sub
Quest questions (`subQuestData/schule.ts`, built via `defineSubQuest`) never set
`shortTip`/`detailTip` per question. Improving `vocabData.ts`'s tips for these 5 words
therefore also improves the tip text shown in the Schule Sub Quest's feedback panel.
Verified in the browser: practicing `study`'s Sub Quest Q1 now shows the new "„勉強する“
heißt „lernen“ – die höfliche Form ist „勉強します“." tip. **No Sub Quest question count,
type, prompt, choices, or answer changed** — `quizBuilder.ts` and `subQuestData/*` were
not touched; only the shared tip text improved, which is the same architecture every
other category's Sub Quest already relies on.

## Reward Regression

- `rewardXp`: 100 (unchanged) — verified via automated script and in-browser Result screen
  (`+100 XP`, `Gesamt +100 XP`).
- `collectedCardIds`: unchanged, same 5 ids — verified via automated script and in-browser
  ("5 Karten gesammelt").
- `unlocksNext`: `"freunde"` (unchanged) — verified in-browser ("Freunde freigeschaltet",
  Home map showing Freunde as `current` immediately after).
- Replay: verified in-browser — completing Schule a second time showed "Wiederholung
  abgeschlossen", "+0 XP", the existing "Wiederholungen stärken dein Wissen…" note, and
  `localStorage`'s `nvq_xp` unchanged (230 before and after) — the existing
  first-clear/double-award guard in `storage.ts` (untouched) still works unmodified.

## Browser QA

- **A. Schule start**: seeded Café+Reise completed/130 XP, confirmed Schule shows as
  `current` on the Home map, `Starten` navigated to `/lesson?category=schule`, page showed
  `1 / 10` and `+100 XP`.
- **B. Q1–Q5**: 学校/先生/に/で/を all confirmed via direct interaction; both fill-blank
  prompts rendered as two lines with the German clue visible in the large prompt text (not
  just the small instruction line); each answered correctly with no ambiguity encountered.
- **C. Q6–Q9**: 今日/日本語/先生-combination sentences all read naturally; Q9's mini
  challenge required picking the correct に/で pairing (not just repeating Q3 or Q4 alone);
  no English text appeared anywhere in the 10-question run (regex-checked programmatically
  across every prompt/instruction/choice).
- **D. Q10**: reached with `10 / 10` progress, `Abschluss-Challenge` badge confirmed
  present (`isChallengeBadge: true`), prompt "Heute lerne ich in der Schule Japanisch."
  answered correctly, detailTip breakdown confirmed structured into the four requested
  blocks.
- **E. Completion**: Result screen showed "Level 2 erreicht!", "+100 XP" breakdown,
  "Vorher: 130 XP" → "Jetzt: 230 XP", "5 Karten gesammelt", "Freunde freigeschaltet"; back
  on Home, Schule showed `Abgeschlossen` and Freunde showed `current` ("Du bist hier").
- **F. Replay**: XP unchanged (230 → 230), "0" new cards implied by the "Wiederholung
  abgeschlossen" branch (no card-count line shown, matching the existing replay UI), replay
  note text confirmed, no duplicate Result sound triggering observed (existing play-once
  ref guard untouched).
- **G. Regression**: Café (`1 / 5`) and Reise (`1 / 10`) lessons load with unchanged
  question counts; Vocabulary loads with the Schule cards visible among 21
  pronunciation-enabled cards; Review loads; Schule's own Sub Quest (`study`, `1 / 10`)
  still runs its full 10-question flow unmodified, its Q1 answered correctly and its
  feedback panel confirmed to show the newly-improved tip text (see the documented side
  effect above); zero console errors, zero server errors across every navigation; no
  "Block"/"Boss"/"Mastered" text found anywhere on the Home page.

## Regression QA

- Café Main Quest: 5 questions, unchanged (verified by count + automated script comparing
  against expected per-category counts).
- Reise Main Quest: 10 questions, unchanged.
- Freunde Main Quest: 5 questions, unchanged.
- Finale Wiederholung (`review`): 5 questions, unchanged.
- Total questions across all categories: 35 (5 + 10 + 10 + 5 + 5) — automated script
  confirms this matches Café(5) + Reise(10) + Schule(10, new) + Freunde(5) + Review(5).
- `rewardXp` for Café/Reise/Freunde/Review: 50/80/110/150 — all unchanged, automated
  script confirms no drift.
- Home Quest Map, Vocabulary, Review, Sub Quest, Speaking Challenge, `quizBuilder.ts`,
  `subQuestData/*`, `storage.ts`, `levelSystem.ts`, `worldMapData.ts`, `sound.ts`,
  `speech.ts`, `speechRecognition.ts` — no files touched beyond `questData.ts` and
  `vocabData.ts` (confirmed via the edit history of this session).

## Remaining Issues

- Q9's two sentence-halves (学校に行きます。/ 学校で勉強します。) are byte-identical to
  Q3's and Q4's individual answers. This is an intentional design choice per the brief's
  own Mini Challenge specification (explicitly contrasting the two previously-taught
  sentences together, not introducing new content) — not treated as a "same full sentence
  repeated" defect, since the pairing itself is the new thing being tested. Flagged here
  for transparency rather than silently left unmentioned.
- Improving `vocabData.ts`'s `shortTip`/`detailTip` for the 5 Schule words also improves
  the same text shown in the Schule Sub Quest's feedback panel, via the existing shared
  fallback in `quizBuilder.ts` (see Tip Improvements above). This is expected given the
  app's existing architecture (word-level tips are intentionally shared across Main Quest
  and Sub Quest), not a scope violation — no Sub Quest question data, counts, types, or
  answers changed.
