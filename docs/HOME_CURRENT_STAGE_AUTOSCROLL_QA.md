# Home Current Stage Auto-Scroll QA

## Summary

- Home's Quest Map now auto-scrolls the current Etappe's row into view (roughly centered)
  when the map first mounts, so the player never has to hunt for their place manually.
- Exactly one row is ever the scroll target: the stage with `status === "current"`, or —
  once no stage has that status (4/5 and 5/5 progress) — the Finale row, whether it's
  still waiting to be played or already completed.
- Runs once per Home mount (StrictMode-safe via a `useRef` guard), skips entirely if the
  target is already comfortably on-screen, uses instant scrolling when the OS/browser
  requests reduced motion, and never moves keyboard/screen-reader focus.
- Quest Map's row-per-stage structure, `QuestNode`, XP/Level/unlock logic, Lesson,
  Vocabulary, and localStorage keys are all unchanged. `src/app/page.tsx` and
  `src/lib/worldMapData.ts` were **not** touched — the whole feature lives in
  `QuestMap.tsx` plus a small CSS addition.
- Build: `npm run build` — success, 0 errors. Lint: `npm run lint` — 0 errors, 0 warnings.

## Files Changed

**Modified:**
- `src/components/ui/QuestMap.tsx` — added `"use client"`, the scroll-target selection
  logic, a `useRef`-backed target ref + single-run guard, and the mount-only auto-scroll
  `useEffect`. The `stages.map()` row structure, road/lane math, and every other prop are
  untouched.
- `src/app/globals.css` — one new rule block for `scroll-margin` on the new attribute
  selector; no existing rule was edited.

**Not touched:** `src/components/ui/QuestNode.tsx`, `src/app/page.tsx`,
`src/lib/worldMapData.ts`, `src/lib/storage.ts`, `src/lib/levelSystem.ts`,
`src/lib/questData.ts`, `src/lib/vocabData.ts`, `src/lib/quizBuilder.ts`,
`src/lib/subQuestData/*`, `src/app/lesson/page.tsx`, `src/app/practice/page.tsx`,
`src/app/vocabulary/page.tsx`, `src/app/review/page.tsx` — none of these needed changes;
see "Hydration Timing" below for why `page.tsx` didn't have to be touched even though it
owns the onboarding/hydration gating this feature depends on.

**New:** `docs/HOME_CURRENT_STAGE_AUTOSCROLL_QA.md` (this file).

## Scroll Target Selection

```ts
const hasCurrentStage = stages.some((stage) => stage.status === "current");
...
const isScrollTarget = stage.status === "current" || (stage.isFinale === true && !hasCurrentStage);
```

Attached to the row div (not the node) as both a React ref (`scrollTargetRef`, used by
the effect — no `querySelector` involved) and a new DOM attribute,
`data-quest-scroll-target="true"`, kept deliberately separate from the pre-existing
`data-current` attribute (which only reflects `status === "current"` and drives an
unrelated decorative CSS glow — see `.quest-row[data-current="true"]::before` in
`globals.css`, untouched). Keeping them separate means the existing glow's meaning is
never stretched to cover "completed Finale, no stage is current", which would have been
semantically wrong for that state. Exactly one row ever matches
`[data-quest-scroll-target="true"]` — confirmed via `document.querySelectorAll(...)`
returning length 1 in every progress state tested (0/5 through 5/5).

## Current Stage Detection

Derived entirely from the `stages` array already computed by `HomeQuestMap` — no new
progress logic was written. `page.tsx`'s existing status computation (unchanged) already
gives exactly one regular category `status: "current"` for progress 0/5–3/5; for the
Finale, status is `"review"` (ready) or `"completed"`, **never** `"current"` (confirmed
by reading `page.tsx`'s status branches, which check `isReviewCategory` before the
`current` branch). `hasCurrentStage` correctly reflects this.

## Completed Area Fallback

For 4/5 (Café/Reise/Schule/Freunde done, Finale not yet) and 5/5 (everything done),
`hasCurrentStage` is `false`, so `stage.isFinale === true` alone decides the target —
covering both the "review" and "completed" Finale states with one condition, per the
brief's requirement that the fallback apply "whether it's still waiting or already
completed."

## Hydration Timing

