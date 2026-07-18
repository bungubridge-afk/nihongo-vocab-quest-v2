# Mobile UX Meta Audit

Smartphone-first UI/UX audit of the free Area 1 ("Erste Schritte in Japan"), re-derived
this pass from the current code and live browser measurement — not carried over from the
earlier `AREA1_COMPREHENSIVE_QA.md`. Target context: a German native speaker (Japanese
A0–A2) opens a URL on their phone, one-handed, in a 3–10 minute session, with no prior
explanation.

## Executive Summary

Area 1 is fundamentally sound on mobile: no horizontal overflow, no overlaps, and all
touch targets ≥44px at every tested width (320/360/375/390/430). The learning content,
rewards, unlocks and privacy were already verified in the prior comprehensive pass. This
mobile pass found **two real, evidence-backed mobile UX defects** and fixed both:

1. **The page/tab title was "Create Next App" and the document language was English
   (`lang="en"`) on a fully German UI.** This is the very first thing a user sees (browser
   tab, shared-link preview) and it undercuts trust; the wrong `lang` also makes screen
   readers mispronounce the German interface. → Fixed.
2. **After answering a question, the "Richtig!/Leider falsch" confirmation and the
   "Weiter" button appear below the fold on typical phones, with no auto-scroll** — so a
   learner taps an answer and sees no visible change, then has to scroll blindly to
   continue. This repeats on every one of the 45 main-quest + up to 260 sub-quest
   questions, in both the Lesson and Practice flows. → Fixed (feedback now scrolls into
   view, guarded so it never moves when already visible, reduced-motion aware).

The remaining observations (Home top-of-page redundancy, dependence on auto-scroll to
reach the map, no onboarding skip/welcome, no daily-return hook) are UX-P2/P3 — worth
watching in the external test, but not blockers, and deliberately **not** changed this
pass to avoid layout regressions before real user data exists.

## Final Verdict

**Conditional Ready** — ready for a limited (5–8 person) external smartphone test.

Rationale: no UX-P0; the two UX-P1 defects are fixed and verified; the core loop works
end-to-end on 320–430px; first-time users can reach and start the first quest. The
"Conditional" reflects (a) the auto-scroll behaviours (Home current-stage and the new
feedback scroll) rely on `requestAnimationFrame`, which this QA environment cannot observe
because it runs the tab as `visibilityState:"hidden"` — verified by forcing the exact
calls, and the Home one was separately confirmed by the user in a real browser — and (b)
live microphone and native-German-copy checks that only real testers can close. These are
external-test observation items, not code blockers.

## Target User

- German native speaker, Japanese level A0–A2.
- On their own smartphone, portrait, one-handed, low-focus (commute/break).
- Opens a bare URL with no onboarding call, wants to "play" at learning words.
- Sessions of 3–10 minutes; success = wants to reopen tomorrow.

## Test Assumptions

- PC correctness is not sufficient; a PC-fine screen that feels cramped, dense, or
  directionless on a phone is a UX defect.
- Real phones lose 100–200px of height to browser chrome; a viewport that "just fits" on
  a 780px emulation can overflow on a real 320×560 device.
- Auto-scroll / smooth-scroll and CSS entrance animations are paused while a tab is
  backgrounded (`visibilityState:"hidden"`); the QA automation tab is always hidden, so
  those behaviours were verified by replicating their exact calls against the live DOM and
  (for the Home scroll) by the user's real-browser confirmation.

## Mobile Device Matrix

Measured with `getBoundingClientRect` / `documentElement.scrollWidth` at each width
(portrait). "OK" = no horizontal overflow, no element wider than viewport, no quest-row or
node/card overlap.

| Width | Home | Onboarding | Lesson (Q) | Lesson (answered) | Vocabulary | Practice/Speaking | Result | Verdict |
|---|---|---|---|---|---|---|---|---|
| 320px | OK | OK | OK (choices fit, tight) | feedback below fold* | OK (search 288px) | OK | OK | OK |
| 360px | OK | OK | OK | feedback below fold* | OK | OK | OK | OK |
| 375px | OK | OK | OK | feedback below fold* | OK | OK | OK | OK |
| 390px | OK | OK | OK | feedback below fold* | OK | OK | OK | OK |
| 412px | OK (inferred) | OK | OK | feedback below fold* | OK | OK | OK | OK |
| 430px | OK | OK | OK | feedback below fold* | OK | OK | OK | OK |
| 768px | OK | OK | OK | OK | OK | OK | OK | OK |
| 1280px | OK | OK | OK | OK | OK | OK | OK | OK |

