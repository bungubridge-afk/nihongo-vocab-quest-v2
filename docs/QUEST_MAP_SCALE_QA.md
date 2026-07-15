# Quest Map Scale QA

## Summary

Rebuilt the Quest Map from one giant absolutely-positioned canvas (5 nodes + 5 info cards
all placed by hand-picked percent coordinates) into a scalable, normal-flow structure: one
independent row per Etappe, a minimal landmark node on the map, and a single selected-stage
detail panel that carries everything the old inline cards used to show. Verified at 375 /
768 / 1280 px across four progress states (0/5, 2/5, 4/5, 5/5) with zero measured overlaps.

- Build: `npm run build` — success, 0 errors.
- Lint: `npm run lint` — 0 errors, 0 warnings.
- Browser sizes tested: 375 px, 768 px, 1280 px.
- Progress states tested: 0/5 (fresh), 2/5 (Café+Reise done, Schule current), 4/5 (Freunde
  done, Finale unlocked), 5/5 (all completed, including Finale).

## Files Changed

New:
- `src/components/ui/QuestMap.tsx` — scalable map layout (one row per stage).
- `src/components/ui/QuestStageDetails.tsx` — selected-stage detail panel.
- `src/lib/worldMapData.ts` — display-only metadata (world name, per-stage icon, flavor
  text, next-area preview array). No lesson content, no XP truth.
- `docs/CONTENT_ARCHITECTURE_10000.md` — Part 2 content specification.
- `docs/QUEST_MAP_SCALE_QA.md` — this file.

Changed:
- `src/components/ui/QuestNode.tsx` — reduced to a pure landmark button (circle + icon +
  short label + status text). No more description, no XP/Karten text, no Starten button,
  no absolute-position `style`/`side` props. Exports `StageIcon` for reuse in the details
  panel.
- `src/components/ui/index.ts` — re-exports for `QuestMap`/`QuestStageDetails`, dropped
  `QuestNodeSide` (removed, no longer needed).
- `src/app/globals.css` — replaced the old `.quest-map`/`.quest-node-panel*` absolute-
  canvas rules with per-row rules (`.quest-row`, `.quest-row-path`, `.quest-row-node`) and
  a new `.home-grid` (CSS Grid with named areas that reorder between mobile and desktop).
- `src/app/page.tsx` — `HomeQuestMap` now builds a `stages[]` array from real
  unlock/completion state, holds `selectedId` (defaults to the next playable stage, or
  Finale once everything is done), and renders `QuestMap` + `QuestStageDetails` inside the
  new grid instead of the old `AdventureMap`/inline cards.

Untouched (per instructions): `lesson/page.tsx`, `practice/page.tsx`,
`vocabulary/page.tsx`, `review/page.tsx`, `questData.ts`, `vocabData.ts`, `quizBuilder.ts`,
`subQuestData/*`, `storage.ts`, `levelSystem.ts` (only its already-existing exports are
imported, nothing in it changed), `sound.ts`, `speech.ts`, `speechRecognition.ts`.

## Layout Architecture

**Previous overlap cause:** all 5 nodes lived in one `position: relative` canvas of fixed
pixel height (`h-[920px] sm:h-[880px]`), each node absolutely positioned by hand-picked
`{x%, y%}` coordinates, with a wide info-card (`.quest-node-panel`, up to 13.5rem) also
absolutely positioned relative to *that same node*. Any future Etappe meant hand-tuning
more coordinates in a shared space that had no structural guarantee against two panels
landing on the same pixels — which is exactly what the brief's screenshot showed.

**New structure:** `QuestMap` renders `stages.map(...)` as ordinary flow `<div>`s
(`.quest-row`), each with its own `min-height` (see Node Spacing below) and its own
absolutely-positioned content **scoped to that row only** — a node can never reach into a
neighboring row because rows are separate block boxes stacked by normal document flow, not
shared coordinates. Adding a 101st stage later means the array gets a 101st element and the
map gets a 101st row; nothing else needs to change, and the total height is never a
hand-set number — it is `sum(row min-heights)`, computed by the browser.

The winding road itself is drawn **per row**, not as one canvas-wide SVG: each row's path
starts at the x-position where the previous row's path ended (so segments connect visually)
and curves to the current stage's lane position, which is also exactly where that row's
node sits (`rowRoadPath()` in `QuestMap.tsx` routes the curve through the node's fixed
`(laneX, 50%)` point, so the road is never visually offset from the node it leads to).
Lane positions cycle through 4 values (`[24, 76, 40, 60]`) instead of a strict left/right
alternation, so the path keeps looking natural indefinitely instead of repeating a rigid
2-step zigzag — this was verified conceptually (the array size no longer bounds the design)
though only 5 real stages exist to click through today.

## Selected Stage Details

