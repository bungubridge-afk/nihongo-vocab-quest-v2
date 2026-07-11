# Nihongo Vocab Quest v2 QA Report

## 1. Summary

- **Overall status:** Pass with minor issues (no blocking bugs; 2 low-severity polish items found)
- **Build status:** ✅ Pass (`npm.cmd run build` — compiled successfully, no TypeScript errors)
- **Lint status:** ✅ Pass (`npm.cmd run lint` — no errors, no warnings)
- **Browser test status:** ✅ Completed via dev server (Onboarding → Home → Café lesson → Reise challenge-fail → Word Collection → Word Practice → Review, full loop)

## 2. Tested Environment

| Item | Value |
|---|---|
| OS | Windows 11 Home 10.0.26200 |
| Node.js | v24.18.0 |
| npm | 11.16.0 |
| Next.js | 16.2.10 (Turbopack) |
| React | 19.2.4 |
| Browser / method | Chromium-based preview via Claude Code's built-in dev-server preview tool (`preview_start` / `preview_eval` / `preview_screenshot`), localhost:3000 |

## 3. Route Checklist

| Route | Status | Notes |
|---|---|---|
| `/` | ✅ OK | Onboarding shown on first visit; Home / Quest Map shown after profile exists |
| `/lesson` (no `category`) | ✅ OK | Defaults to `cafe` as specified |
| `/lesson?category=cafe` | ✅ OK | 5 questions in fixed order, Result screen works |
| `/lesson?category=reise` | ✅ OK | 5 questions, Abschluss-Challenge on Q5 |
| `/lesson?category=invalid` | ✅ OK | Shows "Diese Kategorie wurde nicht gefunden." + "Zurück zur Karte" button |
| `/vocabulary` | ✅ OK | Word Collection renders, filters work |
| `/practice?word=water` | ✅ OK | Water-only 5 questions; **no Hydration/Recoverable Error** (confirmed via `nextjs-portal` shadow-root inspection, both on normal load and hard reload) |
| `/practice?word=coffee` | ✅ OK | Coffee-only questions |
| `/practice?word=bread` / `drink` / `eat` / `hotel` | ✅ OK | Spot-checked; each word's meaning is the Q1 answer, no cross-word main-topic leakage |
| `/practice?word=invalid` | ✅ OK | Shows "Wortkarte nicht gefunden." + "Zur Sammlung" button |
| `/review` | ✅ OK | Empty state and populated state both render correctly |

## 4. Core Flow Results

| Flow | Result | Notes |
|---|---|---|
| Onboarding (5 questions) | ✅ Pass | Auto-advance on click works; profile saved to `nvq_profile`; no XP/cards granted |
| Home / Quest Map (initial) | ✅ Pass | Level 0 / 0 XP / 0 Karten; Café = current; Reise/Schule/Freunde/Abschluss-Review = locked; Next Unlock = Reise |
| Café lesson (Q1–Q5) | ✅ Pass | Fixed order; Q4 = "Wasser bitte." → "水をください。"; Q5 = Abschluss-Challenge "Kaffee und Brot bitte." → "コーヒーとパンをください。"; no kana/romaji leak before answering |
| Café result (first clear) | ✅ Pass | "Level 1 erreicht!" / +50 XP / 5 Karten gesammelt / Reise freigeschaltet |
| Home after Café clear | ✅ Pass | Level 1 / 50 XP / 5 Karten; Café = completed (✓, "Wiederholen"); Reise = current; Schule = locked; Next Unlock = Schule |
| Replay (Café again, all correct) | ✅ Pass | Result = "Wiederholung abgeschlossen", XP +0, Neue Karten 0; `nvq_xp` stayed at 50, `nvq_collected_cards` unchanged |
| Challenge failure (Reise Q5 wrong) | ✅ Pass | Result = "Fast geschafft" / "Abschluss-Challenge noch einmal üben", XP +0, 0 Karten, "Noch einmal" + "Zurück zur Karte"; `nvq_completed_categories` stayed `["cafe"]` (Reise not recorded) |
| Word Collection (initial) | ✅ Pass | 0/20 Karten; Café 5 cards = Sammelbar; Reise/Schule/Freunde = Locked (kanji hidden as "???", "Freigeschaltet nach …") |
| Word Collection (after Café clear) | ✅ Pass | 5/20 Karten; Café 5 cards = Gesammelt; Reise cards = Sammelbar; Schule/Freunde = Locked |
| Word Practice (water, all correct) | ✅ Pass | Exact Q1–Q5 per spec; `nvq_known_words` gains `"water"` |
| Word Practice (1 wrong answer) | ✅ Pass | `nvq_weak_words` gains the word id; `nvq_known_words` unaffected |
| Review (empty) | ✅ Pass | "Noch keine schwachen Wörter." + guidance text + 2 buttons |
| Review (populated) | ✅ Pass | Weak word card shown with kanji/kana/romaji/german/category/shortTip + "Karte üben"; "Karte üben" → `/practice?word=…`; after a full-correct retry the word disappears from "Zu üben" and appears under "Schon sicher" |

