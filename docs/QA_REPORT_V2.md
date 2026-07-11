# Nihongo Vocab Quest v2 QA Report

## 1. Summary

- **Overall status:** Pass — no blocking bugs, no known blockers
- **Build status:** ✅ Pass (`npm.cmd run build` — compiled successfully, no TypeScript errors)
- **Lint status:** ✅ Pass (`npm.cmd run lint` — no errors, no warnings)
- **Browser test status:** ✅ Completed via dev server (Onboarding → Home → Café lesson → Reise → locked-category access attempt → replay → Word Collection → Word Practice → Review, full loop)
- Both bugs from the previous QA pass (locked-category URL bypass, word-level romaji in Word Practice phrase feedback) were fixed and have been re-verified in this pass — see §8 and §9.

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
| `/lesson?category=cafe` | ✅ OK | Unlocked by default, playable; 5 questions in fixed order; replay works |
| `/lesson?category=reise` | ✅ OK | Playable once Café is cleared (`unlockedCategories` includes `reise`) |
| `/lesson?category=schule` (locked) | ✅ OK | Shows "Diese Kategorie ist noch gesperrt." + "Zurück zur Karte"; no questions rendered; progress unaffected |
| `/lesson?category=invalid` | ✅ OK | Shows "Diese Kategorie wurde nicht gefunden." + "Zurück zur Karte" button |
| `/vocabulary` | ✅ OK | Word Collection renders, filters work |
| `/practice?word=water` | ✅ OK | Water-only 5 questions; **no Hydration/Recoverable Error** (confirmed via `nextjs-portal` shadow-root inspection on fresh loads) |
| `/practice?word=coffee` / `bread` / `drink` / `eat` / `station` | ✅ OK | Each word's meaning is the Q1 answer, no cross-word main-topic leakage; sentence-level romaji verified (see §6) |
| `/practice?word=invalid` | ✅ OK | Shows "Wortkarte nicht gefunden." + "Zur Sammlung" button |
| `/review` | ✅ OK | Empty state and populated state both render correctly |

## 4. Core Flow Results

| Flow | Result | Notes |
|---|---|---|
| Onboarding (5 questions) | ✅ Pass | Auto-advance on click works; profile saved to `nvq_profile`; no XP/cards granted; re-verified after `localStorage.clear()` in this pass |
| Home / Quest Map (initial) | ✅ Pass | Level 0 / 0 XP / 0 Karten; Café = current; Reise/Schule/Freunde/Abschluss-Review = locked; Next Unlock = Reise |
| Locked-category direct access (`/lesson?category=schule`) | ✅ Pass | Lock screen shown, no questions playable, `nvq_xp` / `nvq_completed_categories` / `nvq_collected_cards` all unchanged (see §9) |
| Café lesson (Q1–Q5) | ✅ Pass | Fixed order; Q4 = "Wasser bitte." → "水をください。"; Q5 = Abschluss-Challenge "Kaffee und Brot bitte." → "コーヒーとパンをください。"; no kana/romaji leak before answering |
| Café result (first clear) | ✅ Pass | "Level 1 erreicht!" / +50 XP / 5 Karten gesammelt / Reise freigeschaltet |
| Home after Café clear | ✅ Pass | Level 1 / 50 XP / 5 Karten; Café = completed (✓, "Wiederholen"); Reise = current; Schule = locked; Next Unlock = Schule |
| Reise now playable / Schule still locked | ✅ Pass | `/lesson?category=reise` loads normally; `/lesson?category=schule` still shows the lock screen immediately after Café clear |
| Replay (Café again, all correct) | ✅ Pass | Result = "Wiederholung abgeschlossen", XP +0, Neue Karten 0; `nvq_xp` stayed at 50, `nvq_collected_cards` unchanged (see §9) |
| Challenge failure (Reise Q5 wrong) | ✅ Pass | Result = "Fast geschafft" / "Abschluss-Challenge noch einmal üben", XP +0, 0 Karten, "Noch einmal" + "Zurück zur Karte"; `nvq_completed_categories` stayed `["cafe"]` (Reise not recorded) |
| Word Collection (initial) | ✅ Pass | 0/20 Karten; Café 5 cards = Sammelbar; Reise/Schule/Freunde = Locked (kanji hidden as "???", "Freigeschaltet nach …") |
| Word Collection (after Café clear) | ✅ Pass | 5/20 Karten; Café 5 cards = Gesammelt; Reise cards = Sammelbar; Schule/Freunde = Locked |
| Word Practice (water, all correct) | ✅ Pass | Exact Q1–Q5 per spec; `nvq_known_words` gains `"water"`; Q5 feedback romaji = `mizu o kudasai` (sentence-level, fixed) |
| Word Practice (1 wrong answer) | ✅ Pass | `nvq_weak_words` gains the word id; `nvq_known_words` unaffected |
| Review (empty) | ✅ Pass | "Noch keine schwachen Wörter." + guidance text + 2 buttons |
| Review (populated) | ✅ Pass | Weak word card shown with kanji/kana/romaji/german/category/shortTip + "Karte üben"; "Karte üben" → `/practice?word=…`; after a full-correct retry the word disappears from "Zu üben" and appears under "Schon sicher" |

