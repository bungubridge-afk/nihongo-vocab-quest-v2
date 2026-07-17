# Area 1 Comprehensive QA

Scope: the free Area 1 "Erste Schritte in Japan" (Café → Reise → Schule → Freunde →
Finale Wiederholung), audited end-to-end against the current code, a fresh production
build, and live browser behaviour. Nothing in this report is carried over from earlier
QA documents — every claim below was re-derived this pass.

> **Update — final tap-target + auto-scroll pass.** After the initial audit, a follow-up
> pass (1) enlarged every mobile touch target found below 44px and (2) recorded the
> user's manual real-browser confirmation of the Home auto-scroll. Both previously-open
> items (AREA1-04, AREA1-05) are now **Resolved & verified**. The verdict is upgraded to
> **Pass — ready for limited external user testing**. Sections below marked "Update:"
> reflect this pass; the original findings are kept for traceability.

## Executive Summary

- **Final verdict: Pass — Ready for limited external user testing**
- **External user test readiness: Yes**, for the intended audience (German-speaking
  learners on desktop/tablet/mobile). No open P0/P1/P2/P3.
- **P0: 0**
- **P1: 0 remaining** (1 found, fixed, verified)
- **P2: 0 remaining** (3 found, all fixed & verified)
- **P3: 0 remaining** (1 found, resolved via manual real-browser verification)

The learning content itself is in strong shape: all 45 Main Quest questions, all 260 Sub
Quest questions, all 26 Speaking Challenges and all 26 vocabulary entries passed every
structural, answer-integrity, language-quality and romaji-convention check with **zero**
defects. Both full playthrough routes complete correctly with exact reward maths.

The one P1 was **not** a content bug: the Onboarding gate was impossible to complete
without a mouse, which locked keyboard and screen-reader users out of the entire app. It
is fixed and verified. The remaining P2 (sub-44px touch targets) and P3 (auto-scroll
observability) are both now closed — see the Updates in the Responsive Audit and
Auto-Scroll Audit sections and the AREA1-04 / AREA1-05 entries.

## Baseline Inventory

Measured directly from `questData.ts` / `vocabData.ts` / `subQuestData/*`. **Every value
matches the expected baseline exactly — zero deltas.**

| Category | Main Quest | Vocab | Sub Quest | Speaking | rewardXp | Cards | unlocksNext |
|---|---|---|---|---|---|---|---|
| Café | 5 | 5 | 50 | 5 | 50 | 5 | reise |
| Reise | 10 | 11 | 110 | 11 | 80 | 11 | schule |
| Schule | 10 | 5 | 50 | 5 | 100 | 5 | freunde |
| Freunde | 10 | 5 | 50 | 5 | 110 | 5 | review |
| Finale (`review`) | 10 | 0 | 0 | 0 | 150 | 0 | — (terminal) |
| **TOTAL** | **45** | **26** | **260** | **26** | **490** | **26** | |

Level thresholds (`levelSystem.ts`): `[0, 50, 150, 280, 450]`, then +170 XP per level.
Level at 490 XP (Area 1 complete) = **4** (40/170 into the level, 130 XP to Level 5).

localStorage keys (7, unchanged, none added): `nvq_profile`, `nvq_xp`,
`nvq_collected_cards`, `nvq_completed_categories`, `nvq_unlocked_categories`,
`nvq_known_words`, `nvq_weak_words`.

## Files Inspected

`package.json`; `src/app/{page,layout}.tsx`; `src/app/{lesson,practice,review,vocabulary}/page.tsx`;
`src/app/globals.css`; `src/components/ui/*` (Badge, Button, Card, FeedbackPanel,
ProgressPill, QuestMap, QuestNode, QuestStageDetails, RegisterBadge,
UsageExampleComparison, index); `src/lib/*` (questData, vocabData, quizBuilder,
levelSystem, registerData, sound, speech, speechRecognition, storage, vocabularySearch,
worldMapData); `src/lib/subQuestData/*`; `src/types/learning.ts`; existing `docs/*` QA
reports.

## Files Changed

Only three product files were touched (minimal-fix rule):

1. `src/components/ui/Card.tsx` — clickable Cards get the ARIA button pattern (P1 fix).
2. `src/app/globals.css` — `:focus-visible` extended to `[role="button"]` (supports the P1 fix).
3. `src/lib/questData.ts` — `freunde-q8` gains `answerKana: ""` (P2 fix).

No question was added/removed, no vocabulary added, no XP/Level/unlock rule changed, no
localStorage key added.

## Main Quest Audit

