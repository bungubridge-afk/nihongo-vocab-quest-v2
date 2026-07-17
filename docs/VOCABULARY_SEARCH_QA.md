# Vocabulary Search QA

## Summary

- Added a text search box to the Vocabulary page that matches against a word's kanji,
  kana, romaji, and German — typing 学校, がっこう, gakkou, or Schule all find the same
  collected 学校 card.
- Search combines with the existing category and Sprachstil (Locker/Höflich) filters via
  AND, exactly like the brief's own examples (Kategorie Schule + "gakkou" → 1 card; Café +
  Locker → 0 cards regardless of search).
- **Uncollected/locked cards are excluded from search results outright** once a query is
  typed — their hidden kanji/kana/romaji/German is never consulted, so no query can
  reveal that an uncollected word exists or what it says. Verified directly: searching a
  temporarily-uncollected word's own exact kanji and exact German field both return "0
  Wortkarten", and a full-DOM string search confirms neither its romaji nor its kana
  appears anywhere in the page.
- New pure-function module `src/lib/vocabularySearch.ts` (NFKC normalization, case
  folding, katakana↔hiragana folding, German umlaut/ß folding, multi-token AND matching) —
  no external search library.
- Existing Register comparison, pronunciation, "Karte üben", and category/Sprachstil
  filters all work unchanged from search results.
- Build: `npm run build` — success, 0 errors. Lint: `npm run lint` — 0 errors, 0 warnings.

## Files Changed

**New:**
- `src/lib/vocabularySearch.ts` — normalization + matching + the collection-safe
  `buildVocabularySearchIndex` (added during the protection-hardening audit), no
  dependency on React, `VocabItem`, or `localStorage`.
- `docs/VOCABULARY_SEARCH_QA.md` (this file).

**Modified:**
- `src/app/vocabulary/page.tsx` — added the search input, a `Kategorie` heading above the
  (pre-existing, previously unlabeled) category filter, renamed the register filter's
  visible heading from "Register" to "Sprachstil" (its internal type/variable names are
  unchanged — this is a label-only change, made because both filter rows have an "Alle"
  option and the brief requires them to be clearly distinguishable), added the result
  count and an enhanced empty state, and (during the protection-hardening audit) added an
  `isHiddenStatus` helper and switched `searchHaystacks` to index only collected cards.
  `VocabCard` itself was **not modified** — it already handled hidden/visible rendering
  and the Register comparison correctly, and needed nothing new for search to work
  through it.

**Not touched:** `src/lib/vocabData.ts`, `src/types/learning.ts`,
`src/lib/registerData.ts`, `src/lib/questData.ts`, `src/lib/quizBuilder.ts`,
`src/lib/subQuestData/*`, `src/lib/storage.ts`, `src/lib/levelSystem.ts`,
`src/lib/worldMapData.ts`, `src/app/page.tsx`, `src/app/lesson/page.tsx`,
`src/app/practice/page.tsx`, `src/app/review/page.tsx`, `src/app/globals.css`,
`src/components/ui/index.ts` — no new shared component was needed; the search/clear
icons are page-local functions, following the same pattern as the page's existing
`SpeakerIcon`.

## Search UI

A labeled search box sits between the stats grid and the category filter:
`Wortkarten durchsuchen` (visible `<label htmlFor>`) above a `type="search"` input with
placeholder `Japanisch, Kana, Romaji oder Deutsch`, a small inline-SVG search icon on the
left, and — only while there's text — an inline-SVG clear button on the right
(`aria-label="Suche löschen"`, 44×44px). The input is a plain controlled component
(`value`/`onChange` → React state); it updates results on every keystroke, is not wrapped
in a `<form>` (so Enter can never trigger a page reload/submission), starts empty, and is
never auto-focused.

## Searchable Fields

`VocabItem` has no `japanese` field — the brief's own instruction to prefer the real code
over the brief's example names applies here: the four searched fields are `kanji`,
`kana`, `romaji`, and `german` (confirmed by reading `src/types/learning.ts`, unchanged).
`romaji` is actually non-optional on `VocabItem`, but `buildVocabularySearchHaystack`
still guards it with `?? ""` for safety against any future/partial caller.