## 5. Data / localStorage Verification

| Key | Initial (after clear + Onboarding) | After Café clear | Locked-category access attempt | After Practice (water, full correct) | Issues |
|---|---|---|---|---|---|
| `nvq_profile` | Set (5 answers + `createdAt`) | unchanged | unchanged | unchanged | None |
| `nvq_xp` | `null` → reads as `0` | `"50"` | unchanged | unchanged (`"50"`) | None |
| `nvq_collected_cards` | `null` → reads as `[]` | `["coffee","water","bread","drink","eat"]` | unchanged | unchanged | None |
| `nvq_completed_categories` | `null` → reads as `[]` | `["cafe"]` | unchanged | unchanged | None |
| `nvq_unlocked_categories` | `null` → reads as `["cafe"]` | `["cafe","reise"]` | unchanged | unchanged | None |
| `nvq_known_words` | `null` → reads as `[]` | unchanged | unchanged | `["water"]` | None |
| `nvq_weak_words` | `null` → reads as `[]` | unchanged | unchanged | unchanged (`[]`) — becomes `["word"]` after a subsequent 1-wrong-answer run, then empties again after a full-correct retry | None |

Deprecated keys (`nvq_progress`, `nvq_streak`, `nvq_recent_reviews`, `nvq_level`, `nvq_boss_clears`) were verified absent from `src/lib/storage.ts` — confirmed via source review, matching APP_SPEC_V2 §11.

No double-XP-grant or double-card-grant was observed on replay in any tested scenario (Café replay, Challenge failure, or an attempted locked-category access).

## 6. Learning Content Verification

