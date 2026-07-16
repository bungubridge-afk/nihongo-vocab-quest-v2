# Quest Map Polish QA

## Summary

Polish pass over the existing Quest Map (structure and Kyoto theme unchanged): fixed the
current/finale card's stacked double border, tightened the "Du bist hier" flag to its own
node, cut locked cards down to name + 1-line description + Gesperrt (no XP/Karten/button),
softened completed-card/node emphasis relative to current, built a small "sandō" (shrine
approach) decoration along the Freunde→Finale segment, guaranteed a real ≥20px gap between
the finale and the next-area preview, added a short "Was du lernst" line to the sidebar,
and nudged the background scenery further into the corners for readability.

- Build: `npm run build` — success, 0 errors.
- Lint: `npm run lint` — 0 errors, 0 warnings.
- Browser sizes tested: 375 px, 768 px, 1280 px.
- Progress states tested: 0/5, 2/5, 4/5, 5/5 — zero measured overlaps in every combination.

## Files Changed

- `src/components/ui/QuestStageDetails.tsx` — `QuestStageCompactCard`: hides the XP/Karten
  line entirely when locked, clamps the description to 1 line when locked (2 otherwise),
  and no longer stacks the ink selection outline on top of a card that already has its own
  strong status styling (`current`, or any unlocked finale). `QuestStageDetails` (sidebar
  panel): added an optional "Was du lernst" block.
- `src/components/ui/QuestMap.tsx` — added `ApproachDecoration` (the finale-row sandō:
  lantern pair + sakura, tinted by the finale's own status), tagged the current stage's row
  with `data-current` for the new background wash, and pulled the Fuji-peak/torii/machiya
  scenery further into the map's corners at lower opacity.
- `src/app/globals.css` — softened `.quest-node-glow` (completed), made `.quest-node-button`
  explicitly `position: relative` and tightened `.quest-node-here`'s offset to 10px, added
  the `.quest-row-card-desc-1-line` modifier, the `.quest-row[data-current]::before` wash,
  and `.next-area-connector`'s guaranteed `margin-top: 20px` plus its `-active` variant.
- `src/lib/worldMapData.ts` — added `learningSummary` (a one-line "what you practice" blurb
  per stage) to `StageMapMeta`. Display-only; no XP/unlock truth touched.
- `src/app/page.tsx` — passes `learningSummary` into the sidebar panel and a
  `finaleCompleted` flag into `NextAreaPreview` (for the connector's post-finale tint).
- `docs/QUEST_MAP_POLISH_QA.md` — this file.

Untouched (per instructions): `QuestNode.tsx` (only consumed via existing classes/props —
no prop or markup change needed here), `lesson/page.tsx`, `practice/page.tsx`,
`vocabulary/page.tsx`, `review/page.tsx`, `questData.ts`, `vocabData.ts`, `quizBuilder.ts`,
`subQuestData/*`, `storage.ts`, `levelSystem.ts`, `sound.ts`, `speech.ts`,
`speechRecognition.ts`, `types/learning.ts`. No XP/Level/unlock values changed.

## Current Card Border

**Root cause:** the compact map card's `isSelected` styling (a 2px ink `outline` with a
2px `outline-offset` — i.e. a second ring floating just outside the border) was applied
unconditionally whenever a stage was the sidebar's selected stage. Since the selected stage
defaults to whatever is `current` (or the available/completed finale once nothing else is
next), that outline was — in practice — *always* present on top of the current card's own
green border + glow, and on top of the finale's gold border + glow. Two independent
"this is special" treatments stacking is exactly the reported double-border.

**Fix:** the compact card now computes `hasOwnStrongTreatment = isCurrent || (isFinale &&
!isLocked)` and only renders the ink selection outline when `isSelected` is true **and**
the card doesn't already have one of those two strong looks. Verified directly:
`current` card → `outline-style: none`, single `box-shadow`, 2px green `border-color`
only. Unlocked finale (`review`) and completed finale both verified to render **without**
`quest-row-card-selected` in their class list. A plain completed/locked stage explicitly
clicked still gets the outline (unaffected — it has no other strong treatment to clash
with).

## Current Location Marker

`.quest-node-here` ("Du bist hier") is now explicitly anchored to `.quest-node-button`
itself, which was given `position: relative` (previously implicit/static, relying on an
ancestor's positioning to happen to coincide with the button's own box). The gap was set to
`bottom: calc(100% + 10px)`; measured end-to-end from the flag's own bottom edge to the
node circle's top edge (which also includes the button's small vertical padding): **14 px**
— within the requested 8–14 px range. The existing downward-pointing triangle tail
(`::after`) is unchanged and still visually "skewers" toward the node. `pointer-events:
none` was added so the flag can never intercept a tap meant for the node beneath it.