## 5. Data / localStorage Verification

| Key | Initial (after clear + Onboarding) | After Café clear | After Practice (water, full correct) | Issues |
|---|---|---|---|---|
| `nvq_profile` | Set (5 answers + `createdAt`) | unchanged | unchanged | None |
| `nvq_xp` | `null` → reads as `0` | `"50"` | unchanged (`"50"`) | None |
| `nvq_collected_cards` | `null` → reads as `[]` | `["coffee","water","bread","drink","eat"]` | unchanged | None |
| `nvq_completed_categories` | `null` → reads as `[]` | `["cafe"]` | unchanged | None |
| `nvq_unlocked_categories` | `null` → reads as `["cafe"]` | `["cafe","reise"]` | unchanged | None |
| `nvq_known_words` | `null` → reads as `[]` | unchanged | `["water"]` | None |
| `nvq_weak_words` | `null` → reads as `[]` | unchanged | unchanged (`[]`) — becomes `["water"]` after a subsequent 1-wrong-answer run, then empties again after a full-correct retry | None |

Deprecated keys (`nvq_progress`, `nvq_streak`, `nvq_recent_reviews`, `nvq_level`, `nvq_boss_clears`) were verified absent from `src/lib/storage.ts` — confirmed via source review, matching APP_SPEC_V2 §11.

No double-XP-grant or double-card-grant was observed on replay in any tested scenario (Café replay, Challenge failure).

## 6. Learning Content Verification

- **Café Q4:** prompt `Wasser bitte.` → choices `水をください。 / 水を飲みます。 / パンをください。 / コーヒーを飲みます。` → correct = `水をください。`. Post-answer feedback: `水をください。 / みずをください。 · mizu o kudasai · Wasser bitte.` — **exact match to spec**.
- **Café Q5 (Abschluss-Challenge):** prompt `Kaffee und Brot bitte.` → choices `コーヒーとパンをください。 / コーヒーを飲みます。パンを食べます。 / コーヒーを食べます。パンを飲みます。 / 水と駅をください。` → correct = `コーヒーとパンをください。`. Post-answer feedback: `コーヒーとパンをください。 · koohii to pan o kudasai · Kaffee und Brot bitte.` — **exact match to spec**. "Abschluss-Challenge" badge shown; no "Boss" wording anywhere.
- **Water practice Q1–Q5:** confirmed exact matches — Q1 `水→Wasser`, Q2 `Wasser→水`, Q3 `水____ください。→を`, Q4 `水を____。→ください`, Q5 `Wasser bitte.→水をください。`.
- **Kana leakage:** none observed. Prompts/instructions/choices never contain kana readings or romaji before an answer is submitted; `shortTip`/`detailTip`/`answerKana` only render inside `FeedbackPanel` after `answered === true`.
- **phrase-choice feedback accuracy:** for Lesson questions (Café/Reise, which use hand-authored `answerKana`/`answerRomaji`/`answerGerman`), the feedback shows the full-phrase reading correctly (e.g. `mizu o kudasai`, `koohii to pan o kudasai`). For dynamically-built Word Practice phrase-choice questions (e.g. water Q5), the romaji field falls back to the single-word `vocab.romaji` (e.g. `"mizu"`) rather than a full-sentence romaji, because `VocabItem` has no `exampleRomaji` field. This is a known, pre-existing simplification (documented since Phase 1) — see Bugs/Polish sections below.

## 7. UI / UX Findings

**Good:**
- Quest Map reads clearly as a vertical map (connecting lines, current/completed/locked states, distinct gold styling for Abschluss-Review) rather than a flat category grid — matches the "not a plain grid" requirement.
- Consistent design language across all 5 screens (shared `Button`/`Card`/`Badge`/`FeedbackPanel` components); no visual regressions found between phases.
- Mobile (375×812) and desktop (1280×900) layouts both checked — no horizontal overflow on Home, Vocabulary, or Lesson (`document.body.scrollWidth` never exceeded `clientWidth`); Home's sidebar cards correctly move from a right-hand column (desktop) to a stacked column (mobile).
- Locked vocabulary cards strike a reasonable balance: german stays visible (dimmed), kanji is hidden as "???", and "Freigeschaltet nach …" tells the user exactly what to do next.
- "Abbrechen" during a lesson reliably returns to Home; "Zur Sammlung" / "Zur Karte" navigation is consistent across Practice and Review.

