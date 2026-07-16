# Quest Map Japan Theme QA

## Summary

Restored the "quest feeling" the map lost in the previous scale-out pass — compact info
cards next to each node, tighter Etappe spacing, a low-contrast Kyoto-themed background,
wayside decorations, and a three-state road — while keeping the safe one-row-per-Etappe
flow structure and fixing the sidebar's unnatural whitespace at its root cause.

- Build: `npm run build` — success, 0 errors.
- Lint: `npm run lint` — 0 errors, 0 warnings.
- Browser sizes tested: 375 px, 768 px, 1280 px.
- Progress states tested: 0/5, 2/5, 4/5, 5/5 — zero measured overlaps in every combination.

## Files Changed

- `src/lib/worldMapData.ts` — added `AreaTheme`/`AreaThemeId` and a `theme` field on
  `WorldMeta` (`kyoto` for the free area today; `tokyo`/`city`/`nature` reserved for later
  areas). Display-only metadata, as before — no lesson content, no XP truth.
- `src/components/ui/QuestStageDetails.tsx` — trimmed the sidebar `QuestStageDetails`
  panel (dropped the XP/Karten line, now shown on the map's own card instead) and added a
  new export, `QuestStageCompactCard`, the map-side info card.
- `src/components/ui/QuestMap.tsx` — rewritten: tighter lane cycle, a compact card per
  row, a two-variant road curve (mobile vs. sm+ node position), a three-state road
  (`done`/`upcoming`/`todo`), sparse wayside decorations, and a themed `MapScenery`
  background layer.
- `src/app/page.tsx` — stages now carry `rewardXp`/`cardCount`/`description` (sourced
  directly from `questData`, no duplication); sidebar cards wrapped in a new
  `.home-sidebar` container; `QuestMap` now also receives `onStart` and `theme`.
- `src/app/globals.css` — new `.quest-row-card*` rules, three road-state classes, reworked
  `.quest-row`/`.quest-row-node` spacing, themed `.quest-map-deco` background, and the
  `.home-sidebar` fix (see Sidebar Spacing below).
- `src/components/ui/QuestNode.tsx` — **unchanged**; its landmark-button role stayed the
  same, only its container's positioning (in `QuestMap.tsx`/CSS) changed.

Untouched (per instructions): `lesson/page.tsx`, `practice/page.tsx`,
`vocabulary/page.tsx`, `review/page.tsx`, `questData.ts`, `vocabData.ts`, `quizBuilder.ts`,
`subQuestData/*`, `storage.ts`, `levelSystem.ts`, `sound.ts`, `speech.ts`,
`speechRecognition.ts`, `types/learning.ts`. No XP/Level/unlock values changed.

## Previous Problems

1. **Etappen distance too large** — rows were 240–300 px tall with nothing but a landmark
   in them; fixed by tightening the lane cycle, shrinking non-finale row minimums (`170 /
   225 / 250 px` mobile/tablet/desktop, down from `210 / 250 / 300`), and giving each row
   a compact card so the space is *used*, not just narrower.
2. **Monotonous empty road** — fixed by bringing back per-row wayside decorations (a stone
   lantern or sakura petals, alternating) and a themed background layer.
3. **Info cards deleted entirely (previous pass)** — fixed by reintroducing
   `QuestStageCompactCard`, sized to fit inside its own row (never a full-width card).
4. **Large, unnatural sidebar gap** — root-caused and fixed (see Sidebar Spacing).
5. **No Kyoto/Japan travel feeling** — fixed with a `MapScenery` SVG layer (torii, a
   Fuji-like peak, clouds, a faint machiya roofline) plus the per-row decorations.
6. **Hard to reskin per Area** — fixed by moving the scenery choice behind
   `currentWorld.theme.id`, with a real `"kyoto"` implementation and a minimal fallback for
   any other theme id.

## Retained Layout Architecture

The one-row-per-Etappe flow structure from the previous pass is **unchanged in principle**:
`stages.map(...)` still renders one independent `<div className="quest-row">` per stage,
still in normal document flow, still never a single fixed-height absolutely-positioned
canvas. What changed is only *what's inside* each row (tighter spacing, a card, a bit of
decoration) — not the row mechanism itself. Verified: rows still never overlap each other
at any width or progress state (see Overlap Measurements).

## Quest Feeling Improvements