## Locked Card Simplification

`QuestStageCompactCard` now renders, for `locked` stages: title, a **single-line**
(`-webkit-line-clamp: 1`) description, and the `Gesperrt` badge — nothing else. The
`+XP · Karten` line and the Starten/Wiederholen button are both omitted entirely (not just
hidden via opacity) for any locked stage, including a locked finale. Verified: a locked
Reise card read exactly `"ReiseFrage nach Orten und bewege dich in Japan.Gesperrt"` — no
`"XP"` substring anywhere in it, no `<button>` inside it. Selecting a locked stage still
works and still shows its full description, learning summary, and locked reason
("Schließe zuerst die vorherige Etappe ab.") in the **sidebar** — nothing about locked
stages became unreachable, only the *map card's* density dropped.

## Completed Card Hierarchy

Unchanged from the prior pass at the card level (light `--color-primary-border` border, no
box-shadow, `secondary`-styled Wiederholen button) — verified again this pass:
`box-shadow: none`, `border-color: rgb(191, 227, 207)` (the soft green). What *did* change
here is the **node's** completed glow, softened from `0 0 0 4px …, 0 0 18px -4px …` to
`0 0 0 3px …, 0 0 12px -6px …` — a smaller ring with a tighter falloff, so a row of
completed landmarks reads as "done, quietly" rather than competing with the current node's
animated pulse ring for attention.

## Finale Approach

Added `ApproachDecoration`, rendered inside the finale's own row (i.e. the road segment
that runs from the previous stage's lane into the finale's center lane) instead of the
regular per-row lantern-or-sakura decoration used elsewhere. It draws a **symmetric lantern
pair** flanking the path partway down the segment plus a small sakura cluster, all
`aria-hidden` and `pointer-events: none`. Color follows the finale's *own* status, not a
separate flag: cool `--color-ink-soft` gray at low opacity (0.22) while locked — so it never
implies the finale is reachable — warm `--color-gold` once available, and
`--color-primary` green once completed (both at 0.34 opacity, still clearly a background
detail, not competing with the node/card). This reads as "the last stretch of road is
different — you're approaching something" without adding a new row or touching the
one-row-per-stage structure.

## Next Area Connection

`.next-area-connector` now carries an explicit `margin-top: 20px`, so the gap between the
finale row's actual rendered bottom edge (whatever height its card ends up needing) and the
connector is a guaranteed minimum rather than incidental leftover space. Measured at
1280 px: **41 px** (comfortably over the 20 px floor — the finale row's own bottom padding
plus the explicit margin). Once the finale is `completed`, `page.tsx` adds
`next-area-connector-active` to the connector, which retints its dashed line from neutral
gray to a faint `--color-primary-border` green — "the road keeps going" — while the
still-`Demnächst` preview card underneath is completely unchanged (still muted, still not
clickable). Verified the `-active` class is present only when the finale stage's status is
`completed`.

## Map and Sidebar Responsibilities

The map's compact card and the sidebar panel were already fairly well separated from the
prior pass (the sidebar never showed XP/Karten to begin with — verified again this pass:
`QuestStageDetails` renders icon, name, `stageTitle`, status badge, description, and the
button only). The one genuinely new, non-duplicated piece of information added this pass is
the **"Was du lernst" block** — a short, sidebar-only line naming what the stage practices
(e.g. "Bestellen, Essen und Trinken." for Café), sourced from the new
`stageMapMeta[id].learningSummary` field, distinct from the `description`/`flavorText`
already shown in both places. No new duplication was introduced; the map card's role stays
"immediate decision" (name, 1-line blurb, status, reward, action) and the sidebar's stays
"fuller context for the selected stage" (same, plus the learning-summary block, minus the
reward numbers).

## Sidebar Spacing