## Normalization

`normalizeVocabularySearchText` (in `vocabularySearch.ts`) applies, in order:

1. **Unicode NFKC** — composes decomposed accent sequences and, notably, folds full-width
   alphanumerics (e.g. "Ｇａｋｋｏｕ") to their half-width equivalents "for free", so no
   separate full-width handling was needed.
2. **Lowercasing** — case-insensitive for German and romaji alike.
3. **Katakana → hiragana folding** — see "Kana Search" below.
4. **German umlaut/ß folding** — see "German Search" below.
5. **Whitespace trim + collapse** — leading/trailing whitespace removed, internal runs of
   whitespace collapsed to a single space (needed for multi-token splitting).

Applied identically to both the typed query and every word's own fields, so folding never
creates a false asymmetry between the two sides of a comparison.

## Japanese Search

Kanji is matched as a plain substring after normalization — 学 (partial) and 学校 (full)
both match the 学校 card; no special-casing needed since kanji characters are untouched by
every fold step. Verified in the browser for both the exact and partial case.

## Kana Search

Implemented via `katakanaToHiragana`: folds katakana U+30A1–U+30F6 (ァ–ヶ) to hiragana by a
fixed +0x60→−0x60 offset, so コーヒー and こーひー normalize to the same string and match
each other. Deliberately **does not** touch ー (prolonged sound mark, U+30FC — no
hiragana equivalent to fold to), ・ (middle dot), or the rare ヷヸヹヺ forms (no clean
1:1 hiragana equivalent) — folding those would corrupt rather than help a match, so they
pass through unchanged. This is the full scope of kana handling in this pass; no broader
"fuzzy" kana matching (e.g. small-tsu/long-vowel equivalence classes) was attempted.
Verified: exact katakana (コーヒー), full hiragana query (こーひー), and partial hiragana
query (こーひ) all correctly match the コーヒー card.

## Romaji Search

Plain substring match after lowercasing — "gakkou" (full) and "gak" (partial) both match,
case-insensitively ("GAK", "Gak", "gak" all equivalent). Verified in the browser with
uppercase input.

## German Search

Case-insensitive via the shared lowercasing step. Umlaut/ß handling via `foldGermanUmlauts`:
`ä→ae`, `ö→oe`, `ü→ue`, `ß→ss`, applied to **both** the query and every word's own field —
this means an exact umlaut input ("Schüler") and its ASCII-alternate spelling
("schueler") both fold to the identical string and compare equal, so exact-umlaut input
is guaranteed to match (not just tolerated) while the alternate spelling is *also*
accepted. Verified with synthetic fixtures (no umlaut word exists in the current 26-word
data set): "Schüler"/"schueler"/"SCHÜLER" all match a "Schüler" field; "Straße"/"strasse"
both match a "Straße" field. Real-data German checks (Wasser/wasser/WASSER, all matching
the `water` card) were run in the browser.

## Multi-Token Search

`getVocabularySearchTokens` splits the normalized query on whitespace; `matchesNormalizedHaystack`
requires every token to appear (substring match) somewhere in the haystack — logical AND
across tokens, matching the brief's example ("友だち Freund" → 1 card; "友だち Schule" →
no match since Schule isn't part of 友だち's own fields). An empty or whitespace-only
query always matches (zero tokens → vacuously true), preserving "no search = show
everything" as a special case of the same code path rather than a separate branch.

## Category AND Search

`categoryFilter` is checked first in the page's filter predicate (unchanged logic, now
just first in an early-return chain) — confirmed in the browser: Kategorie=Schule +
search "gakkou" → 1 card; Kategorie=Café + search "gakkou" (a Schule-only word) → 0 cards
with the empty-state message and a working "Suche löschen".

## Register AND Search

`registerFilter` (Sprachstil) is checked second. Confirmed: Sprachstil=Locker + search
"tomodachi" → 1 card (友だち, which has both a casual and polite `usageExample`);
Kategorie=Café + Sprachstil=Locker (no search) → 0 cards, since no Café word has any
`usageExamples` yet — matching the pre-existing Register-filter behavior from the prior
pass, now additionally confirmed to compose correctly with the new search.