All 45 questions passed, mechanically, on: unique ids, valid `type`, non-empty
`prompt`/`instruction`, exactly 4 choices, no duplicate choices, `answer ∈ choices`,
`prompt !== answer`, no copy-match (prompt never appears verbatim among choices for
recall types), `isChallenge` only on the last question, `categoryId` consistency, valid
`vocabId` references, no English leakage, and romaji conventions
(は→wa, を→o, 学校→gakkou, 今日→kyou, 勉強→benkyou, 日本語→nihongo, 友だち→tomodachi,
明日→ashita, ください→kudasai). An ambiguity heuristic confirmed no `meaning-choice` /
`japanese-choice` question has two choices mapping to the target's meaning.

- **Café (5)** — pass. Teaches 水/コーヒー/パン/食べる/飲む, `〜をください`, and と for
  listing. The challenge answer `コーヒーとパンをください。` is natural staff-facing
  ordering; no casual imperative is taught anywhere; ください is never described as
  尊敬語 (verified in every Café tip).
- **Reise (10)** — pass. The 11 words in code are: 駅 station, ホテル hotel, 電車 train,
  トイレ toilet, 行く go, どこ where, すみません excuseMe, 右 right, 左 left, 近い near,
  遠い far — matching the brief's list. に (destination) vs で (means/location) used
  correctly; `電車でホテルに行きます。` and `すみません、トイレはどこですか。` are natural.
  No unseen transport vocabulary introduced.
- **Schule (10)** — pass. Particles taught one per question: に=Ziel, で=Ort, を=Objekt,
  は=Thema, と=Begleitung, culminating in `今日は学校で日本語を勉強します。`. The 先生
  explanation is appropriately scoped for beginners.
- **Freunde (10)** — pass. Locker/Höflich contrast is a true minimal pair: Q8's
  `明日は学校に行く。` / `明日は学校に行きます。` differ **only** in the verb ending (the
  は-drop confound is not present — verified in the live prompt). Tips consistently frame
  casual as *not a grammar mistake* ("ist nicht falsch, klingt aber … zu locker"), and
  never present polite as the sole correct form. No anime/rough register anywhere.
- **Finale (10)** — pass. `rewardXp: 150`, `collectedCardIds: []`, no `unlocksNext`
  (terminal) — all confirmed in code and live. A kanji-stem scan of every correct answer
  found **no kanji outside the 26-word inventory**, i.e. no new vocabulary and no new
  grammar. All 26 words are reintroduced.

## Sub Quest Audit

All 260 questions (26 words × 10) passed mechanically: each word has exactly 10
questions, ids unique app-wide (checked against Main Quest ids too), Q1–Q9 are
choice-based with 4 unique choices and `answer ∈ choices`, Q10 is `speaking` for every
word, no English leakage, no copy-match, `vocabId` ownership correct, and romaji
conventions hold. A template-duplication check (distinct prompts across Q1–Q9) passed for
all 26 words — no word is a mechanical clone of another.

Visual audit sampled across types and categories: `coffee` (noun/katakana, Café),
`water`/`bread`/`drink`/`eat` (Café nouns + verbs), `station`/`hotel`/`train`/`toilet`
(Reise nouns), `go` (verb), `where` (question word), `right`/`left`/`near`/`far`
(direction/adjective), `school`/`teacher`/`japaneseLanguage`/`study`/`today` (Schule
nouns/verb/time), `friend`/`meet`/`talk`/`tomorrow`/`like` (Freunde, casual/polite
pairs). `coffee` was additionally played end-to-end in the browser.

Kana/romaji are consistent between Main Quest and Sub Quest (no contradictions found).
`quizBuilder.getFeedbackPayload`'s vocabData fallback behaves as designed (Sub Quest
questions intentionally inherit word-level tips) — with one exception that was the P2
below.

## Speaking Challenge Audit

All 26 present as each word's Q10. `speechRecognition.ts` verified by reading:
`SpeechRecognition ?? webkitSpeechRecognition`, `lang = "ja-JP"`, `maxAlternatives = 3`,
`interimResults=false`, `continuous=false`. Normalization does NFKC → lowercase → strips
whitespace and JP/Latin punctuation → folds katakana to hiragana. Matching is
**full-sentence exact equality** (no substring), so saying only the keyword does not pass.

Robustness: a `settled` guard ensures exactly one of `onResult`/`onFailure` fires,
followed by exactly one `onEnd` (no double-fire); `start()` throwing (session already
running) is caught and reported rather than crashing — so no double-start and no infinite
wait; `abort()` marks settled first so a late result can't fire into an unmounted
component; unsupported browsers return `null` from `startJapaneseRecognition` and
`isSpeechRecognitionSupported()` is false during SSR. Mic denial maps
`not-allowed`/`service-not-allowed` → `permission-denied`.

Automated check: every `acceptedTranscripts` entry normalizes non-empty, and each
question's own `speechText` matches its own accepted list (26/26).

