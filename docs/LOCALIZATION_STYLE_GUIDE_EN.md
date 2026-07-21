# English Localization Style Guide

Stand: 2026-07-21 · 対象: `src/i18n/messages/en.ts` と `src/i18n/contentTranslations.ts` の英語

The English is written natively for English speakers — never a word-for-word
rendering of the German source.

## Voice

- clear, playful, concise, warm, lightly adventurous
- not childish, not corporate, not machine-translated
- No leftover German word order. Reorder freely so the English reads naturally.

## Buttons & labels

- Short and imperative: "Start", "Replay", "Practice this word", "Sign in", "Sign out".
- Sentence case for CTAs, not Title Case ("Save profile", not "Save Profile").
- Avoid unnecessary capitalization mid-phrase.

## Errors

- Say what to do next, not just what went wrong.
- Neutral about account existence on auth ("Email address or password isn't correct.").
- Example: "That username is already taken. Please pick another."

## Numbers & progress

Good vs. bad (the failure mode to avoid is a stiff literal calque):

| German | ✗ literal | ✓ natural |
|---|---|---|
| `Noch 40 XP bis Level 3` | "Still 40 XP until Level 3" | **"40 XP to Level 3"** |
| `Karte üben` | "Practice card" | **"Practice this word"** |
| `1 / 5 Etappen geschafft` | "1 / 5 stages made it" | **"1 / 5 stages cleared"** |

## Plurals, articles, counts

- Count-dependent strings are modeled as **separate catalog keys** chosen by the
  caller (`wordDiscovered` vs `wordsDiscovered`, `resultOne` vs `resultMany`), so
  English and German plural rules stay independent — no runtime pluralization.
- "1 word discovered" / "5 words discovered"; "1 word card" / "5 word cards".

## Terminology (brand glossary — keep consistent)

| Concept | English | German |
|---|---|---|
| Home | Home / Back to map | Startseite / Zur Karte |
| Collection lexicon | **Kotoba Zukan** (brand, unchanged) | Kotoba-Zukan |
| Level | Level | Level |
| Review (feature) | Review | Wiederholung |
| Settings | Settings | Einstellungen |
| Quest / Chapter / Area | Quest / Chapter / Area | Quest / Kapitel / Area |
| Sign in / Sign out | Sign in / Sign out | Anmelden / Abmelden |
| Register (politeness) | Register — Casual / Polite | Sprachstil — Locker / Höflich |
| Stage status | Ready / Completed / Locked | Bereit / Abgeschlossen / Gesperrt |
| Zukan status | Undiscovered / Discovered / In training / Familiar | Unentdeckt / Entdeckt / Im Training / Vertraut |

Never mix two English words for one concept. "Username" (not "handle"),
"display name", "card", "stage", "quest".

## Quest / grammar language

- Keep grammar facts exact: particles (を / に / で / と / が), politeness, and
  cultural claims with their hedging ("often", "many", "usually" — never "all
  Japanese …").
- Japanese inside a string stays **verbatim**; only the surrounding English is
  translated. Fill-in-the-blank prompts keep their `____` and Japanese frame.
- Example: `„Ich esse Brot.“\nパンを____。` → `"I eat bread."\nパンを____。`

## Cultural explanations (Zukan / Japan notes)

- Do not change the claim or its strength between German and English.
- Preserve the dry, light field-guide humor of the dex descriptions — carry the
  wit over, don't flatten it into a literal gloss.
  - `Der stille Held jeder Reise.` → "The quiet hero of every trip."
  - `Unscheinbar im Alltag, aber in dringenden Momenten die wertvollste Karte …`
    → "Unremarkable day to day, but in urgent moments the most valuable card …"

## Punctuation

- Use straight apostrophes' contractions naturally ("don't", "you'll", "it's").
- Typographic quotes “…” in content mirror the German „…“ pairs.
- One consistent style throughout; no mixing.
