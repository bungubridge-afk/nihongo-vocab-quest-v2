# Finale Review QA

## Summary

- Questions before: 5 (4 regular + 1 Abschluss-Challenge)
- Questions after: 10 (9 regular + 1 Abschluss-Challenge, `isChallenge: true` unchanged as
  the array's last element, `id: "review-challenge"` unchanged)
- Reward XP: 150 (unchanged)
- Cards: `[]` (unchanged — the Finale grants no new cards, all 26 were already collected
  by completing Café/Reise/Schule/Freunde)
- Unlock target: none (unchanged — `unlocksNext` is not set on `review`, matching the
  existing behaviour that the Finale is the last stage in Area 1)
- Build: `npm run build` — success, 0 errors
- Lint: `npm run lint` — 0 errors, 0 warnings
- Automated audit (10 questions + full-app regression, via a temporary script deleted
  after use — `_finale_validate.ts` + `_tsconfig.validate.json`, compiled with a
  throwaway CommonJS `tsc` pass and run with `node`): `OK: no failures found.`

## Existing Finale Configuration

Confirmed before any change, in `src/lib/questData.ts`'s `review` entry:

- `id: "review"`
- `name: "Abschluss-Review"`
- `stageTitle: "Alles zusammen"`
- `description: "Wiederhole Wörter aus allen Kategorien."`
- `unlockLevel: 4`
- `rewardXp: 150`
- `collectedCardIds: []`
- `isReview: true`
- `unlocksNext`: not present (no next category unlocked)
- Questions: 5 (`review-q1`–`review-q4` + `review-challenge`)

All of the above except `questions` are unchanged by this pass. Only the `questions`
array was replaced (5 → 10 entries). `getEtappeDisplayName("review")` in
`levelSystem.ts` (untouched) still maps this category to the player-facing name
**"Finale Wiederholung"**.

**Completion processing (untouched, in `storage.ts`/`lesson/page.tsx`):**
- First clear: `recordCategoryCompletion` adds `rewardXp` (150) once, merges
  `collectedCardIds` (empty, so no new cards), marks `review` completed, and (since
  `unlocksNext` is absent) unlocks nothing further.
- Replay: `recordCategoryCompletion` detects `review` is already in
  `completedCategories` and returns `firstClear: false, gainedXp: 0, newCards: []`
  without touching `localStorage` again — the existing double-award guard.
- `lesson/page.tsx`'s `ResultView` shows the "Wiederholung abgeschlossen" branch
  (+0 XP, no card count, "Wiederholungen stärken dein Wissen…" note) whenever
  `completionResult.firstClear` is `false`.

## Area 1 Vocabulary Inventory

Read directly from `src/lib/vocabData.ts` (unchanged by this pass):

- **Café (5):** coffee (コーヒー), water (水), bread (パン), drink (飲む), eat (食べる)
- **Reise (11):** station (駅), hotel (ホテル), train (電車), toilet (トイレ), go (行く),
  where (どこ), excuseMe (すみません), right (右), left (左), near (近い), far (遠い)
- **Schule (5):** school (学校), teacher (先生), japaneseLanguage (日本語),
  study (勉強する), today (今日)
- **Freunde (5):** friend (友だち), meet (会う), talk (話す), tomorrow (明日), like (好き)

Total: 5 + 11 + 5 + 5 = **26**, matching the brief's expected per-category counts
exactly — no discrepancy to report.

## 26-Word Coverage Matrix

"Reviewed in question" lists every question that meaningfully touches the word (as the
central answer, in the correct sentence's context, or in a `shortTip`/`detailTip`
explanation) — appearing only inside a wrong choice does not count, per the brief.

| ID | Japanese | Category | Reviewed in question | Review location | Result |
|---|---|---|---|---|---|
| `coffee` | コーヒー | Café | Q1, Q3, Q10 | Q1 `detailTip` ("コーヒーを飲みます"); Q3 central answer + context; Q10 scene A context | Covered |
| `water` | 水 | Café | Q1 | Q1 `detailTip` ("水を飲みます") | Covered |
| `bread` | パン | Café | Q1, Q3, Q10 | Q1 `exampleJapanese`/context ("パンを食べます"); Q3 central answer; Q10 scene A context | Covered |
| `drink` | 飲む | Café | Q1 | Q1 `detailTip` (verb-pair explanation with 2 example sentences) | Covered |
| `eat` | 食べる | Café | Q1 | Q1 central answer | Covered |
| `station` | 駅 | Reise | Q2 | Q2 central answer | Covered |
| `hotel` | ホテル | Reise | Q2, Q4 | Q2 `detailTip` context; Q4 central sentence ("ホテルに行きます") | Covered |
| `train` | 電車 | Reise | Q4 | Q4 sentence context + `detailTip` ("電車で" contrasted with に) | Covered |
| `toilet` | トイレ | Reise | Q2 | Q2 `detailTip` context ("トイレはどこですか") | Covered |
| `go` | 行く | Reise | Q4 | Q4 central particle question (行きます) | Covered |
| `where` | どこ | Reise | Q2 | Q2 central pattern explanation ("〜はどこですか") | Covered |
| `excuseMe` | すみません | Reise | Q2 | Q2 `detailTip` context ("すみません、駅はどこですか") | Covered |
| `right` | 右 | Reise | Q4 | Q4 `detailTip` context ("右です") | Covered |
| `left` | 左 | Reise | Q4 | Q4 `detailTip` context ("左です") | Covered |
| `near` | 近い | Reise | Q4 | Q4 `detailTip` context ("近いです") | Covered |
| `far` | 遠い | Reise | Q4 | Q4 `detailTip` context ("遠いです") | Covered |
| `school` | 学校 | Schule | Q5, Q6 | Q5 central (both sentences); Q6 context | Covered |
| `teacher` | 先生 | Schule | Q8, Q9 | Q8 `detailTip` ("先生と日本語を勉強します"); Q9 central noun ("先生と話します") | Covered |
| `japaneseLanguage` | 日本語 | Schule | Q6 | Q6 central answer / `vocabId` | Covered |
| `study` | 勉強する | Schule | Q5, Q6 | Q5 context ("学校で勉強します"); Q6 context ("日本語を勉強します") | Covered |
| `today` | 今日 | Schule | Q6 | Q6 central topic ("今日は") | Covered |
| `friend` | 友だち | Freunde | Q7, Q8, Q9, Q10 | Q7/Q8 central noun; Q9 context ("友だちと話す"); Q10 scene C context | Covered |
| `meet` | 会う | Freunde | Q7, Q8 | Q7 central (casual 会う); Q8 central (polite 会います) | Covered |
| `talk` | 話す | Freunde | Q9 | Q9 central (casual 話す / polite 話します) | Covered |
| `tomorrow` | 明日 | Freunde | Q7, Q8 | Q7/Q8 central topic word / `vocabId` | Covered |
| `like` | 好き | Freunde | Q7 | Q7 `detailTip` ("友だちが好き" aside) | Covered |

**Result: 26 / 26 words covered.** Verified both manually and by an automated script
that scans every `prompt`/`instruction`/`answer`/`shortTip`/`detailTip`/`choices`/
`exampleJapanese`/`exampleGerman`/`answerGerman` field of the 10 Finale questions for
each word's kanji stem (okurigana-stripped, so 行く/行きます and 勉強する/勉強します
both match) or its German headword.

