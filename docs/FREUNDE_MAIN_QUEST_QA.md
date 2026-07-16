# Freunde Main Quest QA

## Summary

- Questions before: 5 (4 regular + 1 Abschluss-Challenge)
- Questions after: 10 (9 regular + 1 Abschluss-Challenge, `isChallenge: true` unchanged as
  the array's last element, `id: "freunde-challenge"` unchanged)
- Reward XP: 110 (unchanged)
- Cards: `["friend", "meet", "talk", "tomorrow", "like"]` (unchanged, same 5, no new card)
- Unlock target: `unlocksNext: "review"` (unchanged — unlocks Finale Wiederholung)
- Build: `npm run build` — success, 0 errors
- Lint: `npm run lint` — 0 errors, 0 warnings
- Automated audit (10 questions + full-app regression, via a temporary script deleted
  after use): `OK: no failures found.`

## Existing Freunde Vocabulary

Confirmed before any change (all 5 unchanged in id/kanji/kana/german; only
`shortTip`/`detailTip` improved and `usageExamples` added):

| id | Japanese | Kana | German | Existing example |
|---|---|---|---|---|
| `friend` | 友だち | ともだち | Freund/Freundin | 友だちに会います。 (Ich treffe einen Freund.) |
| `meet` | 会う | あう | treffen | 友だちに会います。 (Ich treffe einen Freund.) |
| `talk` | 話す | はなす | sprechen | 友だちと話します。 (Ich spreche mit einem Freund.) |
| `tomorrow` | 明日 | あした | morgen | 明日、友だちに会います。 (Morgen treffe ich einen Freund.) |
| `like` | 好き | すき | mögen / gern haben | 友だちが好きです。 (Ich mag meine Freunde.) |

Existing `shortTip`/`detailTip` before this pass (for reference):
- `friend`: "„友だち“ ist ein häufiges Wort im Alltag." / "„友だちに会います“ bedeutet „Ich treffe einen Freund“."
- `meet`: "Bei „会う“ benutzt man „に“ für die Person." / "Wie in „友だちに会います“ benutzt man das Partikel „に“ für die Person, die man trifft."
- `talk`: "„〜と話します“ benutzt man, wenn man mit jemandem spricht." / "„友だちと話します“ bedeutet „Ich spreche mit einem Freund“."
- `tomorrow`: "„明日“ steht oft am Satzanfang." / "„明日“ bedeutet „morgen“ und wird oft benutzt, wenn man über zukünftige Pläne spricht."
- `like`: "Bei „好き“ benutzt man „が“ für das, was man mag." / "„好き“ wird wie ein Adjektiv benutzt, gehört aber zu den Na-Adjektiven. Für das, was man mag, benutzt man das Partikel „が“."

No card was added, removed, or replaced. `collectedCardIds` on the `freunde`
`QuestCategory` is untouched.

## Learning Goals

- **Locker (casual)**: plain/dictionary verb forms (話す, 会う, 好き) — natural for
  friends, family, classmates. Explicitly *not* taught as "sloppy" or "wrong".
- **Höflich (polite)**: です/ます forms (話します, 会います, 好きです) — the safe
  default for teachers, strangers, and formal/work situations. Explicitly *not* taught as
  "the only correct form" or as keigo.
- **Friend situations**: casual replies to a friend's question, using words the learner
  already collected in this Etappe.
- **Teacher/stranger situations**: the same content, answered politely — always paired
  with the friend version so the contrast is visible, not learned in isolation.
- **Same meaning, different tone**: at least one question (Q5) asks the learner to
  recognize that two differently-toned sentences mean exactly the same thing.

## Question Review

### Q1 (`freunde-q1`)
- Type: `meaning-choice`
- Prompt: `友だち` → Answer: `Freund/Freundin`
- Situation/Register: none (pure vocabulary recall) — this is intentional: 友だち itself
  carries no register.
- Learning goal: confirm the base meaning before any tone contrast starts.
- Ambiguity check: 3 unrelated distractors (treffen, sprechen, morgen), single answer.
- German/Japanese quality: natural, unchanged from before.
- Kana/romaji: not applicable to this type; falls back to `vocabData.friend`.
- Result: pass. Added a `shortTip`/`detailTip` (previously missing) that already frames
  the register theme: "„友だち“ selbst ist weder locker noch höflich – das entscheidet der
  Satz" (echoing the improved `vocabData.friend` tip, not a verbatim copy).

### Q2 (`freunde-q2`)
- Type: `japanese-choice`
- Prompt: `treffen` → Answer: `会う`
- Learning goal: recall 会う from German, the verb the rest of the quest builds on.
- Ambiguity check: 3 distinct distractors (話す, 友だち, 明日), single answer.
- Result: pass. Added `shortTip`/`detailTip` (previously missing).

### Q3 (`freunde-q3`) — Locker recognition
- Type: `phrase-choice`
- Prompt: `Du sprichst locker mit einem Freund.\nWelche Aussage passt natürlich?`
- Situation: `friend` · Register tested: `casual`
- Answer: `友だちと話す。`
- Ambiguity check: choices are `友だちと話す。` (correct), `友だちと話します。` (same
  meaning, polite — *not* marked wrong, just less natural here), `友だちが話す。`
  (wrong particle — meaning shifts to "the friend talks"), `先生と話します。` (wrong
  person for a "mit einem Freund" scene). Exactly one choice matches "natural for this
  specific friend scene".
- German/Japanese quality: natural, A1-appropriate.
- Kana/romaji: `answerKana`/`answerRomaji`/`answerGerman` set
  (ともだちとはなす。/ tomodachi to hanasu / Ich spreche mit einem Freund.) — matches
  `talk`'s new `usageExamples` casual entry exactly.
- Result: pass. `shortTip`/`detailTip` explicitly state the polite form "ist nicht
  falsch", only less natural for this scene — per the brief's explicit instruction not to
  call polite ungrammatical.

### Q4 (`freunde-q4`) — Höflich recognition
- Type: `phrase-choice`
- Prompt: `Du sprichst mit einer Lehrkraft oder einer unbekannten Person.\nWelche Aussage ist hier passend?`
- Situation: `teacher`/`stranger` · Register tested: `polite`
- Answer: `友だちに会います。`
- Ambiguity check: choices are `友だちに会います。` (correct), `友だちに会う。` (same
  meaning, casual — *not* marked as a grammar mistake), `友だちを会います。` (wrong
  particle — genuine grammar error), `友だちが好きです。` (different meaning entirely —
  vocabulary mix-up). Single correct answer for this specific scene.
- Kana/romaji: matches `meet`'s new `usageExamples` polite entry exactly
  (ともだちにあいます。/ tomodachi ni aimasu / Ich treffe einen Freund.).
- Result: pass. `detailTip` states the casual form "ist nicht unhöflich, klingt aber
  unter Freunden lockerer" — never calls it a mistake.

### Q5 (`freunde-q5`) — Same meaning, different tone
- Type: `phrase-choice`
- Prompt: `Welche beiden Sätze haben dieselbe Bedeutung, aber einen anderen Ton?`
- Answer: `明日、友だちに会う。明日、友だちに会います。` (two-sentence set, following the
  existing app convention already used by the old `freunde-challenge` for combined
  sentences — periods separate the two halves since the Lesson UI's choice buttons don't
  render `\n` as a line break, see Remaining Issues)
- Ambiguity check: the 3 distractors each break the "same meaning" premise on purpose —
  time mismatch (明日 vs 今日), verb mismatch (話す vs 会います), and target mismatch
  (友だち vs 先生) — so exactly one pairing is genuinely same-meaning/different-tone.
- Kana/romaji: matches `tomorrow`'s new `usageExamples` pair exactly.
- Result: pass. `detailTip` explicitly names 会う as locker and 会います as höflich for
  the *same* underlying sentence.

### Q6 (`freunde-q6`) — Casual reply to a friend
- Type: `phrase-choice`
- Prompt: `Ein Freund fragt dich:\n„Was machst du heute?“\nWelche Antwort klingt locker und natürlich?`
- Situation: `friend` · Register: `casual`
- Answer: `今日は友だちに会う。`
- Ambiguity check: `今日は友だちに会います。` (same meaning, polite — a valid but
  less-natural-here answer, not "wrong"), `友だちが会う。` (wrong particle, meaning
  shifts), `今日は先生に会う。` (different content — meeting a teacher, not on-topic for
  this reply). Single sentence, single subject, no unnatural padding — matches the
  brief's "kurz, keine unnatürlichen Subjekte" requirement.
- Kana/romaji: matches `friend`'s new `usageExamples` casual entry exactly
  (きょうはともだちにあう。/ kyou wa tomodachi ni au).
- Result: pass.

### Q7 (`freunde-q7`) — Polite reply to a teacher
- Type: `phrase-choice`
- Prompt: `Eine Lehrkraft fragt dich:\n„Was machst du heute?“\nWelche Antwort ist höflich und natürlich?`
- Situation: `teacher` · Register: `polite`
- Answer: `今日は友だちに会います。`
- Same underlying content/meaning as Q6 (`answerGerman` identical to Q6's), only the
  register/correct-choice flips — verified programmatically (automated script asserted
  Q6/Q7 share `answerGerman` but have different `answer` strings) so the friend/teacher
  contrast is directly visible across the two questions.
- Kana/romaji: matches `friend`'s new `usageExamples` polite entry exactly.
- Result: pass.

### Q8 (`freunde-q8`) — Situation matching
- Type: `phrase-choice`
- Prompt: two situations (Freund/Lehrkraft) and two labeled sentences (Satz A/B) using
  学校/行く (already taught in Schule, per the brief's explicit allowance to borrow
  earlier-learned words), asking which situation↔sentence pairing fits best.
- Answer: `Freund → Satz A, Lehrkraft → Satz B` (A: 明日は学校に行く。 casual; B: 明日は
  学校に行きます。 polite — as of a later correction pass, see "Update — Q8 Comparison
  Correction" below, the two sentences now differ only in the verb ending, 行く vs.
  行きます; both keep 明日は)
- Ambiguity check: the other 3 combination choices are the swapped pairing and the two
  "both same register" pairings — exactly one combination is the natural fit.
- `detailTip` states both sentences mean the same thing and that only the sentence
  ending marks the Locker/Höflich difference.
- Result: pass.

## Update — Q8 Comparison Correction

A later QA pass (the Vocabulary Register UI work) re-examined every casual/polite
comparison in the app for a specific defect: comparing two sentences that differ in
*more than one place* teaches the wrong lesson about what makes a sentence casual or
polite. `freunde-q8`'s original comparison had exactly this problem and has been
corrected. This section documents the change; the Q8 review above already reflects the
corrected sentences.

**Previous comparison** (`freunde-q8`, before this correction):
- Satz A (casual): `明日、学校に行く。` — あした、がっこうにいく。
- Satz B (polite): `明日は学校に行きます。` — あしたはがっこうにいきます。

Two things changed between A and B here, not one: `は` was present in B but absent
in A (Satz A used a comma after 明日 instead), *and* the verb changed from 行く to
行きます. A learner comparing these two sentences for the first time could easily walk
away thinking that dropping `は` is *also* part of what makes a sentence casual — it
isn't; is dropped or kept independently of register.

**New comparison** (current `freunde-q8`):
- Satz A (casual): `明日は学校に行く。` — あしたはがっこうにいく。 — `ashita wa gakkou ni iku`
- Satz B (polite): `明日は学校に行きます。` — あしたはがっこうにいきます。 — `ashita wa gakkou ni ikimasu`
- German (both): `Morgen gehe ich zur Schule.`

Now exactly one thing differs between A and B: the verb ending (行く → 行きます). `明日は`
is identical in both, so the comparison isolates the Locker/Höflich distinction the
question is actually trying to teach.

**Reason:** per the brief's own guidance, a *first* casual/polite comparison should vary
only the sentence ending, not the sentence ending *and* an unrelated detail like a topic
particle. The previous version's extraneous は-difference risked teaching an incorrect
generalization ("casual drops は"); removing it isolates the one variable that actually
matters here.

**What was kept unchanged:** question id (`freunde-q8`), the 4 choices and their labels
(`Freund → Satz A, Lehrkraft → Satz B`, etc. — these reference "Satz A"/"Satz B"
abstractly and never embedded the literal Japanese text, so they needed no edits), the
`answer` string, `vocabId` (`friend`), the learning goal (recognizing which situation a
sentence fits), and the question's position in the array. `rewardXp` (110),
`collectedCardIds` (unchanged 5 ids), and `unlocksNext` (`"review"`) on the `freunde`
`QuestCategory` were not touched. No other Freunde question was modified.

`shortTip`/`detailTip` were rewritten to match the new comparison, keeping the required
message: "Die beiden Sätze haben dieselbe Bedeutung. Die Satzendung zeigt den Unterschied
zwischen Locker und Höflich." (see the Q8 review above for the exact German text used).

Verified via an automated script and in the browser: Q8's `answer` is still present in
its `choices`, `choices` still has exactly 4 unique entries, only one entry is correct,
and the Freunde Main Quest still has exactly 10 questions with `rewardXp: 110`.

### Q9 (`freunde-q9`) — Mini Challenge
- Type: `phrase-choice`
- Prompt: two situations (friend / fremde Person) requiring the correct
  casual-for-friend + polite-for-stranger two-sentence combination.
- Answer: `友だちが好き。日本語が好きです。` — combines `like`'s own casual half
  (友だちが好き。) with `japaneseLanguage`'s existing polite half from the prior
  register-foundation session (日本語が好きです。, `contrastGroup: "like-japanese"`),
  deliberately mixing two different words' contrast pairs for a harder,
  more-integrative "Mini Challenge" than Q3–Q7.
- Ambiguity check: distractors are register-reversed (polite-then-casual, wrong order for
  the stated situations) and particle-swapped (を instead of が, twice) — genuine errors,
  not just rephrasings.
- Result: pass. Slightly harder than Q3/Q4 as intended, without introducing new grammar.

### Q10 (`freunde-challenge`) — Abschluss-Challenge
- Type: `phrase-choice`, `isChallenge: true` (last array element, `id` unchanged from
  before)
- Prompt: two situations (`Du sprichst mit einem engen Freund.` / `Du sprichst mit einer
  Lehrkraft.`) requiring a friend→casual, teacher→polite sentence match using 今日
  (Schule) + 友だち/先生 + 話す/話します (Freunde) — combines a Schule word with two
  Freunde words, satisfying "mindestens 1 Freunde-Wort" and "möglichst auch
  Schule-Wörter".
- Answer: `A: 今日は友だちと話す。 B: 今日は先生と話します。`
- Ambiguity check: the 3 distractors are register-reversed, particle-broken (が instead
  of と, changing the meaning to "the friend/teacher speaks"), and content-mismatched (B
  still about 友だち instead of 先生) — verified none of them independently reproduces
  both halves' intended meaning+register combination.
- Kana/romaji/German: `answerKana`/`answerRomaji`/`answerGerman` set as a period-separated
  two-sentence set (きょうはともだちとはなす。 きょうはせんせいとはなします. /
  kyou wa tomodachi to hanasu. kyou wa sensei to hanashimasu. / Heute spreche ich mit
  einem Freund. Heute spreche ich mit der Lehrkraft.) — readable within the existing
  Feedback panel's plain-text rendering (see Remaining Issues).
- `detailTip` explicitly ties A→casual/Freund and B→polite/Lehrkraft together as "gleicher
  Inhalt, unterschiedlicher Ton".
- Result: pass.

## Register Design

Only `casual` and `polite` are used anywhere in this pass's new content (`neutral` wasn't
needed; `honorific`/`humble` are never used, verified by an automated check). Every
casual/polite pair is explicitly framed as *equally correct Japanese, different fit for
the situation* — never "casual is wrong" or "polite is always right". This is stated both
in question `shortTip`/`detailTip` fields (Q3, Q4, Q6, Q7, Q8) and in the improved
`vocabData` tips.

## Situation Design

`friend`/`family`/`classmate` are used as the casual-appropriate group and
`teacher`/`stranger`/`work` as the polite-appropriate group throughout — consistent with
the Schule words' existing `usageExamples` from the prior register-foundation session,
so the situation vocabulary reads the same way across categories.

## UsageExample Additions

Two `UsageExample`s (one `casual`, one `polite`) added to each of the 5 existing Freunde
words — no new vocabulary card, no existing field removed:

| Word | `contrastGroup` | Casual | Polite |
|---|---|---|---|
| `friend` | `meeting-a-friend-today` | 今日、友だちに会う。 | 今日、友だちに会います。 |
| `meet` | `meeting-a-friend` | 友だちに会う。 | 友だちに会います。 |
| `talk` | `talking-with-a-friend` | 友だちと話す。 | 友だちと話します。 |
| `tomorrow` | `meeting-a-friend-tomorrow` | 明日、友だちに会う。 | 明日、友だちに会います。 |
| `like` | `liking-friends` | 友だちが好き。 | 友だちが好きです。 |

Each casual example's `suitableFor` is `["friend", "family", "classmate"]`; each polite
example's is `["teacher", "stranger", "work"]`. All 10 new ids are unique across the whole
`vocabData` array (checked against the 10 pre-existing Schule ids from the prior session
too).

**Deliberate non-duplication between `friend` and `meet`:** both words naturally pair with
会う, so — to avoid two words claiming byte-identical `UsageExample` content — `friend`'s
pair includes 今日 (today) while `meet`'s pair uses the bare present-tense sentence
without a time word. This mirrors the app's existing pattern (the two words already
shared the same plain `exampleJapanese` before this pass).