**Minor concerns (non-blocking):**
- `/lesson?category=schule` (or any not-yet-unlocked category) is directly reachable by typing the URL, bypassing the Quest Map's lock — see Bug #1 below.
- The Word Practice phrase-choice romaji-fallback issue (single word instead of full phrase) — see Bug #2 below.
- On the Onboarding screen, the option grid is single-column below the `sm` breakpoint and 2-column above it; on a landscape-phone width this can feel a little sparse, but nothing breaks.
- The "Fortschritt" sidebar card on Home always says "Kleine Schritte, echte Sätze." regardless of progress — a static tagline rather than dynamic encouragement, which is fine for MVP but worth revisiting later.

## 8. Bugs Found

No blocking bugs. Two low-severity, non-blocking items:

**Bug #1 — Locked lesson categories are reachable directly via URL**
- Severity: Low
- Reproduction steps: With only Café completed, navigate directly to `/lesson?category=schule` (or `freunde`, `review`).
- Expected: Either the category loads only once actually unlocked, or the user is redirected/blocked with a message, consistent with the Quest Map's locked state.
- Actual: The lesson loads and is fully playable, regardless of `unlockedCategories`. Answering its Abschluss-Challenge correctly *would* still call `recordCategoryCompletion`, which lets a user skip ahead of the intended progression by guessing the URL.
- Suggested fix: In `src/app/lesson/page.tsx`, after resolving `category`, also check `getUnlockedCategories().includes(category.id)`; if not unlocked, render the same "not found" / locked view used for invalid categories. (This was a deliberate scope decision in the Phase 3-B prompt, which only asked for "not found" handling on invalid IDs — flagging it now since full-MVP QA is in scope.)

**Bug #2 — Word Practice phrase-choice romaji is word-level, not phrase-level**
- Severity: Low
- Reproduction steps: `/practice?word=water` → answer Q5 ("Wasser bitte." → "水をください。") → check the feedback's romaji line.
- Expected: Full-sentence romaji, e.g. `mizu o kudasai` (as Café Q4 shows for the same sentence in the Lesson flow).
- Actual: Shows `mizu` (the single-word romaji from `VocabItem.romaji`), because `buildPhraseChoiceQuestion` in `src/lib/quizBuilder.ts` sets `answerRomaji: vocab.romaji` and `VocabItem` has no per-sentence romaji field to draw from instead.
- Suggested fix: Either add an `exampleRomaji` field to `VocabItem` (in `src/types/learning.ts` + `src/lib/vocabData.ts`) and use it in `buildPhraseChoiceQuestion`, or omit the romaji line for dynamically-built phrase questions rather than showing a misleading word-level value.

## 9. Polish Suggestions

- Add a subtle "not unlocked yet" screen for Bug #1 above, reusing the existing "Diese Kategorie wurde nicht gefunden." pattern with different copy (e.g. "Diese Kategorie ist noch nicht freigeschaltet.").
- Consider a small on-Home hint pointing first-time users toward "Wortkarten-Sammlung" / "Wiederholung" (currently they're plain buttons with no explanation of what they do).
- The "Fortschritt" sidebar card could show the *next* reward (e.g. "+80 XP bei Reise") to reinforce forward motion.
- Vocabulary cards are fairly information-dense (kanji, kana, romaji, german, 3 badges, example block, 3 example lists, tip) — on mobile this makes each card quite tall; a "show more" collapse for `commonExamples`/`commonPatterns`/`relatedExpressions` could tighten scanning once more categories are added.
- Review's "Schon sicher" section uses small Badges with no interaction — a future iteration could make these clickable to jump back into practice for spaced review.
- No progress indicator exists yet for "how many categories total remain" beyond the Quest Map itself; the Vocabulary page's "Nächste Kategorie" pill is a nice touch and could be mirrored more prominently elsewhere.

## 10. Recommendation

1. **Fix Bug #1 first** (locked-category URL bypass) — it's small, contained to `lesson/page.tsx`, and protects the core progression logic the rest of the app relies on.
2. **Fix Bug #2** (phrase romaji) if a schema change (`exampleRomaji`) is acceptable at this stage; otherwise, simplest safe fix is to drop the misleading romaji rather than add a field, and revisit later.
3. **UI polish pass** — apply the section 9 suggestions opportunistically; none are blocking for a first deploy.
4. **Add more content** — Schule/Freunde/Abschluss-Review currently have minimal (5-question) placeholder-quality lesson data per APP_SPEC_V2's MVP scope; expanding vocab/example variety here is the next content milestone once the two bugs above are addressed.
5. **GitHub / Vercel deploy** is reasonable once Bug #1 is fixed, since it's the only finding with real gameplay-integrity impact.
6. **OpenAI / AI-Coach** and other "later" features remain correctly out of scope per APP_SPEC_V2 and were not touched.
