# Mobile Beta Release Checklist

Checklist for shipping Area 1 ("Erste Schritte in Japan") to a small external smartphone
beta. Fill the bracketed `[...]` fields at release time.

## Version

- App scope: **Area 1 (free)** — Café → Reise → Schule → Freunde → Finale Wiederholung.
- Content baseline: 45 Main-Quest questions, 26 vocabulary words, 260 Sub-Quest questions
  (incl. 26 Speaking Challenges), 490 total first-clear XP, 26 cards.
- Beta label: `[e.g. area1-beta-1]`

## Commit Hash

- Base at audit time: `057bed5` ("Complete Area 1 accessibility and QA hardening").
- **Not yet committed** at time of writing: the two mobile-UX fixes from the mobile audit
  (`src/app/layout.tsx`, `src/components/ui/FeedbackPanel.tsx`) plus the four
  `docs/MOBILE_*` files.
- **Release commit:** `[fill after committing the fixes]` — the beta MUST be built from a
  commit that includes both fixes (M-01 title/lang, M-02 feedback scroll).

## Vercel URL

- Production/preview URL: `[https://…vercel.app]`
- Confirm it serves the release commit (check the browser tab title reads
  **"Nihongo Quest – Japanisch lernen"**, not "Create Next App" — a quick smoke test that
  the M-01 fix is live).

## Test Period

- Start: `[date]` — End: `[date]` (suggest ~1 week for wave 1).
- Wave 1 size: 5–8 testers.

## Target Testers

- German native speakers, Japanese A0–A2, testing on their **own** smartphone (portrait).
- Mix of "has used learning apps" and "has not".

## Supported Devices

- Any modern smartphone browser (iOS Safari, Android Chrome) at 320–430px CSS width.
- Verified layouts: 320 / 360 / 375 / 390 / 430 px (no horizontal overflow, no overlaps,
  all touch targets ≥44px). 412px is bracketed by the 390/430 results.
- Desktop (768/1280) also works but is out of scope for this beta.

## Known Limitations

- **No account / cloud sync.** Progress is per-device, per-browser (localStorage). Clearing
  site data or switching browsers/devices resets progress. Testers should be told this so
  they don't expect cross-device continuity.
- **Speaking Challenge** needs microphone permission and a browser with the Web Speech
  API; unsupported browsers degrade gracefully (the step can be skipped).
- **No daily streak / notifications** yet — day-2 return relies on intrinsic motivation.
- **Only Area 1** is playable; "Alltag in Japan" is a fogged preview.
- **Auto-scroll** (Home current stage; post-answer feedback) relies on the tab being
  visible; correct on real devices.

## Privacy Notes

- No login, no server-side account, no analytics backend in this build.
- All progress data stays in the browser's localStorage on the tester's device.
- Microphone audio (if used) is processed by the browser's own Web Speech API; the app
  stores no audio.
- If a feedback form (Google Forms etc.) is used, that is a separate third-party service —
  disclose it to testers.

## Data Stored Locally (localStorage keys)

- `nvq_profile` — onboarding answers + createdAt.
- `nvq_xp` — total XP.
- `nvq_collected_cards` — collected vocab ids.
- `nvq_completed_categories` — completed Etappen.
- `nvq_unlocked_categories` — unlocked Etappen.
- `nvq_known_words` — Sub-Quest 9/9 words.
- `nvq_weak_words` — words needing review.
- (No other keys are written.)

## Microphone Permission

- Triggered only at the Speaking Challenge (Q10 of a Sub Quest), on a user gesture.
- Denial / no support / no speech all resolve to a graceful failure; the tester can
  "Überspringen". Confirm on at least one real iOS and one real Android device.

## Test Instructions

- Give testers the URL and `MOBILE_USER_TEST_PLAN_DE.md` tasks only — **no** explanation of
  how the app works.
- If a tester already has progress, have them clear site data so Onboarding appears
  (without explaining what follows).
- Moderator must not reveal answers or pre-explain UI.

## Feedback Form

- Use `MOBILE_USER_FEEDBACK_FORM_DE.md` (transcribe into Google Forms or similar).
- Combine with the moderator observation sheet from `MOBILE_USER_TEST_PLAN_DE.md`.

## Bug Report Requirements

Each bug report must include: device, OS, browser, CSS width if known; **steps taken**;
**what happened**; **what was expected**; screenshot if possible; whether it reproduces.

## Freeze Rules

- **During the test period, do NOT make large UI changes or content/教材 changes.** Keep
  the build stable so all testers see the same app and feedback stays comparable.
- Permitted during the freeze: hotfixes for a genuine UX-P0 (app unusable / progress loss /
  data leak) only. Anything else waits for the post-test analysis.
- No XP / Level / unlock / vocabulary / question changes during the freeze.

## Emergency Rollback

- If a UX-P0 appears mid-test: revert to the previous known-good commit (`057bed5` or the
  last green deploy) and redeploy; note the change and pause new testers until stable.
- Because progress is local per device, a rollback does not lose tester data, but a schema
  change to a localStorage key could — avoid such changes entirely during the freeze.

## Success Criteria

Wave 1 is a success if, across testers:

- ≥ ~80% complete Onboarding → Café → return to Home **without moderator help**.
- Most testers, after answering, see the feedback + "Weiter" **without hunting/scrolling
  confusion** (validates M-02).
- No tester is blocked from progressing (no UX-P0).
- Majority rate "wusste, was als Nächstes zu tun ist" ≥ 4/5.
- Majority rate one-handed use ≥ 4/5.
- No horizontal-scroll / cut-text / overlap bug reports on supported devices.

## Stop Criteria

Pause the test and fix before continuing if:

- Any UX-P0 (progress loss, app won't load, data leak) is observed.
- ≥ 2 testers cannot start the first quest without help.
- ≥ 2 testers report the same blocking layout bug on supported devices.

## Post-Test Analysis

- Aggregate scores + code all open-text answers into themes.
- Map findings to the audit's open items (M-03 Home density, M-04 auto-scroll reliance,
  M-05 onboarding welcome/skip, M-06 retention hook, M-07 Speaking warm-up).
- Decide which UX-P2/P3 items are now evidence-backed enough to schedule.
- Record D1 return (from Sitzung 2) as the key retention signal.
