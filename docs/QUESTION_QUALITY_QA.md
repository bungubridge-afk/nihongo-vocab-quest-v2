# Question Quality QA Report

Audit of every question in Main Quest (`src/lib/questData.ts`) and Sub Quest
(`src/lib/quizBuilder.ts`) for: leftover English text, answers visible in the prompt
(copy-match), ambiguous fill-blank/particle-choice questions, and Mini Challenge quality.
No Quest Map, XP, monetization, AI, or Listening work was done in this pass.

## Scope checked

- **Main Quest**: 30 questions total (Café 5, Reise 10, Schule 5, Freunde 5,
  Abschluss-Review 5), covering all 5 categories.
- **Sub Quest**: 260 questions total (all 26 `buildPracticeQuestions(vocabId)` outputs,
  10 questions each).

Both counts were re-verified after the fixes with an automated script (see "Automated
verification" below) — every question still returns 4 choices, the answer is always
present in `choices`, and question/choice counts are unchanged from before this pass.

## 1. English text found and fixed

| Location | Before | After |
|---|---|---|
| `questData.ts` → `reise-q9` prompt | `"The hotel is far away."` | `"Das Hotel ist weit entfernt."` |

**Count: 1 English string found and fixed.** A full regex sweep of both files (English
function/verb words with word boundaries, so German words like "ist"/"wie" aren't false
hits) found no other English UI-facing text in `prompt`, `instruction`, `choices`,
`answerGerman`, or `exampleGerman` in either file. `quizBuilder.ts` had none from the
start. Romaji strings (Latin-alphabet phonetic transcriptions like `"koohii"`,
`"sumimasen"`) were intentionally left untouched — they are Japanese-learning content,
not English, per the task's own exemption.

## 2. Ambiguous fill-blank / particle-choice questions found and fixed

The core problem: a blank like `友だちと____。` (choices 話します/食べます/飲みます/行きます)
has **three** grammatically and semantically natural completions with と ("talk with a
friend", "eat with a friend", "go with a friend" are all normal sentences) — the intended
answer (話します) was only distinguishable via a German clue that lived in the small
`instruction` line, easy to skim past, or in the worst case wasn't present at all.

**Fix applied everywhere, not just the broken cases**: every fill-blank/particle-choice
question's German clue now lives **inside the prompt itself**, quoted and on its own line
(e.g. `„Ich spreche mit einem Freund.“\n友だちと____。`), rendered in the same large,
bold font as the rest of the prompt (`whitespace-pre-line` added to the prompt `<p>` in
`lesson/page.tsx` and `practice/page.tsx`). The `instruction` line was simplified back to
a plain `"Ergänze den Satz."` / `"Wähle die passende Partikel."` since the clue no longer
needs to hide there.

**Count: 7 Main Quest fill-blank/particle-choice questions updated** (all of them —
`cafe-q3`, `reise-q3`, `reise-q4`, `reise-q7`, `schule-q3`, `freunde-q3`, `review-q3`).
Of these, **`freunde-q3` was the genuinely ambiguous one** (no clue existed before; と +
three different verbs were all plausible). `reise-q7` already had a clue, but only in the
small instruction text (`"Ergänze: Der Bahnhof ist nah."`) — upgraded to the prominent
prompt format. The other five weren't ambiguous to begin with (the wrong verbs don't fit
grammatically — e.g. を + 好きです or に + 食べます are not valid completions) but now
carry the same prominent clue for consistency, per the task's request to apply this to
*all* fill-blank/particle-choice questions, not just the broken ones.

**Sub Quest**: `buildParticleChoiceQuestion()` and `buildFillBlankQuestion()` (the two
generic template builders used by the majority of the 26 words) were updated with the
same `buildBlankPrompt()` helper, so every word using the generic template inherited the
fix automatically. All hand-curated custom fill-blank questions were updated individually:
`water`'s two "水を____。" questions (ください vs 飲みます — the exact case named in the
brief, already partially fixed in an earlier pass, now upgraded to the prompt-embedded
format), `station`'s where-word blank, `where`'s two blanks, `right`/`left`'s
station/go blanks, `friend`'s talk blank, `meet`'s tomorrow blank. **Count: 8 hand-curated
Sub Quest fill-blank instances updated**, plus the 2 generic builder functions that cover
the rest.

## 3. Answer-visible-in-prompt (copy-match) questions found and fixed

`buildKanaRecognitionQuestion()` (the Sub Quest Mini Challenge / Q10 generator) used
`vocab.kana` as the prompt and `vocab.kanji` as the answer. For katakana/hiragana-only
words, `kana` and `kanji` are the **same string**, so the question became "given コーヒー,
pick コーヒー from a list" — not a recognition question at all.

