# Vocabulary Register UI QA

## Summary

- Freunde Q8's casual/polite comparison corrected to a true minimal pair (only the verb
  ending differs now); question id, choices, `answer`, `vocabId`, and the Freunde
  category's `rewardXp`/`collectedCardIds`/`unlocksNext` are all unchanged.
- Finale Review QA's 26-word Coverage Matrix reclassified into **Tested** (5) /
  **Used in correct answer** (11) / **Reviewed in feedback only** (10) — the Finale's
  question data itself was not touched, only the documentation's wording and table.
- Vocabulary page gained a per-card, independently-collapsible **Locker & Höflich
  vergleichen** section for the 10 words that already have `usageExamples` (5 Schule + 5
  Freunde), and a new **Register** filter row (Alle/Locker/Höflich) that AND-combines
  with the existing category filter. Café/Reise words (no `usageExamples` yet) are
  completely unaffected — same cards as before.
- Two new reusable components: `RegisterBadge` and `UsageExampleComparison`.
- `classmate`'s German situation label changed from "Mitschüler" to "Klassenkameraden".
- Build: `npm run build` — success, 0 errors. Lint: `npm run lint` — 0 errors, 0
  warnings. Automated audit (temporary script, deleted after use): `OK: no failures
  found.`

## Files Changed

**Modified:**
- `src/lib/questData.ts` — `freunde-q8` only (see "Freunde Q8 Correction" below).
- `src/lib/registerData.ts` — `classmate` label only.
- `src/app/globals.css` — added `--color-teal`/`--color-teal-soft`/`--color-teal-border`
  for the Höflich badge (kept visually distinct from `--color-primary`, which already
  means "correct/success" elsewhere in the app).
- `src/app/vocabulary/page.tsx` — added the Register filter row, the per-card
  expand/collapse comparison section, and a 0-results message; existing category filter,
  stats, pronunciation button, and "Karte üben" flow are unchanged.
- `src/components/ui/index.ts` — exports for the two new components.
- `docs/FREUNDE_MAIN_QUEST_QA.md` — new "Update — Q8 Comparison Correction" section.
- `docs/FINALE_REVIEW_QA.md` — Coverage Matrix reclassified, Summary reworded, the Q8
  Remaining Issue marked Resolved.

**New:**
- `src/components/ui/RegisterBadge.tsx`
- `src/components/ui/UsageExampleComparison.tsx`
- `docs/VOCABULARY_REGISTER_UI_QA.md` (this file)

**Not touched:** `src/lib/vocabData.ts`, `src/types/learning.ts`, `src/lib/quizBuilder.ts`,
`src/lib/subQuestData/*`, `src/lib/storage.ts`, `src/lib/levelSystem.ts`,
`src/lib/worldMapData.ts`, `src/lib/sound.ts`, `src/lib/speechRecognition.ts`,
`src/app/page.tsx`, `src/app/lesson/page.tsx`, `src/app/practice/page.tsx`,
`src/app/review/page.tsx`, and every Freunde question other than `freunde-q8`.

## Freunde Q8 Correction

**Previous** (two differences from "casual" to "polite" — verb ending *and* は):
- Casual: `明日、学校に行く。` — あした、がっこうにいく。
- Polite: `明日は学校に行きます。` — あしたはがっこうにいきます。

**New** (exactly one difference — the verb ending):
- Casual: `明日は学校に行く。` — あしたはがっこうにいく。 — `ashita wa gakkou ni iku`
- Polite: `明日は学校に行きます。` — あしたはがっこうにいきます。 — `ashita wa gakkou ni ikimasu`
- German (both): `Morgen gehe ich zur Schule.`

**Reason:** a learner's *first* casual/polite comparison should isolate exactly one
variable. The old pair also varied whether は was present, which risks teaching the
wrong lesson ("casual drops は") alongside the intended one ("casual drops です/ます").
Keeping 明日は identical on both sides isolates 行く/行きます as the only difference.

**What changed / didn't:** only the two sentences and `shortTip`/`detailTip` were
rewritten. Question id (`freunde-q8`), all 4 `choices` (they reference "Satz A"/"Satz B"
labels, never the literal Japanese, so no edit was needed there), `answer`, `vocabId`,
and the question's position in the array are unchanged. `freunde` category's
`rewardXp` (110), `collectedCardIds` (5, unchanged), and `unlocksNext` (`"review"`) are
unchanged. No other Freunde question was touched. Full detail in
`docs/FREUNDE_MAIN_QUEST_QA.md`'s "Update — Q8 Comparison Correction" section.

