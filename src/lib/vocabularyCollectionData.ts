import type { CategoryId } from "@/types/learning";
import type {
  AreaProgressView,
  CategoryCollectionView,
  ChapterProgressView,
  CollectionAreaId,
  VocabularyCategoryCollectionData,
  VocabularyCollectionArea,
  VocabularyCollectionChapter,
  VocabularyCollectionEntry,
} from "@/types/vocabularyCollection";

/**
 * Zukan (collection lexicon) display metadata for every word in the app, organised as
 * Area → Kategorie → Kapitel → Entry (see docs/VOCABULARY_COLLECTION_ARCHITECTURE.md).
 *
 * Rules this file lives by:
 * - Display only. Never read for XP, quiz building, unlocks or the search index —
 *   and never shown for a card the player has not discovered yet.
 * - `collectionNumber` is a STABLE 1–26 dex number, never reassigned when words are
 *   added later, and never used as a sort key (sorting is by area/category/chapter/
 *   entryOrder).
 * - Chapter membership + order lives in `vocabularyCollectionChapters[].entryIds`, the
 *   single source of truth; each entry's `areaId`/`chapterId`/`entryOrder` is derived
 *   from it at module load, so the two can never drift apart.
 * - Texts are German, meaning-accurate, and must not contradict the word's own
 *   examples/tips in `vocabData.ts`. Tone: a friendly field guide — light, never silly.
 */

/** The per-word content, before the hierarchy fields are merged in from the chapters. */
type VocabularyCollectionEntryContent = Pick<
  VocabularyCollectionEntry,
  "collectionNumber" | "dexDescriptionGerman" | "usageRoleGerman" | "memoryHookGerman"
>;

/** Every word id that must have a Zukan entry — keeps the record exhaustively typed:
 *  a missing or misspelled key below is a TypeScript error, not a runtime surprise. */
export type VocabCollectionId =
  | "coffee"
  | "water"
  | "bread"
  | "drink"
  | "eat"
  | "station"
  | "hotel"
  | "train"
  | "toilet"
  | "go"
  | "where"
  | "excuseMe"
  | "right"
  | "left"
  | "near"
  | "far"
  | "school"
  | "teacher"
  | "japaneseLanguage"
  | "study"
  | "today"
  | "friend"
  | "meet"
  | "talk"
  | "tomorrow"
  | "like";

const vocabularyCollectionContent: Record<
  VocabCollectionId,
  VocabularyCollectionEntryContent