Each row now shows, right next to its landmark node, a `QuestStageCompactCard` with: the
Etappe name, a one-line (clamped) description, its status badge, `+XP · N Karten`, and a
working Starten/Wiederholen button — all sized to stay inside that row (max `17.5rem`
mobile, `15rem` tablet, `16.25rem` desktop), never a full-bleed card. The road is drawn in
three states instead of two: `quest-path-done` (solid green, completed/current ground
already covered), a new `quest-path-upcoming` (light green-teal dashes, specifically the
one segment leading out of the current stage — "this is where you're headed next"), and
`quest-path-todo` (blue-gray dots, locked/unopened). Wayside decorations (a small stone
lantern or a few sakura petals, alternating by row index) sit on the side opposite the
card, at ~28–30% opacity, so they read as texture, not competing content.

## Node Spacing

Row minimum heights (measured, not just declared):

| Breakpoint | Non-finale row | Finale row |
|---|---|---|
| Mobile (375 px) | 170 px floor, grows with stacked card content | 210 px padding-top reserved + content |
| Tablet (768 px) | 225 px | 260 px |
| Desktop (1280 px) | 250 px | 300 px |

Total map height at 1280 px (Start marker through the end of the next-area preview),
measured end-to-end: **1,631 px ≈ 1.8 screens** at a 900 px viewport — within the
brief's "1.5–2 screens" target for today's 5 Etappen.

## Compact Stage Cards

`QuestStageCompactCard` (in `QuestStageDetails.tsx`) renders beside its node from `sm`
(≥640 px) up, and stacks below it in normal document flow on mobile — implemented with a
single CSS rule pattern: the base rule is "static, centered, margin-top" (the mobile
behavior); a `sm:` media query then switches `[data-side="left"]`/`[data-side="right"]`
cards to `position: absolute` beside the node, while `[data-side="center"]` (the finale)
simply never matches those selectors and keeps the "below, in flow" rule at *every*
breakpoint — no JS breakpoint detection, no duplicated markup. Visual weight is
status-driven: `current` gets a primary-green border and a soft glow (most prominent),
`completed` a quieter thin border with no glow, `locked` a muted gray background with no
button at all, and the (unlocked) finale a gold border and glow.

## Current Location

