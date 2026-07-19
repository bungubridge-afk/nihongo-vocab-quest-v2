import type { CategoryId } from "@/types/learning";
import type {
  VocabularyCategoryCollectionData,
  VocabularyCollectionEntry,
} from "@/types/vocabularyCollection";

/**
 * Zukan (collection lexicon) display metadata for every word in the app.
 *
 * Rules this file lives by:
 * - Display only. Never read for XP, quiz building, unlocks or the search index —
 *   and never shown for a card the player has not discovered yet.
 * - `collectionNumber` is 1–26, unique, ordered by the existing category order
 *   (Café → Reise → Schule → Freunde) and the data order inside `vocabData`.
 * - Texts are German, meaning-accurate, and must not contradict the word's own
 *   examples/tips in `vocabData.ts`. Tone: a friendly field guide — light, never silly.
 */

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

export const vocabularyCollectionEntries: Record<
  VocabCollectionId,
  VocabularyCollectionEntry
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