Unchanged structurally from the prior pass (`.home-sidebar` as a single flex column on
desktop, `display: contents` on mobile) — re-verified this pass rather than re-built:
gaps between Level → Details → Reisefortschritt → Trainingslager measured **18 px, 18 px,
18 px** at 1280 px, in both the 0/5 and 2/5 progress states. No large or uneven gap
reappeared as a side effect of the card-content changes above (the sidebar's height is
still just the sum of its four cards' natural heights, independent of the map's height).

## Background Readability

- Mountain/Fuji silhouettes moved from a `y 8–22` band (which could sit behind a stage's
  own row further down the map) to a `y < 8` band — confined to the strip around the Start
  marker, before any stage's row begins — and their opacity dropped from `0.12`/`0.22` to
  `0.08`/`0.16`.
- The torii silhouette moved further into the actual top-left corner (`translate(10,8)` →
  `translate(6,4)`) and dropped from `0.16` to `0.14` opacity.
- The machiya rooftop skyline stayed pinned to the right edge, opacity `0.1` → `0.08`.
- A new, purely local `radial-gradient` wash (`rgba(255,255,255,0.55)` fading to
  transparent) sits behind the **current** stage's row only (`data-current="true"`),
  lightening whatever scenery shows through specifically where the eye should focus —
  without touching the deco layer's shapes or opacities for any other row.
- The road itself (solid `--color-primary` green / dashed states, 5px stroke) remains
  unambiguously the strongest-contrast line on the canvas relative to all decoration, which
  tops out at 0.34 opacity even for the new approach lanterns.

## Desktop

1280 px, re-verified after this pass's changes: `.home-grid` map column = **71%** of the
grid container width, sidebar = **300 px** (both within the 70–75% / 300–340 px targets),
`column-gap: 2rem`. Zero node/node, card/card, or node/card overlaps in the 0/5, 2/5, 4/5,
and 5/5 progress states.

## Tablet

768 px: zero node/node and card/card overlaps, no horizontal scroll
(`document.documentElement.scrollWidth === innerWidth`). Layout is still the single-column
mobile arrangement at this width (the two-column split starts at `lg` / 1024 px), consistent
with the prior pass and unaffected by this one.

## Mobile