"Du bist hier" (unchanged component, `QuestNode.tsx`'s `HereMarker`) still renders directly
above the current node — since the node's own position didn't change (only its row's
surrounding spacing did), the flag stays exactly where it was, immediately over the
landmark it belongs to.

## Kyoto and Japan Theme

Implemented entirely in inline SVG + CSS (`MapScenery` in `QuestMap.tsx`, `.quest-map-deco`
in `globals.css`) — no external images, no icon library:

- Soft clouds (six low-opacity ellipses) scattered across the canvas.
- A small torii silhouette near the Start marker (top-left area, off-center, ~16% opacity).
- Two distant mountain silhouettes, one with a faint white "snow cap" suggesting Fuji —
  deliberately small and off to the side, not centered or dominant.
- A faint machiya-style rooftop skyline along the right edge (three small roof shapes,
  10% opacity).
- Per-row sakura petals / stone lantern accents (see Quest Feeling Improvements).

All of it renders **behind** the rows (first child in the DOM, `position: absolute; inset:
0; pointer-events: none`), at opacities between 0.1 and 0.3, using existing muted palette
tokens (`var(--color-ink-soft)`, `var(--color-danger-border)` for the sakura pink) rather
than new saturated colors — verified visually via screenshot at 375 px: node labels, card
text, and buttons all stayed fully legible with the background visible but clearly
secondary.

## Area Theme Metadata

`worldMapData.ts` now exports `AreaThemeId = "kyoto" | "tokyo" | "city" | "nature"` and an
`AreaTheme` (`{ id, motifs }`) attached to `WorldMeta.theme`. `QuestMap` accepts a `theme`
prop (defaulting to `"kyoto"`) and its `MapScenery` sub-component switches on it: `"kyoto"`
renders the full scenery described above, any other id renders a minimal generic
placeholder (a couple of clouds) so a future Area 2 declaring `theme: { id: "tokyo", ... }`
doesn't render nothing while its own scenery is still unbuilt. No Area 2 route, lesson
data, or XP values were added — this is metadata-and-fallback only, per instructions.

## Sidebar Spacing

**Root cause of the old large gap:** the sidebar's four cards were four separate items in
a `grid-template-areas` grid where the tall map spanned all four of their row-tracks as
one element. CSS Grid must reconcile "one very tall spanning item" against "four short,
individually-sized rows" by inflating those row-tracks to match the map's height — and
that inflation doesn't distribute evenly or predictably, which is exactly what produced
the reported gap.

**Fix:** wrapped the four sidebar cards in one `.home-sidebar` container.
- **Mobile:** `.home-sidebar { display: contents; }` — the wrapper disappears from the box
  model entirely, so its children become direct grid items again and keep the brief's
  interleaved mobile order (`levelcard → details → map → progress → training`) via
  `grid-template-areas`, exactly as before.
- **Desktop (`lg`, ≥1024 px):** `.home-sidebar` becomes a real `display: flex;
  flex-direction: column; gap: 1.125rem;` box, occupying a *single* grid cell
  (`grid-template-areas: "map sidebar"`, one row, not four). Its height is now just the
  sum of its own four cards' natural heights plus `gap` — completely independent of the
  map's height, so there is nothing left to inflate.

Measured at 1280 px: gaps between Level→Details, Details→Progress, and Progress→Training
are **all exactly 18 px** (the declared `gap`) — no unnatural whitespace anywhere. The
sidebar is also `position: sticky; top: 24px;` with `max-height: calc(100vh - 48px);
overflow-y: auto;`, so on a normal desktop it stays visible while scrolling the (taller)
map, and would scroll internally rather than clip if a future, larger sidebar ever
exceeded the viewport height.

## Desktop

At 1280 px: `.home-grid` columns are `minmax(0, 1fr) 300px` with a 2rem gap. Measured
against the grid container (1152 px, from the page's `max-w-6xl`): **map = 71% of the grid
width, sidebar = 300 px** — both within the brief's targets (map 70–75%, sidebar
300–340 px).

## Tablet

At 768 px, the layout is still in the mobile (`display: contents`) single-column mode
(the `lg` breakpoint for the two-column sidebar is 1024 px), so the map uses the full
container width and cards sit beside their nodes (the `sm:` card-positioning rule is
already active at 640 px+). Measured: zero node/node, card/card, or node/card overlaps;
no horizontal scroll; nothing rendered outside the viewport.

## Mobile

At 375 px: zero overlaps of every measured kind (see below), no horizontal scroll, no
element rendered outside the viewport, minimum node tap target **72×72 px** (well above
the 44 px target). Visual order, measured via each area's own `getBoundingClientRect().top`
(not DOM order): **Level (466) → Details (675) → Map (890) → Reisefortschritt (2760) →
Trainingslager (2917)** — matches the brief's mobile ordering. Screenshots at 375 px
confirmed the background scenery (torii, mountain, clouds, sakura) stays legible and
secondary to the foreground text/cards.

## Progress 0/5

Fresh profile: Café `current` (with "Du bist hier" and a visibly prominent card + working
Starten button), Reise/Schule/Freunde/Finale all `locked` (misted node, gray card, no
button, "Gesperrt" label). Zero node/card overlaps measured. No "Block"/"Boss"/"Mastered"
text anywhere (checked via full-page-text regex).

## Progress 2/5

Café + Reise `completed` (quieter cards, "Wiederholen" buttons), Schule `current`
(prominent card, "Du bist hier", "Starten"), Freunde/Finale `locked`. This is the exact
scenario the original bug report's screenshot showed as broken (card overlap) — re-tested
specifically and confirmed **zero** node/node, card/card, and node/own-card overlaps at
1280, 768, and 375 px. Sidebar's selected-stage panel auto-tracked to Schule.

## Progress 4/5

Freunde completed, Finale unlocked (`review`, not `locked`): node switched from misted
gray to the gold `quest-node-glow-gold` ring, its card gained the
`quest-row-card-finale` gold border/glow and a working Starten button
(`finaleCardHasButton: true`). Verified the initial finale/node-card overlap bug found
during this pass (finale's node and its "below" card were touching by ~2 px at first
implementation) was fixed by increasing the finale row's reserved top space from 108/116 px
to 210 px on both mobile and tablet+ — re-measured gap after the fix: **19 px**, no overlap.

## Progress 5/5

All five completed, Finale showing the `quest-node-finale-done` gold+green "achieved"
treatment (distinct from the plain gold "available" ring). All five node labels read
"Abgeschlossen".

## Overlap Measurements

Machine-measured via `getBoundingClientRect()` pairwise intersection, not visual
inspection, at 375 / 768 / 1280 px × progress 0/5, 2/5, 4/5, 5/5:

- **Node ↔ node:** 0 overlaps in every combination tested.
- **Card ↔ card:** 0 overlaps in every combination tested.
- **Node ↔ its own card** (the specific pair the original bug report was about): 0
  overlaps after the offset fix (initial implementation had a 2 px touch at 1280 px,
  traced to the card's gap-from-node offset being sized for the circle's radius alone
  rather than the button's full label-driven width; fixed by increasing the offset from
  46 px to 66 px).
- **Row ↔ row:** 0 vertical-range overlaps (structural guarantee of normal document flow,
  re-verified anyway).
- **Finale ↔ next-area preview:** 0 overlap; measured a 20 px gap between the finale row's
  bottom edge and the next-area connector's top edge at 1280 px.
- **Map ↔ sidebar:** 0 overlap at 1280 px.
- **Out-of-viewport:** 0 nodes/cards with `left < 0` or `right > viewportWidth` at 375 px.

## Accessibility

- Map nodes remain native `<button>` elements (unchanged `QuestNode.tsx`): keyboard
  focusable, `aria-pressed`, `aria-label` combining title + status, Enter/Space-activatable
  without custom key handling. Re-verified this pass: focusing and clicking a node via
  `.focus()` + `.click()` updates the sidebar panel without navigating.
- Status is always shown as text (Bereit/Abgeschlossen/Gesperrt) on both the node and its
  compact card, never color-only.
- All decorative scenery/road/wayside SVGs are `aria-hidden="true"` and
  `pointer-events: none` — nothing there is announced or interactable.
- `focus-visible` styling (prior session) is unchanged and still applies to every button,
  including the new Starten/Wiederholen buttons on the compact cards.
- `prefers-reduced-motion` handling (pulse, level-up, sparkle) is unchanged — nothing new
  in this pass added unconditional animation.

## Regression

- **Onboarding:** unaffected — completed a fresh 5-question flow to reach the map.
- **XP / Level:** completed a real Schule lesson (`+100 XP`, `Level 1 → Level 2`,
  `Vorher: 130 XP → Jetzt: 230 XP`, "Freunde freigeschaltet") — untouched Result-screen
  logic from prior sessions still correct after this pass's map/sidebar rework.
- **Vocabulary:** loads, 5 pronunciation buttons rendered.
- **Review:** loads, shows the Wiederholung UI.
- **Practice / Sub Quest / Speaking:** `/practice?word=coffee` loaded its 10-question Sub
  Quest, answered Q1–Q9, reached the Q10 Speaking Challenge (`Speaking Challenge` badge +
  `Sprechen` button present).
- **Locked direct URL:** `/lesson?category=review` while Finale was still locked showed
  "Diese Kategorie ist noch gesperrt." (existing `lesson/page.tsx` guard, untouched).
- **Map-side Starten:** clicking a compact card's own Starten button (not the sidebar's)
  navigated correctly to `/lesson?category=freunde` — confirms both action paths (map card
  and sidebar panel) independently work, per the brief's explicit requirement.