**Fix**: the prompt now uses `vocab.romaji` instead of `vocab.kana`. Romaji is always a
distinct Latin-alphabet string from the kanji/kana form, so this is safe for all 26 words,
not just the broken ones. Instruction text updated to
`"Mini Challenge: Welche japanische Schreibweise ist richtig?"` to match the new
romaji→kanji direction.

**Count: 4 words fixed** — `coffee` (コーヒー/コーヒー), `bread` (パン/パン), `toilet`
(トイレ/トイレ), `excuseMe` (すみません/すみません). Checked all 26 words'
`kana`/`kanji` pairs; these were the only four where they're identical. (`where`'s kana
and kanji are also both `どこ`, but `where` has a fully hand-curated template whose Q10 is
a custom phrase-choice "confirm" question, not the generic kana-choice builder, so it was
never affected.)

No other copy-match pattern was found: `buildMeaningChoiceQuestion` (kanji prompt → German
answer) and `buildJapaneseChoiceQuestion` (German prompt → kanji answer) always cross
scripts, so a same-string match is structurally impossible there.

## 4. Mini Challenge (Sub Quest Q10) re-audit — all 26 words

| Category | Result |
|---|---|
| Generic `kana-choice` (17 words: bread, eat, train, toilet, school, teacher, study, today, talk, tomorrow, like, coffee, drink, go, excuseMe, near, far) | Now romaji → kanji, 4 choices, no copy-match |
| Hand-curated Q10 (9 words: water, station, right, left, hotel, where, friend, meet, japaneseLanguage) | Already a distinct phrase-choice/sentence-meaning-choice "Mini Challenge" with different prompt/answer scripts — verified no copy-match, no English, romaji present where the type is phrase-choice |

All 26 Q10s verified: prompt ≠ answer, 4 choices, answer present, no English.

## 5. Main Quest full audit (30 questions, 5 categories)

Checked: instruction/prompt German, no English, answer not visible in prompt, no
multiple-correct ambiguity, natural Japanese/German, `answer` present in `choices`, no
duplicate choices, kana/romaji/German correspondence in `answerKana`/`answerRomaji`/
`answerGerman` fields. **No changes to XP, card rewards, unlock logic, or question count**
— only `prompt`/`instruction` text was edited on the 7 fill-blank/particle-choice
questions plus the 1 English string.

Result: all 30 pass after the fixes (see automated verification below). No further issues
found (no other copy-match, no other ambiguity beyond what's listed above — the
phrase-choice/full-sentence questions were already unambiguous by construction, since
their 4 choices are full sentences with distinct meanings, not single-word completions of
a shared frame).

## 6. Sub Quest full audit (260 questions, 26 words)

Result: all 260 pass after the fixes. Specifically re-verified:

- 10 questions per word, 4 choices each, answer always in choices, no duplicate choices.
- No English text in any field.
- No prompt/answer copy-match.
- Every fill-blank/particle-choice carries an embedded German clue in the prompt.
- `right`/`left`'s です-split bug (from an earlier pass) does not recur — no
  `____す。` prompt pattern and no bare `す` answer anywhere in the 260 questions.
- Every `phrase-choice` question has a non-empty `answerRomaji`.
- No exact duplicate (same type + prompt + answer) within any single word's 10 questions,
  re-checked specifically for the previously-C-rated collision words (hotel, where,
  japaneseLanguage, friend, meet).

## Automated verification

A script (`buildPracticeQuestions()` for all 26 vocab ids + `questCategories` for all 5
Main Quest categories) checked every question for the criteria above. Final run:

```
Main Quest questions checked: 30
Sub Quest questions checked: 260 (26 words x 10)

OK: no failures found.
```

`npm run build` and `npm run lint` both pass with zero errors/warnings.

## Remaining known limitations (not fixed in this pass, out of scope)

- A handful of Sub Quest generic-template words (train, teacher, study, today, talk,
  tomorrow, like) still have a Q7/Q8 pair that reworded-repeats Q5/Q6's sentence when no
  distinct related sentence exists (documented and accepted as "B — acceptable for MVP" in
  the earlier `docs/SUBQUEST_QA_REPORT.md` pass). This is a repetition/variety concern, not
  an English/ambiguity/copy-match bug, and was out of scope for this audit.
- Particle-choice questions where the correct particle is grammatically the *only* sensible
  choice (the large majority) were given a clue for consistency but were never actually
  ambiguous; the と-based friend/talk fill-blanks were the one genuine case of real
  ambiguity found across both files.