## Learning Goals

- **Café ordering:** `〜と〜をください` (Q3) — ordering two things politely from staff,
  building on Q1's food/drink verb pair.
- **Reise vocabulary and movement:** place vocabulary + asking "where" (Q2), and
  combining a means-of-transport (`で`) with a destination (`に`) in one sentence (Q4).
- **に / で / を / は / と:** に = destination (Q4, Q5), で = location of an action
  (Q5), を = object of study (Q6), は = topic marker for time words (Q6), と = "together
  with" a companion (Q9) and "and" between two nouns (Q3).
- **Schule integration:** combining time + place + object + verb into one full sentence
  (Q6), reusing exactly the four building blocks taught in the Schule Etappe.
- **Locker / Höflich:** casual `会う`/`話す` for a close friend (Q7, Q9-A) versus polite
  `会います`/`話します` for a teacher, staff, or a stranger (Q8, Q9-B) — always framed as
  a difference in fit, never in correctness.
- **Situation awareness:** Q9 asks the learner to match two different situations to two
  different registers at once; Q10 asks the learner to do the same across three
  completely different scenes (Café, Schule, Freunde) in a single capstone question.

## Question Review

### Q1 (`review-q1`)
- Type: `meaning-choice`
- Prompt: `食べる` → Answer: `essen`
- Category coverage: Café (central: eat; context/Tip: bread, drink, coffee, water)
- Situation/Register: none (pure vocabulary recall, no register choice involved)
- Learning goal: confirm 食べる/essen and its verb-pair 飲む before any sentence work.
- New-word audit: only `eat`'s own kanji/German plus, in the Tip, `drink`/`coffee`/
  `water`'s existing kanji and existing example sentences (パンを食べます, コーヒーを飲みます,
  水を飲みます) — all already taught in the Café Etappe. No new word.