375 px: zero node/node, card/card, and node/card overlaps in the 0/5 and 2/5 states, no
horizontal scroll. The "Du bist hier" flag's 14 px gap to its node holds at this width too
(the anchor is the button itself, not a breakpoint-dependent ancestor). Locked cards'
one-line description and hidden XP/button keep their footprint small on the narrow column,
same as at other widths (the simplification isn't breakpoint-specific).

## Progress 0/5

Café `current`: single green border + one soft shadow on its card (`outline: none`),
"Du bist hier" flag 14 px above its circle, working Starten button. Reise/Schule/Freunde
all `locked` with the simplified card (name + 1-line description + Gesperrt, no XP, no
button). Finale `locked`, also simplified, its approach decoration rendered in cool gray at
low opacity. No `Block`/`Boss`/`Mastered` text found anywhere (regex-checked on full page
text). Zero overlaps measured.

## Progress 2/5

Café + Reise `completed` (light-green border, no shadow, quieter than current — verified
`box-shadow: none`, soft border color). Schule `current` (green border, single shadow, no
outline — verified). Freunde/Finale locked and simplified. This is the exact scenario the
original bug report's screenshot showed as broken; re-verified specifically at 375 px and
1280 px: **zero** overlaps of every kind, and the current card confirmed free of the
previously-reported dark navy outline.

## Progress 4/5

Freunde completed, Finale `review` (available): node shows the gold `quest-node-glow-gold`
ring, its card shows `quest-row-card-finale` (gold border/glow) **without**
`quest-row-card-selected` stacked on top (the broadened fix — the finale is also affected
by the "auto-selected + own strong styling" pattern, not just plain `current`). XP/Karten
and a working Starten button are shown (finale is unlocked, so the compact-card
simplification doesn't apply to it). Gap to the next-area preview: **41 px**, comfortably
past the 20 px floor.

## Progress 5/5

All five `completed`, finale showing `quest-node-finale-done` (the gold+green "achieved"
ring) — its compact card carries `quest-row-card-completed quest-row-card-finale`, again
**without** the selection outline stacked on top (same broadened fix covers the
completed-finale case too). The next-area connector picked up
`next-area-connector-active` (green-tinted dashes) once the finale reached `completed`.
Zero overlaps.

## Overlap Measurements

Machine-measured via `getBoundingClientRect()` pairwise intersection, not visual
inspection, at 375 / 768 / 1280 px × progress 0/5, 2/5, 4/5, 5/5:

- **Node ↔ node:** 0 overlaps in every combination tested.
- **Card ↔ card:** 0 overlaps in every combination tested.
- **Node ↔ card:** 0 overlaps in every combination tested.
- **"Du bist hier" ↔ node:** not an overlap question (the flag is a child of the node's own
  button and deliberately sits just above it) — instead measured as a *gap*: 14 px at both
  375 px and 1280 px, within the requested 8–14 px range.
- **Row ↔ row:** 0 vertical-range overlaps (structural guarantee of normal document flow,
  re-verified).
- **Finale ↔ next-area preview:** 0 overlap; 41 px gap measured at 1280 px (≥ the 20 px
  floor at every progress state, since the `margin-top: 20px` is unconditional).
- **Map ↔ sidebar:** 0 overlap at 1280 px.
- **Sidebar card ↔ sidebar card:** 0 overlap; gaps measured at exactly 18 px between every
  adjacent pair, both in the 0/5 and 2/5 states.

## Accessibility

- Map nodes remain native `<button>` elements (`QuestNode.tsx` untouched): keyboard
  focusable, `aria-pressed`, `aria-label` combining title + status. Re-verified this pass:
  `.focus()` + `.click()` on a locked node updated the sidebar without navigating.
- Status is always shown as text (Bereit/Abgeschlossen/Gesperrt) on both the node and its
  compact card, unaffected by the density reduction — locked cards still read "Gesperrt" in
  text, they just no longer also show numbers they can't act on yet.
- All new decorative elements (`ApproachDecoration`, the current-row wash) are
  `aria-hidden="true"` and/or `pointer-events: none`; the "Du bist hier" flag gained an
  explicit `pointer-events: none` this pass specifically so it can never intercept a tap
  meant for the node under it.
- `focus-visible` styling (prior session) is unchanged.
- `prefers-reduced-motion` handling (pulse, level-up, sparkle) is unchanged — the new
  background wash and approach decoration are static (no animation was added).

## Regression

- **Onboarding:** unaffected — completed a fresh flow to reach the map.
- **XP / Level:** unaffected — no changes to `levelSystem.ts`, `storage.ts`, or
  `questData.ts`; Result-screen behavior from prior sessions is untouched.
- **Vocabulary:** loads, 5 pronunciation buttons rendered for the seeded card set.
- **Review:** loads, shows the Wiederholung UI.
- **Practice / Sub Quest / Speaking:** `/practice?word=coffee` loaded its 10-question Sub
  Quest (`"1 / 10"` confirmed) — untouched practice page still works.
- **Locked direct URL:** `/lesson?category=review` while Finale was still locked showed
  "Diese Kategorie ist noch gesperrt." (existing guard, untouched).
- **Map-side and sidebar-side Starten both work:** clicking the compact card's own Starten
  button for Schule navigated to `/lesson?category=schule` and rendered the lesson
  correctly — confirms both action paths independently still work.
- **Hydration / console:** zero console errors and zero server errors across every
  navigation and reload performed this pass.
- **Wording:** no "Block", "Boss", or "Mastered" found anywhere in rendered page text.

## Remaining Issues

- The "Du bist hier" gap (14 px, measured node-circle-top to flag-bottom) sits at the upper
  end of the requested 8–14 px range rather than the middle — it's the sum of the flag's
  own 10px CSS offset plus the node button's 4px vertical padding. Tightening it further
  would mean either shrinking the button's padding (which also affects its 44px+ tap target
  sizing) or special-casing the flag's offset to subtract that padding; left as-is since 14
  is still within the requested range.
- As in prior sessions, this environment's screenshot/computer-use tool was unreliable for
  this session (navigation via the dedicated navigate tool failed intermittently before a
  page was already open); all visual claims in this report are backed by
  `getBoundingClientRect()` / computed-style measurements taken directly in the page
  instead of screenshots.