- **Result sounds:** unchanged code path (`lesson/page.tsx` not touched this pass).
- **Hydration / console:** zero console errors and zero server errors across every
  navigation and reload performed, including a hard reload of `/` with progress already
  seeded in `localStorage`.
- **Wording:** no "Block", "Boss", or "Mastered" found anywhere in rendered page text.

## Remaining Issues

- The mobile road curve's target Y-coordinate (used only to draw the decorative curve, via
  a `sm:hidden` / `hidden sm:block` pair of `<path>` elements) is a fixed approximation
  (30% for regular rows, 44% for the finale) rather than a value computed from each row's
  actual (content-driven, therefore variable) height on mobile. The curve still visually
  connects entry-to-node in a plausible S-shape and passes close to the node in every
  progress state checked, but it is not pixel-exact at that one breakpoint the way it is
  at `sm`+ (where the node sits at a fixed 50%). Left as a minor, accepted approximation
  rather than adding JS-measured dynamic path coordinates for a purely decorative curve.
- Sidebar width (300 px) sits at the low end of the brief's 300–340 px range rather than
  the middle, chosen specifically to land the map at 71% (inside the 70–75% target) given
  the page's existing `max-w-6xl` container — a coupled trade-off between the two targets,
  not an oversight.
- As in prior sessions, this environment's screenshot tool intermittently times out;
  screenshots that did succeed this pass are referenced above, and every other visual claim
  is backed by `getBoundingClientRect()` measurements instead.