- Ambiguity check: 3 clearly distinct distractors (trinken, Kaffee, Brot), single answer.
- German/Japanese quality: natural, single-word choices.
- Kana/romaji: not set on the question (type doesn't carry sentence-level readings);
  feedback falls back to `vocabData.eat` (たべる / taberu / essen) — confirmed non-empty
  in the browser.
- Result: pass.

### Q2 (`review-q2`)
- Type: `japanese-choice`
- Prompt: `Bahnhof` → Answer: `駅`
- Category coverage: Reise (central: station; context/Tip: where, toilet, hotel, excuseMe)
- Situation/Register: none.
- Learning goal: recall 駅 and the "asking where something is" cluster
  (どこ/すみません/トイレ/ホテル) as a natural thematic group.
- New-word audit: only already-taught Reise words and the already-taught pattern
  `〜はどこですか`. No new word or grammar.
- Ambiguity check: 3 distinct distractors (ホテル, 電車, トイレ), single answer. Prompt is
  German, so there is no Japanese-to-Japanese copy-match risk for this type.
- German/Japanese quality: natural.
- Kana/romaji: not set on the question; feedback falls back to `vocabData.station`
  (えき / eki / Bahnhof) — confirmed non-empty in the browser.
- Result: pass.

### Q3 (`review-q3`)
- Type: `phrase-choice`
- Prompt: `Du bestellst höflich bei einer Servicekraft im Café: Kaffee und Brot.`
- Answer: `コーヒーとパンをください。`
- Category coverage: Café (coffee, bread, と, を〜ください)
- Situation: addressee named explicitly ("Servicekraft"). Register: polite request
  (ください) — not framed as keigo.
- Learning goal: と for "and" between two nouns, combined with the existing
  `〜をください` ordering pattern.
- New-word audit: identical sentence to the existing, already-vetted `cafe-challenge`
  answer — no new word, no new grammar.
- Ambiguity check: `コーヒーを飲みます。パンを食べます。` (statement, not an order — speech-act
  mismatch), `コーヒーを食べます。パンを飲みます。` (verb/food-drink mismatch, doubly wrong),
  `水と駅をください。` (nonsensical combination). Single unambiguous answer.
- German/Japanese quality: natural, A1-appropriate.
- Kana/romaji: `answerKana`/`answerRomaji`/`answerGerman` set
  (コーヒーとパンをください。/ koohii to pan o kudasai / Kaffee und Brot bitte.) — confirmed
  rendering correctly in the browser feedback panel.
- Result: pass. `detailTip` explicitly states ください is not an honorific ("kein
  Ehrenwort"), per the brief's prohibition on treating it as 尊敬語.

### Q4 (`review-q4`)
- Type: `particle-choice`
- Prompt: `„Ich fahre mit dem Zug zum Hotel.“\n電車でホテル____行きます。` → Answer: `に`
- Category coverage: Reise (central: go/hotel; context/Tip: train, right, left, near, far)
- Situation: none (grammar-focused, no register choice).
- Learning goal: に as the destination marker, contrasted in the same sentence with で
  as the means of transport (already taught in the Reise Etappe).
- New-word audit: reuses `reise-challenge`'s exact sentence (電車でホテルに行きます) — no
  new vocabulary, no new particle usage.
- Ambiguity check: choices に/で/を/は — only に fits the blank given 電車で already
  occupies the "means" role; で would double up nonsensically, を/は don't mark a
  destination. Single correct answer.
- German/Japanese quality: natural, matches the app's existing two-line fill-in
  convention (German clue + Japanese cloze in `prompt`, rendered via `whitespace-pre-line`
  — confirmed rendering as two visual lines in the browser).
- Kana/romaji: not set (matches the existing `reise-q4`/`schule-q3` convention for this
  type); `exampleJapanese`/`exampleKana`/`exampleGerman` are set explicitly and show the
  full sentence (電車でホテルに行きます。/ でんしゃでホテルにいきます。/ Ich fahre mit dem Zug
  zum Hotel.) in the feedback's "Beispiel" box — confirmed in the browser. The top
  reading line falls back to `vocabData.go` (いく / iku / gehen), also confirmed.
- Result: pass.

### Q5 (`review-q5`)
- Type: `phrase-choice`
- Prompt: `Welches Satzpaar zeigt „に“ (Ziel) und „で“ (Ort der Handlung) richtig?`
- Answer: `学校に行きます。学校で勉強します。`
- Category coverage: Schule (school central; study in context)
- Situation: none (grammar contrast, no register choice).
- Learning goal: directly contrast に (destination) and で (location of the action) using
  the exact two sentences already taught individually in the Schule Etappe (`schule-q3`/
  `schule-q4`, recombined the same way `schule-q9` already does).
- New-word audit: no new content — reuses the established sentence pair verbatim.
- Ambiguity check: the 3 distractors swap/duplicate the particles
  (で+に swapped, both に, both で) — each is either ungrammatical or a same-particle
  duplicate. Single correct pairing.
- German/Japanese quality: natural; both halves individually already vetted.
- Kana/romaji: `answerKana`/`answerRomaji`/`answerGerman` set
  (がっこうにいきます。がっこうでべんきょうします。/ gakkou ni ikimasu. gakkou de benkyou
  shimasu. / Ich gehe zur Schule. Ich lerne in der Schule.) — confirmed in the browser.
- Result: pass.

### Q6 (`review-q6`)
- Type: `phrase-choice`
- Prompt: `Heute lerne ich in der Schule Japanisch.` → Answer: `今日は学校で日本語を勉強します。`
- Category coverage: Schule (japaneseLanguage central; today/school/study in context)
- Situation: none.
- Learning goal: combine 今日は (topic/time) + 学校で (location) + 日本語を (object) +
  勉強します (action) into one full sentence — the same capstone `schule-challenge`
  already teaches, reused here as a review checkpoint distinct from Q5 (Q5 tests
  recognizing a *contrast*; Q6 tests recognizing a fully *assembled* sentence, so the two
  don't duplicate the same skill).
- New-word audit: identical sentence to the existing `schule-challenge` answer — no new
  content.
- Ambiguity check: 3 distractors, each isolating one mistake (に/で mix-up on location,
  を/で mismatch on object vs. medium, 話します instead of 勉強します). Single correct answer.
- German/Japanese quality: natural.
- Kana/romaji: set (きょうはがっこうでにほんごをべんきょうします。/ kyou wa gakkou de nihongo
  o benkyou shimasu / Heute lerne ich in der Schule Japanisch.) — confirmed in the browser.
- Result: pass. `detailTip` breaks the sentence into its four blocks as required.

### Q7 (`review-q7`) — Locker
- Type: `phrase-choice`
- Prompt: `Du sprichst locker mit einem engen Freund.\nWelche Aussage passt natürlich?`
- Answer: `明日、友だちに会う。`
- Category coverage: Freunde (tomorrow/meet central; friend/like in context)
- Situation: `friend` (named explicitly in the prompt). Register tested: casual.
- Learning goal: the plain form 会う is natural and not rude when talking to a close friend.
- New-word audit: identical sentence to `vocabData.tomorrow`'s existing
  `tomorrow-meeting-friend-casual` `usageExample` — no new content.
- Ambiguity check: `明日、友だちが会う。` (が instead of に — genuine particle error, flips
  subject/object roles), `明日、友だちに会います。` (same meaning, polite — not marked wrong,
  just less natural for "ein enger Freund"), `明日、先生に会う。` (wrong person for this
  specific friend scene). Single answer that fits *this* scene.
- German/Japanese quality: natural.
- Kana/romaji: set (あした、ともだちにあう。/ ashita, tomodachi ni au / Morgen treffe ich
  einen Freund.) — matches `vocabData.tomorrow`'s existing usage example exactly;
  confirmed in the browser.
- Result: pass. `detailTip` explicitly states the plain form "ist nicht unhöflich".

### Q8 (`review-q8`) — Höflich
- Type: `phrase-choice`
- Prompt: `Du sprichst höflich mit einer Lehrkraft, mit Servicepersonal oder mit einer
  unbekannten Person.\nWelche Aussage ist hier passend?`
- Answer: `明日、友だちに会います。`
- Category coverage: Freunde (tomorrow/meet central; teacher in Tip context)
- Situation: `teacher`/`staff`/`stranger` (all three named explicitly). Register tested:
  polite.
- Learning goal: the same underlying sentence as Q7, with only the verb ending changed
  (会う → 会います) — a clean minimal pair, differing in nothing but the register marker,
  per the brief's own guidance in section 6.
- New-word audit: identical sentence to `vocabData.tomorrow`'s existing
  `tomorrow-meeting-friend-polite` `usageExample` — no new content.
- Ambiguity check: `明日、友だちに会う。` (same meaning, casual — not marked as a mistake),
  `明日、友だちを会います。` (を instead of に — genuine particle error), `明日、先生に会います。`
  (wrong person — the scene is about meeting a *friend*, told politely, not meeting the
  teacher). Single answer.
- German/Japanese quality: natural.
- Kana/romaji: set (あした、ともだちにあいます。/ ashita, tomodachi ni aimasu / Morgen treffe
  ich einen Freund.) — matches `vocabData.tomorrow`'s existing usage example exactly;
  confirmed in the browser.
- Result: pass. `detailTip` explicitly states the casual form "ist dabei kein Fehler, nur
  weniger passend in dieser Situation" — never "falsch".

### Q9 (`review-q9`) — Mini Challenge
- Type: `phrase-choice`
- Prompt: two labeled situations (`Situation A`: friend, `Situation B`: staff/teacher)
  asking which sentence-pair combination fits best.
- Answer: `A: 友だちと話す。 B: 先生と話します。`
- Category coverage: Freunde (talk central) + Schule (teacher, context) — crosses 2
  categories in one question, per the brief's "mindestens 2 Kategorien" requirement.
- Situation: both named explicitly (`friend` / `Servicepersonal oder Lehrkraft`).
  Register: casual for A, polite for B.
- Learning goal: recognize that the *same* と+話す/話します pattern already taught with
  友だち (Freunde Etappe) also applies naturally to 先生 (Schule Etappe) — no new
  grammar, just a new combination of two already-taught fragments.
- New-word audit: 友だちと話す/友だちと話します are `vocabData.talk`'s own existing usage
  examples; 先生と話します recombines the already-taught と-pattern (先生と日本語を勉強します,
  from `vocabData.teacher`) with the already-taught 話します (from `vocabData.talk`) — no
  new word, no new grammar, only a new sentence combining two established fragments.
- Ambiguity check: `A: 友だちと話します。 B: 先生と話す。` (register-reversed — the exact
  mistake type required by the brief), `A: 友だちが話す。 B: 先生が話します。` (が instead of
  と — genuine particle error, flips meaning to "the friend/teacher talks"), `A: 友だちと
  話す。 B: 友だちと話します。` (content mismatch — B ignores the stated teacher/staff
  situation). Single correct answer; not merely silly distractors.
- German/Japanese quality: natural.
- Kana/romaji: set with `A:`/`B:` labels
  (A: ともだちとはなす。 B: せんせいとはなします。 / A: tomodachi to hanasu. B: sensei to
  hanashimasu. / A: Ich spreche mit einem Freund. B: Ich spreche mit der Lehrkraft.) —
  confirmed rendering readably in the browser feedback panel.
- Result: pass.

### Q10 (`review-challenge`) — Abschluss-Challenge
- Type: `phrase-choice`, `isChallenge: true` (last array element)
- Prompt: three labeled scenes (A. Café order, B. polite Schule sentence to a teacher,
  C. casual Freunde sentence) asking which 3-sentence set matches A/B/C.
- Answer: `A: コーヒーとパンをください。 B: 今日は学校で日本語を勉強します。 C: 明日、友だちに会う。`
- Category coverage: Café + Schule + Freunde (all three named per the brief; Reise is
  deliberately not part of Q10 — it already gets dedicated coverage in Q2/Q4).
- Situation: all three scenes named explicitly. Register: B polite, C casual — matches
  each stated situation.
- Learning goal: recombine three already-mastered, unmodified sentences (from Q3, Q6, and
  Q7 respectively) into one capstone recognition task, mirroring how each Main Quest's own
  Abschluss-Challenge recombines its Etappe's individual sentences.
- New-word audit: all three sentences are the exact, unmodified answers from Q3/Q6/Q7 —
  no new word, no new grammar anywhere in this question.
- Ambiguity check: distractor 1 breaks scene A with a genuine particle error
  (`コーヒーとパンにください。`, に instead of を), distractor 2 breaks scene B with a
  meaning error (`日本語を話します。` instead of `勉強します` — speaking vs. studying),
  distractor 3 breaks scene C with a register reversal (`会います` instead of `会う` in a
  stated-casual scene) — the three required distractor types (助詞違い, 意味違い,
  register逆転) are each isolated to exactly one scene, and none are silly/joke options.
- German/Japanese quality: natural, matches each scene's stated register.
- Kana/romaji: set with `A:`/`B:`/`C:` labels separated by ` / ` for readability, per the
  brief's explicit instruction to make each reading's sentence mapping clear without
  changing the UI (the existing `FeedbackPanel` renders these fields as plain text, not
  `whitespace-pre-line`, so a real line break would collapse to a single space — `/` is
  used instead of a newline, following the same convention `freunde-challenge` already
  established for its own two-sentence answer):
  `A: コーヒーとパンをください。 / B: きょうはがっこうでにほんごをべんきょうします。 / C: あした、
  ともだちにあう。` — confirmed rendering correctly in the browser.
- Result: pass. `detailTip` explains each of the three scenes separately with a bolded
  Café:/Schule:/Freunde: lead-in, as required.

## Register Review

Only `casual` and `polite` register framing appears anywhere in the new Finale content
(no `honorific`/`humble`, matching the brief's explicit prohibition). Every casual/polite
contrast is stated as a difference in *fit for the situation*, never in *correctness*:

- Q7 `detailTip`: "Die einfache Form ist nicht unhöflich – sie passt einfach zu einer
  vertrauten Person…"
- Q8 `detailTip`: "Die lockere Form ist dabei kein Fehler, nur weniger passend in dieser
  Situation."
- Q9 `detailTip`: "Beide Formen sind korrektes Japanisch – nur der Ton unterscheidet sich,
  nicht die Grammatik."
- Q10 `detailTip`: "Die einfache Form „会う“ ist unter engen Freunden ganz natürlich, nicht
  unhöflich – nur locker."

None of the prohibited phrasings ("Locker ist falsch", "Höflich ist immer richtig",
"普通形は失礼です", "です・ますは尊敬語です", "friends never get -masu") appear anywhere in the
10 questions — checked manually against every `shortTip`/`detailTip` while writing this
report.

**Q7 = Locker, Q8 = Höflich, Q9 = situation+register combination** — confirmed structurally
(Q7's answer is the plain form, Q8's answer is the -masu form for the *same* underlying
sentence, Q9 requires picking the correct casual/polite pairing for two different stated
situations at once).

## Particle Review

| Particle | Role taught | Where reviewed |
|---|---|---|
| に | destination (wohin) | Q4 (central), Q5 (contrasted with で) |
| で | location of an action (wo) | Q5 (contrasted with に), also で = means of transport in Q4's given sentence |
| を | object of an action (was) | Q6 (日本語を勉強します) |
| は | topic marker for a time word (今日は) | Q6 |
| と | "and" between two nouns | Q3 (コーヒーとパン); "together with" a companion | Q9 (友だちと話す / 先生と話します) |

に/で are explicitly contrasted in one combined question (Q5), matching the brief's
requirement; no new particle usage is introduced anywhere in the Finale.

## New Vocabulary Audit

Every Japanese sentence across all 10 questions was checked against the 26-word
`vocabData` inventory plus the fixed grammar/particle set already used in the four Main
Quests (に/で/を/は/と/が/です/ます/ください). No new content word, no new particle usage,
no new verb conjugation, no unfamiliar proper noun, no new counter/number, and no new time
expression appears anywhere. Every full sentence used as a correct answer (Q3, Q5, Q6, Q7,
Q8, Q10) is either byte-identical to, or a straightforward recombination of, sentences
already established in the Café/Reise/Schule/Freunde Main Quests or in `vocabData`'s own
`usageExamples`. Confirmed both manually (see Question Review above) and by the automated
script's English-leakage and coverage checks.

## Reward Regression

- `rewardXp`: 150 (unchanged) — confirmed via the automated script and in-browser Result
  screen (`+150 XP`, `Gesamt +150 XP`, `Vorher: 340 XP` → `Jetzt: 490 XP`).
- `collectedCardIds`: unchanged, still `[]` — confirmed via the automated script and
  in-browser ("0 Karten gesammelt" on first clear).
- `unlocksNext`: still absent — confirmed in-browser (no "… freigeschaltet" badge shown
  after completion; Home still shows only the fogged "Alltag in Japan" preview).
- Replay: completing the Finale a second time showed "Wiederholung abgeschlossen", "+0
  XP", the existing "Wiederholungen stärken dein Wissen…" note, and the Home page's total
  XP staying at 490 both before and after — the existing first-clear/double-award guard in
  `storage.ts` (untouched) still works unmodified.

## Completion Regression

- First clear: Result screen showed "Level 4 erreicht!" (340 → 490 XP crosses the 450
  threshold), "+150 XP" breakdown, "0 Karten gesammelt", no unlock badge; back on Home,
  all 5 stages showed "Abgeschlossen" and "5 / 5 Etappen geschafft".
- Next-area preview: "Alltag in Japan" / "Neue Orte, neue Gespräche und eine Hör-Quest." /
  "Demnächst" still renders correctly below the completed map (from `worldMapData.ts`,
  untouched).
- Replay: "Wiederholung abgeschlossen", "+0 XP", no new cards, XP unchanged (490 → 490).
- No duplicate Result-sound triggering observed (existing play-once ref guard in
  `lesson/page.tsx`, untouched).

## Browser QA

- **A. Finale locked:** seeded `localStorage` with only Café/Reise/Schule completed
  (Freunde not yet done); Home showed Freunde as `Bereit`/current and Finale Wiederholung
  as **"Gesperrt"** with no Starten button; direct navigation to
  `/lesson?category=review` showed **"Diese Kategorie ist noch gesperrt."** with a "Zurück
  zur Karte" button — no console or server errors.
- **B. Finale unlocked:** with Café/Reise/Schule/Freunde all completed, Home showed
  Finale Wiederholung as **"Bereit"**; Starten navigated to `/lesson?category=review`;
  page showed **1 / 10** and **"insgesamt +150 XP"**; no Hydration errors observed on
  load.
- **C. Q1–Q2:** confirmed 食べる→essen and Bahnhof→駅, both 4-choice, no English text, no
  copy-match (German prompt / Japanese choices or vice versa, never identical text).
- **D. Q3–Q4:** confirmed the Café order (コーヒーとパンをください) and the Reise
  destination sentence (電車でホテルに行きます); both use only previously-taught
  vocabulary; Q3's feedback showed correct kana/romaji/German
  (コーヒーとパンをください。 · koohii to pan o kudasai · Kaffee und Brot bitte.), Q4's
  "Beispiel" box showed the correct full sentence.
- **E. Q5–Q6:** confirmed the に/で contrast pair and the Schule integration sentence;
  Q5 and Q6 test clearly different skills (contrast recognition vs. full-sentence
  assembly); German Tips read clearly in both the short and expanded ("Mehr anzeigen")
  states.
- **F. Q7–Q8:** confirmed the Locker (明日、友だちに会う。) and Höflich
  (明日、友だちに会います。) answers; casual was never described as a grammar mistake in
  either Tip; the correct answer changed correctly based on the stated addressee.
- **G. Q9:** confirmed the two-situation combination (friend → casual, staff/teacher →
  polite), a register-reversed distractor among the choices, and exactly one correct
  answer.
- **H. Q10:** reached with **10 / 10** progress and the **"Abschluss-Challenge"** badge
  present; the 3-sentence set (Café/Schule/Freunde) read clearly with `A:`/`B:`/`C:`
  labels; kana/romaji/German all correct and clearly mapped per scene; `detailTip`
  explained each of the 3 scenes separately (Café:/Schule:/Freunde:); no new vocabulary
  anywhere.
- **I. First completion:** existing `rewardXp` (+150), 0 new cards, Area marked complete,
  Home showed the Finale as "Abgeschlossen" and all 5 Etappen as complete, next-area
  preview ("Alltag in Japan") displayed naturally, no double XP award.
- **J. Replay:** XP unchanged (490 → 490 both before and after), 0 new cards,
  "Wiederholung abgeschlossen" shown, no duplicate Result-sound triggering.
- **K. Regression:** Café (`1 / 5`, +50 XP), Reise (`1 / 10`, +80 XP), Schule (`1 / 10`,
  +100 XP), and Freunde (`1 / 10`, +110 XP) all load with unchanged question
  counts/rewards; Vocabulary shows **26 / 26** cards; Review (weak-words page) loads with
  no errors; a Sub Quest (`eat`, `/practice?word=eat`) still shows **1 / 10** unmodified;
  zero console errors and zero server errors observed across every navigation in this QA
  pass; no "Boss"/"Mastered"/"Block" text found on any page visited.

## Regression QA

- Café Main Quest: 5 questions, unchanged (ids, answers, `rewardXp: 50`).
- Reise Main Quest: 10 questions, unchanged (ids, answers, `rewardXp: 80`).
- Schule Main Quest: 10 questions, unchanged (ids, answers, `rewardXp: 100`).
- Freunde Main Quest: 10 questions, unchanged (ids, answers, `rewardXp: 110`).
- Sub Quest: all 26 words × 10 questions = 260 questions, unchanged — confirmed via the
  automated script calling `getSubQuestQuestions` for every `vocabData` id.
- `src/lib/vocabData.ts`, `src/types/learning.ts`, `src/lib/registerData.ts`,
  `src/lib/quizBuilder.ts`, `src/lib/subQuestData/*`, `src/lib/storage.ts`,
  `src/lib/levelSystem.ts`, `src/lib/worldMapData.ts`, `src/lib/sound.ts`,
  `src/lib/speech.ts`, `src/lib/speechRecognition.ts`, every file under `src/app/*`, and
  every file under `src/components/*` — none touched. Only `src/lib/questData.ts` (the
  `review` category's `questions` array) and this new doc were changed.

## Remaining Issues

- **Freunde Main Quest's `freunde-q8` mixes two differences in its casual/polite
  comparison, not just the sentence ending.** Per this brief's section 6 audit request:
  `freunde-q8`'s two sentences are `明日、学校に行く。` (casual) and `明日は学校に行きます。`
  (polite) — besides the expected 行く→行きます register change, the casual side also
  drops `は` (明日, no は) while the polite side keeps it (明日**は**). This matches the
  brief's own "推奨しない初回比較" example almost exactly (`今日、学校に行く。今日は学校に
  行きます。`). `freunde-q9` and `freunde-challenge` were also checked: `freunde-q9`
  compares two *different* topics (友だち vs. 日本語) with their own independently correct
  registers rather than a same-content minimal pair, so the "vary only the ending" rule
  doesn't directly apply there; `freunde-challenge` keeps `今日は` identical on both sides
  and only changes the addressee (友だち→先生, expected for a situation-match) plus the
  register ending, so it doesn't exhibit the same issue. As instructed, `freunde-q8` was
  **not** modified this pass (Freunde Main Quest content is out of scope) — flagging it
  here for a future pass to consider.
- **Two/three-sentence Finale answers (Q5, Q9, Q10) rely on `/`-separated single-line text,
  not real line breaks.** `FeedbackPanel`'s answer/reading/example fields render as plain
  `<p>` text (no `white-space: pre-line`), so a literal `\n` would collapse to a single
  space. Per the brief's explicit instruction not to change any UI this pass, Q9/Q10 use
  `A: … / B: … / C: …` labels with `/` separators (Q5 has no scene labels, so it keeps the
  simpler period-separated two-sentence convention already used by `schule-q9`). This is
  the same technique the existing `freunde-challenge`/`schule-q9` questions already rely
  on, not a new pattern.
- This environment's Browser pane occasionally cached stale interactive-element refs after
  a feedback panel appeared (the `Weiter`/`Mehr anzeigen` buttons); every case was resolved
  by re-reading the page with the `all` filter before clicking, and every claim in this
  report is backed by `get_page_text`/`read_page` output taken directly from the running
  app.