## Finale Coverage Classification

The old Coverage Matrix said all 26 words were "covered", which reads as "tested". They
aren't all tested — most are supporting context. Reclassified into three tiers (Tested >
Used in correct answer > Reviewed in feedback, strongest wins when a word qualifies for
more than one):

- **Tested (5):** eat, station, go, meet, talk — the word's own meaning/usage is the
  central judgment needed to answer correctly.
- **Used in correct answer (11):** coffee, bread, hotel, train, school, teacher,
  japaneseLanguage, study, today, friend, tomorrow — appears in the correct sentence, but
  the question's central judgment is something else (a particle, a register, a different
  word).
- **Reviewed in feedback only (10):** water, drink, toilet, where, excuseMe, right, left,
  near, far, like — only reappears in a `shortTip`/`detailTip`, never in a correct
  answer.
- **Total reintroduced: 26** (5 + 11 + 10).

The Finale's `questions` data was **not** modified for this reclassification — only
`docs/FINALE_REVIEW_QA.md`'s wording and its Coverage Matrix table changed. Full per-word
table with question/location detail is in that doc.

## Register Badge

`src/components/ui/RegisterBadge.tsx` — a small `<span>` badge taking a `SpeechRegister`
and rendering `getRegisterLabel(register)` as real text, always. Colour is decoration on
top, never the only signal (`neutral`/`humble`→gray, `casual`→blue, `polite`→the new
teal, `honorific`→gold — all 5 register values handled, even though only `casual`/
`polite` have any real content today). `casual` gets a small speech-bubble SVG,
`polite` a small bowing-figure SVG; both are `aria-hidden="true"` and purely decorative
since the label text is always present. Teal was added specifically so a Höflich badge
is never visually confused with the app's existing "correct answer" green.

## Usage Example Comparison

`src/components/ui/UsageExampleComparison.tsx` takes `usageExamples: UsageExample[] |
undefined` directly (not a whole `VocabItem`), so it's reusable and trivially safe:
`undefined`/`[]` renders `null`, no error. It groups examples by `contrastGroup`
(falling back to the example's own `id` if absent, so an ungrouped example still
renders), sorts each group **casual before polite** regardless of the source array's own
order, and renders each example as a card with: `RegisterBadge`, a fixed one-line
register blurb ("Natürlich bei Freunden…" / "Eine sichere Wahl bei Lehrkräften…"),
Japanese/kana/romaji/German, a "SITUATION" line for `contextGerman`, and `noteGerman`
only when present. Long German text wraps (`break-words`) rather than overflowing.

## Contrast Groups

Verified (manually and by script) for all 10 words with `usageExamples` (5 Schule + 5
Freunde, 20 examples total, all ids unique): every group has exactly one `casual` and
one `polite` example, and the component always renders casual first. Words without a
`contrastGroup` would still render standalone (not currently exercised, since every
existing example has one) — handled safely by falling back to the example's own id.

## Register Filter

Added a second filter row below the existing category filter: **Alle / Locker /
Höflich** (labels pulled from `getRegisterLabel`, not hardcoded, so they can't drift from
the badge text). `hasRegisterExample(vocab, register)` checks
`vocab.usageExamples?.some(e => e.register === register)`, so Café/Reise words (no
`usageExamples`) never match `casual`/`polite` and disappear from the grid when either
filter is active — confirmed 0 Café/Reise words match, 10/10 Schule+Freunde words match
both (since all 10 currently have both a casual and a polite example). Combines with the
category filter via AND (both must match); an empty result shows "Keine passenden
Wortkarten gefunden." instead of an empty grid — confirmed in the browser for
Café+Locker (0 results) and Schule+Höflich (5 results). Filtering is pure client-side
React state — no page reload, no URL change.

## Usage Examples Available

- **Schule (5/5):** school, teacher, japaneseLanguage, study, today — each with one
  casual + one polite example, pre-existing data from an earlier pass, unchanged.