- **Café Q4:** prompt `Wasser bitte.` → choices `水をください。 / 水を飲みます。 / パンをください。 / コーヒーを飲みます。` → correct = `水をください。`. Post-answer feedback: `水をください。 / みずをください。 · mizu o kudasai · Wasser bitte.` — **exact match to spec**.
- **Café Q5 (Abschluss-Challenge):** prompt `Kaffee und Brot bitte.` → choices `コーヒーとパンをください。 / コーヒーを飲みます。パンを食べます。 / コーヒーを食べます。パンを飲みます。 / 水と駅をください。` → correct = `コーヒーとパンをください。`. Post-answer feedback: `コーヒーとパンをください。 · koohii to pan o kudasai · Kaffee und Brot bitte.` — **exact match to spec**. "Abschluss-Challenge" badge shown; no "Boss" wording anywhere.
- **Water practice Q1–Q5:** confirmed exact matches — Q1 `水→Wasser`, Q2 `Wasser→水`, Q3 `水____ください。→を`, Q4 `水を____。→ください`, Q5 `Wasser bitte.→水をください。`.
- **Kana leakage:** none observed. Prompts/instructions/choices never contain kana readings or romaji before an answer is submitted; `shortTip`/`detailTip`/`answerKana` only render inside `FeedbackPanel` after `answered === true`.
- **phrase-choice feedback accuracy (fixed):** Word Practice phrase-choice questions now show sentence-level romaji for all 5 Café words, verified directly in the browser:
  - water: `Wasser bitte.` → `水をください。` → romaji `mizu o kudasai`
  - coffee: `Einen Kaffee bitte.` → `コーヒーをください。` → romaji `koohii o kudasai`
  - bread: `Brot bitte.` → `パンをください。` → romaji `pan o kudasai`
  - drink: `Ich trinke Wasser.` → `水を飲みます。` → romaji `mizu o nomimasu`
  - eat: `Ich esse Brot.` → `パンを食べます。` → romaji `pan o tabemasu`
  - For words without a sentence-level romaji entry (e.g. `station`), the romaji line is safely omitted (`えきはどこですか。 · Wo ist der Bahnhof?`, no kana/romaji reading line falls back to the word-level `"eki"`). Lesson-flow phrase-choice questions (Café/Reise/Schule/Freunde/Abschluss-Review, hand-authored in `questData.ts`) were unaffected by this fix — they already carried their own explicit sentence-level `answerRomaji`.

## 7. UI / UX Findings

**Good:**
- Quest Map reads clearly as a vertical map (connecting lines, current/completed/locked states, distinct gold styling for Abschluss-Review) rather than a flat category grid — matches the "not a plain grid" requirement.
- Consistent design language across all 5 screens (shared `Button`/`Card`/`Badge`/`FeedbackPanel` components); no visual regressions found between phases.
- Mobile (375×812) and desktop (1280×900) layouts both checked — no horizontal overflow on Home, Vocabulary, or Lesson; Home's sidebar cards correctly move from a right-hand column (desktop) to a stacked column (mobile).
- Locked vocabulary cards strike a reasonable balance: german stays visible (dimmed), kanji is hidden as "???", and "Freigeschaltet nach …" tells the user exactly what to do next.
- Locked *lesson* categories now behave the same way as locked vocabulary cards conceptually — a clear, dedicated message ("Diese Kategorie ist noch gesperrt.") rather than silently letting the user play out of order.
- "Abbrechen" during a lesson reliably returns to Home; "Zur Sammlung" / "Zur Karte" navigation is consistent across Practice and Review.

**Minor concerns (non-blocking, tracked as polish, not bugs):**
- On the Onboarding screen, the option grid is single-column below the `sm` breakpoint and 2-column above it; on a landscape-phone width this can feel a little sparse, but nothing breaks.
- The "Fortschritt" sidebar card on Home always says "Kleine Schritte, echte Sätze." regardless of progress — a static tagline rather than dynamic encouragement, which is fine for MVP but worth revisiting later.
- Words without a sentence-level romaji entry in Word Practice show no romaji line at all rather than any reading — acceptable and safe per design, but could be filled in with more sentence-level romaji data over time (see §10 content expansion).

## 8. Bugs Found

**Blocking bugs: 0.**

Both bugs identified in the previous QA pass have been fixed and re-verified in this pass:

| # | Bug | Status | Verified fix |
|---|---|---|---|
| 1 | Locked lesson categories were reachable directly via URL (e.g. `/lesson?category=schule` before Reise was cleared), letting a user skip ahead of the intended progression and potentially trigger `recordCategoryCompletion` out of order | ✅ **Fixed** | `src/app/lesson/page.tsx` now checks `getCompletedCategories()` / `getUnlockedCategories()` (via a mounted `useEffect`, no hydration mismatch) before rendering the lesson; unauthorized access shows "Diese Kategorie ist noch gesperrt." with a "Zurück zur Karte" button and never reaches `LessonSession`/`recordCategoryCompletion`. Re-tested in this pass (§9). |
| 2 | Word Practice phrase-choice feedback showed word-level romaji instead of sentence-level (e.g. `mizu` instead of `mizu o kudasai` for water Q5) | ✅ **Fixed** | `src/lib/quizBuilder.ts` now looks up sentence-level romaji for the 5 Café words instead of falling back to `vocab.romaji`; `getFeedbackPayload`'s phrase-choice branch no longer falls back to word-level romaji when a sentence-level value is absent (shows nothing instead of a misleading value). Re-tested for all 5 Café words plus a no-data word (`station`) in this pass (§9). |

No new bugs were found during this re-QA pass.

## 9. Regression Test Results

| Regression check | Result |
|---|---|
| Locked lesson access fix (`/lesson?category=schule` before unlock) | ✅ PASS — lock screen shown, no questions rendered, `nvq_xp`/`nvq_completed_categories`/`nvq_collected_cards` unchanged |
| Practice sentence romaji fix (water/coffee/bread/drink/eat) | ✅ PASS — all 5 show correct sentence-level romaji (`mizu o kudasai`, `koohii o kudasai`, `pan o kudasai`, `mizu o nomimasu`, `pan o tabemasu`); a word without romaji data (`station`) safely omits the romaji line instead of falling back to word-level romaji |
| Hydration check (`/practice?word=water` and others, fresh loads) | ✅ PASS — no "Recoverable Error" / Hydration failed overlay observed on any tested route, confirmed via `nextjs-portal` shadow-root inspection |
| Replay — no double XP grant | ✅ PASS — Café replay after first clear shows "Wiederholung abgeschlossen", XP +0, and `nvq_xp` stays at `"50"` |
| Existing routes/flows unaffected | ✅ PASS — Onboarding, Home / Quest Map, Café → Reise unlock progression, Word Collection, and Review all verified working exactly as in the previous QA pass; no "Boss" or "Mastered" text found anywhere in `src` (case-insensitive grep) or in the browser |

## 10. Polish Suggestions

- Consider a small on-Home hint pointing first-time users toward "Wortkarten-Sammlung" / "Wiederholung" (currently they're plain buttons with no explanation of what they do).
- The "Fortschritt" sidebar card could show the *next* reward (e.g. "+80 XP bei Reise") to reinforce forward motion.
- Vocabulary cards are fairly information-dense (kanji, kana, romaji, german, 3 badges, example block, 3 example lists, tip) — on mobile this makes each card quite tall; a "show more" collapse for `commonExamples`/`commonPatterns`/`relatedExpressions` could tighten scanning once more categories are added.
- Review's "Schon sicher" section uses small Badges with no interaction — a future iteration could make these clickable to jump back into practice for spaced review.
- No progress indicator exists yet for "how many categories total remain" beyond the Quest Map itself; the Vocabulary page's "Nächste Kategorie" pill is a nice touch and could be mirrored more prominently elsewhere.
- Sentence-level romaji in Word Practice is currently only mapped for the 5 Café words; extending the same lookup to Reise/Schule/Freunde vocabulary would make Word Practice feedback fully consistent across all categories.

## 11. Recommendation

With both previously-found bugs fixed and no blockers remaining, the suggested next steps are:

1. **UI polish** — apply the §10 suggestions opportunistically; none are blocking.
2. **Content expansion** — Schule/Freunde/Abschluss-Review currently have minimal (5-question) placeholder-quality lesson data per APP_SPEC_V2's MVP scope, and sentence-level romaji in Word Practice only covers the 5 Café words; both are good next content milestones.
3. **GitHub push** — the app is in a stable, bug-free state suitable for committing/pushing.
4. **Vercel deploy** — reasonable once pushed, since no gameplay-integrity or build issues remain.
5. **AI Coach / OpenAI integration** — remains correctly out of scope for MVP per APP_SPEC_V2 and should be picked up later, after the above.