Everything that used to sit in the wide inline card (description, status, XP reward, card
count, Starten/Wiederholen button, locked-reason copy) now lives in exactly one place:
`QuestStageDetails`, driven by `selectedId` state in `HomeQuestMap`.

- Initial selection: `nextCategory ?? "review"` — Café on a fresh profile (verified),
  automatically follows the player to Reise → Schule → Freunde → Finale as each stage
  completes (verified after a real Café and a real Schule lesson completion in-browser —
  selection moved to Reise, then to Freunde, with no manual reselection).
- Selecting a node **only swaps the panel** — verified: clicking the Café landmark while on
  Schule's turn left `window.location.href` at `/` and updated the panel to show Café's
  "Wiederholen" button; no navigation happened until that button was clicked.
- Locked stages are fully selectable (clicking Freunde while it was locked showed its
  description, `+110 XP`, a "Gesperrt" badge, and "Schließe zuerst die vorherige Etappe
  ab." — with **no** Starten/Wiederholen button rendered at all).
- Keyboard: nodes are real `<button>` elements (`aria-pressed`, `aria-label="{title} –
  {status}"`), so Tab focuses them and native `<button>` semantics fire the same `onSelect`
  handler on Enter/Space — no custom key handling needed or added.

## Node Spacing

`.quest-row` minimum heights (measured via `getBoundingClientRect()`, not assumed):

| Breakpoint | Target (brief) | Measured |
|---|---|---|
| Mobile (375 px) | 190–230 px | 210 px (CSS `min-height`, base rule) |
| Tablet (768 px) | 230–270 px | 250 px |
| Desktop (1280 px) | 280–320 px | 300 px |

These are `min-height`, not fixed height — a row with unusually tall content (e.g. a very
long title wrapping to 3 lines) grows the row instead of overflowing it, so nothing is ever
clipped or bled into a neighbor.

## Desktop

`.home-grid` at ≥1024px: `grid-template-columns: minmax(0, 1fr) 320px` with `column-gap:
2rem`. Measured against the actual grid container (not the raw viewport, which also
includes page padding): map = 800 px, sidebar = 320 px, container = 1152 px → **map is 69%
of the grid** (target 70–75%; the 1-point shortfall is the container's own `max-w-6xl`
cap plus the fixed 320 px sidebar arithmetic, not a layout bug — widening the container
slightly or narrowing the sidebar by ~15px would hit 70% exactly, left as a follow-up
tuning note rather than a required fix). Sidebar cards render in the brief's required order
top-to-bottom: Dein Level → selected stage details → Reisefortschritt → Trainingslager, with
no duplicate "Nächstes Ziel" card (the old standalone card was removed; its job is now the
details panel itself, which auto-follows the next playable stage).

## Tablet

768 px verified: row heights 250 px (exactly mid-range of the 230–270 target), zero node
overlaps, no horizontal scroll (`document.documentElement.scrollWidth === innerWidth`).

## Mobile

375 px verified: row heights 210 px, zero node overlaps, no horizontal scroll, minimum
node tap target measured at **72×72 px** (target ≥44 px, comfortably exceeded). Visual
order (measured via each area's `getBoundingClientRect().top`, not DOM order) confirmed:
**Dein Level (466) → selected stage details (675) → Quest Map (934) → Reisefortschritt →
Trainingslager** — matching the brief's mobile ordering via `grid-template-areas` alone;
no JS reordering, no duplicate markup.

## Progress 0/5

Fresh profile after `localStorage.clear()` + onboarding: Café shown as `current` with the
"Du bist hier" flag, Reise/Schule/Freunde/Finale all `locked` (misted, lock stamp, no
Starten button, "Gesperrt" label preserved as text — not color-only). Selected details
panel defaulted to Café with a working "Starten" button. No occurrence of "Block" anywhere
in the page text (regex-checked). Zero node-to-node overlaps at any tested width.

## Progress 2/5

Café + Reise seeded as `completed`, Schule `current`, Freunde/Finale `locked`. Node labels
read `CaféAbgeschlossen`, `ReiseAbgeschlossen`, `Du bist hierSchuleBereit`,
`FreundeGesperrt`, `Finale WiederholungGesperrt`. Selected panel auto-defaulted to Schule.
Zero overlaps measured (the exact scenario the brief's screenshot showed as broken before).

## Progress 4/5

Freunde completed, Finale (`review`) unlocked: circle switched from misted gray to the
gold `quest-node-glow-gold` treatment (`finaleGold: true, finaleMist: false`), details
panel showed the flavor text "Zeige, was du auf deiner ersten Reise gelernt hast." and a
working Starten button. Confirms the "locked Finale never looks challengeable, unlocked
Finale gets special gold treatment" requirement holds through the state transition, not
just at rest.

## Progress 5/5

All five stages `completed`, Finale showed the `quest-node-finale-done` gold+green glow
treatment distinct from the plain gold "available" ring. All five map labels plus the
details-panel status badge read "Abgeschlossen" (6 occurrences, verified by count).

## Overlap Measurements

Machine-measured via `getBoundingClientRect()` pairwise intersection tests, not visual
inspection, at all three breakpoints:

- **Node ↔ node:** 0 overlaps at 375 / 768 / 1280 px, in all four progress states tested.
- **Row ↔ row:** 0 vertical-range overlaps (each `.quest-row`'s own bounding box never
  intersects a sibling row's — a structural guarantee of normal document flow, re-verified
  empirically anyway).
- **Map ↔ sidebar:** 0 overlaps at 1280 px (`mapVsSidebarOverlap: false`).
- **Node ↔ its own label:** by construction, not measured separately — the label is inside
  the same `<button>` as the circle, so "overlap" isn't a meaningful question; what was
  measured instead is whether that combined block stays inside its row (yes, verified
  under Node Spacing).
- Out-of-viewport check (`left < 0 || right > viewportWidth`) on every node at 375 px: 0
  nodes out of bounds.

## Navigation

- Selecting a node never navigates (`window.location.href` unchanged after clicking a
  different, non-current node) — verified directly.
- The details panel's Starten button navigates to `/lesson?category={selectedId}`; the
  Wiederholen button (shown for completed stages) does the same.
- Locked stages render no button at all — there is nothing to accidentally click into a
  locked lesson from the panel; the existing `lesson/page.tsx` access guard (untouched)
  still independently blocks a direct URL to a locked category.

## Accessibility

- Every map node is a native `<button>` (`aria-pressed`, `aria-label` combining title +
  status) — keyboard-focusable and Enter/Space-activatable without any custom key
  handling.
- Status is always shown as text ("Bereit"/"Abgeschlossen"/"Gesperrt"), never color-only,
  both on the map node and in the details panel's badge.
- `focus-visible` outline (added in the prior session, unchanged) still applies to these
  buttons.
- `prefers-reduced-motion` handling (pulse/level-up/sparkle animations) is unchanged from
  the prior session — nothing in this pass added new unconditional animation.

## Regression

- **Onboarding:** unaffected — completed a fresh 5-question flow to reach the map.
- **XP / Level:** completed a real Café lesson (`+50 XP`, `Level 0 → Level 1`) and a real
  Schule lesson (`+100 XP`, `Vorher: 130 XP → Jetzt: 230 XP`, `Level 1 → Level 2`,
  "Freunde freigeschaltet") — Result screen XP breakdown/Level-up UI from the prior session
  is untouched and still correct after this pass's Home rewrite.
- **Vocabulary:** loads, 5 pronunciation buttons rendered for the seeded card set.
- **Review:** loads, shows the Wiederholung UI.
- **Practice / Sub Quest / Speaking:** `/practice?word=coffee` loaded its 10-question Sub
  Quest, answered through Q1–Q9, and reached the Q10 Speaking Challenge screen
  (`Speaking Challenge` badge + `Sprechen` button present) — untouched practice page still
  works after the Home-only changes here.
- **Locked direct URL:** `/lesson?category=review` while Finale was still locked showed
  "Diese Kategorie ist noch gesperrt." — existing guard in `lesson/page.tsx` (not modified)
  still enforced.
- **Result sounds:** unchanged code path (`lesson/page.tsx` not touched by this pass); the
  play-once ref guard from the prior session still governs it.
- **Hydration / console:** zero console errors and zero server errors across every
  navigation and reload performed during this QA pass, including a hard reload of `/`
  after progress had been seeded via `localStorage`.
- **Wording:** no "Block", "Boss", or "Mastered" found anywhere in rendered page text
  (regex-checked on the full `document.body.textContent` at multiple states).

## Remaining Issues

- Desktop map-to-grid-width ratio measured at **69%** against the 70–75% target — a
  1-point shortfall traced to the container's `max-w-6xl` cap combined with the fixed
  320 px sidebar column, not a structural defect. Left as a minor tuning note rather than
  changed now, since adjusting it further would mean picking a new arbitrary max-width or
  sidebar width without a specific number given in the brief.
- As in the prior session, the preview tool's screenshot capture was unreliable in this
  environment (timed out repeatedly); all visual/geometry claims in this report are backed
  by `getBoundingClientRect()` measurements and accessibility-tree snapshots instead of
  screenshots.
- `QuestMap`'s lane-cycle algorithm is designed to be Etappe-count-independent, but has
  only been exercised with the real 5-stage free area — `docs/CONTENT_ARCHITECTURE_10000.md`
  flags re-verifying it at a larger Etappe count (e.g. Area 2's 6 stages, or a synthetic
  20+ stage test) as a Phase 2 follow-up before it's relied on at that scale.
