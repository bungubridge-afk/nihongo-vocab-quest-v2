# Sub Quest QA Report

## Summary

- Total vocab checked: 26
- A: 4
- B: 15
- C: 5
- D: 2

**Status: original findings below (pre-fix). See "Fixed (follow-up pass)" for what changed.**

## Fixed (follow-up pass)

All issues below were addressed in `src/lib/quizBuilder.ts`. No other files were changed.

1. **right / left (D → Fixed).** `findParticle()` now explicitly skips a "で" match when it's
   the start of "です" (`sentence.slice(index, index + 2) === "です"`), so the false-positive
   split can no longer happen for any word, present or future. On top of that, `right` and
   `left` now have a dedicated hand-curated 10-question template
   (`buildDirectionWordPracticeQuestions`) covering meaning, a fill-blank using two different
   real sentence frames ("駅は____です。" / "____に行きます。"), phrase-choice pairs, a
   rechts/links contrast sentence, a paired-meaning question, and a polite Mini Challenge —
   verified to never produce `右____す` / `右で____` or any single-kana answer.
2. **hotel / where / japaneseLanguage / friend / meet (C → Fixed).** Each now has a
   hand-curated template (`buildHotelPracticeQuestions`, `buildWherePracticeQuestions`,
   `buildJapaneseLanguagePracticeQuestions`, `buildFriendPracticeQuestions`,
   `buildMeetPracticeQuestions`) built from genuinely distinct real/constructed sentences, so
   Q5–Q10 never repeat the same prompt+answer+type combination. `findRelatedSentenceSource()`
   also gained a collision guard (skips a related sentence that's byte-identical to the
   target's own sentence) as a generic safety net for any other word with the same
   vocabData collision pattern.
3. **Schule/Freunde romaji gap (10 words).** `EXAMPLE_ROMAJI` now has entries for `school`,
   `teacher`, `japaneseLanguage`, `study`, `today`, `friend`, `meet`, `talk`, `tomorrow`, and
   `like`. Every phrase-choice question across all 26 words now returns a non-empty
   `answerRomaji`/`feedback.romaji` (verified by script across all 260 generated questions,
   plus two pre-existing blanks on `water`'s and `station`'s combo questions found and fixed
   along the way).

Verified: `npm run build` and `npm run lint` both pass; a script exercising all 26
`buildPracticeQuestions()` outputs confirms 10 questions each, 4 choices each, no duplicate
choices, answer always present, no `____す` / bare-`す` patterns, no repeated
prompt+answer+type combos in the previously-C-rated words, and non-empty romaji on every
phrase-choice question.

## Overall Findings (original, pre-fix)

`buildPracticeQuestions(vocabId)` reliably returns 10 well-formed questions for all 26
words: every question has exactly 4 choices, the answer is always present in `choices`,
there are no duplicate choices within a question, and `getFeedbackPayload()` never throws
or returns an empty `answer`/`kana`/`german`. Structurally the generator is sound.

Quality is uneven, though, and the unevenness has two distinct, identifiable root causes
rather than being random:

1. **Q7/Q8 "reinforcement" pair frequently duplicates Q5/Q6.** `findRelatedSentenceSource()`
   looks for a related word whose own `exampleJapanese` contains the target word's kanji. In
   practice this only succeeds for **water**, **station** (hand-curated), **bread** (via
   `eat`), and **school** (via `today`) — those four get eight genuinely distinct Japanese
   sentences across Q5–Q8. For every other word, one of two things happens:
   - No related sentence contains the kanji at all → the generator falls back to reusing the
     word's own example a second time, at least reworded ("Wähle noch einmal…" /
     "Bestätige noch einmal…") so it reads as intentional repetition. This is the common case
     (coffee, drink, eat, train, toilet, go, excuseMe, near, far, teacher, study, today, talk,
     tomorrow, like) — rated **B**, acceptable for MVP.
   - A related sentence *is* found, but `vocabData.ts` happens to store the **exact same**
     `exampleJapanese`/`exampleGerman` string on both words (e.g. `hotel` and `go` both use
     "ホテルに行きます。"; `where` and `station` both use "駅はどこですか。";
     `japaneseLanguage` and `study` both use "日本語を勉強します。"; `friend` and `meet` both
     use "友だちに会います。"). Here the code *keeps the non-reworded instruction* (since a
     "source" was technically found), so Q7 looks and reads identically to Q5 — this reads
     more like a bug than intentional reinforcement. Rated **C**: `hotel`, `where`,
     `japaneseLanguage`, `friend`, `meet`.

2. **`findParticle()` misreads "です" as containing the particle "で".** For any word whose
   `exampleJapanese` is literally `[word]です。` with no other real particle before it (no
   を/に/と/が/は), the search for "で" matches the "で" inside "です" itself. This produces a
   nonsensical fill-in-the-blank: **right** → Q3 prompt `右____す。` (answer "で"), Q4 prompt
   `右で____。` (answer "す", a single meaningless kana competing against full verbs). **left**
   has the identical problem. This is a genuine generation bug, not a taste issue — rated **D**
   for both. Every other reise-category word with a similar adjective+です pattern (`near`,
   `far`) is safe because their sentences have a real は before です (`駅は近いです。`,
   `ホテルは遠いです。`), so は wins the "earliest particle" comparison.