**Scoring (verified live, matches spec):** Speaking is skippable (`canSkip: true` on all
26) and the result is scored out of the **9** choice questions. `coffee` with 0/9 →
`weakWords: ["coffee"]`, `knownWords: []`, screen reads "0 / 9 richtig … Sprechen
übersprungen". Replayed with 9/9 → `knownWords: ["coffee"]`, `weakWords: []` (the weak
entry is cleared). No duplicate result sound observed.

## Vocabulary Data Audit

All 26 words have every required field non-empty (`id`, `kanji`, `kana`, `romaji`,
`german`, `categoryId`, `exampleJapanese`, `exampleKana`, `exampleGerman`, `shortTip`,
`detailTip`). No duplicate ids; all `categoryId`s valid; every word is granted by
**exactly one** category's `collectedCardIds` (no word ungranted, none double-granted);
every `collectedCardIds` entry resolves to a real word in that same category. No English
leakage in German fields; romaji conventions hold; no `exampleKana` contains kanji.

## Register and Situation Audit

Register lives on `UsageExample` (per sentence), never on `VocabItem` as a whole —
confirmed in `types/learning.ts`. `usageExamples` is optional; 10 words carry it (5
Schule + 5 Freunde), 20 examples total, all ids unique. Every `contrastGroup` has exactly
one `casual` + one `polite` whose German meanings match (verified programmatically), so
each pair is a genuine same-meaning contrast. `suitableFor` is non-empty everywhere.
**No example marks `casual` as suitable for `teacher`** (or `stranger`).
`honorific`/`humble` are used by **zero** examples — correct for A0–A1.
`getSituationLabel("classmate")` returns **"Klassenkameraden"**. `UsageExampleComparison`
sorts casual-before-polite deterministically regardless of source order. `RegisterBadge`
always renders its German label as text, so register is never colour-only.

## Vocabulary UI Audit

26 cards render; collected cards show kanji/kana/romaji/German + example + tips;
uncollected show `???` with no data; pronunciation button present with
`aria-label="Aussprache hören"`; "Karte üben" navigates with the correct word id;
Register comparison expands per card with `aria-expanded` + `aria-controls`; category
filter (Kategorie) and Sprachstil filter (Alle/Locker/Höflich) both work and AND-combine
with search. Result count renders in a scoped `aria-live="polite"` region.

## Vocabulary Search Privacy Audit

**Pass — no leakage.** Verified at two levels:

1. **Code level (getter instrumentation).** Every word's `kanji`/`kana`/`romaji`/`german`
   was replaced with a getter that throws if read. `buildVocabularySearchIndex` was then
   run with the real collection predicate (16 collected / 10 hidden). It **did not
   throw**: the index was built from 16 collected cards and the 10 hidden cards' text
   fields were **never read at all**. A sanity check confirmed the instrumentation was
   live (reading a hidden getter directly does throw), so the no-throw result is
   meaningful. Hidden cards never entered the index, and a hidden word's kanji matched
   nothing in it.
2. **Browser level (partial-collection state).** Searching a hidden word's exact kanji
   (`学校`), romaji (`gakkou`), kana (`がっこう`) and German (`Schule`) each returned
   **"0 Wortkarten"**. Scanning the DOM with the search input itself removed from the
   scan showed **zero** occurrences of the hidden word's kanji, kana, romaji or German
   example. (An initial naive scan appeared to show leakage; that was the user's own
   typed query echoed in the input's `value`, not card data — confirmed by re-scanning
   with the input excluded.) A collected word (`koohii`) still returned its card;
   an empty query still renders all 26 including `???` placeholders.