> = {
  // --- Café (#001–#005) ---
  coffee: {
    collectionNumber: 1,
    dexDescriptionGerman:
      "Wird am Morgen besonders häufig herbeigerufen. Im Café gehört diese Karte zu den zuverlässigsten Klassikern.",
    usageRoleGerman:
      "Du benutzt das Wort beim Bestellen oder wenn du über Getränke sprichst.",
    memoryHookGerman: "コーヒー + をください = Einen Kaffee bitte.",
  },
  water: {
    collectionNumber: 2,
    dexDescriptionGerman:
      "Der stille Held jeder Reise. Taucht zuverlässig auf, wenn Kaffee, Hitze oder ein langer Tag ihren Tribut fordern.",
    usageRoleGerman:
      "水 brauchst du beim Bestellen und in vielen einfachen Alltagssätzen.",
    memoryHookGerman:
      "水をください ist einer der sichersten Bestellsätze für Anfänger.",
  },
  bread: {
    collectionNumber: 3,
    dexDescriptionGerman:
      "Klein, praktisch und erstaunlich oft in der Nähe von Kaffee anzutreffen. Im Café bildet es schnell ein gutes Duo.",
    usageRoleGerman:
      "パン verwendest du beim Bestellen und wenn du über Essen sprichst.",
    memoryHookGerman: "Mit と verbindest du zwei Dinge: コーヒーとパン.",
  },
  drink: {
    collectionNumber: 4,
    dexDescriptionGerman:
      "Der natürliche Gegner eines vollen Glases. Auch dieses Verb arbeitet besonders gern mit を zusammen.",
    usageRoleGerman: "飲む benutzt du für Wasser, Kaffee und andere Getränke.",
    memoryHookGerman: "Getränk + を + 飲む: 水を飲む.",
  },
  eat: {
    collectionNumber: 5,
    dexDescriptionGerman:
      "Dieses Verb wird aktiv, sobald etwas Essbares auf dem Tisch liegt. Sein bevorzugter Begleiter ist die Partikel を.",
    usageRoleGerman: "食べる beschreibt, dass jemand etwas isst.",
    memoryHookGerman: "Vor 食べる steht das Essen häufig mit を: パンを食べる.",
  },

  // --- Reise (#006–#016) ---
  station: {
    collectionNumber: 6,
    dexDescriptionGerman:
      "Der große Knotenpunkt jeder Reise. Wer diese Karte kennt, findet fast immer einen Weg nach Hause.",
    usageRoleGerman:
      "駅 brauchst du, wenn du nach dem Bahnhof fragst oder dein Ziel nennst.",
    memoryHookGerman:
      "駅はどこですか = Wo ist der Bahnhof? Das Muster passt für jeden Ort.",
  },
  hotel: {
    collectionNumber: 7,
    dexDescriptionGerman:
      "Ruht tagsüber unauffällig in der Stadt und wird am Abend zum wichtigsten Ziel müder Reisender.",
    usageRoleGerman:
      "ホテル benutzt du, wenn du dein Ziel nennst oder nach dem Weg fragst.",
    memoryHookGerman: "Ziel + に + 行きます: ホテルに行きます.",
  },
  train: {
    collectionNumber: 8,
    dexDescriptionGerman:
      "Rollt pünktlich durchs ganze Land und nimmt jeden mit, der die richtige Partikel dabei hat.",
    usageRoleGerman:
      "電車 brauchst du, wenn du sagst, womit du unterwegs bist.",
    memoryHookGerman: "Verkehrsmittel + で: 電車で行きます = Ich fahre mit dem Zug.",
  },
  toilet: {
    collectionNumber: 9,
    dexDescriptionGerman:
      "Unscheinbar im Alltag, aber in dringenden Momenten die wertvollste Karte des ganzen Zukans.",
    usageRoleGerman: "トイレ brauchst du, um höflich nach der Toilette zu fragen.",
    memoryHookGerman: "トイレはどこですか – am besten mit すみません davor.",
  },
  go: {
    collectionNumber: 10,
    dexDescriptionGerman:
      "Ein rastloses Verb, das nie lange stehen bleibt. Wo ein Ziel auftaucht, ist es kurz danach zur Stelle.",
    usageRoleGerman: "行く beschreibt, dass du irgendwohin gehst oder fährst.",
    memoryHookGerman: "Das Ziel bekommt に: 駅に行きます.",
  },
  where: {
    collectionNumber: 11,
    dexDescriptionGerman:
      "Das neugierigste Wort der Sammlung. Es stellt immer dieselbe Frage – und bekommt jedes Mal eine neue Antwort.",
    usageRoleGerman: "どこ benutzt du, um nach Orten zu fragen.",
    memoryHookGerman: "[Ort] + はどこですか funktioniert überall.",
  },
  excuseMe: {
    collectionNumber: 12,
    dexDescriptionGerman:
      "Öffnet Gespräche, entschuldigt kleine Missgeschicke und holt freundlich Aufmerksamkeit. Kaum ein Wort ist vielseitiger.",
    usageRoleGerman:
      "すみません sagst du, bevor du jemanden ansprichst – oder um dich zu entschuldigen.",
    memoryHookGerman: "すみません、 + Frage = die höfliche Eröffnung.",
  },
  right: {
    collectionNumber: 13,
    dexDescriptionGerman:
      "Zeigt zuverlässig in eine Richtung und wird bei Wegbeschreibungen ständig gesichtet. Reist fast immer gemeinsam mit 左.",
    usageRoleGerman:
      "右 brauchst du, um Richtungen zu verstehen und selbst anzugeben.",
    memoryHookGerman: "右です = Es ist rechts. Kurz und vollständig.",
  },
  left: {
    collectionNumber: 14,
    dexDescriptionGerman:
      "Der Zwilling von 右 – nur mit anderer Blickrichtung. Wer beide zusammen lernt, verwechselt sie deutlich seltener.",
    usageRoleGerman: "左 brauchst du für Richtungen – beim Antworten und beim Zuhören.",
    memoryHookGerman: "左です = Es ist links. Immer als Paar mit 右 üben.",
  },
  near: {
    collectionNumber: 15,
    dexDescriptionGerman:
      "Ein freundliches Adjektiv, das kurze Wege verspricht. Sein Gegenspieler 遠い ist übrigens nie weit entfernt.",
    usageRoleGerman:
      "近い beschreibt, dass etwas nah ist – praktisch bei Wegen und Zielen.",
    memoryHookGerman: "駅は近いです = Der Bahnhof ist nah.",
  },
  far: {
    collectionNumber: 16,
    dexDescriptionGerman:
      "Klingt nach langen Wegen und müden Füßen. Taucht diese Karte auf, lohnt sich vielleicht doch der Zug.",
    usageRoleGerman: "遠い beschreibt, dass etwas weit entfernt ist.",
    memoryHookGerman: "ホテルは遠いです – das Gegenteil von 近いです.",
  },

  // --- Schule (#017–#021) ---
  school: {
    collectionNumber: 17,
    dexDescriptionGerman:
      "Ein Ort voller Tafeln, Hefte und neuer Wörter. Besonders gut befreundet mit den Partikeln に und で.",
    usageRoleGerman: "学校 benutzt du, wenn du über Schule und Lernen sprichst.",
    memoryHookGerman: "学校に行きます (wohin) – 学校で勉強します (wo).",
  },
  teacher: {
    collectionNumber: 18,
    dexDescriptionGerman:
      "Ein respektvoller Titel, der Wissen weitergibt. Auch Ärztinnen und Ärzte hören in Japan auf diese Anrede.",
    usageRoleGerman:
      "先生 ist die Anrede für Lehrkräfte – und ein Wort, das du nie für dich selbst benutzt.",
    memoryHookGerman: "先生に聞きます = Ich frage die Lehrkraft.",
  },
  japaneseLanguage: {
    collectionNumber: 19,
    dexDescriptionGerman:
      "Die Sprache selbst, festgehalten als Eintrag. Das 語 am Ende verrät: Hier geht es ums Sprechen, nicht ums Land.",
    usageRoleGerman:
      "日本語 benutzt du, wenn du über die japanische Sprache sprichst.",
    memoryHookGerman: "日本 = Japan, 日本語 = Japanisch. 語 steht für Sprache.",
  },
  study: {
    collectionNumber: 20,
    dexDescriptionGerman:
      "Ein fleißiges Verb, das dich durch den ganzen Zukan begleitet. Es arbeitet am liebsten mit を zusammen.",
    usageRoleGerman: "勉強する beschreibt, dass du etwas lernst oder studierst.",
    memoryHookGerman: "日本語を勉強します = Ich lerne Japanisch.",
  },
  today: {
    collectionNumber: 21,
    dexDescriptionGerman:
      "Erscheint jeden Morgen frisch und stellt sich am liebsten an den Satzanfang. Kleiner Auftritt, großer Stolperstein.",
    usageRoleGerman: "今日 benutzt du, um über den heutigen Tag zu sprechen.",
    memoryHookGerman: "Das は nach 今日 sprichst du „wa“ aus: 今日は…",
  },

  // --- Freunde (#022–#026) ---
  friend: {
    collectionNumber: 22,
    dexDescriptionGerman:
      "Selbst weder locker noch höflich – der Ton kommt vom Satzende. Eine verlässliche Begleitung für viele weitere Wörter.",
    usageRoleGerman:
      "友だち benutzt du, wenn du über Freundinnen und Freunde sprichst.",
    memoryHookGerman: "友だちに会う (locker) – 友だちに会います (höflich).",
  },
  meet: {
    collectionNumber: 23,
    dexDescriptionGerman:
      "Wird immer dann aktiv, wenn zwei Menschen denselben Ort ansteuern. Personen merkt es sich mit der Partikel に.",
    usageRoleGerman: "会う beschreibt, dass du jemanden triffst.",
    memoryHookGerman: "Person + に + 会う: 友だちに会います.",
  },
  talk: {
    collectionNumber: 24,
    dexDescriptionGerman:
      "Ein geselliges Verb, das ungern allein bleibt. Mit と holt es sich immer jemanden zum Reden dazu.",
    usageRoleGerman: "話す beschreibt, dass du mit jemandem sprichst.",
    memoryHookGerman: "Person + と + 話す: 友だちと話します.",
  },
  tomorrow: {
    collectionNumber: 25,
    dexDescriptionGerman:
      "Immer einen Tag voraus und trotzdem nie zu früh dran. Für seine Pläne braucht es keine eigene Zukunftsform.",
    usageRoleGerman: "明日 benutzt du für Pläne und alles, was morgen passiert.",
    memoryHookGerman: "明日、友だちに会います – gleiche Verbform wie heute.",
  },
  like: {
    collectionNumber: 26,
    dexDescriptionGerman:
      "Der herzlichste Eintrag der Sammlung. Was ihm gefällt, markiert es treu mit der Partikel が.",
    usageRoleGerman: "好き benutzt du, um zu sagen, was du magst.",
    memoryHookGerman: "〜が好き(です) – mit が, nicht mit を.",
  },
};