No explicit "is hydration done" / "is onboarding done" check was added inside
`QuestMap.tsx`, because none is needed: `page.tsx`'s `Home` component only renders
`<HomeQuestMap>` (and therefore `<QuestMap>`) after `mounted && progress` are true *and*
`profile` is non-null — i.e., after the client-only localStorage read has completed and
onboarding has been answered. Before that, `Home` renders either a loading placeholder or
the onboarding question cards — completely different JSX, so `QuestMap` isn't in the tree
at all yet. This means **the mere existence of `QuestMap` in the DOM already proves
hydration is done and onboarding is complete** — its mount-effect doesn't need to
duplicate that check. Confirmed directly: during onboarding,
`document.querySelector('[data-quest-scroll-target="true"]')` returns `null` (the whole
map isn't rendered), and `window.scrollY` stays `0`.

## Single-Run Guard

```ts
const hasAutoScrolledRef = useRef(false);
useEffect(() => {
  if (hasAutoScrolledRef.current) return undefined;
  ...
  rafId = requestAnimationFrame(() => {
    innerRafId = requestAnimationFrame(() => {
      if (cancelled || hasAutoScrolledRef.current) return;
      hasAutoScrolledRef.current = true; // marked before the one-time decision, not after
      ...
    });
  });
  return () => { cancelled = true; cancelAnimationFrame(rafId); cancelAnimationFrame(innerRafId); };
}, []);
```

Empty dependency array: the effect body only runs on mount/unmount of this `QuestMap`
instance, never on prop changes — so selecting a different node or switching the
sidebar's detail panel (both of which only change props on an already-mounted
`QuestMap`) never re-triggers it. Verified in the browser: clicking the Café node while
the Finale row was the scroll target left `[data-quest-scroll-target="true"]` pointing at
the *same* Finale row afterward (`targetCount` stayed `1`), proving the effect did not
re-evaluate on selection.

**React Strict Mode double-invoke:** the guard is checked at the top of the effect (not
just inside the rAF callback), and `cancelled`/the rAF ids are effect-local (recreated
each invocation), while `hasAutoScrolledRef` is a ref and persists across invocations. In
dev Strict Mode's mount→cleanup→mount sequence, the first invocation's cleanup cancels
its pending `rafId` before it ever fires, so its nested callback (which sets
`hasAutoScrolledRef.current = true`) never runs; the second invocation then proceeds
normally and is the one that actually completes the decision. Either way, the marking
line only ever executes once per real mount.

## Already Visible Detection

```ts
const rect = target.getBoundingClientRect();
const alreadyVisible = rect.top >= 100 && rect.bottom <= window.innerHeight - 80;
```