Search behaviour verified: exact/partial, case-insensitive (`GAK`, `SCHULE`), NFKC
full-width (`Ｇａｋｋｏｕ`), katakana↔hiragana fold (`こーひー` finds コーヒー),
whitespace trim, multi-token AND (`学校 Schule` matches; `学校 Kaffee` doesn't), and
0-result state with "Suche löschen".

## Quest Map Audit

One row per Etappe (5 rows). Mechanical `getBoundingClientRect()` checks at 375/768/1280
found **zero** row-to-row overlaps and **zero** node-vs-card overlaps at every width.
Current stage shows "Du bist hier"; completed/locked states render distinctly; the Finale
row has its sandō approach decoration; next-area preview "Alltag in Japan / Demnächst"
renders; sidebar is `position: sticky` at desktop. Locked stages expose no Starten
control, and direct URL access to a locked category is blocked ("Diese Kategorie ist noch
gesperrt."). Selecting a node only changes the detail panel — it never navigates.

## Auto-Scroll Audit

Target selection is correct and unambiguous at every progress state (exactly one
`[data-quest-scroll-target="true"]` and at most one `[data-current="true"]`):

| Progress | Target | Verified |
|---|---|---|
| 0/5 | Café (current) | ✓ |
| 2/5 | Schule (current) | ✓ |
| 5/5 | Finale (completed — `currentCount: 0`, fallback works) | ✓ |

Logic verified: at 2/5 the Schule row measured `top: 868, bottom: 1118` in an 800px
viewport → `alreadyVisible` correctly evaluates **false** → `scrollIntoView({block:
"center"})` lands the row centre at exactly the viewport centre (offset **0**), fully
visible; a second run would then correctly skip (`alreadyVisible` true → idempotent). At
0/5 the Café row was already on screen (`top: 368`) and was correctly **not** scrolled.
`document.activeElement` stayed `BODY` throughout — focus is never stolen. Selecting a
different node did **not** re-fire the scroll. Reduced-motion is handled in JS
(`behavior: prefersReducedMotion ? "auto" : "smooth"`).

**Limitation (environment, not product):** the effect schedules its scroll inside a
2×`requestAnimationFrame` chain, and this automation browser reports
`document.visibilityState === "hidden"`, where browsers pause rAF. A direct probe
confirmed **`rafFires: 0`** and that `behavior: "smooth"` cannot animate while hidden,
while an instant `scrollIntoView` works. So the scroll could not be observed firing
*by itself* here. This is an artifact of the headless/backgrounded tab, not a defect: a
real user's visible tab fires rAF normally. Everything the effect does once rAF fires
(target choice, visibility test, centring, focus preservation, idempotency) was verified
by replicating the effect body against the live DOM.

**Update — Resolved / verified manually.** The user has since confirmed in a real, visible
browser window that opening Home smoothly scrolls to the current Etappe and lands on the
correct row. Combined with the logic verification above (correct target at 0/5, 2/5, 5/5;
`alreadyVisible` false at top=868 → centres to viewport centre with offset 0; skip when
already visible; focus untouched; no re-fire on node select), this closes the item. The
non-firing seen in this QA environment was solely the hidden-tab rAF pause, **not** a
product defect. `QuestMap.tsx` was not modified. **AREA1-05: Resolved (manually verified);
removed from remaining P3s.**

## Onboarding Audit

Shows only on first visit (fresh `localStorage`); 5 questions, one per screen, with
"Fortschritt n/5" and a progress bar; "Zurück" is present and correctly disabled on step
1; selections persist into `nvq_profile`; completing it lands on Home with no double
transition and no Hydration error; a saved profile goes straight to Home on revisit;
"Lernplan anpassen" clears the profile and re-enters Onboarding. No Home auto-scroll runs
during Onboarding (QuestMap isn't mounted — Home early-returns before it).

This is where the **P1** lived — see AREA1-01.

## XP / Level / Reward Audit

Full-correct route, measured live from a genuinely fresh state (0 XP / 0 cards / Level 0):

| Step | XP delta | Total | Level | Cards | Unlock message |
|---|---|---|---|---|---|
| Café | +50 | 50 | 0→1 | 5 | "Reise freigeschaltet" |
| Reise | +80 | 130 | 1 | 11 | "Schule freigeschaltet" |
| Schule | +100 | 230 | 1→2 | 5 | "Freunde freigeschaltet" |
| Freunde | +110 | 340 | 2→3 | 5 | "Finale Wiederholung freigeschaltet" |
| Finale | +150 | **490** | 3→4 | **0** | (none — terminal) |

Totals: **490 XP**, **26 cards**, **Level 4**, **5/5 Etappen** — exactly as specified.

Level boundaries verified programmatically at and around every threshold: 0→L0, 49→L0,
50→L1, 51→L1, 149→L1, 150→L2, 151→L2, 279→L2, 280→L3, 281→L3, 449→L3, 450→L4, 451→L4,
490→L4, 619→L4, 620→L5. `getLevelProgress(0)` = Level 0; negative XP is clamped.

## Unlock Audit

`getInitialUnlockedCategories()` = `["cafe"]`. The chain
`cafe → reise → schule → freunde → review` was verified for every intermediate completed
set, and `questData`'s `unlocksNext` values agree with `levelSystem`'s chain (no drift
between the two sources). Finale has no `unlocksNext` (terminal). Direct URL access to a
not-yet-unlocked category is blocked.

## Replay Audit

Replaying a completed Café (including a deliberate wrong answer first): XP **490 → 490
(+0)**, cards **26 → 26 (0 new)**, result screen shows "Wiederholung abgeschlossen",
"+0 XP" and the existing explanatory note; no re-unlock, no duplicate award. The
first-clear guard in `storage.recordCategoryCompletion` (untouched) is idempotent.

## localStorage Audit

7 keys, none added this pass. `readJSON` wraps `JSON.parse` in try/catch and returns the
caller's fallback, so malformed JSON, absent values and wrong types degrade safely rather
than throwing; `writeJSON` swallows quota/private-mode failures. Verified live: a
corrupted profile / cleared storage returns to Onboarding cleanly; unknown ids in
`collectedCards` are harmless (membership tests only); an invalid `?word=` id renders
"Wortkarte nicht gefunden." rather than crashing. Reload and re-seeded states behaved
consistently throughout this pass.

## Sound Audit

`sound.ts` guards Web Audio behind availability checks and try/catch, so an unsupported
or restricted `AudioContext` cannot crash the app. Correct/incorrect answer sounds and
the result sounds fire once per action; the Result screen's play-once ref guard prevented
duplicate playback on replay. Audio is a nice-to-have path and never blocks progression.
(Audible output itself is not observable in this environment — verified by code reading
and by the absence of any thrown error across the full playthrough.)

## Speech Audit

`speech.ts` (TTS) checks `"speechSynthesis" in window`, wraps everything in try/catch,
picks a Japanese voice (`ja-JP`) with a female-voice hint list and falls back to the
first Japanese voice, and no-ops safely when unsupported. Pronunciation buttons carry
`aria-label="Aussprache hören"` (Vocabulary) / `"Aussprache anhören"` (Speaking
Challenge). Recognition is covered under Speaking Challenge Audit above.

## Responsive Audit

Mechanically measured (`getBoundingClientRect`, `scrollWidth` vs `innerWidth`):

- **375px** — no horizontal overflow on Home/Vocabulary/Lesson (`scrollWidth === 375`);
  zero quest-row overlaps; no element wider than the viewport; Register comparison stacks
  to **1 column** (`grid-template-columns: 310px`); search field and its 44×44px clear
  button sit inside the viewport; Lesson answer choices are **52px** tall.
- **768px** — no overflow (`753 ≤ 768`); zero row and node/card overlaps.
- **1280px** — no overflow; zero overlaps; sidebar `position: sticky` intact.

Tap targets (original audit): all **primary** interactions met 44px, but secondary
`size="sm"` buttons and a few icon/disclosure controls measured **20–40px** — see
AREA1-04.

**Update — 44px audit after the fix (mechanical, `getBoundingClientRect` at 375px, every
visible interactive element per page).** All offenders resolved; **0 elements under 44px**
on every page:

| Page | Interactive elements | Under 44px (before → after) |
|---|---|---|
| Onboarding | 7 | (options were Cards ≥52px) → **0** |
| Home | 17 | 6 → **0** |
| Lesson (question) | 5 | 1 (Abbrechen) → **0** |
| Lesson (feedback open) | 7 | "Mehr anzeigen" → **0*** |
| Vocabulary (comparison open) | 72 | 32 → **0** |
| Practice Q1 | 5 | 1 → **0** |
| Practice Q10 (Speaking) | 4 | 2 → **0** |
| Practice Result | 2 | 0 → **0** |
| Review | 3 | 3 → **0** |

No horizontal overflow at any point. The pronunciation buttons are now **44×44** with the
glyph unchanged (Vocabulary icon still 16×16, Speaking icon still 20×20).

*\* "Mehr anzeigen" (the feedback-panel detail toggle) has a computed **44px** layout box
(`min-height: 44px`, `height: 44px`); `getBoundingClientRect` reports 43.1px **only** in
this automation environment because `document.visibilityState === "hidden"` freezes the
panel's `pop-in` keyframe at its `from` state (`scale(0.98)`), scaling the whole panel —
the primary "Weiter" button in the same panel is scaled identically. Forcing the settled
(post-animation) state, exactly as a real visible browser reaches within 0.18s, yields
**44px** (`passesWhenSettled: true`). Same root cause as AREA1-05; not a product defect.*

## Accessibility Audit

- Real `<button>` elements for lesson/practice choices, quest nodes, filters, pagination.
- `ProgressPill` correctly renders a real `<button>` when clickable (with `aria-label`).
- `aria-expanded` + `aria-controls` on the Register comparison toggle (verified live).
- `aria-pressed` on quest nodes; `aria-label` naming each node and its status.
- `:focus-visible` outline applies to `button, a, summary` and now `[role="button"]`.
- Result count uses a scoped `aria-live="polite"` containing only the count text — no
  over-announcement.
- Decorative SVGs are `aria-hidden="true"`; register/state are never colour-only.
- Auto-scroll never moves focus (`activeElement` stayed `BODY`).
- Uncollected words never appear in any `aria-label` or `data-*` attribute.
- Reduced motion respected in both CSS and the auto-scroll JS.
- **Update:** all mobile touch targets now ≥44px (see the Responsive Audit table) — the
  WCAG 2.5.5 (Enhanced) target size is met, not just the 2.5.8 minimum.

The **P1 keyboard lockout** (AREA1-01) was the one significant failure here; it is fixed,
and the sub-44px touch-target gap (AREA1-04) is now also fixed & verified.

## Route Audit

All routes loaded with **zero console errors, zero server errors and no Hydration
errors**: `/`, `/lesson?category=cafe|reise|schule|freunde|review`, `/vocabulary`,
`/review`, `/practice?word=coffee` (valid), `/practice?word=school` (valid id but
uncollected → correctly blocked, no data leak), `/practice?word=does-not-exist` (invalid
→ "Wortkarte nicht gefunden."). Locked category via direct URL → "Diese Kategorie ist
noch gesperrt."

Note: `/vocabulary` intermittently 404'd in the dev server until `.next` was cleared —
a Turbopack dev-cache artifact only. The production build prerenders `/vocabulary`
correctly and the route works after a clean start; not a product defect.

## Console / Hydration Audit

No console errors, no React key warnings, no Hydration mismatches observed on any route,
during either playthrough route, or during any filter/search/comparison interaction.
`npm run build` reports no TypeScript errors. Server log clean throughout.

## Automated Validation

A temporary harness (compiled to CommonJS with a throwaway `tsconfig`, run under Node
with a small `@/` path-alias shim, all deleted afterwards — no new dependency, no change
to product imports) validated, against the real data:

Main Quest 45 · Sub Quest 260 · Speaking 26 · Vocab 26 · UsageExamples 20 · id
uniqueness (app-wide) · referential integrity (`vocabId`, `collectedCardIds`) · choices
count/uniqueness · `answer ∈ choices` · copy-match · multiple-correct heuristic ·
tips presence · English-leak regex · romaji conventions · reward/cards/unlock values ·
unlock chain vs `questData` agreement · Finale coverage + no-new-kanji · search privacy
via getter instrumentation · Level boundaries.

**Final run: `P0: 0  P1: 0  P2: 0  DELTA: 0 — OK: no problems found.`**

## Browser Playthrough

**A. Full-correct route.** Fresh `localStorage` → Onboarding (5/5) → Home (Level 0, 0 XP,
0 cards, Café current, all others Gesperrt) → Café 5/5 → Reise 10/10 → Schule 10/10 →
Freunde 10/10 → Finale 10/10 → Home. Ended at **XP 490, 26 cards, Level 4, 5/5 Etappen,
all completed**, next-area preview shown, auto-scroll target = completed Finale.

**B. Wrong-answer + replay route.** Deliberate wrong answer showed "Leider falsch" with
the correct answer, its kana/romaji/German, the Beispiel block and the tip; re-answering
and completing worked; replay gave **+0 XP / 0 new cards** and "Wiederholung
abgeschlossen" with no re-unlock.

**C. Sub Quest.** `coffee` played twice end-to-end: 0/9 → `weakWords`; 9/9 →
`knownWords` (and weak cleared). Speaking Challenge Q10 reached both times, showing
sentence + kana + romaji + German with **Sprechen** / **Überspringen**; skip is
non-penalising and scores out of 9. (Actual microphone recognition — success/retry paths
— is not exercisable in this environment; covered by code audit instead.)

## Issues Found

### AREA1-01 — Onboarding cannot be completed without a mouse
- **Severity: P1**
- **File:** `src/components/ui/Card.tsx` (root cause); surfaced at `src/app/page.tsx:227`
- **Location:** `Card` rendered `<div onClick={onClick}>` with no `role`, no `tabIndex`,
  no key handler. Onboarding answers are `<Card onClick=…>`.
- **Reproduction:** Clear `localStorage` → open `/` → try to answer with keyboard only.
- **Expected:** Options are reachable by Tab and activatable with Enter/Space.
- **Actual:** `document.querySelectorAll('a[href], button:not([disabled]), input, …')`
  returned **0 focusable elements** on the first screen ("Zurück" is disabled at step 1).
  Options were `DIV`, `role: null`, `tabIndex: -1`. Since Onboarding is a mandatory gate
  before Home, keyboard-only and screen-reader users were locked out of the **entire app**.
- **Fix:** `Card` now applies the standard ARIA button pattern when (and only when)
  `onClick` is provided: `role="button"`, `tabIndex={0}`, and an `onKeyDown` handler for
  Enter/Space (Space `preventDefault`'d so activation never scrolls the page). It stays a
  `<div>` deliberately — cards hold block content and inherit surrounding text alignment,
  so converting to `<button>` would have centred the Trainingslager card's text.
  `globals.css` `:focus-visible` extended to `[role="button"]` so the focus ring shows.
- **Verification:** Focusable elements on the first screen **0 → 6**; all 6 now
  `role="button"`, `tabIndex=0`. Enter advanced 1/5 → 2/5. Space activated and was
  `defaultPrevented` with `scrollY` unchanged. The **entire Onboarding was then completed
  using only keyboard events**, reaching Home with `nvq_profile` saved. Non-interactive
  Cards were confirmed unaffected (`/vocabulary` has `roleButtonCount: 0` across its 51
  cards).
- **Status: Fixed & verified.**

### AREA1-02 — Home "Trainingslager" card not keyboard operable
- **Severity: P2**
- **File:** `src/app/page.tsx:449` (same `Card` root cause)
- **Reproduction:** Home → Tab; the Trainingslager card could not be reached/activated.
- **Expected/Actual:** Should be operable; was mouse-only.
- **Mitigation at the time:** a separate "Wiederholung" button already navigated to
  `/review`, so no functionality was unreachable — hence P2, not P1.
- **Fix:** resolved by the same `Card` change (no page-level edit needed).
- **Verification:** now `role="button"`, `tabIndex: 0`, and `text-align` still `start`
  (no visual regression).
- **Status: Fixed & verified.**

### AREA1-03 — `freunde-q8` feedback showed an unrelated word's reading
- **Severity: P2**
- **File:** `src/lib/questData.ts` (`freunde-q8`); mechanism in `quizBuilder.ts:39`
- **Reproduction:** Play Freunde to Q8 and answer it; read the line under the answer.
- **Expected:** No reading, since the answer (`"Freund → Satz A, Lehrkraft → Satz B"`) is
  a German mapping label containing no Japanese.
- **Actual:** `getFeedbackPayload` falls back to `vocab?.kana` when `answerKana` is
  undefined, and the question sets `vocabId: "friend"` — so the panel rendered
  **"ともだち · Morgen gehe ich zur Schule."**, presenting 友だち's reading as the reading
  of that German answer. 友だち appears in neither Satz A nor Satz B (both are about
  学校/行く), so this is actively misleading. Confirmed live before the fix.
- **Fix:** `answerKana: ""` on `freunde-q8` — empty rather than omitted, because `??`
  only falls back on `undefined`. No shared code touched (avoiding regression across all
  other questions that rely on the fallback intentionally). The two sentences and their
  kana remain visible in the Beispiel block.
- **Verification:** panel now reads `Freund → Satz A, Lehrkraft → Satz B` /
  `Morgen gehe ich zur Schule.` — ともだち gone; automated re-run reports 0 P2.
  It is the only question in all 305 with a non-Japanese answer plus a `vocabId`.
- **Status: Fixed & verified.**

### AREA1-04 — Some mobile touch targets below 44px
- **Severity: P2 — Fixed & verified**
- **Files:** `src/components/ui/Button.tsx` (`SIZE_CLASSES.sm`),
  `src/components/ui/FeedbackPanel.tsx` (detail toggle),
  `src/app/vocabulary/page.tsx` (pronunciation button),
  `src/app/practice/page.tsx` (Speaking pronunciation button),
  `src/app/page.tsx` (`<summary>` "Wofür sind XP?").
- **Mechanical 375px baseline (before):** `size="sm"` buttons **33px** (Wortkarten-Sammlung,
  Wiederholung, Lernplan anpassen, Starten/Wiederholen ×5, Zur Karte, Karte üben ×26,
  Abbrechen, Zur Sammlung, Zur Wortkarten-Sammlung); FeedbackPanel "Mehr anzeigen"
  **96×20**; Home `<summary>` "Wofür sind XP?" **133×24**; Vocabulary pronunciation
  **36×36**; Speaking pronunciation **40×40**.
- **Expected:** ≥44px touch target at 375px.
- **Fix (minimal, no visual/layout change):**
  - `Button.tsx` `SIZE_CLASSES.sm` gains `min-h-11` (44px). The label keeps its own
    `text-sm` size; the extra height is absorbed by the existing flex centering, so the
    button still *looks* `sm` — only its hit area grows. `md`/`lg` already exceeded 44px.
  - `FeedbackPanel` detail toggle gains `inline-flex min-h-11 items-center` (matching the
    Vocabulary comparison toggle's existing pattern).
  - Both pronunciation buttons go from `h-10 w-10`/`p-2`→ `h-11 w-11` (44×44); **the SVG
    glyph is unchanged** (Vocabulary 16×16, Speaking 20×20) — only the tappable circle grew.
  - Home `<summary>` gains `min-h-11`.
- **Impact of the shared `Button` change:** verified safe. `sm` is used across Home,
  Lesson (Abbrechen), Vocabulary/Review/Practice nav and Karte üben; adding a min-height
  cannot shrink or reflow content, and the full 375/768/1280 re-audit found no overflow,
  no overlap, and no layout change. The `Card` `role="button"` behaviour from AREA1-01 is
  independent and still verified (keyboard onboarding completes; non-interactive Cards
  stay non-focusable, `/vocabulary` `roleButtonCount: 0`).
- **Verification:** mechanical `getBoundingClientRect` re-audit at 375px shows **0 elements
  under 44px** on Onboarding, Home, Lesson (question + feedback), Vocabulary, Practice
  (Q1/Q10/Result) and Review (see the Responsive Audit table). Pronunciation buttons
  measured 44×44 with icons at 16×16 / 20×20. (The one apparent 43px on "Mehr anzeigen" is
  a hidden-tab animation-pause artifact — computed layout box is 44px; proven by forcing
  the settled state → 44px.)
- **Status: Fixed & verified.**

### AREA1-05 — Auto-scroll not observable in a hidden/headless tab
- **Severity: P3 — Resolved (manually verified)**
- **File:** `src/components/ui/QuestMap.tsx:173–199` (not modified)
- **Detail:** the scroll is scheduled in a 2×`requestAnimationFrame` chain; the QA browser
  reported `visibilityState: "hidden"` and fired **0** rAF callbacks, so the scroll never
  executed *in that environment* (and `behavior: "smooth"` cannot animate while hidden).
- **Why not a defect:** rAF pausing on hidden pages is correct browser behaviour. All of
  the effect's decisions were verified against the live DOM by replicating its body
  (correct target at 0/5, 2/5, 5/5; `alreadyVisible` false at top=868; centring to offset
  0; skip when already visible; focus untouched; no re-fire on select).
- **Resolution:** the user confirmed in a real, visible browser window that Home smoothly
  scrolls to the current Etappe and lands on the correct row. `QuestMap.tsx` unchanged.
- **Status: Resolved (manually verified); removed from remaining P3s.**

## Fixes Applied

| ID | Severity | Fix | Files |
|---|---|---|---|
| AREA1-01 | P1 | ARIA button pattern for clickable Cards + focus ring | `Card.tsx`, `globals.css` |
| AREA1-02 | P2 | Resolved by the AREA1-01 fix | (same) |
| AREA1-03 | P2 | `answerKana: ""` stops a misleading kana fallback | `questData.ts` |
| AREA1-04 | P2 | `min-h-11` on `sm` buttons + feedback toggle + `<summary>`; pronunciation buttons → 44×44 (icon unchanged) | `Button.tsx`, `FeedbackPanel.tsx`, `vocabulary/page.tsx`, `practice/page.tsx`, `page.tsx` |
| AREA1-05 | P3 | Resolved — Home auto-scroll confirmed in a real browser by the user (no code change) | — |

Post-fix re-verification (final): automated content harness **P0/P1/P2/DELTA all 0**;
`npm run build` success, 0 errors; `npm run lint` **0 errors, 0 warnings**; mechanical
44px audit at 375px shows **0 under-44px** on every page; Café replayed from a fresh 0 XP
state → +50 XP, 5 cards, Reise unlocked, Level 1; keyboard-only onboarding completes to
Home; auto-scroll target correct (Café current, 1 target / 1 current, focus on BODY);
768/1280 have no overflow and no quest-row/node/card overlaps, sidebar sticky; zero
console/server errors.

## Issues Not Fixed

**None.** All five findings (AREA1-01…05) are Fixed & verified or Resolved.

## External Test Blockers

**None.** All P0/P1/P2/P3 are closed. Content, rewards, unlocks, replay, privacy,
keyboard access and mobile touch targets all pass.

## Remaining Risks

These are **not** code blockers — they are items to keep an eye on *during* the external
test, per the brief:

1. **Native-speaker German review** of the ~305 questions' prompts/tips. This pass's
   automated English-leak check and non-native read found no defects, but a native read
   before a wide launch remains advisable and can happen during limited testing.
2. **Live microphone recognition paths** (successful utterance, retry after a failed
   attempt, mic-permission denial) cannot be exercised without real audio input. The code
   audit verified normalization, exact matching, the single-settle guard, error mapping
   and the unsupported-browser fallback; real-device confirmation is a natural
   external-test item.
3. **Audible sound output** was verified only as "never throws" (no audio in this
   environment); real playback is worth a quick real-device check.
4. The `/vocabulary` dev-server 404 needs a `.next` clear if it recurs locally; it does
   **not** affect production builds (the route prerenders cleanly).

## Final Verdict

**Pass — Ready for limited external user testing.**

- P0: **0**
- P1: **0**
- P2: **0**
- P3: **0**

Rationale: every main flow works end-to-end; the reward/unlock/replay maths is exact
(490 XP / 26 cards / Level 4 / 5-5 Etappen, +0 on replay); all 305 authored questions and
26 vocabulary entries pass every structural and language check with zero defects;
uncollected-word privacy is proven at both the index and DOM level; no console, server or
hydration errors on any route; layout is clean at 375/768/1280 with no overlaps; **every
mobile touch target is ≥44px**; keyboard-only users can complete onboarding and use the
app; and the Home auto-scroll is confirmed working in a real browser. The Remaining Risks
above are ordinary external-test observations (native German review, live mic/audio on
real devices), not code defects, and do not block a limited external release.