// ---------------------------------------------------------------------------
// Hierarchy: Area → Chapter. Chapters are the single source of truth for which
// entries belong where and in what order.
// ---------------------------------------------------------------------------

export const vocabularyCollectionAreas: VocabularyCollectionArea[] = [
  {
    id: "area1",
    order: 1,
    titleGerman: "Erste Schritte in Japan",
    subtitleGerman: "Deine ersten Wörter für Café, Reise, Schule und Freunde.",
  },
];

export const vocabularyCollectionChapters: VocabularyCollectionChapter[] = [
  {
    id: "area1-cafe-01",
    areaId: "area1",
    categoryId: "cafe",
    order: 1,
    titleGerman: "Erste Bestellung",
    subtitleGerman: "Getränke, ein Snack und die sichere Bestellform.",
    entryIds: ["coffee", "water", "bread", "drink", "eat"],
  },
  {
    id: "area1-reise-01",
    areaId: "area1",
    categoryId: "reise",
    order: 1,
    titleGerman: "Orientierung unterwegs",
    subtitleGerman: "Orte, Verkehrsmittel und nach dem Weg fragen.",
    entryIds: [
      "station",
      "hotel",
      "train",
      "toilet",
      "go",
      "where",
      "excuseMe",
      "right",
      "left",
      "near",
      "far",
    ],
  },
  {
    id: "area1-schule-01",
    areaId: "area1",
    categoryId: "schule",
    order: 1,
    titleGerman: "Lernen und Sprache",
    subtitleGerman: "Schule, Lehrkraft und über das Lernen sprechen.",
    entryIds: ["school", "teacher", "japaneseLanguage", "study", "today"],
  },
  {
    id: "area1-freunde-01",
    areaId: "area1",
    categoryId: "freunde",
    order: 1,
    titleGerman: "Erste Gespräche",
    subtitleGerman: "Freunde treffen, sprechen und Pläne machen.",
    entryIds: ["friend", "meet", "talk", "tomorrow", "like"],
  },
];