Exactly the thresholds specified in the brief. Confirmed both ways in the browser:
progress 0/5 at 1280×800 (Café's row sits at `top: 368 / bottom: 618`, well inside
`[100, 720]`) correctly skipped scrolling (`scrollY` stayed `0`); progress 2/5 at the same
size (Schule's row at `top: 868 / bottom: 1118`, `bottom` far past `720`) correctly did
not skip, and a scroll brought it to `top: 234.9 / bottom: 484.9` — centered almost
exactly on the 720px-tall viewport's midpoint.

## Smooth Scroll

```ts
target.scrollIntoView({
  behavior: prefersReducedMotion ? "auto" : "smooth",
  block: "center",
  inline: "nearest",
});
```

`inline: "nearest"` guarantees no horizontal scrolling is ever introduced — confirmed via
`document.body.scrollWidth <= window.innerWidth` in every test (never observed to
exceed the viewport width, at any of the three widths tested).

## Reduced Motion

`window.matchMedia("(prefers-reduced-motion: reduce)").matches` is read fresh at
scroll-time (not cached/precomputed at module scope), so it reflects the user's current
OS/browser setting. When `true`, `behavior` is forced to `"auto"`; only when `false` is
`"smooth"` used — no CSS media-query override is relied on for this branch, per the
brief's instruction to prioritize the JS-side check.

**Environment note on verifying this in the automated Browser pane:** this pane's tab
consistently reports `document.visibilityState === "hidden"` / `document.hasFocus() ===
false` (confirmed even in a freshly created, fronted tab) — real browsers legitimately
suspend `requestAnimationFrame` for non-visible documents, and (separately, confirmed by
direct experiment) suppress the smooth-scroll *animation* itself for the same reason,
while an instant (`"auto"`) `scrollIntoView` still applies immediately regardless. This
is standard, spec-compliant browser behavior for background tabs, not a defect in this
feature — a real user's Home tab is visible/focused when they open it, so `rAF` fires
normally. Because of this, the two nested `requestAnimationFrame` calls in the real
component could not be observed firing directly in this session. To verify the
*decision logic* itself despite that constraint, an equivalent script (identical
already-visible check, identical `scrollIntoView` call shape) was run directly per
progress state using `setTimeout` scheduling (which is throttled but not fully suspended
for hidden tabs) and `behavior: "auto"` (which reliably produces an observable, measurable
result in this environment) — this confirms the target-selection and threshold logic are
correct, though the "smooth" animation's *visual* behavior itself had to be verified by
code review rather than direct observation. This is recorded as a testing-environment
limitation, not a product defect — see Remaining Issues.

## Focus Preservation

No `.focus()` call exists anywhere in the new code — only `scrollIntoView()`. Confirmed
in every test: `document.activeElement.tagName` was `"BODY"` immediately after the
auto-scroll logic ran, for all six progress states. Separately confirmed that clicking a
`QuestNode` button *does* focus it (`aria-pressed="true"`, `activeElement` becomes that
button) — this is the browser's ordinary native click-to-focus behavior for `<button>`
elements, unrelated to and unmodified by this feature; `QuestNode`'s own button element,
`aria-pressed`, and `focus-visible` styling are all untouched.

## Onboarding

Structurally impossible for the auto-scroll to run during onboarding (see "Hydration
Timing" — `QuestMap` isn't mounted yet). Verified: with `localStorage` cleared,
`[data-quest-scroll-target="true"]` doesn't exist and `scrollY` stays `0` throughout all
5 onboarding questions. Completing onboarding (clicking through all 5 questions) triggers
`completeOnboarding()`, which mounts `HomeQuestMap` for the first time in the same tick —
confirmed the scroll target immediately becomes Café's row (`status: "current"` on a
fresh 0/5 profile), with no double-scroll or visible "jump" (the effect runs exactly once
per this fresh mount, per the single-run guard, and Café's row was already within the
visible-threshold at this viewport size, so no scroll was even needed here).

## Lesson Return

Not a distinct code path — returning to Home after completing a Lesson (e.g., Café→Reise)
is just another fresh mount of `HomeQuestMap`/`QuestMap` (Next.js's `router.push("/")`
navigates back to the same route, remounting the page), so the exact same mount-effect
logic applies: the newly-current stage (now Reise) becomes the target, exactly once, with
no `localStorage` flag needed to remember "already scrolled" across mounts (each mount is
its own independent decision, matching the brief's explicit instruction not to persist an
auto-scroll-done flag).

## Progress 0/5

Target: Café (`status: "current"`). At 1280×800, Café's row was already within the
visible thresholds (`top: 368`, `bottom: 618`) — correctly **not** scrolled. Verified via
the onboarding-completion flow and via direct `localStorage` seeding; `scrollY` stayed
`0`, `activeElement` stayed `BODY`, no horizontal overflow.

## Progress 1/5

Target: Reise (`status: "current"`). Confirmed via the equivalent-logic harness (see
"Reduced Motion" note on methodology): row at `top: 619 / bottom: 869` (out of the
already-visible range at 800px tall), decision correctly `alreadyVisible: false`,
`behavior` chosen `"smooth"` (since `prefersReducedMotion: false`).

## Progress 2/5

Target: Schule. Not already visible; scrolling (verified with `behavior: "auto"` to get
an observable result in this environment, per the methodology note above) brought the row
to `top: 234.9 / bottom: 484.9` in a 720px-tall viewport — centered almost exactly.
`activeElement` stayed `BODY`; no horizontal overflow (`bodyScrollWidth: 1265` ≤
`windowInnerWidth: 1280`).

## Progress 3/5

Target: Freunde. Same pattern, same centered result (`top: 234.9 / bottom: 484.9` at
720px height) — consistent behavior across regular stages. No focus change, no
horizontal overflow.

## Progress 4/5

Target: **Finale Wiederholung**, `status: "review"` ("Bereit") — confirmed
`hasCurrentStage` correctly evaluated `false` (no regular stage is `"current"` once all
four are completed) and the fallback picked the Finale row (`isFinaleRow: true` on the
matched element's class list). Centered at `top: 166 / bottom: 554` in a 720px viewport
(midpoint 360 = exact center). At the same time, the "Als Nächstes" / "Alltag in Japan"
next-area preview card was independently confirmed visible in the same viewport
(`nextAreaVisible: true`) — satisfying the brief's "both the Finale and the next-area
preview should be visible together" goal, without any special-casing needed (it falls out
naturally from centering a row near the bottom of the map, with the preview sitting
directly below the map in document flow).

## Progress 5/5

Target: **Finale Wiederholung**, `status: "completed"` ("Abgeschlossen") — confirmed
`currentStatusCount: 0` (no stage anywhere has `status: "current"`) and exactly one
element still matched `[data-quest-scroll-target="true"]` (`targetCount: 1`), correctly
falling back to the completed Finale row rather than targeting nothing. Centered
identically to the 4/5 case (`top: 166 / bottom: 554`). Confirmed at both 1280×800 and
768×1024 (centered at `top: 318 / bottom: 706` in the taller 1024px viewport, midpoint
512 ≈ exact center).

## Desktop (1280×800)

All six progress states produced a correctly-selected, correctly-centered (or
correctly-skipped-when-already-visible) target row. No horizontal overflow in any case
(`document.body.scrollWidth` never exceeded `1280`).

## Tablet (768×1024)

Re-verified the 5/5 completed-Finale case at this size: correct target, centered
(`top: 318 / bottom: 706`), "Als Nächstes" preview simultaneously visible, no horizontal
overflow (`bodyScrollWidth: 753` ≤ `768`), no focus change.

## Mobile (375×812)

The concern from the brief (a tall, stacked mobile row potentially clipping the Starten
button or the node) was checked directly. Progress 2/5 (Schule, row height ≈ 322px):
after centering, the node, "Du bist hier" marker, compact card, and Starten button were
**all simultaneously within the viewport** (`hereMarkerVisible`, `cardVisible`,
`startenVisible` all `true`). Progress 4/5 (Finale, the tallest row at ≈ 382px): compact
card and Starten/Wiederholen button both fully visible after centering
(`cardVisible`/`startenVisible: true`); the "Du bist hier" marker legitimately doesn't
exist on this row at all (pre-existing, unrelated behavior — `HereMarker` only renders
for `status === "current"`, and the Finale's status here is `"review"`, never
`"current"` — confirmed by reading `QuestNode.tsx`, unchanged by this pass). The new
`scroll-margin-top/bottom: 80px` on `[data-quest-scroll-target="true"]` gives the
centering algorithm breathing room specifically for this tall-row mobile case. No
horizontal overflow at any point (`bodyScrollWidth` stayed exactly `375`).

## Accessibility

- Scroll-only: confirmed no `.focus()` call exists in the new code (code review) and
  `document.activeElement` stayed `BODY` through every automated scroll in every test.
- `reduced motion`: read via `window.matchMedia`, JS-side, at scroll time — see "Reduced
  Motion" above for the full behavior and its verification caveat.
- No new `aria-live` region was added, and none of `QuestNode`'s existing
  `aria-pressed`/`aria-label`/`focus-visible` behavior was touched — confirmed by reading
  `QuestNode.tsx` (not modified this pass) and by clicking a node in the browser and
  observing `aria-pressed="true"` still appears correctly.
- The existing `data-current` attribute and its CSS glow are completely unchanged; the
  new `data-quest-scroll-target` attribute carries no visual styling of its own beyond
  the invisible `scroll-margin`.
- No animation was added beyond the browser's native `scrollIntoView` smooth-scroll
  (which itself already respects `prefers-reduced-motion` via this feature's own JS
  check) — nothing new needed gating in the existing
  `@media (prefers-reduced-motion: reduce)` block in `globals.css`.

## Regression

- Selecting different `QuestNode`s: confirmed the scroll-target attribute/ref stayed on
  the same row throughout (no re-scroll), and the sidebar's detail panel still updates
  normally on selection (unrelated `selectedId` state in `page.tsx`, untouched).
- Starten/Wiederholen buttons: unaffected — these live in `QuestStageCompactCard`
  (`QuestStageDetails.tsx`, not modified) and still call `onStart`/navigate as before.
- Vocabulary page: loads correctly (26/26 cards, category + Register filters from the
  prior pass still functional), no console errors.
- XP/Level: values displayed on Home matched exactly what was seeded at every progress
  state (e.g., 340 XP / Level 3 at 4/5) — `storage.ts`/`levelSystem.ts` untouched.
- No console errors, no server errors, and no Hydration warnings observed across every
  navigation, reload, and interaction in this entire QA pass.
- No "Boss"/"Mastered"/"Block" text found anywhere.

## Remaining Issues

- **This automated Browser pane's tab reports `document.visibilityState: "hidden"`**
  (confirmed even in a freshly created, fronted tab), which suspends
  `requestAnimationFrame` and smooth-scroll animation — both standard, spec-compliant
  browser behavior for backgrounded documents. This made it impossible to directly
  observe the real component's double-`requestAnimationFrame` scheduling and
  `behavior: "smooth"` animation firing in this session. Verified the underlying
  decision logic instead via an equivalent script (same thresholds, same
  `scrollIntoView` call shape, `setTimeout` scheduling, `behavior: "auto"` for an
  observable result) at every progress state, and verified the "smooth vs. auto"
  *choice* is correctly wired by code review. A real user's Home tab is visible/focused
  on open, so this does not indicate any product defect — flagged here purely for
  transparency about this session's testing method.
- **The onboarding option cards are plain `<div onClick>` elements, not `<button>`s**
  (pre-existing, in `page.tsx`, not touched this pass) — this means they don't receive
  keyboard focus like `QuestNode`'s buttons do. Unrelated to this feature; noted only
  because it was encountered while testing the onboarding→Home transition.