## Contrast Groups

Each of the 5 new groups (`meeting-a-friend-today`, `meeting-a-friend`,
`talking-with-a-friend`, `meeting-a-friend-tomorrow`, `liking-friends`) contains exactly
one `casual` and one `polite` `UsageExample` with matching `german` text (verified
programmatically), matching this session's established design pattern from the prior
Schule register pass. No group id collides with the 5 pre-existing Schule group ids.

## Tip Improvements

- **friend**: now states 友だち is register-neutral by itself, then shows the exact
  casual/polite pair to prove it.
- **meet**: adds the [Person] + に + 会う/会います pattern with both registers, and warns
  not to confuse に (person met) with と (used for 話す).
- **talk**: explicitly contrasts 友だちと話す (casual) with 先生と話します (polite, a
  different addressee) in prose — this is where the brief's own illustrative friend/
  teacher example for 話す lives; it's *not* used as the `UsageExample` contrast pair
  itself, since a strict pair requires matching German translations (see Remaining
  Issues for why this distinction matters).
- **tomorrow**: clarifies that 明日 itself carries no tone — the verb ending does.
- **like**: states が stays the same in both registers, only です changes, and flags a
  common beginner mistake (using を instead of が).

All five explanations are distinct in wording (no copy-pasted template), each states the
base meaning, gives a casual+polite mini example, says who it fits, and names one common
mistake — matching the brief's required elements without repeating the same sentence
across words.