/** entry id → its hierarchy position, derived once from the chapters above. */
const ENTRY_HIERARCHY: Record<
  string,
  { areaId: CollectionAreaId; chapterId: string; entryOrder: number }
> = (() => {
  const map: Record<
    string,
    { areaId: CollectionAreaId; chapterId: string; entryOrder: number }
  > = {};
  for (const chapter of vocabularyCollectionChapters) {
    chapter.entryIds.forEach((entryId, index) => {
      map[entryId] = {
        areaId: chapter.areaId,
        chapterId: chapter.id,
        entryOrder: index + 1,
      };
    });
  }
  return map;
})();

/**
 * The full entries, content + hierarchy merged. Built at module load; throws loudly if
 * a word has no chapter (a data-consistency bug that must never ship), so downstream
 * code can rely on every entry having complete hierarchy fields.
 */
export const vocabularyCollectionEntries: Record<
  VocabCollectionId,
  VocabularyCollectionEntry
> = (() => {
  const result = {} as Record<VocabCollectionId, VocabularyCollectionEntry>;
  for (const [id, content] of Object.entries(vocabularyCollectionContent) as [
    VocabCollectionId,
    VocabularyCollectionEntryContent,
  ][]) {
    const hierarchy = ENTRY_HIERARCHY[id];
    if (!hierarchy) {
      throw new Error(
        `vocabularyCollectionData: entry "${id}" is not assigned to any chapter`
      );
    }
    result[id] = { ...content, ...hierarchy };
  }
  return result;
})();