## Collection Protection

**The single most important requirement.** Protection is enforced at **two** levels, the
first being the strong one:

1. **The search index only ever contains collected cards.** `searchHaystacks` is built by
   `buildVocabularySearchIndex(vocabData, shouldIndex)`, where `shouldIndex` accepts a card
   only if `!isHiddenStatus(getCardStatus(vocab, progress))`. `buildVocabularySearchIndex`
   calls `buildVocabularySearchHaystack` — the *only* function that reads a card's
   kanji/kana/romaji/German — **after** `shouldIndex` has already returned `true`. So an
   uncollected/locked card's hidden text fields are **never read at all**; its content
   never enters the in-memory index in the first place, rather than being read and then
   filtered out. `getCardStatus`/`isHiddenStatus` decide "is this hidden?" from `vocab.id`
   and `vocab.categoryId` only — never from the protected text fields.
2. **The render filter also excludes hidden cards** once a query is active
   (`isHiddenStatus(getCardStatus(...))` → `return false` before the haystack lookup).
   This is now belt-and-suspenders: even the `searchHaystacks.get(id) ?? ""` fallback
   would yield an empty haystack (no entry exists for a hidden card) and fail every
   non-empty query anyway.

When the query is empty, hidden cards are still included in `visibleCards` so the existing
`???` placeholder renders exactly as before — the index is simply not consulted on that
path.

**This section was hardened after a code-level audit.** The original implementation built
`searchHaystacks` for *all* `vocabData` up front (reading every card's text fields,
including uncollected ones) and relied solely on level 2 to keep hidden cards out of the
*results*. That produced correct output with no DOM/result leak, but it did read hidden
cards' fields into memory — contradicting the "never consulted" claim. Level 1 above is
the fix: hidden fields are now never read, verified by a getter-instrumented test (see
"Hidden Data Audit").

## Hidden Data Audit

**Code-level proof (getter instrumentation).** A temporary Node script wrapped every
word's four searchable fields (`kanji`/`kana`/`romaji`/`german`) in getters that count
reads and, for a card marked *hidden*, **throw**. It then ran the real
`buildVocabularySearchIndex` with the real collection predicate (Café + Reise collected;
Schule + Freunde uncollected → 10 hidden cards). Results:

- Building the index **did not throw** — meaning no hidden card's text getter was ever
  invoked (16 collected → 16 indexed; 10 hidden → 0 reads, 0 indexed).
- A sanity check confirmed the instrumentation is real: reading a hidden card's `kanji`
  getter directly *does* throw, so the "no throw during index build" result is meaningful,
  not a no-op.
- Every collected card was present in the index and findable by its own romaji.
- A hidden card's real kanji matched **nothing** in the index (its data isn't there).

Output: `OK: no failures found. Hidden cards' text fields were never read.` The script was
deleted after running (repo convention for temp validation).

**Browser confirmation (partial-collection state).** With Café + Reise collected and
Schule + Freunde uncollected:

- Searching a hidden Schule word's exact kanji (`学校`) → **"0 Wortkarten"**, "Keine
  passenden Wortkarten gefunden." — not shown at all.
