# Nihongo Vocab Quest Monetization Plan

**Status of this document:** Planning only. No application code (`src/app`, `src/lib`, `src/components`, `src/types`) was changed to produce this plan, and nothing described here is implemented yet.

---

## 1. Goal

Turn Nihongo Vocab Quest v2 from a free, localStorage-only MVP into a sustainably monetized learning product, without compromising the core experience that makes it worth paying for in the first place.

Guiding assumptions:
- The target audience is German-speaking users learning Japanese, specifically **beginners** (A1 and below) — not intermediate/advanced learners.
- The learning experience should stay **gamified**: a Quest Map, word-card collection, and short quizzes, not a dry flashcard app.
- **AI Coach** (free-form Japanese practice with AI feedback) is the flagship *future* paid feature, not something needed to start charging.
- Revenue should come from either a **subscription** (monthly/yearly) or a **lifetime purchase**, decided later once we know real usage patterns — this document proposes both as options rather than committing to one.
- Monetization must never come at the cost of trust: pricing should feel fair for a young, still-small MVP, not premium-positioned from day one.

---

## 2. Current MVP Status

What exists today, based on `docs/APP_SPEC_V2.md`, `docs/IMPLEMENTATION_PLAN_V2.md`, and `docs/QA_REPORT_V2.md`:

**Implemented and QA-passed (Pass, no blocking bugs):**
- Onboarding (5-question profile setup, no XP/card effect)
- Home / Quest Map (Level, XP, Karten, Next Unlock, vertical map with current/completed/locked states)
- Café Lesson ("Erste Bestellung", 5 questions incl. Abschluss-Challenge, full feedback with kana/romaji/German/Beispiel/Tips)
- Reise / Schule / Freunde / Abschluss-Review lesson categories (same 5-question mechanical structure as Café, but with minimal/placeholder-quality content per MVP scope)
- Word Collection (`/vocabulary`) with Sammelbar / Gesammelt / Üben / Gelernt / Locked states, category filters
- Word Practice (`/practice?word=...`) — single-word-scoped 5-question drills
- Review (`/review`) — weak-word list driven by practice results, links back into Word Practice
- Progress persistence via `localStorage` only (7 keys: profile, xp, collected cards, completed/unlocked categories, known/weak words) — no server, no account
- Level/XP system and category-unlock logic (`completedCategories`-based, not XP-threshold-based)
- Deployed: `main` is pushed to GitHub and deployed to Vercel; the production URL has been verified working for Onboarding, Home, Lesson, Vocabulary, Practice, and Review

**Not yet built:**
- No login / accounts — progress lives only in one browser's `localStorage` and is lost on clear or device change
- No database — nothing is stored server-side
- No payment integration of any kind
- No AI Coach — the placeholder page exists in spec only; no OpenAI (or other LLM) integration

In short: the *gameplay loop* is solid and QA-verified end to end, but everything needed to *sell* it — accounts, persistence beyond one browser, payments, and the flagship AI feature — does not exist yet.

---

## 3. Free Plan

What stays free, indefinitely, not just as a trial:

- Full Onboarding flow
- Café category: all 5 word cards, the full Café Lesson (including Abschluss-Challenge), and Word Practice for each Café word
- Basic Review (weak-word list limited to Café words)
- Progress stored locally (no account required to use the free tier at all)

**Purpose of the free plan:**
- Let a new user experience the *entire* core loop once — Onboarding → collect first cards → clear a category → see XP/level go up — with zero friction (no signup wall before the "aha" moment).
- Prove the teaching approach works (scene-based phrases, not raw word lists) before asking for money.
- Create a natural, honest reason to upgrade: the user finishes Café, sees Reise/Schule/Freunde/Abschluss-Review sitting right there on the Quest Map, locked behind "Premium" instead of behind a completion gate that no longer applies once payment exists.

The free plan is intentionally *one full category*, not a diluted taste of everything — a complete, satisfying loop is a better upgrade motivator than a handful of restricted features across every category.

