/**
 * Pure text-search helpers for the Vocabulary page. No React, no DOM, no localStorage —
 * every function here is a plain string transform so it stays cheap and testable as the
 * word list grows from 26 words toward hundreds or thousands. Nothing here decides
 * *which* cards are allowed to be searched (locked/uncollected protection is the
 * caller's job, in `vocabulary/page.tsx`) — this module only answers "does this text
 * match this query", assuming it's already been decided that the text is safe to search.
 */

const KATAKANA_TO_HIRAGANA_OFFSET = 0x60;

/**
 * Katakana → hiragana, only across the range that shifts cleanly by a fixed offset
 * (ァ–ヶ, U+30A1–U+30F6). Deliberately leaves ー (prolonged sound mark), ・ (middle dot),
 * and the rare ヷヸヹヺ forms untouched — they either aren't letters or have no clean
 * hiragana equivalent, so folding them would corrupt the text rather than help matching.
 * This lets a search for "こーひー" find "コーヒー" (and vice versa) without touching the
 * long-vowel mark itself.
 */
function katakanaToHiragana(value: string): string {
  return value.replace(/[ァ-ヶ]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - KATAKANA_TO_HIRAGANA_OFFSET)
  );
}

/**
 * German umlaut / ß → ASCII-alternate spelling. Applied identically to the query and to
 * every word's own search text, so an exact umlaut ("Schüler") and its ASCII-alternate
 * spelling ("Schueler") both fold to the same form and compare equal — this also means
 * typing the umlaut exactly still matches, since both sides go through the same fold.
 */
const UMLAUT_FOLD: Record<string, string> = {
  ä: "ae",
  ö: "oe",
  ü: "ue",
  ß: "ss",
};

function foldGermanUmlauts(value: string): string {
  return value.replace(/[äöüß]/g, (char) => UMLAUT_FOLD[char] ?? char);
}

/**
 * Normalizes any search text — a typed query, or a word's own fields — into one
 * comparable form:
 * 1. Unicode NFKC (also folds full-width alphanumerics, e.g. "Ｇａｋｋｏｕ", to their
 *    half-width equivalents, and composes decomposed accent sequences into one character).
 * 2. Lowercased (case-insensitive for German and romaji alike).
 * 3. Katakana folded to hiragana (see `katakanaToHiragana`).
 * 4. German umlauts/ß folded to their ASCII-alternate spelling (see `foldGermanUmlauts`).
 * 5. Leading/trailing whitespace trimmed, internal runs of whitespace collapsed to one space.
 *
 * Pure and side-effect-free — safe to call on both sides of any comparison.
 */
export function normalizeVocabularySearchText(value: string): string {
  if (!value) return "";
  const composed = value.normalize("NFKC").toLowerCase();
  const kanaFolded = katakanaToHiragana(composed);
  const umlautFolded = foldGermanUmlauts(kanaFolded);
  return umlautFolded.trim().replace(/\s+/g, " ");
}

/** The subset of a word's fields this module searches. A plain object shape (not tied to
 *  `VocabItem` directly) so tests and future callers can pass any matching shape. */
export interface VocabularySearchFields {
  kanji: string;
  kana: string;
  romaji: string;
  german: string;
}

/**
 * Builds one normalized "haystack" string from a word's searchable fields. The result
 * doesn't depend on any search query, so it's safe — and, for large word lists,
 * recommended — to compute once per word (e.g. in a `useMemo` keyed on the word list)
 * and reuse across every keystroke, rather than rebuilding it on every render.
 *
 * `germanText` is the ALREADY-localized meaning in the current app language: an
 * English learner searches only Japanese + English meaning, a German learner only
 * Japanese + German meaning. The caller localizes it (see `buildVocabularySearchIndex`)
 * so this module stays free of any i18n dependency.
 */
export function buildVocabularySearchHaystack(
  item: VocabularySearchFields,
  germanText: string = item.german
): string {
  return normalizeVocabularySearchText(
    [item.kanji, item.kana, item.romaji ?? "", germanText].join(" ")
  );
}

/**
 * Builds a search index (word id → normalized haystack), but **only** for the items
 * `shouldIndex` accepts. This is the collection-safe entry point: a word's
 * kanji/kana/romaji/German is read (via `buildVocabularySearchHaystack`) *only after*
 * `shouldIndex` has already returned `true` for it — so an excluded word's text fields
 * are never touched at all, not merely omitted from the output afterward.
 *
 * The predicate must decide eligibility from safe metadata only (e.g. the word's `id` and
 * whether it's been collected), never from the searchable text fields themselves. That
 * way an uncollected/hidden word is skipped *before* any of its hidden content is read
 * into memory. Because the `continue` fires before `buildVocabularySearchHaystack` is
 * called, a hidden word whose `kanji`/`kana`/`romaji`/`german` are throwing getters would
 * never trigger them (this is exactly what the protection test asserts).
 */
export function buildVocabularySearchIndex<T extends VocabularySearchFields & { id: string }>(
  items: readonly T[],
  shouldIndex: (item: T) => boolean,
  localizeGerman: (item: T) => string = (item) => item.german
): Map<string, string> {
  const index = new Map<string, string>();
  for (const item of items) {
    if (!shouldIndex(item)) continue;
    // `localizeGerman` is invoked only AFTER the item passed `shouldIndex`, so a hidden
    // card's meaning is never localized or read into the index — the collection-privacy
    // invariant (hidden text never enters the search index) still holds per locale.
    index.set(item.id, buildVocabularySearchHaystack(item, localizeGerman(item)));
  }
  return index;
}

/** Splits an already-normalized query into its space-separated search tokens (an empty
 *  or whitespace-only query yields `[]`). */
export function getVocabularySearchTokens(normalizedQuery: string): string[] {
  return normalizedQuery.split(" ").filter(Boolean);
}

/**
 * True if every token in `normalizedQuery` appears somewhere in `haystack` (logical AND
 * across tokens; each token itself is a plain substring match). An empty query always
 * matches. This is the fast path for a render loop over many words: call it with a
 * precomputed `haystack` (`buildVocabularySearchHaystack`, memoized per word) and a
 * precomputed `normalizedQuery` (`normalizeVocabularySearchText`, computed once per
 * keystroke) so no per-word normalization work repeats.
 */
export function matchesNormalizedHaystack(haystack: string, normalizedQuery: string): boolean {
  const tokens = getVocabularySearchTokens(normalizedQuery);
  if (tokens.length === 0) return true;
  return tokens.every((token) => haystack.includes(token));
}

/**
 * One-shot convenience match: normalizes `query` and rebuilds `item`'s haystack from
 * scratch on every call. Correct for any list size, but repeats normalization work each
 * time — prefer `buildVocabularySearchHaystack` + `matchesNormalizedHaystack` when
 * filtering many words on every keystroke (see `vocabulary/page.tsx`).
 */
export function matchesVocabularySearch(item: VocabularySearchFields, query: string): boolean {
  return matchesNormalizedHaystack(
    buildVocabularySearchHaystack(item),
    normalizeVocabularySearchText(query)
  );
}