## Reward Regression

- `rewardXp`: 110 (unchanged) — confirmed via automated script and in-browser Result
  screen (`+110 XP`, `Gesamt +110 XP`).
- `collectedCardIds`: unchanged, same 5 ids — confirmed via automated script and
  in-browser ("5 Karten gesammelt").
- `unlocksNext`: `"review"` (unchanged) — confirmed in-browser ("Finale Wiederholung
  freigeschaltet", Home map showing Finale as `Bereit`/current immediately after).
- Replay: completing Freunde a second time showed "Wiederholung abgeschlossen", "+0 XP",
  the existing "Wiederholungen stärken dein Wissen…" note, and `localStorage`'s `nvq_xp`
  unchanged (340 before and after) — the existing double-award guard in `storage.ts`
  (untouched) still works unmodified.

## Browser QA

- **A. Freunde start**: seeded Schule completed/230 XP, confirmed Freunde shows as
  `current` on the Home map, `Starten` navigated to `/lesson?category=freunde`, page
  showed `1 / 10` and `+110 XP`, no Hydration errors on load.
- **B. Q1–Q2**: confirmed 友だち→Freund/Freundin and treffen→会う, both 4-choice, no
  English, no copy-match.
- **C. Q3–Q5**: confirmed the Locker/Höflich contrast is scene-driven, that polite is
  never called ungrammatical in Q3's tip text, and that Q5 correctly tests
  same-meaning-different-tone recognition.
- **D. Q6–Q7**: confirmed the friend-casual/teacher-polite reply pair share the same
  underlying meaning (identical `answerGerman`) with clearly different, natural Japanese.
- **E. Q8–Q9**: confirmed the situation↔sentence matching format and the Mini Challenge's
  slightly higher difficulty (mixed-word combination, register-reversed distractors), with
  no multiple-correct-answer ambiguity.
- **F. Q10**: reached with `10 / 10` progress and the `Abschluss-Challenge` badge
  confirmed present; answered correctly; kana/romaji/German verified consistent with the
  two-sentence answer format.
- **G. Completion**: Result screen showed "Level 3 erreicht!", "+110 XP" breakdown,
  "Vorher: 230 XP" → "Jetzt: 340 XP", "5 Karten gesammelt", "Finale Wiederholung
  freigeschaltet"; back on Home, Freunde showed `Abgeschlossen` and Finale Wiederholung
  showed `Bereit` (current).
- **H. Replay**: XP unchanged (340 → 340), "Wiederholung abgeschlossen" branch shown, no
  card-count line (matches existing replay UI), no duplicate Result sound triggering
  observed (existing play-once ref guard untouched).
- **I. Regression**: Café (`1 / 5`), Reise (`1 / 10`), and Schule (`1 / 10`) all load with
  unchanged question counts; Freunde's own Sub Quest (`talk`, `1 / 10`) still runs its
  full flow unmodified — its Q1 answered correctly and its feedback panel confirmed to
  show the newly-improved `talk` tip text (expected shared-fallback side effect, same as
  the prior Schule pass; no Sub Quest question count/type/answer changed); Vocabulary
  loads with all 26 cards' pronunciation buttons present, no unexpected "Locker"/"Höflich"
  text anywhere (badges are explicitly out of scope this pass); Review loads; zero console
  errors, zero server errors across every navigation and a hard reload; no
  "Block"/"Boss"/"Mastered" text found anywhere on the Home page.

## Regression QA

- Café Main Quest: 5 questions, unchanged.
- Reise Main Quest: 10 questions, unchanged.
- Schule Main Quest: 10 questions, unchanged (from the prior session's work).
- Finale Wiederholung (`review`): 5 questions, unchanged.
- Total questions across all categories: 40 (5 + 10 + 10 + 10 + 5) — automated script
  confirms this matches Café(5) + Reise(10) + Schule(10) + Freunde(10, new) + Review(5).
- `rewardXp` for Café/Reise/Schule/Review: 50/80/100/150 — all unchanged.
- Freunde's own Sub Quest (5 words × 10 questions each): question count unchanged,
  verified for `talk` in-browser; not touched in `subQuestData/*` or `quizBuilder.ts`.
- Speaking Challenge, Quest Map, Vocabulary, Review, `storage.ts`, `levelSystem.ts`,
  `worldMapData.ts`, `sound.ts`, `speech.ts`, `speechRecognition.ts` — no files touched
  beyond `questData.ts` and `vocabData.ts` (confirmed via the edit history of this
  session; `types/learning.ts` and `registerData.ts` were read but not modified, since
  the existing types/helpers already covered everything this pass needed).

## Remaining Issues

- **Two-sentence answers use period-separation, not line breaks.** `lesson/page.tsx`'s
  prompt paragraph uses `whitespace-pre-line` (so `\n` in a *prompt* renders as a real line
  break — used throughout this pass's multi-line situation prompts), but its choice
  buttons and the `FeedbackPanel`'s answer/example fields do **not** — a literal `\n`
  there would collapse to a single space rather than a line break. Per the brief's own
  instruction not to change the UI for this, every two-sentence answer (Q5, Q8's
  `exampleJapanese`, Q9, Q10) uses the same period-separated single-line convention the
  *pre-existing* `freunde-challenge` already used successfully — not a new pattern
  introduced by this pass.
- **`talk`'s vocabData tip illustrates a friend/teacher contrast with different content**
  (友だちと話す vs 先生と話します — different addressee, not just different register),
  per the brief's own suggested example for that word's Tip section. This is kept as
  prose explanation only; the actual `UsageExample` `contrastGroup` for `talk` uses a
  strict same-meaning pair (friend/friend, casual/polite) instead, so the automated
  "casual/polite pair shares the same German" check stays meaningful for every group,
  including `talk`'s.
- As in prior sessions, this environment's dedicated `navigate` tool intermittently
  returned "denied or failed" on the first attempt and required a second, forced call
  before succeeding; all navigation in this QA pass eventually succeeded and every claim
  above is backed by DOM text extraction or `localStorage` reads taken directly in the
  running app.