- A full `document.body.innerHTML` string scan while that query was active confirmed
  neither the romaji `gakkou` nor the kana `がっこう` appears anywhere in the page (the one
  "Schule" on screen is the `Kategorie` filter button's own label, not the hidden card).
- A collected Café word (`koohii`) still returned its card correctly (1 result).
- Empty query + Schule category filter still renders the hidden cards as `???` /
  "Sammelbar" placeholders, unchanged.
- No `data-*` attribute or `aria-label` anywhere carries a hidden word's real content —
  confirmed by reading `VocabCard`'s JSX (unmodified) and by the DOM string scan above.
- No console errors, no hydration errors, no server errors on the partial-collection page.

## Result Count

`formatResultCount` renders `"0 Wortkarten"` / `"1 Wortkarte"` / `"N Wortkarten"`
(German singular/plural, 0 taking the plural form per the brief's own example) in a
single `<p aria-live="polite">` containing only the count text — no surrounding label is
included in the live region, so a screen reader announces just the number, not the whole
filter-bar. The count reflects `visibleCards.length`, i.e. exactly what's rendered in the
grid (including `???` placeholders when the query is empty, matching how "how many cards
are shown" already worked before this pass).

## Empty State

`Keine passenden Wortkarten gefunden.` is always shown for zero results. When a search
query is active (`normalizedQuery` non-empty), two more things appear: the supplementary
line `Versuche einen anderen Suchbegriff oder ändere die Filter.` and a `Suche löschen`
button that clears only `query` (category/Sprachstil filters are untouched) — confirmed
in the browser that this supplementary block does **not** appear for a pure
filter-combination zero-result (Café + Locker, no search text), matching the brief's
distinction between "search produced nothing" and "filters alone produced nothing".

## Performance

- **Haystacks are precomputed once per collection change**, in a
  `useMemo(() => ..., [state.progress])` — building one `Map<id, haystack>` covering only
  the collected cards. Normalizing a collected word's fields happens once (not once per
  keystroke), and `state.progress` is set once after hydration, so in practice the index
  builds effectively once. (This was `[]`-keyed and covered all words in the original
  version; it's now keyed on `state.progress` so it can exclude hidden cards from the
  index entirely — see "Collection Protection".)
- **The query is normalized once per keystroke** (`useMemo` keyed on `query`), not once
  per word — so typing doesn't re-run NFKC/case/kana/umlaut folding 26 (or, at future
  scale, thousands of) times per keystroke.
- The per-keystroke cost is: one `normalizeVocabularySearchText` call (cheap, one short
  string) + a `.filter()` over the word list doing a cheap `Map.get` + `matchesNormalizedHaystack`
  (a few `.includes()` calls) per word — no JSON.stringify, no re-normalization of
  per-word fields, anywhere in the render path.
- No external search library was added; `vocabularySearch.ts` also exposes the granular
  pieces (`buildVocabularySearchHaystack`, `matchesNormalizedHaystack`) specifically so a
  much larger future word list can keep using the same precompute-once-per-word,
  normalize-once-per-keystroke shape without changing the module's public API.

## Desktop (1280px)

Search input capped at `max-w-md` (doesn't stretch full-width on a wide screen), sits
naturally above the filter rows, card grid (`sm:grid-cols-2 lg:grid-cols-3`) unaffected.

## Tablet (768px)

Confirmed no horizontal overflow (`document.body.scrollWidth: 753` ≤
`window.innerWidth: 768`) with a query active and the input's natural `w-full` width
inside its container.

## Mobile (375px)

Confirmed: no horizontal overflow (`scrollWidth`/`innerWidth` both exactly `375`); search
input width `343px`, right edge at `359px` (within the 375px viewport, so the icon and
text never spill outside it); the clear button measured exactly `44×44px` with its right
edge at `359px` (also within viewport); all 8 filter buttons (Kategorie ×5 + Sprachstil
×3) measured `≥44px` tall (0 short buttons found) — this reuses the `min-h-11` fix
already applied to these buttons in the prior Home-auto-scroll/Register-UI passes, not
something newly added here.

## Accessibility

- Visible `<label htmlFor="vocab-search">` (not just a placeholder) names the input.
- `type="search"` (native semantics + a browser-native clear affordance on some
  platforms, which this page's own explicit clear button supplements, not replaces).
- The clear button is a real `<button>` with `aria-label="Suche löschen"`, sized 44×44px.
- No `<form>` wraps the input, so pressing Enter cannot submit/reload the page.
- `:focus-visible` styling is already global (`globals.css`, unmodified) and applies to
  the input, the clear button, and every filter button automatically.
- The result count uses `aria-live="polite"` scoped to just the count text (see "Result
  Count" above) — not the whole filter bar, avoiding excessive announcements.
- No hidden word's kanji/kana/romaji/German is ever placed in any `aria-label` or
  `data-*` attribute (see "Hidden Data Audit").
- Colour is never the only signal for anything this pass touched — the existing
  `RegisterBadge` (unmodified) already pairs colour with visible text.

## Browser QA

- **A. Japanese:** `学校` (exact) and `学` (partial) both correctly returned only the
  学校 card.
- **B. Kana:** `がっこう` (exact) and `がっ` (partial) both correctly returned only the
  学校 card.
- **C. Romaji:** `gakkou`, `GAK` (uppercase partial) both correctly matched.
- **D. German:** `Schule`, `SCHULE` (all-uppercase) both correctly matched (1 card each).
- **E. AND conditions:** Kategorie=Café + query `gakkou` → 0 Wortkarten (with empty-state
  message + supplementary text + working "Suche löschen"); Kategorie=Alle +
  Sprachstil=Locker + query `tomodachi` → 1 Wortkarte (友だち); Kategorie=Café +
  Sprachstil=Locker (no query) → 0 Wortkarten, no supplementary search text (confirming
  the "only show search-specific copy when a query is active" distinction).
- **F. Uncollected cards:** see "Hidden Data Audit" above — full pass, including a
  DOM-wide string search for the hidden word's romaji/kana.
- **G. Clear:** typing shows the clear button; clicking it (both the inline button and
  the empty-state's own "Suche löschen") empties the query and returns to the
  category/Sprachstil-filtered set without resetting those filters.
- **H. Empty state:** natural German copy, "Suche löschen" present and functional, no
  layout breakage (`Card` component renders normally in the empty-grid slot).
- **I. Responsive:** 375/768/1280 all confirmed — see the three sections above.
- **J. Regression:** Home's current-stage auto-scroll (`data-quest-scroll-target`) still
  correctly targets the Finale row on a fully-completed profile; Café lesson and the
  Review (weak-words) page both load with no errors; "Karte üben" from a *search result*
  navigated to exactly `/practice?word=school` (confirmed via
  `window.location.search === "?word=school"` — the typed query `学校` never reached the
  URL) and the resulting Sub Quest page loaded normally (`1 / 10`); zero console errors
  and zero server errors were observed across every step of this entire QA pass.

## Regression QA

- `VocabCard` was not modified: pronunciation button, "Karte üben", and the
  Locker/Höflich comparison toggle (independent per-card `useState`, `aria-expanded`/
  `aria-controls`, casual-before-polite ordering) all work unchanged, including when
  reached through a search result.
- Category filter (`Kategorie`) and Sprachstil filter behavior are unchanged apart from
  gaining their explicit headings; their own filtering logic (`matchesCategory`,
  `hasRegisterExample`) was not altered, only reordered into early-return form for
  readability.
- 26/26 card count, Home auto-scroll, Café/Reise/Schule/Freunde Main Quests, Finale,
  Practice/Sub Quest, XP/Level display: all unaffected — confirmed via `git diff` that
  only `src/app/vocabulary/page.tsx` (existing file) and the new `vocabularySearch.ts`
  changed.
- No "Boss"/"Mastered"/"Block" text found anywhere.

## Remaining Issues

- **No broader "fuzzy" kana equivalence** (e.g. treating small-tsu っ or vowel-length
  variants as flexible) was implemented — only the katakana↔hiragana fold described
  above. This matches the brief's own fallback instruction ("実装する場合... ただし、不正確
  な変換になる場合は無理に実装せず、NFKCと通常部分一致までに留めてください") — broader kana
  fuzzing risks incorrect matches (e.g. conflating が/か), so it was deliberately left out.
- **German umlaut/ß folding could not be verified against a real word in the current
  26-word data set**, since none of the 26 words' German fields contain an umlaut or ß.
  Verified instead with synthetic fixtures (`Schüler`/`Straße`) exercising the exact same
  `normalizeVocabularySearchText` function real words would go through — the underlying
  fold is data-independent, so this is a faithful test of the actual code path, just not
  an in-app word.
- The `"Register"` heading label was renamed to `"Sprachstil"` (visible text only; the
  `RegisterFilter` type, `registerFilter` state variable, and `getRegisterLabel`/
  `hasRegisterExample` helper names are all unchanged) specifically to satisfy the
  brief's requirement that two adjacent "Alle" filter groups be clearly distinguished by
  heading, and because the brief's own section 12 example uses "Sprachstil" for this
  heading. Noted here since it's a small UI-copy change beyond the strictly-new search
  feature.