- **Freunde (5/5):** friend, meet, talk, tomorrow, like — same shape, unchanged.

## Usage Examples Not Yet Available

- **Café (0/5), Reise (0/11):** no `usageExamples` on any word in these categories, so
  none of them shows the "Locker & Höflich vergleichen" section or matches the Register
  filter. Per the brief, adding `usageExamples` to Café/Reise is explicitly out of scope
  this pass — their cards render exactly as before.

## Collected Cards

A collected card (status `gesammelt`/`ueben`/`gelernt`) with `usageExamples` shows the
existing content unchanged, plus a new "Locker & Höflich vergleichen" toggle at the
bottom (above "Karte üben"). Expanding shows the full casual/polite comparison; each
card's expand state is independent local component state — opening one card never
affects any other, and nothing is persisted to `localStorage` (collapses again on
reload, as specified).

## Uncollected Cards

Locked and "sammelbar" (unlocked-but-not-yet-collected) cards are unaffected: they still
show `???`/no kana/no German/no example, and now additionally **never** render the
compare button or any `UsageExampleComparison` content, regardless of the active
Register filter. Verified directly: temporarily un-collecting `school` (which has
`usageExamples`) while the Höflich filter was active still showed it in the grid (the
filter matches on the underlying word, not collection status) but as a `???` card with
no compare button — and a full-page HTML scan confirmed neither the casual sentence nor
its kana appeared anywhere in the DOM.

## Search and Filter Combination

The existing Vocabulary page has **no free-text search input** — only the category
filter (Alle/Café/Reise/Schule/Freunde) existed before this pass. The brief's checklist
mentions "search AND category AND status" combining with the new Register filter; there
is no search box to combine with, so that specific combination doesn't apply here. What
does exist — category filter AND register filter AND the existing per-card
collected/uncollected status logic — all combine correctly (see "Register Filter" and
"Uncollected Cards" above). Noted here rather than silently assumed, per instructions to
verify current structure before building on it.

## Desktop (1280px)

Comparison cards render 2-per-row (`sm:grid-cols-2`, confirmed via computed
`grid-template-columns` = two ~143px tracks) inside the vocabulary card's own column
width. No horizontal overflow (`document.body.scrollWidth` ≤ viewport width).

## Tablet (768px)

Still 2-per-row at this width (Tailwind's `sm:` breakpoint is 640px, so 768px already
qualifies) — matches the brief's "2 columns or stacked" allowance. No horizontal
overflow; toggle button confirmed 44px tall.

## Mobile (375px)

Comparison stacks to 1 column (confirmed via computed `grid-template-columns` = one
~310px track). Badge, Japanese sentence, kana, romaji, German, and the "SITUATION"
line/`contextGerman` all wrap within the viewport with no overflow. All filter buttons
(category row + new register row) and the compare/collapse toggle measured at exactly
**44px tall** — the category filter buttons were originally ~33px (pre-existing,
`size="sm"`); a `min-h-11` class was added to both filter rows so every tappable control
on this page meets the 44px target consistently, not just the newly-added ones.

## Accessibility

- The compare/collapse control is a real `<button>` with `aria-expanded` (confirmed
  `"true"`/`"false"` toggling correctly) and `aria-controls` pointing to the comparison
  section's `id` (confirmed the referenced element exists while expanded and is removed
  from the DOM while collapsed, matching the visual state).
- Keyboard operable natively (native `<button>`, no custom key handling needed).
- `:focus-visible` styling is already global (`globals.css`, pre-existing) and applies to
  every new button automatically — not re-implemented.
- Register is never colour-only: every `RegisterBadge` always renders its German label
  as text; the two register-specific SVG icons are `aria-hidden="true"`.
- `contrastGroup` examples render casual-then-polite in DOM order, so a screen reader
  encounters them in the same natural order a sighted user sees.
- No new animation was added (plain conditional rendering for expand/collapse), so
  `prefers-reduced-motion` needed no new handling.
- Pronunciation buttons (pre-existing, untouched) keep their `aria-label="Aussprache
  hören"`; no pronunciation button was added to the comparison examples this pass (see
  Remaining Issues).

## Browser QA