export const vocabularyCategoryCollection: VocabularyCategoryCollectionData[] = [
  {
    categoryId: "cafe",
    titleGerman: "Café",
    subtitleGerman: "Wörter für Bestellungen, Getränke und kleine Pausen.",
    flavorGerman: "Alle Café-Wörter entdeckt – Bestellen kann kommen!",
    iconKey: "cup",
  },
  {
    categoryId: "reise",
    titleGerman: "Reise",
    subtitleGerman: "Wörter, die dir unterwegs den Weg zeigen.",
    flavorGerman: "Alle Reise-Wörter entdeckt – du findest deinen Weg!",
    iconKey: "torii",
  },
  {
    categoryId: "schule",
    titleGerman: "Schule",
    subtitleGerman: "Wörter rund um Lernen, Unterricht und Sprache.",
    flavorGerman: "Alle Schul-Wörter entdeckt – Streberstufe erreicht!",
    iconKey: "book",
  },
  {
    categoryId: "freunde",
    titleGerman: "Freunde",
    subtitleGerman: "Wörter für Gespräche, Pläne und gemeinsame Zeit.",
    flavorGerman: "Alle Freunde-Wörter entdeckt – Gesprächsstoff gesichert!",
    iconKey: "chat",
  },
];

/** Safe lookup — returns undefined for ids without Zukan metadata (should not happen;
 *  the automated validation asserts exact coverage of vocabData). */
export function getCollectionEntry(
  vocabId: string
): VocabularyCollectionEntry | undefined {
  return (
    vocabularyCollectionEntries as Record<string, VocabularyCollectionEntry>
  )[vocabId];
}

export function getCategoryCollectionData(
  categoryId: CategoryId
): VocabularyCategoryCollectionData | undefined {
  return vocabularyCategoryCollection.find(
    (entry) => entry.categoryId === categoryId
  );
}

/** "#001"-style Zukan number. */
export function formatCollectionNumber(collectionNumber: number): string {
  return `#${String(collectionNumber).padStart(3, "0")}`;
}

// ---------------------------------------------------------------------------
// Hierarchy queries + progress (pure). Progress-dependent functions take an
// `isDiscovered` predicate so they never read localStorage or hidden text
// fields themselves — the page derives discovery from `getCardStatus` (which
// reads only id/categoryId) and passes it in.
// ---------------------------------------------------------------------------

/** Category display/sort order. Café → Reise → Schule → Freunde. */
export const COLLECTION_CATEGORY_ORDER: CategoryId[] = [
  "cafe",
  "reise",
  "schule",
  "freunde",
];

function areaOrderOf(areaId: CollectionAreaId): number {
  return vocabularyCollectionAreas.find((area) => area.id === areaId)?.order ?? 999;
}

function categoryOrderOf(categoryId: CategoryId): number {
  const index = COLLECTION_CATEGORY_ORDER.indexOf(categoryId);
  return index === -1 ? 999 : index;
}

export function getChapterById(
  chapterId: string
): VocabularyCollectionChapter | undefined {
  return vocabularyCollectionChapters.find((chapter) => chapter.id === chapterId);
}

/** The vocab ids of a chapter, in intended learning order (empty for unknown ids). */
export function getEntriesForChapter(chapterId: string): string[] {
  return getChapterById(chapterId)?.entryIds ?? [];
}

/** Chapters of one category, sorted by their `order`. */
export function getChaptersForCategory(
  categoryId: CategoryId
): VocabularyCollectionChapter[] {
  return vocabularyCollectionChapters
    .filter((chapter) => chapter.categoryId === categoryId)
    .sort((a, b) => a.order - b.order);
}

