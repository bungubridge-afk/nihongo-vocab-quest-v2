# 10,000 Vocabulary Content Architecture

Design-only document. No vocabulary data, lesson content, routes, or code are implemented
by this document — it defines the target structure so future work has exact numbers to
build against instead of open-ended scope.

## Product Goal

Grow `nihongo-vocab-quest-v2` from today's single free area (26 words, Café → Finale
Wiederholung) into an app that can carry a learner from absolute beginner (A0) to
practical upper-advanced (C1/C2 long-tail) Japanese, covering **10,000 unique canonical
vocabulary entries**, without ever presenting the learner with an unstructured wall of
10,000 flashcards. The map metaphor stays the core loop; it just needs a structure that
scales to hundreds of Etappen instead of 5.

## Definition of 10,000 Words

"10,000 words" means **10,000 unique canonical vocabulary entries**, not 10,000 surface
strings. Concretely:

- Inflected/conjugated forms (食べる → 食べます, 食べた, 食べて…) are **not** separate
  entries; they belong to one canonical entry's conjugation data.
- Orthographic variants of the same word (水 / みず) are **one** entry, not two — kana is
  a field on the entry, not a separate headword.
- A headword with multiple unrelated meanings (橋 "bridge" vs 箸 "chopsticks" — different
  kanji, coincidentally same kana, are already different entries by kanji; but a single
  kanji with multiple senses, e.g. 上げる) is modeled as **one entry with a `senses[]`
  array**, not one entry per sense, so it is not double-counted.
- Every entry has a globally unique `id`, generated once and never reused, so word packs
  and Etappen can reference vocabulary without duplicating or renumbering it.

### Canonical Vocabulary Schema

```ts
interface CanonicalVocabEntry {
  id: string;                 // stable, never reused
  headword: string;           // kanji/primary written form
  kana: string;
  romaji: string;
  germanGloss: string;        // primary gloss shown in the app
  partOfSpeech: string;
  frequencyRank?: number;     // corpus-frequency based, for ordering/prioritization
  jlptLevel?: "N5" | "N4" | "N3" | "N2" | "N1" | null;
  cefrEstimate?: "A0" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  topicIds: string[];         // e.g. ["food", "cafe"] — links entry to Themed Expeditions
  prerequisiteIds: string[];  // other entry ids a learner should already know
  exampleJapanese: string;
  exampleKana: string;
  exampleGerman: string;
  register?: "neutral" | "polite" | "casual" | "formal" | "written";
  senses?: Array<{ germanGloss: string; exampleJapanese: string; exampleGerman: string }>;
  curatedStatus: "hand-authored" | "ai-drafted" | "ai-reviewed" | "published";
  sourceStatus: "canonical" | "candidate";  // "candidate" = not yet approved for use
}
```

All content-generation (human or AI) reads FROM this catalog and writes questions ABOUT
entries in it — it never invents new headwords on the fly. This is what "AI does not
decide the canonical vocabulary" (Section: AI Content Pipeline) means in practice: an AI
pipeline may propose a `sourceStatus: "candidate"` entry, but it only becomes usable in a
live Etappe after a human promotes it to `"canonical"`.

## Content Layers

10,000 words are never rendered as one map. Three layers, each with a different authoring
model and a different UI surface:

| Layer | Purpose | Authoring | UI surface |
|---|---|---|---|
| **A. Main Journey** | Core vocabulary, A0→B2, the story-driven "critical path" | Hand-authored (today's quality bar) | The map (`/journey/[areaId]`) |
| **B. Themed Expeditions** | Topic depth (food, medicine, work, tech, culture…), B1→C1 | AI-drafted, human-sampled review | Topic list (`/expeditions`) |
| **C. Adaptive Mastery** | Weak-word remediation + long-tail advanced vocabulary (N2/N1) | Mostly AI-generated per session, drawn only from the canonical catalog | Personal coach (`/mastery`) |

## Exact Vocabulary Allocation

```
Main Journey            1,236 words
Themed Expeditions       3,000 words
Adaptive Mastery Pool    5,764 words
---------------------------------------
TOTAL                   10,000 words
```

No word is counted twice: a word taught in Main Journey is not re-counted in Themed
Expeditions; a word later reviewed via Adaptive Mastery (because it's a Main Journey word
the learner got wrong) is drawn from the *same* entry, not duplicated — Adaptive Mastery's
5,764-word figure is specifically the **advanced/long-tail pool that has no other fixed
home** (never taught via a linear Etappe), not a review-count.

## Main Journey

20 areas, including today's free area as Area 1 (unchanged). Each area (after Area 1)
follows the brief's session pattern: **4 Main Quest + 1 Hör-Quest + 1 Finale = 6 Etappen**.
Area 1 keeps its current **4 Main Quest + 1 Finale = 5 Etappen, no Hör-Quest** (matches
today's build exactly — nothing here changes it).

| # | Area (user-facing name) | Level | New words | Cumulative | Etappen | Free/Paid |
|---|---|---|---|---|---|---|
| 1 | Erste Schritte in Japan | A0 | 26 | 26 | 5 | Free |
| 2 | Alltag in Japan | A1 | 40 | 66 | 6 | Free |
| 3 | Unterwegs in der Stadt | A1 | 40 | 106 | 6 | Free |
| 4 | Essen und Bestellen | A1 | 40 | 146 | 6 | Paid |
| 5 | Zeit und Termine | A1 | 40 | 186 | 6 | Paid |
| 6 | Zuhause und Familie | A2 | 55 | 241 | 6 | Paid |
| 7 | Freunde und Freizeit | A2 | 55 | 296 | 6 | Paid |
| 8 | Lernen und Schule | A2 | 55 | 351 | 6 | Paid |
| 9 | Gesundheit und Körper | A2 | 55 | 406 | 6 | Paid |
| 10 | Reisen und Unterkunft | A2 | 55 | 461 | 6 | Paid |
| 11 | Arbeit und Beruf | B1 | 70 | 531 | 6 | Paid |
| 12 | Gefühle und Meinungen | B1 | 70 | 601 | 6 | Paid |
| 13 | Kultur und Etikette | B1 | 70 | 671 | 6 | Paid |
| 14 | Medien und Technik | B1 | 70 | 741 | 6 | Paid |
| 15 | Service und Probleme | B1 | 70 | 811 | 6 | Paid |
| 16 | Gesellschaft und Nachrichten | B2 | 85 | 896 | 6 | Paid |
| 17 | Diskussion und Argumentation | B2 | 85 | 981 | 6 | Paid |
| 18 | Formelle Kommunikation | B2 | 85 | 1,066 | 6 | Paid |
| 19 | Lesen und Verstehen | B2 | 85 | 1,151 | 6 | Paid |
| 20 | Gesamttraining | B2 | 85 | 1,236 | 6 | Paid |

**Main Journey totals: 1,236 words · 119 Etappen** (5 + 19×6).

Prerequisite chain: each area's `prerequisiteIds`/unlock condition is "previous area's
Finale completed" — the exact same completion-gates-the-next-stage rule already used for
Café→Reise→Schule→Freunde→Finale, just repeated at the area level. XP values and per-word
reward amounts for *new* areas are a future numbers decision, explicitly out of scope
here; existing values for the free area are not touched.

## Themed Expeditions

12 topic packs, unlocked once the learner has cleared a minimum number of Main Journey
areas (exact gate is a future decision — candidate rule: "Area 5 Finale cleared"). Each
pack = 10 vocabulary-pack sessions × 25 words, no Main/Listening/Finale subdivision (a
simpler, denser format befitting optional depth content):

| Pack | Theme | Words |
|---|---|---|
| 1 | Essen & Kochen (vertiefend) | 250 |
| 2 | Reisen intensiv | 250 |
| 3 | Business-Japanisch | 250 |
| 4 | Anime & Populärkultur | 250 |
| 5 | Medizin & Notfall | 250 |
| 6 | Recht & Verwaltung | 250 |
| 7 | IT & Technik | 250 |
| 8 | Kunst & Geschichte | 250 |
| 9 | Sport | 250 |
| 10 | Natur & Umwelt | 250 |
| 11 | Geld & Finanzen | 250 |
| 12 | Wissenschaft | 250 |

**Themed Expeditions totals: 3,000 words · 120 sessions** (12 × 10). All paid tier.

## Adaptive Mastery

Not a fixed map. Draws only from the canonical catalog, in two ways:

1. **Weak-word remediation** — reuses the existing `weakWords` mechanism (Trainingslager),
   scoped to whatever the learner has already been taught in Main Journey/Themed
   Expeditions. No new vocabulary, no new storage key.
2. **Advanced/long-tail pool** — **5,764 canonical entries** (JLPT N2–N1 range, low
   corpus-frequency vocabulary, specialized register) that are *never* delivered through a
   fixed Etappe. They exist purely as a catalog Adaptive Mastery's session generator can
   pull from once a learner has cleared enough of Main Journey to plausibly benefit
   (candidate gate: "Area 15 Finale cleared", i.e. B1 complete).

Session shape: on-demand, ~10–15 items per session, generated per learner from (a) their
current weak words and (b) a difficulty-matched slice of the advanced pool — not
pre-authored, so there is no fixed "session count" for this layer (see Risks).

## Area and Session Counts

```
Main Journey:        20 areas · 119 Etappen  (80 Main Quest + 19 Hör-Quest + 20 Finale)
Themed Expeditions:   12 packs · 120 sessions
Adaptive Mastery:     dynamic, no fixed count (session generator, not authored content)
---------------------------------------------------------------------------------------
Fixed, pre-authored sessions total: 239  (119 + 120)
```

Breakdown used above:
- Main Quest Etappen: Area 1 has 4, Areas 2–20 have 4 each → 4 + 19×4 = **80**
- Hör-Quest Etappen: Area 1 has 0, Areas 2–20 have 1 each → **19**
- Finale Etappen: every area has exactly 1 → **20**
- Total Main Journey Etappen: 80 + 19 + 20 = **119**

Average new words per Etappe (Main Journey): 1,236 / 119 ≈ **10.4** — kept deliberately
low per the brief's "don't overload a beginner Etappe" instruction; Area 1 alone averages
26/5 ≈ 5.2 new words/Etappe (today's actual, unchanged density), later areas trend higher
(≈13–17/Etappe) once a learner already reads hiragana/katakana fluently and needs fewer
scaffolding questions per word.

## Listening Progression

- **Free area (Erste Schritte in Japan): zero Listening Etappen**, matching this session's
  explicit "no Listening Unit in the free area" instruction and every prior session's
  scope.
- From Area 2 (**Alltag in Japan**) onward: **exactly 1 Hör-Quest per Main Journey area**
  → 19 Hör-Quest Etappen total across the whole Main Journey.
- Difficulty ramps with area level, per the brief:
  - **A0–A1 areas (2–5):** single words or 1–2 sentences, 5–15 seconds of audio.
  - **A2 areas (6–10):** short dialogues, 15–30 seconds.
  - **B1+ areas (11–20):** dialogues/announcements/explanations, 30–60 seconds.
- Themed Expeditions do not get dedicated Hör-Quest sessions in this phase (Phase 5); a
  later phase may add them without changing this document's word-count math (Listening
  reuses existing vocabulary, it doesn't add new canonical entries).

## AI Content Pipeline

AI is a **drafting and QA-assist tool**, never the final authority on what ships.

**AI may:**
- Draft candidate questions (prompt/choices/distractors) for a given canonical entry.
- Propose distractor sets for meaning-choice/fill-blank style questions.
- Draft example sentences for review.
- Generate personalized Adaptive Mastery sessions from a learner's weak words + the
  advanced pool.
- Suggest synonym/antonym pairs and flag likely duplicate entries.
- Suggest a `cefrEstimate`/`jlptLevel` for a candidate entry.
- Assist QA (run the same automated checks a human reviewer would, faster).

**AI may never, unattended:**
- Decide a candidate vocabulary entry is `sourceStatus: "canonical"`.
- Pick the final correct answer for an ambiguous question.
- Resolve a "this question has two valid answers" conflict.
- Certify Japanese grammatical correctness or German translation quality as final.
- Approve content for publication (`curatedStatus: "published"` requires a human step).

**Required automated validation** (every generated question, before any human sees it):
- Matches its JSON schema (matches the existing `QuizQuestion` shape).
- `answer` is present in `choices`; `choices` has no duplicates.
- No more than one choice is semantically valid for the prompt (multi-correct check).
- No English text leaks in (reusing the word-boundary regex approach already used for
  Sub Quest QA in this project).
- No copy-match (prompt literally equal to the answer).
- Flags on: unnaturally long sentences, off-topic vocabulary, undefined prerequisite words
  used in a distractor/example without being taught yet (checked against
  `prerequisiteIds`).

## Human Review Policy

Review depth scales with the content layer — this is the lever that makes 10,000 words
economically realistic without lowering Main Journey's bar:

- **Main Journey (1,236 words, 119 Etappen):** full manual QA per Etappe, same standard
  as today's 26-word free area (see `docs/SUBQUEST_CONTENT_QA_V2.md` for the bar). Every
  question hand-reviewed before publish.
- **Themed Expeditions (3,000 words, 120 sessions):** AI-drafted, then human **spot-check
  sampling** (a fixed percentage per pack, e.g. 20% of items, plus 100% of any item an
  automated check flagged) rather than 100% manual review of every item.
- **Adaptive Mastery (5,764-word pool + dynamic sessions):** automated validation only at
  the catalog level (the 5,764 entries themselves go through the same canonical-vocabulary
  approval gate as any other entry); individual AI-generated *sessions* built from that
  pool at runtime are not manually reviewed per session — the safety net is the automated
  checks above, applied at generation time.

## Map Scalability

10,000 words are never one page. Proposed route structure (**documented here, not
implemented**):

- `/` — today's Home, becomes "current world's map" (what Part 1 of this session built).
- `/journey` — Main Journey overview: the 20 areas as a world list (locked/unlocked, like
  today's single Reisefortschritt bar, one row per area).
- `/journey/[areaId]` — one area's map, using the exact `QuestMap` component built in Part
  1 of this session (one row per Etappe — already proven not to overlap regardless of
  Etappe count).
- `/expeditions` — Themed Expeditions list (12 packs as cards, not a road map — depth
  content doesn't need a narrative path).
- `/expeditions/[packId]` — one pack's 10 sessions.
- `/mastery` — Adaptive Mastery / AI Coach entry point (today's Trainingslager card is the
  seed of this).

Nothing above is routed today. The reason `QuestMap` (Part 1) was built as one-row-per-
stage in normal document flow instead of one giant absolutely-positioned canvas is
precisely so `/journey/[areaId]` can render any of the 20 areas' 5–6 Etappen through the
same component without new layout work — the component does not know or care whether it's
showing 5 stages or 119.

## Free and Paid Boundaries

- **Free:** Area 1 (Erste Schritte in Japan) only — unchanged from today. 26 words.
- **Paid, Phase 2+:** Area 2 (Alltag in Japan) onward, all of Main Journey areas 2–20, all
  Themed Expeditions, all of Adaptive Mastery.
- Exact pricing/paywall mechanics are out of scope (monetization is explicitly excluded
  from this and prior sessions) — this section only marks *where* the boundary sits.

## Release Phases

- **Phase 1 — Free area complete.** Today's Café→Finale Wiederholung, game-feel and
  retention validated. *(Current state after this session's Quest Map rework.)*
- **Phase 2 — Alltag in Japan.** Area 2 built (Main Quest + Hör-Quest + Finale), learning
  history introduced.
- **Phase 3 — Accounts.** Login, database, monetization, cross-device progress sync.
- **Phase 4 — AI Coach.** AI Chat, weak-vocabulary analysis, AI-personalized practice
  questions (the beginning of Adaptive Mastery, using the pipeline defined above).
- **Phase 5 — Themed Expeditions.** All 12 packs, intermediate vocabulary breadth.
- **Phase 6 — Full catalog.** Remaining Main Journey areas completed, the 5,764-word
  Adaptive Mastery pool populated, advanced-learner routes opened.

## Risks

- **Authoring cost at scale.** Main Journey alone (1,236 words) implies roughly 12,360
  Sub-Quest-style questions at today's 10-questions-per-word density, plus ~480 Main Quest
  questions — full hand-authoring at the current bar (as used for the 26-word free area)
  does not scale past a few areas without the AI-assisted pipeline above; Themed
  Expeditions (3,000 words) are explicitly *not* held to full hand-authoring for this
  reason.
- **Prerequisite drift.** As areas are added, `prerequisiteIds` must stay accurate or
  later Etappen will quietly use un-taught vocabulary in distractors/examples — the
  automated check listed above is required, not optional, once content volume exceeds
  what a human can eyeball.
- **Duplicate/near-duplicate entries.** At 10,000 entries, near-duplicate headwords
  (formal/informal register pairs, synonyms) risk being miscounted as distinct canonical
  words; `sourceStatus: "candidate"` plus a dedicated dedup pass before promotion is the
  mitigation.
- **Level/CEFR estimate drift.** `cefrEstimate`/`jlptLevel` on AI-drafted candidate entries
  are a *suggestion*; without periodic human recalibration against a real corpus, area
  difficulty could quietly creep, defeating the "don't overload beginners" goal this
  document is built around.
- **Map component assumptions.** `QuestMap`'s lane-cycle algorithm (Part 1) was verified
  up to 5 stages; before routing a 20-Etappe area through it (Phase 2), it should be
  re-verified at that length specifically (still expected to hold, since the mechanism is
  per-row and count-independent by design, but not yet measured at that scale).

## Next Implementation Priorities

1. Build `worldMapData`-equivalent metadata for Area 2 (Alltag in Japan) and its 6
   Etappen, reusing the exact `QuestMap`/`QuestStageDetails` components from Part 1.
2. Stand up the canonical vocabulary catalog schema (even empty/seed-only) so Area 2's
   words have real `id`s from day one instead of ad-hoc string ids.
3. Prototype the AI drafting pipeline against a single Themed Expedition pack (smallest
   blast radius) before pointing it at Main Journey content.
4. Define the actual paywall/unlock rule for "Area 2 onward is paid" (Phase 3 concern,
   but the *rule*, not the payment mechanism, should be settled before Area 2 ships).