---

## 4. Paid Plan

What unlocks with a paid account:

- All remaining categories: Reise, Schule, Freunde, Abschluss-Review
- The full vocabulary collection (once content is expanded beyond the current ~20 words — see §8 Phase 1)
- Advanced Review (spaced-repetition-style prioritization instead of the current simple weak-word list; see `docs/QA_REPORT_V2.md` §10's "extend sentence-level romaji" and general content-depth notes)
- **AI Coach**, including:
  - Example-sentence generator ("show me 3 more sentences using 飲む")
  - Writing correction (user submits a Japanese sentence, gets corrected + explained in German)
  - Personalized weak-point practice (AI-assembled quiz from the user's actual mistake history, not just a static weak-word list)
- Progress sync across devices (requires the account/database work in §7 regardless of payment — see note there)

---

## 5. Pricing Ideas

Initial, deliberately modest price points (subject to revision once there's real usage data):

| Plan | Price (draft) | Notes |
|---|---|---|
| Monthly | €4.99–€7.99 | Standard SaaS-style recurring |
| Yearly | €39–€59 | ~35–40% discount vs. 12× monthly, to reward commitment |
| Lifetime | €29–€49 | One-time; useful for an early-adopter / Kickstarter-style launch, but caps recurring revenue — treat as a limited-time offer rather than a permanent tier |

These are **placeholder ranges**, not final pricing. Actual pricing should be set only after:
- Phase 1 content expansion is done (§8) — charging before Reise/Schule/Freunde/Abschluss-Review are "real" content is premature.
- Some free-tier usage data exists (how far do people actually get through Café before dropping off?).

---

## 6. What Users Would Pay For

Ranked by how directly the current app already demonstrates the value, based on what's built and QA-verified:

1. **The satisfaction of collecting word cards** — Word Collection's Sammelbar → Gesammelt progression is already a proven hook (visually distinct states, category badges, "Karte üben" per card). This is the single strongest asset to expand and gate behind payment for additional categories.
2. **Practical, scene-based phrases over raw vocabulary** — Café's Q4/Q5 ("Wasser bitte." → "水をください。", "Kaffee und Brot bitte." → "コーヒーとパンをください。") are the app's actual differentiator versus generic flashcard apps. More categories = more real scenes (station, school, friends) = more of exactly this value.
3. **Explanations in German, for German speakers specifically** — every instruction, tip, and feedback string in the app is in German, not English. This is a real niche most general-purpose Japanese apps (Duolingo included) do not serve well.
4. **Personalized weak-point review** — `nvq_weak_words` already exists and drives `/review`; this is the seed of a feature users would pay to see get smarter (AI-assembled review sessions instead of a flat list).
5. **AI Coach as a safety net** — the ability to ask "is this sentence correct?" without fear of judgment is a strong emotional hook for anxious beginners, but it is the *least* proven part of the roadmap since nothing has been built yet — treat it as the payoff feature, not the MVP of the paid tier.
6. **Being unmistakably beginner-focused** — Duolingo's Japanese course tries to serve everyone; this app's whole structure (Quest Map starting at zero, Onboarding asking "Ich starte bei null") signals "this is for you specifically" to true beginners in a way larger apps don't.

---

## 7. Required Architecture for Monetization

**Not implemented yet — this section is a technical checklist for later, not a build plan for now.**

Required components:
- **Authentication** — users need an identity so progress and payment status can be tied to them across devices/browsers.
- **Database** — to store anything server-side at all (currently 100% `localStorage`).
- **User progress table(s)** — server-side equivalent of the current 7 `localStorage` keys (`nvq_profile`, `nvq_xp`, `nvq_collected_cards`, `nvq_completed_categories`, `nvq_unlocked_categories`, `nvq_known_words`, `nvq_weak_words`), keyed by user id instead of by browser.
- **Subscription status** — a field/table tracking whether a user is on Free or Paid, and until when.
- **Payment provider integration** — to actually charge money and receive webhooks about subscription state changes.
- **Protected paid content** — server- or client-side gating so Reise/Schule/Freunde/Abschluss-Review and AI Coach only render/function for paid accounts.
- **Account settings page** — manage email, password/login method, subscription, data export/delete.
- **Privacy policy** — required once any personal data (email, payment info, progress tied to identity) is collected.
- **Terms of service** — required once money changes hands.
- **Contact/support page** — users need a way to ask about billing issues, refunds, bugs.

Technologies already in use:
- Next.js (application framework)
- Vercel (hosting/deploy — the production app is already live here)

Candidate technologies for the still-unbuilt pieces (not chosen yet, listed for later evaluation):
- Supabase or Firebase (auth + database, either is a reasonable fit for a project this size)
- Stripe (payments/subscriptions)
- OpenAI API (for AI Coach, later — after payment infrastructure exists, since AI Coach is the paid feature that needs gating in the first place)

**None of this should be implemented now.** The MVP currently has zero users and zero proven retention; building auth/DB/payments before content and free-tier engagement are proven would be solving a problem that doesn't exist yet.

---

## 8. Recommended Implementation Order

### Phase 1: Content Expansion
- Improve Reise / Schule / Freunde content quality (currently minimal/placeholder per `docs/IMPLEMENTATION_PLAN_V2.md`'s MVP scope)
- Increase vocabulary count beyond the current ~20 words
- Increase question count/variety per category beyond the fixed 5-question (4 + Abschluss-Challenge) structure
- Make `shortTip`/`detailTip` text feel more natural and varied, less templated

### Phase 2: Free vs. Paid Boundary
- Finalize exactly which categories/features are Free vs. Paid (§3/§4 above are a starting proposal, not final)
- Design the "Locked — Premium" UI treatment on the Quest Map and Word Collection, distinct from the existing "Locked — not yet unlocked by progress" state (these are two different kinds of "locked" and must look/read differently to avoid confusing users)
- Decide how Abschluss-Review (which currently requires *all* other categories completed) interacts with a paid gate

### Phase 3: Authentication + Database
- Migrate progress storage from `localStorage` to a real database, keyed by authenticated user
- Implement login/signup and session management
- Keep `localStorage` as a fallback/cache layer if useful, but make the database the source of truth

### Phase 4: Payment
- Integrate a payment provider (e.g. Stripe) for subscriptions and/or one-time purchase
- Track and enforce subscription status
- Gate paid content server-side (not just hidden in the UI) so it can't be trivially bypassed

### Phase 5: AI Coach
- Integrate an LLM API (e.g. OpenAI) behind the paid tier
- Build: phrase questions, word questions, writing correction, weak-point-driven review generation

---

## 9. What Not To Do Yet

Explicitly deferred, not because these are bad ideas, but because they're premature before Phase 1 is done:

- Implementing Stripe
- Implementing login/authentication
- Migrating to a database
- Connecting the OpenAI API
- Building a sophisticated SRS (spaced repetition) algorithm
- Any large-scale refactor of the existing app
- Pricing aggressively / high
- Polishing the UI to a "finished product" level

**Reason:** the app does not yet have enough paid-tier *content* to justify charging money or building the infrastructure to charge it. Every item above is either work that becomes easier to justify (and to scope correctly) once Phase 1 content exists, or work that actively risks destabilizing a currently QA-passing, bug-free MVP for no immediate benefit.

---

## 10. Next Best Step

**Do not start monetization implementation next.**

The concrete next step is: **make Reise, Schule, Freunde, and Abschluss-Review into real, high-quality lesson content** — the same level of care currently given to Café (natural scene-based sentences, well-chosen distractors, genuinely useful tips) — and grow the vocabulary collection to match.

Only after that content genuinely earns a "Premium" label should the Free/Paid boundary (§8 Phase 2) be designed. Everything in §7/§9 (auth, database, payments, AI Coach) comes after that.