- **A. Freunde Q8:** played through the Freunde Main Quest to Q8; prompt showed the
  corrected `Satz A: 明日は学校に行く。` / `Satz B: 明日は学校に行きます。` (identical
  prefix, only the verb differs); answered correctly; feedback's `shortTip` read "Beide
  Sätze bedeuten dasselbe – nur die Satzendung zeigt den Unterschied zwischen Locker und
  Höflich."; completed all 10 questions and confirmed `+110 XP` unchanged (shown as
  "Wiederholung abgeschlossen"/`+0 XP` since Freunde was already completed in this
  session — the existing replay guard, untouched).
- **B. Vocabulary basic display:** 26/26 cards, category filter switches correctly,
  existing card content (Beispiel/Muster/Verwandt/shortTip), pronunciation button, and
  "Karte üben" navigation all still work; no console/server errors.
- **C. usageExamples present:** every Schule and Freunde card showed "Locker & Höflich
  vergleichen"; expanding `school` showed the casual (今日は学校に行く。) and polite
  (今日は学校に行きます。) examples with badges, kana, romaji, German, "SITUATION" +
  `contextGerman`, and `noteGerman`, casual first; collapsing removed the section and
  reverted the button label; each card's toggle is independent.
- **D. usageExamples absent:** Café/Reise cards show no compare button and their
  existing display is byte-for-byte the same as before this pass; no errors.
- **E. Register filter:** Alle shows all cards; Locker/Höflich each show exactly the 10
  Schule+Freunde words and 0 Café/Reise words; Café+Locker together produced "Keine
  passenden Wortkarten gefunden."; Schule+Höflich produced the expected 5; no page
  reload, no Hydration errors observed at any point.
- **F. Uncollected cards:** temporarily un-collecting `school` while Höflich was active
  kept it in the grid as `???`/"Sammelbar" with no compare button and no leaked content
  (confirmed via a full-DOM string search) — then restored.
- **G. Responsive:** 1280/768/768 confirmed 2-column comparison grid, 375px confirmed
  1-column; no horizontal overflow at any width; all filter buttons and the
  compare/collapse toggle confirmed 44px tall after the tap-target fix.
- **H. Regression:** Home (Quest Map, XP/Level/cards, next-area preview), Finale
  (`/lesson?category=review`, still 1/10 and `+150 XP`), Review (`/review`, weak-words
  page), and a Sub Quest (`/practice?word=talk`, still 1/10) all loaded with no
  console or server errors.

## Regression QA

- Café Main Quest, Reise Main Quest, Schule Main Quest: not touched, not re-verified
  question-by-question this pass (no file affecting them changed) — confirmed via `git`
  diff that only the files listed in "Files Changed" were modified.
- Freunde Main Quest: 10 questions, unchanged except `freunde-q8`'s two sentences and its
  tips; `rewardXp` (110), `collectedCardIds` (5), `unlocksNext` (`"review"`) confirmed
  unchanged via an automated script and in-browser.
- Finale Wiederholung: 10 questions, `rewardXp` (150) — unchanged; confirmed via the
  automated script and in-browser (`1 / 10`, `+150 XP`).
- Sub Quest: not touched; spot-checked one word (`talk`) loads unchanged (`1 / 10`).
- `XP`/`Level`/unlock logic: untouched (`storage.ts`, `levelSystem.ts` not modified);
  confirmed Home's XP/Level figures match what they were before this session's changes.
- No "Boss"/"Mastered"/"Block" text found on any page visited.

## Remaining Issues

- **No pronunciation button on comparison examples.** Per the brief, this is optional
  this pass ("今回は必須ではありません"), and adding one to every casual/polite example
  would meaningfully increase the DOM/interaction density of an already info-dense
  expanded section. Left out for now — `speakJapanese` from `speech.ts` is already
  available and this can be added later without any data model changes.
- **No free-text search exists on the Vocabulary page.** The brief's checklist assumes a
  search box to AND-combine the Register filter with; this pass's investigation
  confirmed none exists today (only the category filter did, before this pass). Not
  built this pass, since adding a new search feature was not itself requested — flagged
  here rather than silently invented or silently skipped.
- **Café/Reise words still show no register content**, by design — the brief explicitly
  excludes adding `usageExamples` to those two categories this pass. Their Vocabulary
  cards, and the Register filter, will simply keep excluding them until a future pass
  authors that content.