/** Chapters of one area, sorted by category order then chapter order. */
export function getChaptersForArea(
  areaId: CollectionAreaId
): VocabularyCollectionChapter[] {
  return vocabularyCollectionChapters
    .filter((chapter) => chapter.areaId === areaId)
    .sort(
      (a, b) =>
        categoryOrderOf(a.categoryId) - categoryOrderOf(b.categoryId) ||
        a.order - b.order
    );
}

/**
 * Sorts vocab ids into display order: area.order → category order → chapter.order →
 * entryOrder. Ids without collection metadata are pushed to the end (stable), so this
 * never throws on unexpected input. Pure — returns a new array.
 */
export function sortCollectionEntries(entryIds: readonly string[]): string[] {
  const rank = (id: string): [number, number, number, number, number] => {
    const entry = getCollectionEntry(id);
    if (!entry) return [999, 999, 999, 999, 999];
    const chapter = getChapterById(entry.chapterId);
    return [
      areaOrderOf(entry.areaId),
      chapter ? categoryOrderOf(chapter.categoryId) : 999,
      chapter ? chapter.order : 999,
      entry.entryOrder,
      entry.collectionNumber,
    ];
  };
  return [...entryIds].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    for (let i = 0; i < ra.length; i += 1) {
      if (ra[i] !== rb[i]) return ra[i] - rb[i];
    }
    return 0;
  });
}

/** Discovery progress of one chapter, using the caller's discovery predicate. */
export function getChapterProgress(
  chapter: VocabularyCollectionChapter,
  isDiscovered: (vocabId: string) => boolean
): ChapterProgressView {
  const total = chapter.entryIds.length;
  const discovered = chapter.entryIds.filter((id) => isDiscovered(id)).length;
  return {
    chapterId: chapter.id,
    categoryId: chapter.categoryId,
    titleGerman: chapter.titleGerman,
    discovered,
    total,
    remaining: total - discovered,
    // A chapter with entries is completed once every one of them is discovered.
    isCompleted: total > 0 && discovered === total,
  };
}

/** Discovered word count of a category (across all its currently-available chapters). */
export function getCategoryDiscoveredCount(
  categoryId: CategoryId,
  isDiscovered: (vocabId: string) => boolean
): number {
  return getChaptersForCategory(categoryId).reduce(
    (sum, chapter) =>
      sum + chapter.entryIds.filter((id) => isDiscovered(id)).length,
    0
  );
}

/**
 * Collection view of a category. Note there is no category-level "isCompleted": a
 * category is never permanently complete, callers compare completedChapters against
 * availableChapters (which only counts chapters that exist today).
 */
export function buildCategoryCollectionView(
  categoryId: CategoryId,
  isDiscovered: (vocabId: string) => boolean
): CategoryCollectionView {
  const chapters = getChaptersForCategory(categoryId).map((chapter) =>
    getChapterProgress(chapter, isDiscovered)
  );
  return {
    categoryId,
    discoveredWords: chapters.reduce((sum, c) => sum + c.discovered, 0),
    totalWords: chapters.reduce((sum, c) => sum + c.total, 0),
    availableChapters: chapters.length,
    completedChapters: chapters.filter((c) => c.isCompleted).length,
    chapters,
  };
}

/** Aggregate discovery progress of a whole area over its currently-available chapters. */
export function getAreaProgress(
  areaId: CollectionAreaId,
  isDiscovered: (vocabId: string) => boolean
): AreaProgressView {
  const chapters = getChaptersForArea(areaId).map((chapter) =>
    getChapterProgress(chapter, isDiscovered)
  );
  const completedChapters = chapters.filter((c) => c.isCompleted).length;
  return {
    areaId,
    discoveredWords: chapters.reduce((sum, c) => sum + c.discovered, 0),
    totalWords: chapters.reduce((sum, c) => sum + c.total, 0),
    availableChapters: chapters.length,
    completedChapters,
    isCompleted: chapters.length > 0 && completedChapters === chapters.length,
  };
}
