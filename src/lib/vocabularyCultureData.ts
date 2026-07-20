import type { VocabCollectionId } from "@/lib/vocabularyCollectionData";
import type {
  CultureNoteType,
  VocabularyCultureNote,
} from "@/types/vocabularyCulture";

/**
 * Japan-Notizen für alle 26 Zukan-Wörter (see src/types/vocabularyCulture.ts).
 *
 * Editorial rules:
 * - Accuracy over humor. Only stable facts: writing systems, established loanword
 *   origins, particle behavior, ubiquitous signage, well-documented daily-life
 *   patterns. Scope is always hedged („oft“, „viele“, „meist“, „häufig“) —
 *   never "alle Japaner …", never regional facts presented as nationwide.
 * - 1–3 short German sentences per note; no new grammar lessons, at most one new
 *   word/kanji with an inline translation.
 * - Display-only: rendered ONLY inside the detail dialog of a *discovered* card.
 *   Never part of the search index, quiz content or any aria/data attribute of
 *   hidden cards.
 *
 * Keyed by `VocabCollectionId`, so a missing or misspelled entry is a TypeScript
 * error — the automated validation additionally asserts exact coverage at runtime.
 */
export const vocabularyCultureNotes: Record<VocabCollectionId, VocabularyCultureNote> = {
  // --- Café ---
  coffee: {
    vocabId: "coffee",
    type: "daily-life",
    japanNoteGerman:
      "Kaffee bekommst du in Japan nicht nur im Café: Viele Convenience Stores haben frische Kaffeemaschinen, und an Getränkeautomaten gibt es Kaffee in Dosen – im Winter oft sogar warm.",
  },
  water: {
    vocabId: "water",
    type: "daily-life",
    japanNoteGerman:
      "In vielen Restaurants in Japan bekommst du kostenlos Wasser oder Tee serviert, häufig schon beim Hinsetzen. Extra bestellen musst du es dann gar nicht – aber 水をください funktioniert überall.",
  },
  bread: {
    vocabId: "bread",
    type: "etymology",
    japanNoteGerman:
      "パン kam im 16. Jahrhundert mit portugiesischen Händlern und Missionaren nach Japan – vom portugiesischen „pão“. Deshalb klingt es weder wie das englische „bread“ noch wie „Brot“.",
  },
  drink: {
    vocabId: "drink",
    type: "language",
    japanNoteGerman:
      "Anders als im Deutschen „nimmt“ man Medizin im Japanischen nicht – man „trinkt“ sie: 薬を飲む („Medizin trinken“) sagt man auch bei Tabletten. 飲む deckt also mehr ab als das deutsche „trinken“.",
  },
  eat: {
    vocabId: "eat",
    type: "language",
    japanNoteGerman:
      "Im Japanischen lässt man das Subjekt oft weg, wenn es aus dem Kontext klar ist: パンを食べます kann „ich esse“, „sie isst“ oder „wir essen“ bedeuten. Das Muster Essen + を + 食べる bleibt dabei immer gleich.",
  },

  // --- Reise ---
  station: {
    vocabId: "station",
    type: "writing",
    japanNoteGerman:
      "Auf japanischen Bahnhofsschildern steht der Stationsname meist gleich mehrfach: in Kanji, in Hiragana und in lateinischen Buchstaben. So kannst du Stationsnamen oft auch ohne Kanji-Kenntnisse lesen.",
  },
  hotel: {
    vocabId: "hotel",
    type: "travel",
    japanNoteGerman:
      "Neben dem ホテル gibt es in Japan das Ryokan (旅館): eine traditionelle Unterkunft mit Tatami-Böden und Futon-Betten. Auf Buchungsseiten begegnen dir häufig beide Wörter nebeneinander.",
  },
  train: {
    vocabId: "train",
    type: "travel",
    japanNoteGerman:
      "In Tokio und anderen Großstädten fahren die 電車 tagsüber in sehr kurzen Abständen. Ansagen und Anzeigen sind auf vielen Strecken zusätzlich auf Englisch – die Stationsmelodien bleiben trotzdem ein Erlebnis.",
  },
  toilet: {
    vocabId: "toilet",
    type: "daily-life",
    japanNoteGerman:
      "Öffentliche Toiletten sind in Japan häufig kostenlos und gut gepflegt – in Bahnhöfen, Kaufhäusern und Convenience Stores. Viele haben beheizte Sitze und ein Bedienfeld mit erstaunlich vielen Knöpfen.",
  },
  go: {
    vocabId: "go",
    type: "language",
    japanNoteGerman:
      "行く deckt mehr ab als das deutsche „gehen“: Es heißt auch „fahren“ oder „fliegen“. Wie du ans Ziel kommst, sagt erst das Verkehrsmittel mit で – das Verb selbst bleibt einfach 行く.",
  },
  where: {
    vocabId: "where",
    type: "language",
    japanNoteGerman:
      "In Geschäften und höflichen Durchsagen hörst du statt どこ manchmal die höflichere Form どちら. Verstehen reicht – für deine eigenen Fragen ist どこですか völlig in Ordnung.",
  },
  excuseMe: {
    vocabId: "excuseMe",
    type: "daily-life",
    japanNoteGerman:
      "すみません ist in Japan auch ein kleines Dankeschön: Wer jemanden bemüht hat, sagt oft すみません statt ありがとう. Und im Restaurant ruft man damit ganz normal das Personal – niemand empfindet das als unhöflich.",
  },
  right: {
    vocabId: "right",
    type: "daily-life",
    japanNoteGerman:
      "Auf Rolltreppen stehen die Menschen in Tokio meist links, in Osaka dagegen oft rechts – ein bekannter regionaler Unterschied. Wer 右 und 左 lesen kann, versteht auch die Hinweisschilder dazu.",
  },
  left: {
    vocabId: "left",
    type: "travel",
    japanNoteGerman:
      "In Japan herrscht Linksverkehr: Autos fahren links, und auch auf Gehwegen und Treppen hält man sich oft links. Beim ersten Blick über die Straße lohnt es sich, daran zu denken.",
  },
  near: {
    vocabId: "near",
    type: "language",
    japanNoteGerman:
      "In Wohnungsanzeigen taucht oft die Abkürzung 駅近 auf – „nah am Bahnhof“, aus 駅 und 近い zusammengesetzt. Nähe zur Station ist in Japan ein echtes Verkaufsargument.",
  },
  far: {
    vocabId: "far",
    type: "daily-life",
    japanNoteGerman:
      "Entfernungen werden in Japan gern in Gehminuten angegeben: 徒歩5分 („5 Minuten zu Fuß“) steht auf vielen Schildern und in Anzeigen. Ob etwas 遠い ist, misst man im Alltag eher in Minuten als in Kilometern.",
  },

  // --- Schule ---
  school: {
    vocabId: "school",
    type: "daily-life",
    japanNoteGerman:
      "Das japanische Schuljahr beginnt im April – vielerorts genau zur Kirschblütenzeit. Einschulungsfotos unter blühenden Bäumen gehören für viele Familien fest dazu.",
  },
  teacher: {
    vocabId: "teacher",
    type: "language",
    japanNoteGerman:
      "An Namen wird 先生 direkt angehängt: Aus Herrn Tanaka wird 田中先生. Ein zusätzliches „Herr“ oder „Frau“ braucht es dabei nicht – die Anrede steckt schon im Titel.",
  },
  japaneseLanguage: {
    vocabId: "japaneseLanguage",
    type: "writing",
    japanNoteGerman:
      "Japanisch mischt drei Schriften oft im selben Satz: Kanji, Hiragana und Katakana. 日本語 selbst besteht aus drei Kanji – und dein Zukan zeigt dir bei jedem Wort mehrere Schreibweisen nebeneinander.",
  },
  study: {
    vocabId: "study",
    type: "writing",
    japanNoteGerman:
      "勉強 schreibt sich mit den Kanji 勉 („sich anstrengen“) und 強 („stark“). Lernen ist im Japanischen also wörtlich eine kleine Kraftanstrengung – ein Bild, das viele Lernende sofort wiedererkennen.",
  },
  today: {
    vocabId: "today",
    type: "language",
    japanNoteGerman:
      "今日 hat zwei Lesungen: きょう („heute“) und こんにち. Die zweite steckt im bekannten Gruß こんにちは – in ihm verbirgt sich also wörtlich ein „dieser Tag“.",
  },

  // --- Freunde ---
  friend: {
    vocabId: "friend",
    type: "writing",
    japanNoteGerman:
      "友だち siehst du auch als 友達 geschrieben – gleiche Bedeutung, gleiche Aussprache, nur ist das zweite Zeichen einmal Hiragana und einmal Kanji. Lehrbücher für Anfänger nutzen oft die Mischform mit だち.",
  },
  meet: {
    vocabId: "meet",
    type: "language",
    japanNoteGerman:
      "Im Deutschen triffst du „jemanden“ – ein direktes Objekt. Im Japanischen begegnest du eher „zu jemandem“: 会う nimmt die Partikel に, nicht を. Dieser kleine Unterschied gehört zu den häufigsten Stolpersteinen.",
  },
  talk: {
    vocabId: "talk",
    type: "writing",
    japanNoteGerman:
      "Das Kanji 話 aus 話す steckt auch in 電話 („Telefon“) – wörtlich etwa „Elektro-Sprechen“. Und das 電 davor kennst du schon aus 電車.",
  },
  tomorrow: {
    vocabId: "tomorrow",
    type: "language",
    japanNoteGerman:
      "明日 kann あした oder あす gelesen werden – beides heißt „morgen“. あした ist im Gespräch üblich, あす hörst du eher in Nachrichten und offiziellen Durchsagen.",
  },
  like: {
    vocabId: "like",
    type: "language",
    japanNoteGerman:
      "Das deutsche „mögen“ ist ein Verb – 好き dagegen beschreibt einen Zustand, ungefähr „lieb/angenehm sein“. Genau deshalb steht das, was du magst, mit が und nicht mit を.",
  },
};

/** Safe lookup for the detail dialog. Only ever called for a discovered card —
 *  hidden cards never load or render culture data. */
export function getCultureNote(vocabId: string): VocabularyCultureNote | undefined {
  return (vocabularyCultureNotes as Record<string, VocabularyCultureNote>)[vocabId];
}

/** German section label per note type (shown as small kicker next to JAPAN-NOTIZ). */
export const CULTURE_NOTE_TYPE_LABEL: Record<CultureNoteType, string> = {
  "daily-life": "Alltag",
  language: "Sprache",
  writing: "Schrift",
  travel: "Unterwegs",
  etymology: "Wortherkunft",
};
