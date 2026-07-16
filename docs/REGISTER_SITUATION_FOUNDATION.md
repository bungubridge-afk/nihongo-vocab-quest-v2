# Register and Situation Foundation

Design/data foundation only. No UI, no new question type, no Main/Sub Quest content
change. This document explains the data model added to support future casual/polite
(and eventually keigo) content, and exactly what was and wasn't built in this pass.

## Purpose

Today the app teaches words and です/ます-form sentences without ever addressing *why*
a sentence sounds the way it does, or whether it would suit talking to a friend versus a
teacher. This pass adds the data structure needed to eventually:

- Show the same meaning in a casual and a polite phrasing side by side.
- Let a learner pick the right register for who they're talking to (friend, teacher,
  shop staff, a stranger, …).
- Show a "Locker" / "Höflich" badge per example sentence in Vocabulary.
- Introduce casual speech in the Freunde Main Quest.
- Ask the learner to pick the phrasing that fits a given scene in the Finale.
- Extend to 尊敬語 (honorific) and 謙譲語 (humble) later, without a data-model rewrite.

None of the five items above are implemented yet — this pass only builds the types, the
helper functions, and one worked example (the existing Schule words) so that later work
has real data and a stable shape to build on.

## Why Vocabulary Items Are Not Simply Casual or Polite

A word like 水, 学校, 今日, or 日本語 carries no politeness of its own — it's just a
noun. Politeness in Japanese lives almost entirely in the *predicate* (the verb/adjective
ending a sentence) and in the speaker's choice of register for the situation, not in the
nouns that happen to appear in it. The same noun, 学校, appears equally naturally in:

- 今日は学校に行く。 (casual — plain form 行く)
- 今日は学校に行きます。 (polite — ます form 行きます)

Tagging `VocabItem.school` itself as "casual" or "polite" would be simply wrong: the word
is neutral, and either sentence is completely normal Japanese depending on who's talking
to whom. This is why `SpeechRegister` is a property of a **sentence** (`UsageExample`),
never of a `VocabItem` as a whole. `VocabItem` keeps its own single, unclassified
`exampleJapanese`/`exampleKana`/`exampleGerman` fields exactly as before — those are not
register-tagged and never claimed to be.

The one intentional exception the brief calls out: some fixed expressions carry their own
politeness regardless of context — e.g. ください is inherently a polite request form,
some words look bookish/obsolete no matter the sentence. Nothing in this pass adds such a
word-level flag (no word in this app needs one yet), but `SpeechRegister` living on
`UsageExample` doesn't block a future `VocabItem.inherentRegister?: SpeechRegister` from
being added later for that narrow case — this pass just doesn't need it yet, so it
doesn't exist yet.

## Speech Registers

`SpeechRegister` (`src/types/learning.ts`):

| Value | German label | German description |
|---|---|---|
| `neutral` | Neutral | Neutral formuliert, ohne einen deutlichen lockeren oder höflichen Ton. |
| `casual` | Locker | Eine lockere Form für Freunde, Familie oder vertraute Personen. |
| `polite` | Höflich | Eine höfliche Form für unbekannte Personen, Lehrkräfte oder formellere Situationen. |
| `honorific` | Respektvoll | Eine respektvolle Form, mit der die Handlung einer anderen Person aufgewertet wird. |
| `humble` | Bescheiden | Eine bescheidene Form, mit der die eigene Handlung gegenüber einer anderen Person zurückgenommen wird. |

Only 5 values, matching the brief's "don't add more than needed." `honorific`/`humble`
are defined so the type is complete and future-proof, but **no content in this app uses
them yet** — see Future Keigo Expansion.

## Conversation Situations

`ConversationSituation` (`src/types/learning.ts`), with the German labels implemented in
`registerData.ts`:

| Value | German label |
|---|---|
| `general` | Allgemein |
| `friend` | Freunde |
| `family` | Familie |
| `classmate` | Mitschüler |
| `teacher` | Lehrkraft |
| `stranger` | Fremde Person |
| `staff` | Servicepersonal |
| `work` | Arbeit |

A `UsageExample.suitableFor` array names every situation a given phrasing is natural in
(e.g. a casual sentence might suit `friend`, `family`, and `classmate` all at once).