\* "feedback below fold" was the UX-P1 issue (M-02) — now fixed by auto-scrolling the
feedback panel into view. 412px was not individually re-measured but is bracketed by clean
320/390/430 results with identical layout rules. No width showed horizontal overflow.

## User Journey

Each stage: what the user sees / what they must do.

1. **First access** — Browser tab now reads "Nihongo Quest – Japanisch lernen" (was
   "Create Next App"). Lands directly in Onboarding (no welcome/splash).
2. **Onboarding** — 5 single-question screens ("Quest-Setup · Fortschritt n/5" + progress
   bar + title + 6 option cards + "Zurück"). Tap one card → auto-advances. Keyboard
   Enter/Space works (options are `role="button"`). No "skip".
3. **Home (map)** — Top: 3 stat pills (Level/XP/Karten) + 3 buttons (Wortkarten-Sammlung,
   Wiederholung, Lernplan anpassen) + "Wofür sind XP?" disclosure + "Deine Reise" heading.
   Then (mobile grid order) "Dein Level" card → selected-stage details (with **Starten**)
   → the vertical quest map (Café "Du bist hier") → Reisefortschritt → Trainingslager.
   On load, the map auto-scrolls to center the current stage.
4. **Café start** — Tap Starten (either in the details card or the map's compact card) →
   `/lesson?category=cafe`.
5. **Answer a question** — Instruction + prompt (large JP) + 4 choice buttons + progress
   bar + "Abbrechen"/"+XP" badge. Tap a choice.
6. **Incorrect** — Choice turns red, correct choice turns green; feedback panel:
   "Leider falsch", correct answer, kana·romaji·German, Beispiel, shortTip, "Mehr
   anzeigen" (detailTip collapsed), "Weiter". Now scrolls into view.
7. **Correct** — Same panel with "Richtig!". Now scrolls into view.
8. **Quest complete** — Result: "Etappe abgeschlossen!/Level X erreicht!", XP breakdown,
   animated XP bar, "N Karten gesammelt", "… freigeschaltet", "Zurück zur Karte".
9. **Home return** — Auto-scrolls to the new current stage (e.g. Reise).
10. **Next quest** — Tap Starten on the newly-current stage.
11. **Vocabulary** — Search box (JP/kana/romaji/German), Kategorie + Sprachstil filters,
    result count, 26 cards (collected show content + pronunciation + "Karte üben" +
    "Locker & Höflich vergleichen"; uncollected show `???`).
12. **Sub Quest** — `/practice?word=…`: 9 choice questions + Q10 Speaking Challenge
    (Sprechen / Überspringen). Scored out of 9; 9/9 → known, else weak.
13. **Return** — Saved profile → straight to Home; auto-scroll to current stage; progress
    persists via localStorage. No streak/notification hook.

## First 10 Seconds

- **Evidence:** Onboarding Q1 renders "QUEST-SETUP · Fortschritt 1/5 · Was bringt dich zu
  Japanisch?" with 6 tappable option cards. No app name/logo, no one-line "what is this",
  no skip. Tab title now correctly names the app.
  - **Likely interpretation:** "A Japanese-learning app is asking me setup questions."
  - **Likely emotion:** mild interest, slight "why before I've seen anything?".
  - **Confidence:** Medium. **Severity:** UX-P2 (no welcome/skip).
- **Evidence (Home):** After onboarding, the map auto-scrolls to Café "Du bist hier" with
  a green "Starten". The world title "Erste Schritte in Japan" and stage names are clear.
  - **Likely interpretation:** "This is a journey/quest map; Café is where I start."
  - **Likely emotion:** orientation, curiosity.
  - **Confidence:** Medium-High. **Severity:** OK — *contingent on auto-scroll firing*.
    Without it, the first screen is stat pills + buttons, which reads as "dashboard", not
    "start here" (UX-P2, mitigated by the working auto-scroll).
- **Free-scope check:** "무료 Area 1 범위" (which part is free) is **not** explicitly stated
  anywhere; the fogged "Alltag in Japan / Demnächst" preview implies more-to-come but not
  "this area is the free part". Minor (UX-P3).

## Cognitive Load

Per-screen count of simultaneously-presented information and a 1–5 load score
(1 very light … 5 too high).

| Screen | Concurrent info | Score | Note |
|---|---|---|---|
| Onboarding Q | title + 6 options + progress + Zurück | **2** | Clean, one decision. |
| Home (top, pre-scroll) | 3 pills + 3 buttons + XP disclosure + heading + Level card | **4** | Dense, redundant (see M-03); mitigated because auto-scroll moves focus to the map. |
| Home (map, post-scroll) | current node + Du bist hier + compact card + Starten | **2–3** | Good once centered. |
| Lesson question | instruction + prompt + 4 choices + progress + XP badge | **3** | Appropriate; JP prompt is dominant, choices clear. |
| Lesson feedback | verdict + answer + kana·romaji·German + Beispiel + shortTip + Mehr + Weiter | **3–4** | detailTip correctly collapsed; kana/romaji/German share one muted line (good hierarchy). Length is OK; the *position* was the problem (fixed). |
| Result | verdict + XP breakdown + bar + cards + unlock + button | **3** | Celebratory, scannable. |
| Vocabulary | search + 2 filter rows + count + cards | **3–4** | Two "Alle" filter groups labelled Kategorie/Sprachstil — acceptable. |
| Speaking Q10 | sentence + kana + romaji + German + Sprechen + Überspringen | **3** | Fits at 320px. |

- kana/romaji/German visual priority: correct — JP kanji is largest, the reading line is
  small and muted. No evidence of romaji crowding out kana.
- shortTip vs detailTip: not duplicative; detailTip is collapsed behind "Mehr anzeigen".
- "read before you can advance": the feedback fix now brings Weiter into view rather than
  forcing a scroll, so the user is less likely to skip the feedback without reading — but
  Weiter is still a deliberate second tap (good; no accidental auto-advance).

## One-Handed Use

| Action | Location | One-handed impact | Frequency | Frustration risk | Fix effort |
|---|---|---|---|---|---|
| Answer choices | mid-card, full-width, 52px, stacked | Low (thumb-friendly) | Very high | Low | — |
| Weiter (after answer) | below feedback | **was** high (below fold) → **now** brought into view | Very high | **Lowered** by M-02 fix | Done |
| Starten | details card + map compact card (mid-screen) | Low | Medium | Low | — |
| Abbrechen | top-left | Medium (reach up) | Low | Low | — |
| Search + clear | top of Vocabulary | Medium (reach up); clear button 44px | Low | Low | — |
| Filters | below search | Low (wrap, 44px) | Low | Low | — |
| Pronunciation | top-right of card / speaking card | Medium; 44px | Low–Med | Low | — |
| Karte üben | bottom of each card | Low | Medium | Low | — |
| Register compare toggle | bottom of card, 44px | Low | Low | Low | — |
| Speaking Sprechen / Überspringen | mid/lower card | Low | Med | Low | — |

Choices and the primary buttons sit in the comfortable thumb zone; the only recurring
top-reach is "Abbrechen" (rare). The big recurring one-handed pain — reaching a below-fold
Weiter after every answer — is what M-02 addresses.

## Emotional Journey

Estimates (not certainties), with retention impact.

| Stage | Likely + | Likely − | Cause | Conf. | Retention | Recommendation |
|---|---|---|---|---|---|---|
| A. Open URL | Interesse | leichte Verunsicherung | direct into setup, but tab now names the app | M | Med | (done: title/lang) |
| B. Onboarding start | Erwartung | "warum Fragen zuerst?" | no welcome/skip | M | Low-Med | consider a 1-line intro / skip later |
| C. Onboarding mid | — | leichte Ungeduld | 5 screens | M | Low | keep to 5, it's fast |
| D. Home first view | Orientierung | Überforderung (falls kein Auto-Scroll) | dense top block | M | Med | auto-scroll mitigates; watch in test |
| E. First question | Neugier | — | clear, big JP | M-H | Med | — |
| F. First correct | Erfolg, Zuversicht | — | "Richtig!" + XP; now visible without scroll | M-H | High | (improved by M-02) |
| G. First incorrect | — | (guarded) Verunsicherung | wording is gentle ("Leider falsch" + shows answer, casual "nicht falsch" framing) | M | Med | good; never blaming |
| H. Café complete | Stolz | — | Result, XP bar, unlock badge | H | High | — |
| I. New quest unlocked | Motivation | — | "… freigeschaltet" | H | High | — |
| J. Home return | Klarheit | (falls kein Auto-Scroll) Suchen | auto-scroll to new current | M | Med | verify in test |
| K. Vocabulary | Nützlichkeit | leichte Dichte | many cards | M | Med | fine as reference |
| L. Sub Quest | Vertrautheit | — | same loop | M | Med | — |
| M. Speaking | Neugier / Spaß | Unsicherheit (Mikrofon) | permission + no audio feedback loop tested | L-M | Med | skip is available; real-mic test needed |
| N. Next-day return | — | kein Anlass | no streak/notification | M | **Low** | future: streak/goal (out of scope now) |

## Persona Analysis

Scales 1–5 (satisfaction / continuation / comprehension), with confidence.

- **Persona A (absolute beginner, gamer, ex-Duolingo).** Attracted by: quest map, XP,
  card collection, unlock badges. Confusing: nothing major; may find the Home top block
  "busy". Drop-off risk: low early; medium at "next day" (no streak). Trust risk: the old
  "Create Next App" title would have hurt (fixed). Sat **4** / Cont **3–4** / Comp **4** /
  Conf **M**.
- **Persona B (absolute beginner, utility-focused, low game appetite).** Attracted by:
  real phrases (Café ordering, station), clear German. Confusing: gamification framing
  ("Quest", "Karten") may feel unnecessary but not off-putting. Drop-off: medium if it
  feels "too playful". Needs before paying: evidence they're learning usable sentences —
  which the content delivers. Sat **3–4** / Cont **3** / Comp **4** / Conf **M**.
- **Persona C (A1–A2, reviewing).** Attracted by: Locker/Höflich contrasts, Vocabulary
  search, Sub Quests. Confusing: little; may find Area 1 too easy. Drop-off: high after
  finishing Area 1 (no Area 2 yet). Sat **3** / Cont **2–3** / Comp **5** / Conf **M**.
- **Persona D (busy, 3–5 min/session).** Attracted by: short quests, resumable. Confusing:
  the Home top density costs seconds; auto-scroll helps. Drop-off: medium if each session
  feels like "scrolling to find where I was" (auto-scroll is the key mitigation). Sat
  **3–4** / Cont **3** / Comp **4** / Conf **M**.
- **Persona E (not tech-savvy, few learning apps).** Attracted by: big buttons, one
  decision per screen in onboarding/lessons. Confusing: the pre-fix below-fold feedback
  ("I tapped, nothing happened") would have hit this persona hardest (fixed by M-02);
  Speaking permission prompt may confuse. Drop-off: was medium-high at first answer
  (improved), medium at Speaking. Sat **3** / Cont **3** / Comp **3–4** / Conf **M**.

## Mobile Usability

- **Strengths:** No horizontal overflow at any width; all targets ≥44px; choices are
  52px full-width; vertical map with auto-scroll; search/filters wrap cleanly; 0-results
  handled. **Evidence:** mechanical `getBoundingClientRect` sweep 320–430. **Confidence:** High.
- **Weaknesses:** (fixed) feedback below fold after answering; Home top block is
  dense/redundant; heavy dependence on auto-scroll for the map to feel usable.
  **Confidence:** High.
- **Risks:** If auto-scroll fails on some browser/scroll-restoration combo, mobile Home
  first-impression degrades to a stat dashboard. **Confidence:** Medium.

## Learning UX

- **Strengths:** One central judgment per question; kana/romaji/German hierarchy is
  correct; casual/polite framed as *appropriateness*, never "wrong"; feedback always shows
  the correct answer + reading + example; detailTip is opt-in. **Confidence:** High.
- **Weaknesses:** No explicit "you learned X today" summary; Speaking has no
  low-stakes practice before the graded Q10. **Confidence:** Medium.
- **Risks:** Beginners might advance past feedback without reading — reduced now that
  Weiter is a deliberate second tap that scrolls into view rather than being missed
  entirely. **Confidence:** Medium.

## Gamification

- **Strengths:** XP, Level, card collection, quest unlocks, "Du bist hier", completion
  celebration, weak/known word tracking — a coherent, non-childish game layer.
- **Weaknesses:** No streak, no daily goal, no notification → weak *daily* pull.
- **Risks:** Without a return hook, retention past day 1 relies purely on intrinsic
  motivation. **Evidence:** no streak/notification code exists (confirmed). **Confidence:** High.

## Trust and Credibility

- **Strengths:** Clean Kyoto-toned visuals, German copy free of English leakage, honest
  register teaching, no dark patterns, local-only storage.
- **Weaknesses (fixed):** "Create Next App" tab title + `lang="en"` were credibility leaks
  on first contact. **Evidence:** observed tab title; `layout.tsx`. **Confidence:** High.
- **Risks:** For utility-minded Persona B/C, the "Quest/Karten" framing must not read as
  "not a serious tool" — worth a direct question in the test. **Confidence:** Medium.

## Retention

Present in code: next-target (current stage), short achievements (per-quest completion),
quest unlock, XP, Level, card collection, completion feedback, Wiederholen (replay,
+0 XP), weak words, known words, current-position (auto-scroll). **Absent:** any
daily-return reason (streak, reminder, daily goal, notification) — confirmed by code.

- 1st-session continuation: strong (immediate unlocks + XP + card collecting).
- Return within the session: strong.
- Next-day return: **weak** (no hook) — future work, not this pass.
- 1-week return: weak for the same reason.
- Post-Area-1 return: weak (no Area 2 yet) — expected for a free first area.

## Drop-Off Risks

| Point | Trigger | Personas | Prob. | Impact | Evidence | Prevention | Measure |
|---|---|---|---|---|---|---|---|
| URL open | direct-to-setup, no context | B, E | Low–Med | Med | onboarding is Q1 immediately | tiny intro/skip (later) | first-screen bounce |
| Onboarding | 5 questions feel like a wall | D, E | Low | Low | 5 quick taps | keep short; optional skip later | onboarding completion rate |
| Home first view | density / "where do I start" | D, E | Low–Med | Med | dense top block, map ~1000px down | auto-scroll (present) | time-to-first-Starten |
| First answer | "I tapped, nothing changed" (feedback below fold) | ALL, esp. E | **was High** | High | 320px: Richtig! at 622 > vh 560 | **M-02 fix (done)** | scroll events between answer and Weiter |
| Long feedback | too much to read | E | Low | Low | detailTip collapsed | (ok) | Mehr-anzeigen taps |
| Speaking Q10 | mic permission / no result | E, D | Med | Med | permission prompt; skip exists | keep skip prominent | skip rate, mic-grant rate |
| Next day | no reason to return | ALL | Med–High | High | no streak/notification | future retention hook | D1 return rate |

## UX Scores

1–5 (5 best), each with evidence / reasoning / confidence / main risk. Priority-weighted
items marked ⚖.

- **First impression — 3.5.** Ev: tab title fixed; onboarding is immediate, no
  splash/skip. Reason: competent but launches into setup. Conf: M. Risk: no welcome.
- **Purpose clarity — 4.** Ev: "Was bringt dich zu Japanisch?", quest map, JP prompts.
  Reason: Japanese-learning is obvious quickly. Conf: M-H. Risk: free-scope not stated.
- ⚖ **Ease of starting — 4.** Ev: onboarding → auto-scroll to Café "Starten". Reason:
  low-friction once auto-scroll fires. Conf: M. Risk: auto-scroll dependency.
- **Navigation clarity — 3.5.** Ev: map + "Du bist hier" + sidebar; 3 top buttons. Reason:
  clear after scroll; top is busy. Conf: M. Risk: redundant paths.
- ⚖ **Mobile ergonomics — 4.** Ev: 52px choices, ≥44px targets, no overflow 320–430.
  Reason: thumb-friendly. Conf: High. Risk: Weiter reach (mitigated).
- **Reading comfort — 4.** Ev: JP dominant, muted reading line, wraps cleanly. Conf: M-H.
- ⚖ **Lesson clarity — 4.** Ev: one judgment/question, clear instruction+prompt+4 choices.
  Conf: High. Risk: none major.
- ⚖ **Feedback usefulness — 4.** Ev: verdict + answer + reading + example + tip; now
  visible without scrolling. Conf: M-H. Risk: pre-fix visibility (resolved).
- **Sense of progress — 4.** Ev: progress bar, X/Y, XP bar, Reisefortschritt, unlock. Conf: High.
- **Reward satisfaction — 4.** Ev: Result animation, XP, cards, unlock shine. Conf: M-H.
- **Game appeal — 3.5.** Ev: quests/XP/cards/map. Reason: appealing to A/D, neutral to B/C.
  Conf: M. Risk: "too playful" for utility users.
- **Learning credibility — 4.** Ev: honest register teaching, real phrases, no errors in
  automated checks. Conf: M. Risk: native-German nuance unverified.
- **Error recovery — 4.** Ev: shows correct answer, gentle wording, weak-word tracking,
  replay. Conf: M-H.
- **Vocabulary usability — 4.** Ev: search (JP/kana/romaji/German), filters, compare,
  privacy-safe. Conf: High.
- **Speaking usability — 3.** Ev: ja-JP recog, skip, retry; but no low-stakes warm-up and
  real-mic untested here. Conf: L-M. Risk: mic UX on real devices.
- ⚖ **Return motivation — 2.5.** Ev: unlocks/XP pull within a session; no daily hook. Conf:
  M. Risk: D1 drop.
- ⚖ **Daily-use suitability — 3.** Ev: short resumable quests + auto-scroll resume; but no
  reason to *start* a new day. Conf: M. Risk: retention.
- **Accessibility — 4.** Ev: `lang="de"` now, 44px targets, keyboard onboarding,
  aria-expanded/controls, reduced-motion aware, focus not stolen. Conf: M-H.
- **Overall mobile UX — 3.7** (weighted toward Ease-of-starting, Lesson clarity, Mobile
  ergonomics, Feedback usefulness, Return motivation, Daily-use). Reason: strong core loop
  and ergonomics; the two fixed defects were the main drags; retention is the soft spot.

## Issues Found

Priority Score = Impact × Frequency × Confidence ÷ Effort (each 1–5).

- **M-01 — Default app title + wrong document language.** UX-P1. Ev: browser tab showed
  "Create Next App"; `layout.tsx` `title`/`description` were Next defaults and `lang="en"`
  on a German UI. User feeling: "unfertig / nicht vertrauenswürdig"; screen-reader
  mispronunciation. Personas: all (esp. B/C trust; E for a11y). Impact 4, Freq 5 (every
  open/share), Conf 5, Effort 1 → **Score 100**. Action: German title/description,
  `lang="de"`. **Status: Fixed & verified** (tab now "Nihongo Quest – Japanisch lernen",
  `document.documentElement.lang==="de"`).

- **M-02 — Feedback + "Weiter" below the fold after answering, no auto-scroll.** UX-P1.
  Ev: 320×560 → "Richtig!" top 622 (> vh 560), "Weiter" 449px below fold, `scrollY` stays
  0; same in Practice; even 390×844 has the panel below the fold. User feeling: "Hat mein
  Tippen funktioniert?" then blind scrolling; repeated every question. Personas: all, esp.
  E. Impact 4, Freq 5 (both flows, ~305 questions), Conf 5, Effort 2 → **Score 50**.
  Action: FeedbackPanel scrolls itself into view on mount when not already fully visible
  (guarded; reduced-motion aware); one shared component covers Lesson + Practice.
  **Status: Fixed & verified** (forced-call brings Richtig! to top 153 and Weiter fully
  into view; guard confirmed to not scroll when already visible; smooth/rAF can't be
  observed live only due to the hidden-tab environment).

- **M-03 — Home top-of-page density & redundancy.** UX-P2. Ev: before the map, mobile
  shows Level pill **and** a "Dein Level" card (same info); Karten pill "Zur Sammlung"
  **and** a "Wortkarten-Sammlung" button (same target); "Wiederholung" button **and** the
  "Trainingslager" card (same `/review`). Map is ~1000px down (3103px page). User feeling:
  "viele Zahlen/Knöpfe, bevor ich spiele". Personas: D, E, B. Impact 3, Freq 4, Conf 4,
  Effort 3 → **Score 16**. Action (recommended, **not done**): thin the top block / drop
  the redundant "Dein Level" card on mobile / rely on auto-scroll. Deferred — it's a
  layout change with real regression surface; better decided with test data.

- **M-04 — Dependence on auto-scroll to reach the map.** UX-P2. Ev: without the
  current-stage auto-scroll, the first mobile screen is the stat/button cluster, not
  "start here". Impact 3, Freq 5, Conf 3, Effort 4 → **Score 11.25**. Action: none now;
  auto-scroll is present and (Home) user-confirmed. Watch in test.

- **M-05 — No onboarding welcome / skip; free-scope not stated.** UX-P2/P3. Ev: URL opens
  straight into Q1; no "was ist das / überspringen"; "which part is free" never stated.
  Impact 2, Freq 3, Conf 3, Effort 3 → **Score 6**. Action: none now (flow change); note
  for later.

- **M-06 — No daily-return hook.** UX-P3 (future). Ev: no streak/notification/daily-goal
  code. Impact 3, Freq 2, Conf 4, Effort 5 → **Score 4.8**. Action: future retention
  feature; explicitly out of scope this pass.

- **M-07 — Speaking has no low-stakes warm-up; real-mic UX unverified.** UX-P3. Ev:
  Q10 is the only speaking step; skip present; audio not testable here. Impact 2, Freq 2,
  Conf 3, Effort 4 → **Score 3**. Action: cover in external test.

## Fixes Applied

| ID | UX-Sev | Fix | Files |
|---|---|---|---|
| M-01 | P1 | German `<title>`/`description`, `lang="de"` | `src/app/layout.tsx` |
| M-02 | P1 | FeedbackPanel scrolls into view after answering (guarded, reduced-motion) | `src/components/ui/FeedbackPanel.tsx` |

Post-fix: `npm run build` success (0 errors), `npm run lint` 0 errors/0 warnings; Café
full playthrough 5/5 → +50 XP / 5 cards / Reise unlocked / Level 1; Home auto-scroll now
targets Reise; no horizontal overflow 320–430; guard confirmed (no scroll when feedback
already visible); zero console/server errors.

## Issues Not Fixed

- **M-03, M-04, M-05, M-06, M-07** — all UX-P2/P3. Deferred deliberately: each is either a
  layout/flow change with regression surface that should be validated against real test
  data first (M-03/M-04/M-05), or a future feature explicitly out of this pass's scope
  (M-06/M-07). None blocks a limited external test.

## Remaining Risks

1. **Auto-scroll behaviours** (Home current-stage; new feedback scroll) use
   `requestAnimationFrame`/`smooth`, which this QA environment pauses (hidden tab). Both
   were verified by replicating the exact calls; the Home one was also user-confirmed in a
   real browser. Recommend one real-device glance at the feedback scroll during the test.
2. **Live microphone** (grant / deny / retry / recognition) — untestable without real
   audio; covered by code review only.
3. **Native-German copy nuance** across ~305 prompts/tips — automated English-leak check is
   clean, but a native read is a natural test-phase item.
4. **Retention** past day 1 is structurally weak (no streak/notification) — expected for a
   free first area; a known future item.
5. **Home top density (M-03)** may draw test comments; left intentionally unchanged.

## External Test Readiness

- No UX-P0. Two UX-P1 fixed & verified. Core loop works 320–430px. First-time users can
  reach and start the first quest. build/lint pass. Test materials created:
  `MOBILE_USER_TEST_PLAN_DE.md`, `MOBILE_USER_FEEDBACK_FORM_DE.md`,
  `MOBILE_BETA_RELEASE_CHECKLIST.md`.
- Conditions: treat the auto-scroll and mic behaviours as things to *observe* in the test
  rather than gates; keep the test to a small first wave (5–8) so M-03/M-05-type comments
  can inform a follow-up before wider release.

## Final Recommendation

**Conditional Ready** — release Area 1 to a limited (5–8 person) German-speaking
smartphone test. Ship the two fixes (M-01, M-02); observe the auto-scroll, Speaking, and
Home-density questions in the feedback form; hold the UX-P2 layout changes (M-03/M-04) for
a data-informed follow-up.