A third, smaller finding: **`EXAMPLE_ROMAJI` in `quizBuilder.ts` only has entries for
Café/Reise vocab ids.** All 10 Schule/Freunde words (`school`, `teacher`,
`japaneseLanguage`, `study`, `today`, `friend`, `meet`, `talk`, `tomorrow`, `like`) show a
blank `feedback.romaji` on every phrase-choice question (Q5, and Q7 when it falls back to
the word's own sentence). This isn't new to Sub Quest — the same gap existed for the old
Q5 in the 5-question Practice — but the 10-question expansion doubles how often it's
visible (Q5 *and* Q7 instead of just Q5). Not blocking, but worth closing.

No word produced a broken `answer`/`choices` mismatch, a category mix-up (e.g. a "water"
quest surfacing "school" as its subject), or a hydration-unsafe pattern — the shuffle logic,
distractor pools, and feedback fallbacks all held up across all 26 words.

## Per Vocab Review

### coffee
Rating: B

Generated Questions:
1. [meaning-choice] コーヒー → Kaffee
2. [japanese-choice] Kaffee → コーヒー
3. [particle-choice] コーヒー____ください。→ を
4. [fill-blank] コーヒーを____。→ ください
5. [phrase-choice] Einen Kaffee bitte. → コーヒーをください。
6. [sentence-meaning-choice] コーヒーをください。→ Einen Kaffee bitte.
7. [phrase-choice] Einen Kaffee bitte. → コーヒーをください。 ("Wähle noch einmal…")
8. [sentence-meaning-choice] コーヒーをください。→ Einen Kaffee bitte. ("Bestätige noch einmal…")
9. [mistake-choice] Einen Kaffee bitte. → コーヒーをください。 (vs. …食べます/飲みます/行きます)
10. [kana-choice] コーヒー → コーヒー (kana=kanji for katakana words, expected)

Issues:
- Q7/Q8 are content-identical to Q5/Q6 (no related word's sentence mentions コーヒー). Reworded instructions make the repeat feel intentional, so this is tolerable but not ideal.

Recommendation:
- Keep generic template

### water
Rating: A

Generated Questions:
1. [meaning-choice] 水 → Wasser
2. [japanese-choice] Wasser → 水
3. [particle-choice] 水____ください。→ を
4. [fill-blank] 水を____。→ ください
5. [sentence-meaning-choice] 水を飲みます。→ Ich trinke Wasser.
6. [phrase-choice] Wasser bitte. → 水をください。
7. [phrase-choice] Ich trinke Wasser. → 水を飲みます。
8. [phrase-choice] Wasser und Kaffee bitte. → 水とコーヒーをください。
9. [meaning-choice] 水はどこですか。→ Wo ist das Wasser?
10. [mistake-choice] 水をください。→ みずをください。· mizu o kudasai · Wasser bitte. (kana/romaji/meaning confirm)

Issues:
- None

Recommendation:
- Keep generic template (already hand-curated; no action needed)

### bread
Rating: A

Generated Questions:
1. [meaning-choice] パン → Brot
2. [japanese-choice] Brot → パン
3. [particle-choice] パン____ください。→ を
4. [fill-blank] パンを____。→ ください
5. [phrase-choice] Brot bitte. → パンをください。
6. [sentence-meaning-choice] パンをください。→ Brot bitte.
7. [phrase-choice] Ich esse Brot. → パンを食べます。 (via "eat", genuinely distinct sentence)
8. [sentence-meaning-choice] パンを食べます。→ Ich esse Brot.
9. [mistake-choice] Brot bitte. → パンをください。 (vs. …食べます/飲みます/行きます)
10. [kana-choice] パン → パン (kana=kanji, expected)

Issues:
- None. `eat`'s example sentence genuinely mentions パン, so Q7/Q8 add real variety.

Recommendation:
- Keep generic template

### drink
Rating: B

Generated Questions:
1. [meaning-choice] 飲む → trinken
2. [japanese-choice] trinken → 飲む
3. [particle-choice] 水____飲みます。→ を
4. [fill-blank] 水を____。→ 飲みます
5. [phrase-choice] Ich trinke Wasser. → 水を飲みます。
6. [sentence-meaning-choice] 水を飲みます。→ Ich trinke Wasser.
7. [phrase-choice] Ich trinke Wasser. → 水を飲みます。 ("Wähle noch einmal…")
8. [sentence-meaning-choice] 水を飲みます。→ Ich trinke Wasser. ("Bestätige noch einmal…")
9. [mistake-choice] Ich trinke Wasser. → 水を飲みます。 (vs. …食べます/行きます/好きです)
10. [kana-choice] のむ → 飲む

Issues:
- Q7/Q8 duplicate Q5/Q6 (no related sentence mentions 飲む).

Recommendation:
- Keep generic template

### eat
Rating: B

Generated Questions:
1. [meaning-choice] 食べる → essen
2. [japanese-choice] essen → 食べる
3. [particle-choice] パン____食べます。→ を
4. [fill-blank] パンを____。→ 食べます
5. [phrase-choice] Ich esse Brot. → パンを食べます。
6. [sentence-meaning-choice] パンを食べます。→ Ich esse Brot.
7. [phrase-choice] Ich esse Brot. → パンを食べます。 ("Wähle noch einmal…")
8. [sentence-meaning-choice] パンを食べます。→ Ich esse Brot. ("Bestätige noch einmal…")
9. [mistake-choice] Ich esse Brot. → パンを食べます。 (vs. …飲みます/行きます/好きです)
10. [kana-choice] たべる → 食べる

Issues:
- Q7/Q8 duplicate Q5/Q6 (bread and coffee's sentences don't mention 食べる).

Recommendation:
- Keep generic template

### station
Rating: A

Generated Questions:
1. [meaning-choice] 駅 → Bahnhof
2. [japanese-choice] Bahnhof → 駅
3. [particle-choice] 駅____どこですか。→ は
4. [fill-blank] すみません、駅は____ですか。→ どこ
5. [phrase-choice] Wo ist der Bahnhof? → 駅はどこですか。
6. [sentence-meaning-choice] 駅に行きます。→ Ich gehe zum Bahnhof.
7. [phrase-choice] Der Bahnhof ist nah. → 駅は近いです。
8. [phrase-choice] Der Bahnhof ist weit. → 駅は遠いです。
9. [phrase-choice] Ich fahre mit dem Zug zum Bahnhof. → 電車で駅に行きます。
10. [phrase-choice] Entschuldigung, wo ist der Bahnhof? → すみません、駅はどこですか。

Issues:
- None

Recommendation:
- Keep generic template (already hand-curated; no action needed)

### hotel
Rating: C → **Fixed (A)**: now a hand-curated template (`buildHotelPracticeQuestions`); Q5–Q10 are 6 genuinely distinct sentences (own, near, far, train combo, where, polite confirm), no more byte-identical repeat.

Generated Questions:
1. [meaning-choice] ホテル → Hotel
2. [japanese-choice] Hotel → ホテル
3. [particle-choice] ホテル____行きます。→ に
4. [fill-blank] ホテルに____。→ 行きます
5. [phrase-choice] Ich gehe zum Hotel. → ホテルに行きます。
6. [sentence-meaning-choice] ホテルに行きます。→ Ich gehe zum Hotel.
7. [phrase-choice] Ich gehe zum Hotel. → ホテルに行きます。
8. [sentence-meaning-choice] ホテルに行きます。→ Ich gehe zum Hotel.
9. [mistake-choice] Ich gehe zum Hotel. → ホテルに行きます。 (vs. …食べます/飲みます/好きです)
10. [kana-choice] ホテル → ホテル (kana=kanji, expected)

Issues:
- Q7/Q8 are byte-for-byte identical to Q5/Q6. `go`'s `exampleJapanese`/`exampleGerman` in vocabData.ts is literally the same string as hotel's own example ("ホテルに行きます。" / "Ich gehe zum Hotel."), so `findRelatedSentenceSource` "succeeds" but adds zero new content — and because a source was technically found, the instruction text does NOT get reworded to "noch einmal", so Q7 looks exactly like Q5 was asked twice with no acknowledgement. This reads as a glitch to a user, worse than the plain-duplicate case.

Recommendation:
- Needs light adjustment (either reject a "source" whose sentence is identical to vocab's own, falling further down relatedVocabIds, or give hotel/go visibly different example sentences in vocabData)

### train
Rating: B

Generated Questions:
1. [meaning-choice] 電車 → Zug
2. [japanese-choice] Zug → 電車
3. [particle-choice] 電車____行きます。→ で
4. [fill-blank] 電車で____。→ 行きます
5. [phrase-choice] Ich fahre mit dem Zug. → 電車で行きます。
6. [sentence-meaning-choice] 電車で行きます。→ Ich fahre mit dem Zug.
7. [phrase-choice] Ich fahre mit dem Zug. → 電車で行きます。 ("Wähle noch einmal…")
8. [sentence-meaning-choice] 電車で行きます。→ Ich fahre mit dem Zug. ("Bestätige noch einmal…")
9. [mistake-choice] Ich fahre mit dem Zug. → 電車で行きます。 (vs. …食べます/飲みます/好きです)
10. [kana-choice] でんしゃ → 電車

Issues:
- Q7/Q8 duplicate Q5/Q6 (none of go/station/hotel's sentences mention 電車).

Recommendation:
- Keep generic template

### toilet
Rating: B

Generated Questions:
1. [meaning-choice] トイレ → Toilette
2. [japanese-choice] Toilette → トイレ
3. [particle-choice] トイレ____どこですか。→ は
4. [fill-blank] トイレは____。→ どこですか
5. [phrase-choice] Wo ist die Toilette? → トイレはどこですか。
6. [sentence-meaning-choice] トイレはどこですか。→ Wo ist die Toilette?
7. [phrase-choice] Wo ist die Toilette? → トイレはどこですか。 ("Wähle noch einmal…")
8. [sentence-meaning-choice] トイレはどこですか。→ Wo ist die Toilette? ("Bestätige noch einmal…")
9. [mistake-choice] Wo ist die Toilette? → トイレはどこですか。 (vs. …食べます/飲みます/行きます)
10. [kana-choice] トイレ → トイレ (kana=kanji, expected)

Issues:
- Q7/Q8 duplicate Q5/Q6 (where/excuseMe/station's sentences don't mention トイレ).

Recommendation:
- Keep generic template

### go
Rating: B

Generated Questions:
1. [meaning-choice] 行く → gehen
2. [japanese-choice] gehen → 行く
3. [particle-choice] ホテル____行きます。→ に
4. [fill-blank] ホテルに____。→ 行きます
5. [phrase-choice] Ich gehe zum Hotel. → ホテルに行きます。
6. [sentence-meaning-choice] ホテルに行きます。→ Ich gehe zum Hotel.
7. [phrase-choice] Ich gehe zum Hotel. → ホテルに行きます。 ("Wähle noch einmal…")
8. [sentence-meaning-choice] ホテルに行きます。→ Ich gehe zum Hotel. ("Bestätige noch einmal…")
9. [mistake-choice] Ich gehe zum Hotel. → ホテルに行きます。 (vs. …食べます/飲みます/好きです)
10. [kana-choice] いく → 行く

Issues:
- Q7/Q8 duplicate Q5/Q6. Note: hotel's sentence "ホテルに行きます。" does contain 行き, but not the exact substring "行く" (go's kanji, with く not き), so the source lookup correctly misses it here — unlike the hotel→go direction, this one degrades gracefully into the reworded fallback rather than a silent collision.

Recommendation:
- Keep generic template

### where
Rating: C → **Fixed (A)**: now a hand-curated template (`buildWherePracticeQuestions`); tests どこ across station/hotel/toilet contexts with no repeated sentence, plus a short-phrase question and a polite Mini Challenge.

Generated Questions:
1. [meaning-choice] どこ → wo
2. [japanese-choice] wo → どこ
3. [particle-choice] 駅____どこですか。→ は
4. [fill-blank] 駅は____。→ どこですか
5. [phrase-choice] Wo ist der Bahnhof? → 駅はどこですか。
6. [sentence-meaning-choice] 駅はどこですか。→ Wo ist der Bahnhof?
7. [phrase-choice] Wo ist der Bahnhof? → 駅はどこですか。
8. [sentence-meaning-choice] 駅はどこですか。→ Wo ist der Bahnhof?
9. [mistake-choice] Wo ist der Bahnhof? → 駅はどこですか。 (vs. …行きます/食べます/飲みます)
10. [kana-choice] どこ → どこ (kana=kanji, expected)

Issues:
- Same collision pattern as hotel: `station`'s `exampleJapanese`/`exampleGerman` is identical to `where`'s own example ("駅はどこですか。" / "Wo ist der Bahnhof?"), so Q7/Q8 are byte-identical to Q5/Q6 with the non-reworded instruction, reading as a glitch. This is exactly the "どこ makes a weird standalone quest" risk flagged in the brief.

Recommendation:
- Needs light adjustment (same fix as hotel) or Needs custom template — "wo" doesn't have a natural example sentence of its own beyond the one it shares with `station`, so a hand-curated template (like water/station) may be the more durable fix.

### excuseMe
Rating: B

Generated Questions:
1. [meaning-choice] すみません → Entschuldigung
2. [japanese-choice] Entschuldigung → すみません
3. [particle-choice] すみません、駅____どこですか。→ は
4. [fill-blank] すみません、駅は____。→ どこですか
5. [phrase-choice] Entschuldigung, wo ist der Bahnhof? → すみません、駅はどこですか。
6. [sentence-meaning-choice] すみません、駅はどこですか。→ Entschuldigung, wo ist der Bahnhof?
7. [phrase-choice] Entschuldigung, wo ist der Bahnhof? → すみません、駅はどこですか。 ("Wähle noch einmal…")
8. [sentence-meaning-choice] すみません、駅はどこですか。→ Entschuldigung, wo ist der Bahnhof? ("Bestätige noch einmal…")
9. [mistake-choice] Entschuldigung, wo ist der Bahnhof? → すみません、駅はどこですか。 (vs. …行きます/食べます/飲みます)
10. [kana-choice] すみません → すみません (kana=kanji, expected)

Issues:
- Q7/Q8 duplicate Q5/Q6 (where/toilet/station's sentences don't mention すみません). Milder than `where`'s case since excuseMe's own example is already a full, natural, distinct sentence, and the instruction is properly reworded.

Recommendation:
- Keep generic template

### right
Rating: D → **Fixed (A)**: `findParticle()` no longer matches "で" inside "です", and `right` now has a dedicated template (`buildDirectionWordPracticeQuestions`); Q3/Q4 are natural fill-blanks ("駅は____です。"/"____に行きます。"→右), no more `右____す`/`右で____`.

Generated Questions:
1. [meaning-choice] 右 → rechts
2. [japanese-choice] rechts → 右
3. [particle-choice] 右____す。→ で **(broken)**
4. [fill-blank] 右で____。→ す **(broken)**
5. [phrase-choice] Es ist rechts. → 右です。
6. [sentence-meaning-choice] 右です。→ Es ist rechts.
7. [phrase-choice] Es ist rechts. → 右です。 ("Wähle noch einmal…")
8. [sentence-meaning-choice] 右です。→ Es ist rechts. ("Bestätige noch einmal…")
9. [mistake-choice] Es ist rechts. → 右です。 (vs. …食べます/飲みます/行きます — grammatically odd distractors, but functions as wrong-answer bait)
10. [kana-choice] みぎ → 右

Issues:
- **Q3 is broken.** `findParticle()` matches the "で" inside "です" (右です。has no real を/に/と/が/は), so the blank is `右____す。` with answer "で" — splitting "です" into two meaningless fragments. This is not valid, teachable Japanese.
- **Q4 is broken.** Same root cause: the "predicate" after the false-positive "で" is just "す" (one kana), so the fill-blank answer is a meaningless single character competing against full verbs ("食べます"/"飲みます"/"行きます").
- Q7/Q8 also duplicate Q5/Q6 on top of the Q3/Q4 break.

Recommendation:
- Needs urgent fix (or Needs custom template, matching the special-case approach used for water/station)

### left
Rating: D → **Fixed (A)**: same fix as right (shared `buildDirectionWordPracticeQuestions` template + the `findParticle()` です-guard); no more `左____す`/`左で____`.

Generated Questions:
1. [meaning-choice] 左 → links
2. [japanese-choice] links → 左
3. [particle-choice] 左____す。→ で **(broken)**
4. [fill-blank] 左で____。→ す **(broken)**
5. [phrase-choice] Es ist links. → 左です。
6. [sentence-meaning-choice] 左です。→ Es ist links.
7. [phrase-choice] Es ist links. → 左です。 ("Wähle noch einmal…")
8. [sentence-meaning-choice] 左です。→ Es ist links. ("Bestätige noch einmal…")
9. [mistake-choice] Es ist links. → 左です。 (vs. …行きます/食べます/飲みます)
10. [kana-choice] ひだり → 左

Issues:
- Identical root cause and identical breakage to `right`: Q3 blanks "で" out of "です" (`左____す。`), Q4's answer is the meaningless fragment "す".
- Q7/Q8 duplicate Q5/Q6.

Recommendation:
- Needs urgent fix (same as right)

### near
Rating: B

Generated Questions:
1. [meaning-choice] 近い → nah
2. [japanese-choice] nah → 近い
3. [particle-choice] 駅____近いです。→ は
4. [fill-blank] 駅は____。→ 近いです
5. [phrase-choice] Der Bahnhof ist nah. → 駅は近いです。
6. [sentence-meaning-choice] 駅は近いです。→ Der Bahnhof ist nah.
7. [phrase-choice] Der Bahnhof ist nah. → 駅は近いです。 ("Wähle noch einmal…")
8. [sentence-meaning-choice] 駅は近いです。→ Der Bahnhof ist nah. ("Bestätige noch einmal…")
9. [mistake-choice] Der Bahnhof ist nah. → 駅は近いです。 (vs. …食べます/飲みます/行きます)
10. [kana-choice] ちかい → 近い

Issues:
- Q7/Q8 duplicate Q5/Q6. Unlike right/left, Q3/Q4 are unaffected by the です-splitting bug because `駅は近いです。` has a real は before です, so は correctly wins the earliest-particle search.

Recommendation:
- Keep generic template

### far
Rating: B

Generated Questions:
1. [meaning-choice] 遠い → weit / entfernt
2. [japanese-choice] weit / entfernt → 遠い
3. [particle-choice] ホテル____遠いです。→ は
4. [fill-blank] ホテルは____。→ 遠いです
5. [phrase-choice] Das Hotel ist weit entfernt. → ホテルは遠いです。
6. [sentence-meaning-choice] ホテルは遠いです。→ Das Hotel ist weit entfernt.
7. [phrase-choice] Das Hotel ist weit entfernt. → ホテルは遠いです。 ("Wähle noch einmal…")
8. [sentence-meaning-choice] ホテルは遠いです。→ Das Hotel ist weit entfernt. ("Bestätige noch einmal…")
9. [mistake-choice] Das Hotel ist weit entfernt. → ホテルは遠いです。 (vs. …食べます/飲みます/行きます)
10. [kana-choice] とおい → 遠い

Issues:
- Q7/Q8 duplicate Q5/Q6. Q3/Q4 are safe (は precedes です, same reason as near).
- Minor: `far`'s own example is about the Hotel ("ホテルは遠いです。"), not the Bahnhof — thematically fine (far is a standalone adjective, not station-specific), but worth noting it never mentions 駅 despite being reise-category alongside station.

Recommendation:
- Keep generic template

### school
Rating: A

Generated Questions:
1. [meaning-choice] 学校 → Schule
2. [japanese-choice] Schule → 学校
3. [particle-choice] 学校____行きます。→ に
4. [fill-blank] 学校に____。→ 行きます
5. [phrase-choice] Ich gehe zur Schule. → 学校に行きます。
6. [sentence-meaning-choice] 学校に行きます。→ Ich gehe zur Schule.
7. [phrase-choice] Heute gehe ich zur Schule. → 今日、学校に行きます。 (via "today", genuinely distinct sentence)
8. [sentence-meaning-choice] 今日、学校に行きます。→ Heute gehe ich zur Schule.
9. [mistake-choice] Ich gehe zur Schule. → 学校に行きます。 (vs. …食べます/飲みます/好きです)
10. [kana-choice] がっこう → 学校

Issues:
- None. `today`'s example genuinely extends school's own sentence, giving real Q7/Q8 variety.
- Minor/cosmetic: Q5/Q7 (phrase-choice) show blank `feedback.romaji` — see the Schule/Freunde romaji-gap finding in Overall Findings.

Recommendation:
- Keep generic template

### teacher
Rating: B

Generated Questions:
1. [meaning-choice] 先生 → Lehrer/Lehrerin
2. [japanese-choice] Lehrer/Lehrerin → 先生
3. [particle-choice] 先生____聞きます。→ に
4. [fill-blank] 先生に____。→ 聞きます
5. [phrase-choice] Ich frage den Lehrer. → 先生に聞きます。
6. [sentence-meaning-choice] 先生に聞きます。→ Ich frage den Lehrer.
7. [phrase-choice] Ich frage den Lehrer. → 先生に聞きます。 ("Wähle noch einmal…")
8. [sentence-meaning-choice] 先生に聞きます。→ Ich frage den Lehrer. ("Bestätige noch einmal…")
9. [mistake-choice] Ich frage den Lehrer. → 先生に聞きます。 (vs. …飲みます/行きます/食べます)
10. [kana-choice] せんせい → 先生

Issues:
- Q7/Q8 duplicate Q5/Q6 (school/study/japaneseLanguage's sentences don't mention 先生).
- Q5/Q7 romaji blank (Schule romaji gap).

Recommendation:
- Keep generic template

### japaneseLanguage
Rating: C → **Fixed (A)**: light hand-curated template (`buildJapaneseLanguagePracticeQuestions`) adds a today-combo sentence, a "日本語は言語です。" flavor sentence, and a 勉強する/話す usage contrast — no more byte-identical Q7/Q8. Romaji also backfilled.

Generated Questions:
1. [meaning-choice] 日本語 → Japanisch
2. [japanese-choice] Japanisch → 日本語
3. [particle-choice] 日本語____勉強します。→ を
4. [fill-blank] 日本語を____。→ 勉強します
5. [phrase-choice] Ich lerne Japanisch. → 日本語を勉強します。
6. [sentence-meaning-choice] 日本語を勉強します。→ Ich lerne Japanisch.
7. [phrase-choice] Ich lerne Japanisch. → 日本語を勉強します。
8. [sentence-meaning-choice] 日本語を勉強します。→ Ich lerne Japanisch.
9. [mistake-choice] Ich lerne Japanisch. → 日本語を勉強します。 (vs. …食べます/飲みます/行きます)
10. [kana-choice] にほんご → 日本語

Issues:
- Same collision pattern as hotel/where: `study`'s `exampleJapanese`/`exampleGerman` is identical to `japaneseLanguage`'s own example ("日本語を勉強します。" / "Ich lerne Japanisch."), so Q7/Q8 are byte-identical to Q5/Q6 with the non-reworded instruction. Matches the brief's specific worry that 日本語/勉強する would "同じ問題が重複しやすい".
- Q5/Q7 romaji blank (Schule romaji gap).

Recommendation:
- Needs light adjustment (same fix as hotel/where)

### study
Rating: B

Generated Questions:
1. [meaning-choice] 勉強する → lernen
2. [japanese-choice] lernen → 勉強する
3. [particle-choice] 日本語____勉強します。→ を
4. [fill-blank] 日本語を____。→ 勉強します
5. [phrase-choice] Ich lerne Japanisch. → 日本語を勉強します。
6. [sentence-meaning-choice] 日本語を勉強します。→ Ich lerne Japanisch.
7. [phrase-choice] Ich lerne Japanisch. → 日本語を勉強します。 ("Wähle noch einmal…")
8. [sentence-meaning-choice] 日本語を勉強します。→ Ich lerne Japanisch. ("Bestätige noch einmal…")
9. [mistake-choice] Ich lerne Japanisch. → 日本語を勉強します。 (vs. …食べます/飲みます/行きます)
10. [kana-choice] べんきょうする → 勉強する

Issues:
- Q7/Q8 duplicate Q5/Q6. Note the lookup for `study` (kanji "勉強する") correctly misses `japaneseLanguage`'s sentence because that sentence contains "勉強します" not the exact substring "勉強する" (します vs する differ), so this word degrades gracefully into the reworded fallback rather than a silent collision — the collision only shows up in the *japaneseLanguage→study* direction.
- Q5/Q7 romaji blank (Schule romaji gap).

Recommendation:
- Keep generic template

### today
Rating: B

Generated Questions:
1. [meaning-choice] 今日 → heute
2. [japanese-choice] heute → 今日
3. [particle-choice] 今日、学校____行きます。→ に
4. [fill-blank] 今日、学校に____。→ 行きます
5. [phrase-choice] Heute gehe ich zur Schule. → 今日、学校に行きます。
6. [sentence-meaning-choice] 今日、学校に行きます。→ Heute gehe ich zur Schule.
7. [phrase-choice] Heute gehe ich zur Schule. → 今日、学校に行きます。 ("Wähle noch einmal…")
8. [sentence-meaning-choice] 今日、学校に行きます。→ Heute gehe ich zur Schule. ("Bestätige noch einmal…")
9. [mistake-choice] Heute gehe ich zur Schule. → 今日、学校に行きます。 (vs. …食べます/飲みます/好きです)
10. [kana-choice] きょう → 今日

Issues:
- Q7/Q8 duplicate Q5/Q6 (study/school/japaneseLanguage's sentences don't mention 今日). The brief worried time-expressions would feel "thin" with the generic template — content is actually reasonably rich (today's own example already combines with 学校), the real issue is just the Q7/Q8 repeat, same as most B-rated words.
- Q5/Q7 romaji blank (Schule romaji gap).

Recommendation:
- Keep generic template

### friend
Rating: C → **Fixed (A)**: hand-curated template (`buildFriendPracticeQuestions`) draws on talk/tomorrow/like's real sentences plus a 会う/話す/好き usage-contrast question — no more byte-identical Q7/Q8. Romaji backfilled.

Generated Questions:
1. [meaning-choice] 友だち → Freund/Freundin
2. [japanese-choice] Freund/Freundin → 友だち
3. [particle-choice] 友だち____会います。→ に
4. [fill-blank] 友だちに____。→ 会います
5. [phrase-choice] Ich treffe einen Freund. → 友だちに会います。
6. [sentence-meaning-choice] 友だちに会います。→ Ich treffe einen Freund.
7. [phrase-choice] Ich treffe einen Freund. → 友だちに会います。
8. [sentence-meaning-choice] 友だちに会います。→ Ich treffe einen Freund.
9. [mistake-choice] Ich treffe einen Freund. → 友だちに会います。 (vs. …飲みます/行きます/食べます)
10. [kana-choice] ともだち → 友だち

Issues:
- Same collision pattern as hotel/where/japaneseLanguage: `meet`'s `exampleJapanese`/`exampleGerman` is identical to `friend`'s own example ("友だちに会います。" / "Ich treffe einen Freund."), so Q7/Q8 are byte-identical to Q5/Q6 with the non-reworded instruction.
- Q5/Q7 romaji blank (Freunde romaji gap).

Recommendation:
- Needs light adjustment (same fix as hotel/where/japaneseLanguage)

### meet
Rating: C → **Fixed (A)**: hand-curated template (`buildMeetPracticeQuestions`) mirrors friend's fix from the 会う perspective, with a new today-combo sentence so Q6/Q10 no longer repeat. Romaji backfilled.

Generated Questions:
1. [meaning-choice] 会う → treffen
2. [japanese-choice] treffen → 会う
3. [particle-choice] 友だち____会います。→ に
4. [fill-blank] 友だちに____。→ 会います
5. [phrase-choice] Ich treffe einen Freund. → 友だちに会います。
6. [sentence-meaning-choice] 友だちに会います。→ Ich treffe einen Freund.
7. [phrase-choice] Ich treffe einen Freund. → 友だちに会います。 ("Wähle noch einmal…")
8. [sentence-meaning-choice] 友だちに会います。→ Ich treffe einen Freund. ("Bestätige noch einmal…")
9. [mistake-choice] Ich treffe einen Freund. → 友だちに会います。 (vs. …行きます/食べます/飲みます)
10. [kana-choice] あう → 会う

Issues:
- Mirror of `friend`: `friend`'s sentence is identical to `meet`'s own example, so Q7/Q8 duplicate Q5/Q6. In this direction the instruction *does* get reworded ("noch einmal"/"Bestätige noch einmal") because the code evaluates the collision from friend's own relatedVocabIds order differently — still a duplicate, just with better framing than the `friend`→`meet` direction.
- Q5/Q7 romaji blank (Freunde romaji gap).

Recommendation:
- Needs light adjustment (same underlying fix as friend, even though the symptom is milder here)

### talk
Rating: B

Generated Questions:
1. [meaning-choice] 話す → sprechen
2. [japanese-choice] sprechen → 話す
3. [particle-choice] 友だち____話します。→ と
4. [fill-blank] 友だちと____。→ 話します
5. [phrase-choice] Ich spreche mit einem Freund. → 友だちと話します。
6. [sentence-meaning-choice] 友だちと話します。→ Ich spreche mit einem Freund.
7. [phrase-choice] Ich spreche mit einem Freund. → 友だちと話します。 ("Wähle noch einmal…")
8. [sentence-meaning-choice] 友だちと話します。→ Ich spreche mit einem Freund. ("Bestätige noch einmal…")
9. [mistake-choice] Ich spreche mit einem Freund. → 友だちと話します。 (vs. …食べます/飲みます/行きます)
10. [kana-choice] はなす → 話す

Issues:
- Q7/Q8 duplicate Q5/Q6 (friend/meet/like's sentences don't mention 話す). Particle と is correctly identified (no です-style false positive, since と genuinely precedes 話します).
- Q5/Q7 romaji blank (Freunde romaji gap).

Recommendation:
- Keep generic template

### tomorrow
Rating: B

Generated Questions:
1. [meaning-choice] 明日 → morgen
2. [japanese-choice] morgen → 明日
3. [particle-choice] 明日、友だち____会います。→ に
4. [fill-blank] 明日、友だちに____。→ 会います
5. [phrase-choice] Morgen treffe ich einen Freund. → 明日、友だちに会います。
6. [sentence-meaning-choice] 明日、友だちに会います。→ Morgen treffe ich einen Freund.
7. [phrase-choice] Morgen treffe ich einen Freund. → 明日、友だちに会います。 ("Wähle noch einmal…")
8. [sentence-meaning-choice] 明日、友だちに会います。→ Morgen treffe ich einen Freund. ("Bestätige noch einmal…")
9. [mistake-choice] Morgen treffe ich einen Freund. → 明日、友だちに会います。 (vs. …食べます/飲みます/行きます)
10. [kana-choice] あした → 明日

Issues:
- Q7/Q8 duplicate Q5/Q6 (meet/friend/like's sentences don't mention 明日). Same "time expression feels thin" risk as today — content is fine (own example combines with 友だちに会います), only the Q7/Q8 repeat is the actual issue.
- Q5/Q7 romaji blank (Freunde romaji gap).

Recommendation:
- Keep generic template

### like
Rating: B

Generated Questions:
1. [meaning-choice] 好き → mögen / gern haben
2. [japanese-choice] mögen / gern haben → 好き
3. [particle-choice] 友だち____好きです。→ が
4. [fill-blank] 友だちが____。→ 好きです
5. [phrase-choice] Ich mag meine Freunde. → 友だちが好きです。
6. [sentence-meaning-choice] 友だちが好きです。→ Ich mag meine Freunde.
7. [phrase-choice] Ich mag meine Freunde. → 友だちが好きです。 ("Wähle noch einmal…")
8. [sentence-meaning-choice] 友だちが好きです。→ Ich mag meine Freunde. ("Bestätige noch einmal…")
9. [mistake-choice] Ich mag meine Freunde. → 友だちが好きです。 (vs. …行きます/食べます/飲みます)
10. [kana-choice] すき → 好き

Issues:
- Q7/Q8 duplicate Q5/Q6 (friend/talk/tomorrow's sentences don't mention 好き). The brief worried が (the object-marking particle for 好き, unlike the usual を) would be handled poorly — it is not: Q3 correctly identifies が as the earliest/only real particle and offers it as a distinct choice from を/に/と, so the が-vs-を distinction is actually tested correctly.
- Q5/Q7 romaji blank (Freunde romaji gap).

Recommendation:
- Keep generic template

## Fix Priority

1. ~~**right** — D — です-split bug.~~ **Fixed**: `findParticle()` guard + dedicated template.
2. ~~**left** — D — same bug.~~ **Fixed**: same template + guard.
3. ~~**hotel** — C — hotel/go sentence collision.~~ **Fixed**: dedicated template.
4. ~~**where** — C — where/station sentence collision.~~ **Fixed**: dedicated template.
5. ~~**japaneseLanguage** — C — japaneseLanguage/study sentence collision.~~ **Fixed**: light dedicated template.
6. ~~**friend** — C — friend/meet sentence collision.~~ **Fixed**: dedicated template.
7. ~~**meet** — C — mirror of friend.~~ **Fixed**: dedicated template.
8. ~~**Schule/Freunde romaji gap** — B, 10 words.~~ **Fixed**: `EXAMPLE_ROMAJI` extended to cover all 10, plus two pre-existing blanks on water/station's combo questions found and fixed along the way.
9. **Remaining B-rated generic-template words** (coffee, drink, eat, train, toilet, go, excuseMe, near, far, teacher, study, today, talk, tomorrow, like) — Q5≈Q7 / Q6≈Q8 repetition when no related sentence mentions the target word, but always reworded and always correct. Out of scope for this pass (not requested); still acceptable to ship as-is per the original recommendation.

## Recommended Next Implementation

If picking up further work on Sub Quest content, tackle in this order:

1. **Fix `right` and `left` first.** This is the only outright-broken content in the set (2 of 26 words, both D). The cleanest fix is probably a small guard in the particle/predicate detection: don't treat "で" as a match if it's part of "です" and no other real particle exists in the sentence — or simply give `right`/`left` hand-curated templates (as `water`/`station` already have), since their content is thin enough (`右です。` / `左です。`) that a custom Q3–Q8 set would also read more naturally than the generic template can produce from a single three-word sentence.
2. **Then address the 5 collision words** (`hotel`, `where`, `japaneseLanguage`, `friend`, `meet`) by making `findRelatedSentenceSource()` skip a candidate whose `exampleJapanese` is identical to the target word's own sentence, so it either falls through to the next `relatedVocabIds` entry or degrades to the already-reworded fallback path instead of silently repeating with an unchanged instruction.
3. **Only after that**, backfill `EXAMPLE_ROMAJI` entries for the 10 Schule/Freunde vocab ids — a purely additive, low-risk change that closes the blank-romaji gap without touching question logic.

No code changes were made in this pass; the above is a prioritized punch list for a future
implementation session.