## UsageExample Data Structure

```ts
export interface UsageExample {
  id: string;                          // unique across the whole app
  japanese: string;
  kana: string;
  romaji: string;
  german: string;
  register: SpeechRegister;
  suitableFor: ConversationSituation[]; // at least one entry
  contextGerman?: string;               // "Du sprichst locker mit einem Freund."
  noteGerman?: string;                  // short "why this fits" note
  contrastGroup?: string;               // links the casual/polite pair for one meaning
}
```

Added to `VocabItem` as a fully optional field:

```ts
usageExamples?: UsageExample[];
```

Nothing else on `VocabItem` changed. Words without `usageExamples` (21 of the app's 26
words, as of this pass) behave exactly as before — every existing read of
`exampleJapanese`/`exampleKana`/`exampleGerman`/`shortTip`/`detailTip` is untouched, and
`getFeedbackPayload`'s existing fallback chain in `quizBuilder.ts` (not modified this
pass) never looks at `usageExamples` at all.

## Casual and Polite Contrast Groups

`contrastGroup` is a free-form string id shared by every `UsageExample` that expresses the
*same meaning* at different registers. `getContrastExamples(vocab, group)` in
`registerData.ts` returns all examples sharing that id — today that's always exactly the
casual/polite pair for one of the 5 Schule words, but the mechanism supports more than two
per group later (e.g. adding an `honorific` variant to an existing group in the future
needs no shape change, just one more `UsageExample` with the same `contrastGroup`).

## Initial Schule Examples

Two `UsageExample`s added to each of the 5 existing Schule words — no new vocabulary
card, no change to any existing field:

| Word | `contrastGroup` | Casual | Polite |
|---|---|---|---|
| school (学校) | `school-going-today` | 今日は学校に行く。 | 今日は学校に行きます。 |
| teacher (先生) | `study-with-teacher` | 先生と日本語を勉強する。 | 先生と日本語を勉強します。 |
| japaneseLanguage (日本語) | `like-japanese` | 日本語が好き。 | 日本語が好きです。 |
| study (勉強する) | `study-japanese` | 日本語を勉強する。 | 日本語を勉強します。 |
| today (今日) | `study-today` | 今日は学校で勉強する。 | 今日は学校で勉強します。 |

Each casual example's `suitableFor` is `["friend", "family", "classmate"]`; each polite
example's is `["teacher", "stranger", "work"]`. `contextGerman` names the scene
("Du sprichst locker mit einem Freund…" / "Du sprichst höflich mit einer Lehrkraft…"),
and `noteGerman` gives a one-line reason the phrasing fits.

**On `teacher`'s casual example specifically:** 先生と日本語を勉強する does **not** mean
"speaking casually *to* the teacher" — it means telling a friend, casually, that you study
with the teacher. This is stated explicitly in its `contextGerman`
("Du erzählst einem Freund locker davon, dass du mit der Lehrkraft lernst.") and
reinforced in `noteGerman`
("Diese lockere Form richtet sich an einen Freund, nicht an die Lehrkraft selbst."), so a
future UI reading this data can never present it as "it's fine to be casual with your
teacher."

## Beginner UI Labels

Only two labels are meant to reach an A0–A1 learner in the near term:

- **Locker** (`casual`)
- **Höflich** (`polite`)

`neutral` exists for content that genuinely isn't marked either way (not shown as a badge
in the eventual UI, or shown as an unobtrusive default). `Respektvoll`/`Bescheiden`
(honorific/humble) are defined but not surfaced anywhere yet — see below.

## Future Vocabulary UI

Not built this pass. Recorded here as the intended direction for whoever picks this up:

- Each `UsageExample` gets a small **Locker**/**Höflich** badge next to it.
- The casual/polite pair from the same `contrastGroup` are shown together (stacked or
  side-by-side), so the contrast is visible at a glance rather than found by scrolling.
- Each example shows *who* it suits (its `suitableFor` situations), via
  `getSituationLabel`.
- A simple **Alle / Locker / Höflich** filter lets a learner browse just one register.

## Future Question Types

Candidates for later work, **not implemented in this pass**:

- `situation-choice` — given a scene, pick the phrasing that fits.
- `register-choice` — given a sentence, identify its register.
- `tone-conversion` — rewrite a casual sentence as polite (or vice versa).
- `dialogue-choice` — pick the natural next line in a short exchange.

`quizBuilder.ts` and `src/types/learning.ts`'s `QuestionType` union were **not** touched —
adding any of the above is future work, deliberately out of scope here.

## Future Keigo Expansion

- `polite` → 丁寧語 (already partially covered by this pass's です/ます examples).
- `honorific` → 尊敬語 (respectful forms for someone else's action, e.g. いらっしゃる).
- `humble` → 謙譲語 (modest forms for your own action, e.g. 参る).

At A0–A1, the app teaches and shows **casual and polite only**. `honorific`/`humble` are
reserved type values with German labels/descriptions ready, but zero `UsageExample`s use
them yet, and no lesson content should be built around them until the learner is well past
this app's current level.

## Backward Compatibility

- `VocabItem.usageExamples` is optional; 21 of 26 words have no value for it at all —
  those words' Vocabulary card, Sub Quest, and feedback panel behavior is byte-for-byte
  unchanged.
- No existing `exampleJapanese`/`exampleKana`/`exampleGerman`/`shortTip`/`detailTip` field
  was removed, renamed, or reinterpreted.
- No existing example sentence was auto-classified into a register — every `register`
  value in this pass was written by hand for a newly-authored sentence, per the brief's
  explicit instruction not to guess at existing content.
- `quizBuilder.ts`, `subQuestData/*`, `questData.ts`, `storage.ts`, `levelSystem.ts`, and
  every page/component file were not touched — Main Quest question counts/answers/rewards,
  Sub Quest content, Speaking Challenge, XP, Level, unlock rules, and localStorage keys are
  all unchanged.

## Validation

An automated script (run against the real `vocabData`/`questData`, then deleted per the
brief's instruction — see the completion report for its output) checked:

- Every `SpeechRegister` and `ConversationSituation` value has a non-empty German label
  (register values also have a non-empty description).
- A word with no `usageExamples` (checked via `coffee`) returns `[]` from every
  `registerData.ts` helper rather than throwing, and its own `exampleJapanese` field is
  unchanged.
- All 10 new `UsageExample` ids (2 per Schule word × 5 words) are unique across the whole
  `vocabData` array.
- Every new example has non-empty `japanese`/`kana`/`romaji`/`german`/`contextGerman`, a
  valid `register`, a non-empty `suitableFor`, and a `contrastGroup`.
- Each Schule word's two examples share exactly one `contrastGroup` and include exactly
  one `casual` and one `polite` entry; `getContrastExamples`/`getUsageExamplesByRegister`
  return the expected counts for each.
- Romaji conventions: topic-marking は → `wa`, を → `o`, 学校 → `gakkou`, 今日 → `kyou`,
  勉強 → `benkyou` — checked against every new example that contains those characters.
- No English-looking text in any new German field (word-boundary regex, tuned to avoid
  false positives against German words).
- Main Quest question counts and `rewardXp` for all 5 categories (Café 5/50, Reise 10/80,
  Schule 10/100, Freunde 5/110, Review 5/150), and Schule's `collectedCardIds`, are
  unchanged from before this pass.

## Remaining Work

- No UI reads `usageExamples`/`registerData.ts` yet — Vocabulary's badges, the
  side-by-side contrast view, and the register filter are all future work.
- No Main Quest or Sub Quest question uses this data yet — Freunde's planned casual
  introduction and the Finale's planned situation-matching question are future work.
- `honorific`/`humble` have no real content — a future keigo pass would add
  `UsageExample`s with those registers to appropriate words once the app reaches a level
  where teaching them makes sense.
- Only the 5 Schule words have `usageExamples` today; expanding coverage to other
  categories (Café, Reise, Freunde) is future work and should follow the same
  "hand-author each example, never auto-classify" rule established here.
- The narrow "a word is inherently polite regardless of context" case (e.g. ください) has
  no dedicated field yet; if it's needed later, it can be added as an optional
  `VocabItem.inherentRegister?: SpeechRegister` without touching `UsageExample`.
