# Quest Map and XP QA

## Summary

- Files changed: `src/app/page.tsx`, `src/components/ui/QuestNode.tsx`,
  `src/components/ui/ProgressPill.tsx`, `src/components/ui/index.ts` (type re-exports),
  `src/app/globals.css`, `src/lib/levelSystem.ts`, `src/app/lesson/page.tsx`.
  New: `docs/QUEST_MAP_XP_QA.md`. Untouched: questData, vocabData, quizBuilder,
  subQuestData, storage, sound, speech, speechRecognition, practice/vocabulary/review pages.
- Build: `npm run build` — success, 0 errors.
- Lint: `npm run lint` — 0 errors, 0 warnings.
- Browser sizes tested: 375 px, 768 px, 1280 px (geometry-measured: all node circles and
  info panels inside the viewport, zero panel overlaps, no horizontal scroll at any width).
- Progress states tested: fresh profile (nothing completed), after Café, after Café+Reise,
  finale unlocked (4/5 done), everything completed (5/5), replay of a completed stage.

## Quest Map

- Initial: after `localStorage.clear()` + onboarding, the map shows "Erste Schritte in
  Japan / Deine Reise beginnt hier." with a sunrise start marker, one green road segment
  from Start to Café, "Du bist hier" flag on Café, 4 dotted-gray unopened segments, and
  Reise/Schule/Freunde/Finale in gray mist with lock stamps. No "Block", "Boss" or
  "Mastered" anywhere in the DOM (regex-checked).
- Structure: the old zigzag card list is gone. The map is a tall scenic canvas
  (sky→meadow gradient, CSS/SVG clouds and mountain silhouettes) with an inline-SVG
  winding road (cubic bezier S-curves through the five landmark anchors,
  `preserveAspectRatio="none"` + `vector-effect: non-scaling-stroke`, so the road passes
  exactly through the nodes at every width). Stage nodes are landmark circles with
  per-stage inline-SVG icons; details live in small side panels, not full-width cards.
- Completed: green circle with white check stamp and soft glow, "Abgeschlossen" badge,
  "Wiederholen" button; road up to (and including) the player's current position is solid
  green.
- Current: pulsing green ring (disabled under `prefers-reduced-motion`), black
  "Du bist hier" flag above the circle, "Bereit" badge, primary "Starten" button.
- Locked: mist (reduced opacity + grayscale, still readable), lock stamp on the circle,
  "Gesperrt" badge, no button; dotted gray road; direct URL to a locked lesson still
  shows "Diese Kategorie ist noch gesperrt."
- Finale: displayed as "Finale Wiederholung" with description "Zeige, was du auf deiner
  ersten Reise gelernt hast." — a bigger torii-gate landmark with the panel centered
  below it. While locked it is fully gray/misty with no gold and no button (verified:
  `goldFrame:false, mist:true, button:none`). Once unlocked it switches to the gold
  ring/frame with "Bereit" + "Starten" (verified: `gold:true, mist:false`), and after
  completion keeps a gold-and-green "finale done" glow.
- Next area preview: below the map the road continues (dotted) into a fog panel with
  mountain + torii silhouettes: "Als Nächstes / Alltag in Japan / Neue Orte, neue
  Gespräche und eine Hör-Quest." + "Demnächst" badge. Not clickable; no lesson data added.
- Mobile (375 px): vertical winding road retained with moderate left/right meander; all
  circles/panels measured inside the viewport, alternating panel sides prevent overlap,
  buttons ≥ 140×33 px, no horizontal scroll.
- Desktop (1280 px): map takes the wide left column; the right column is a slimmer
  progress rail (Dein Level, Reisefortschritt, Nächstes Ziel, Trainingslager).

## XP

- Purpose shown: an `ⓘ Wofür sind XP?` `<details>` under the status pills explains
  "XP zeigen deinen gesamten Lernfortschritt und erhöhen dein Level. Neue Etappen werden
  durch abgeschlossene Quests freigeschaltet – nicht durch XP." XP is never shown as a
  currency, nothing consumes XP, and unlocking still depends only on completing the
  previous Etappe.
- Level progress: new display-only `getLevelProgress(xp)` in `levelSystem.ts` (thresholds
  0/50/150/280/450 + 170-XP repeat unchanged). Shown as pill sub-line, aside card with
  bar ("Level 1", "80 / 100 XP", "Noch 20 XP bis Level 2", "Gesamt: 130 XP"), and on the
  Result screen.
- Boundary calculations: automated script over xp = 0, 49, 50, 130, 149, 150, 279, 280,
  449, 450, 619, 620 — currentLevel/nextLevel/xpIntoLevel/xpRequiredForLevel/xpRemaining/
  progressPercent all correct and consistent with the untouched `calculateLevelFromXp`
  and `xpForNextLevel` (12/12 cases pass; 450+ repeats every 170 XP as before).
- First completion (Café): Result shows "Level 1 erreicht!", breakdown box
  "XP erhalten / Etappenabschluss +50 XP / Gesamt +50 XP", "Vorher: 0 XP · Jetzt: 50 XP",
  "Level 0 → Level 1 · Noch 100 XP bis Level 2", "5 Karten gesammelt",
  "Reise freigeschaltet". Only the real `gainedXp` is shown — no invented bonuses.
- Reise completion: "Etappe abgeschlossen!", "+80 XP" breakdown, "Vorher: 50 XP · Jetzt:
  130 XP", "Noch 20 XP bis Level 2", "Schule freigeschaltet"; XP bar animated 0% → 80%.
- Replay: "Wiederholung abgeschlossen", breakdown "Wiederholung +0 XP" and note
  "Wiederholungen stärken dein Wissen, geben aber aktuell keine zusätzlichen XP." —
  stored XP verified unchanged (130 before and after). Double-award guard untouched.
- Level up: headline swaps to "Level X erreicht!" with a one-shot pop + CSS sparkles and
  the bar animating from 0 within the new level; all animation is CSS-only and disabled
  under `prefers-reduced-motion`.
- XP breakdown source: only `CategoryCompletionResult.gainedXp/totalXp` plus a
  `getXP()` read before recording — storage logic, keys, and reward values unchanged.

## Regression

- Unlock: Café initially the only startable stage; Café→Reise→Schule→Freunde→Finale chain
  verified while playing through Café and Reise; locked direct URL blocked.
- Cards: Café clear granted 5 cards, Reise 11 total (badge "Karten gesammelt"); counts
  shown in the Karten pill (click → Sammlung works as a real button with aria-label).
- Storage: no key changes; replay leaves xp/cards/completed untouched.
- Result sounds: play-once ref guard untouched; per-answer sounds untouched.
- Vocabulary: page loads, 16 collected cards listed, "Aussprache hören" buttons present.
- Practice/Speaking: Sub Quest loads (1 / 10) — practice page untouched.
- Review: page loads with known/weak sections — untouched.
- Hydration: fresh loads produce zero console errors/warnings (the only warnings during
  the session were dev-time Fast-Refresh full reloads while files were being edited).
- Wording: no "Block", "Boss", "Mastered", or English "Next Unlock" in any user-facing
  screen; status pills now read Level / XP gesamt / Karten / Nächstes Ziel, and
  "Nächstes Ziel" names the next playable Etappe (unlock-by-completion, not XP).

## Remaining issues

- The preview tool's screenshot capture timed out throughout this session (a tooling
  issue: the page itself stayed responsive, console stayed clean, and layout was verified
  via accessibility snapshots and bounding-box measurements at 375/768/1280 px instead).
- Info-panel action buttons on the map are 33 px tall (the app-wide `size="sm"` button)
  — consistent with every other screen, though slightly below the 44 px touch-target
  ideal. Left as-is for visual consistency.
