# Localized Content QA

Stand: 2026-07-21 · 対象: 学習データの説明言語(英語)化と検索・非表示保護

## コンテンツ件数

| 対象 | 件数 | 状態 |
|---|---|---|
| 独語データ文字列(全体、distinct) | **587** | 全件 `contentTranslations.ts` に英語エントリあり(0 missing)✅ |
| 語彙(vocab)語義 `german` | 26語 | localizeContent 経由で表示 |
| vocab tips(shortTip / detailTip) | 26語×2 | 同上 |
| vocab 例文訳(exampleGerman) | 26語 | 同上 |
| usageExamples(Schule 5語: german / contextGerman / noteGerman) | 対象語のみ | 同上 |
| Quest / Sub Quest 設問(instruction / prompt / choices / answer / answerGerman / exampleGerman / shortTip / detailTip / speechGerman / label) | 5カテゴリ + 26語×10問 | `buildLessonQuestions`/`buildPracticeQuestions` が locale で localize |
| 図鑑エントリ(dexDescription / usageRole / memoryHook) | 26語×3 | localizeContent |
| 文化ノート(japanNoteGerman) | 26語 | localizeContent |
| カテゴリ/章/エリア/worldMap メタ(name / stageTitle / description / titleGerman / subtitleGerman / learningSummary / flavorText / area preview) | 全件 | localizeContent |

## 実ブラウザ確認済み(EN mode)

- Zukan: 語義 Coffee / Water / Bread / to drink / to eat、Japanese(コーヒー/水/…)保持、
  章タイトル(First order / Finding your way / …)、hidden card は「???」「Undiscovered」
  「Finish quests to discover this card.」のみ=**本文リークなし** ✅
- Lesson: 「Choose the correct meaning.」+ 日本語prompt保持 + 英語選択肢、
  Feedback「Correct!」「A coffee, please.」「"コーヒーをください" is your go-to sentence …」✅
- collectionNumber は #001–#005 で安定(並び替えキーに使っていない)✅

## Vocabulary search(locale対応)

実ブラウザ(EN mode)で計測:

| 検索語 | 結果 |
|---|---|
| `coffee`(英語語義) | **1 word card**、コーヒー表示 ✅ |
| `kaffee`(独語語義) | **0 word cards**、コーヒー非ヒット ✅ |

- 検索インデックスは現在locale の語義のみ対象(`buildVocabularySearchIndex` に
  `localizeGerman` を渡し、`localizeContent(vocab.german, locale)` を索引化)。
- English画面で German語義はヒットせず、German画面で English語義はヒットしない(相互排他)。
- locale変更時は `useMemo` の依存に `locale` を含めるためインデックスを安全に再構築。

## hidden privacy(非表示保護)維持

- `localizeGerman` は `shouldIndex`(=`!isHiddenStatus`)が **true を返した後にのみ**
  呼ばれる。未発見カードの語義は localize も索引化もされず、hidden text はどのlocaleでも
  インデックスへ入らない(従来の「hidden card のフィールドを一切読まない」不変条件を保持)。
- 文化ノート(japanNoteGerman)は詳細ダイアログ内=発見済みカードでのみ getCultureNote を
  呼び、検索インデックスにも aria/data属性にも含めない。
- static client data として bundle 内には存在しうるため「完全秘匿」とは表現せず、
  「ゲーム上の未発見情報として非表示」である。

## 維持した既存仕様

- collectionNumber、Vocabulary ID、Quest ID、カード順、Quest順、設問数、Tips、
  Register比較、Zukan情報、Japan-Notiz、例文、日本語(漢字/かな/ローマ字/例文/選択肢)は
  英語版・ドイツ語版で共通・無変更。
- ドイツ語表示は `localizeContent(text, "de")` が原文をそのまま返すため、移行前後で
  バイト単位同一。

## Remaining

- 図鑑26語の文章スタイル全面改稿は本パスでは行わず、既存German内容の意味を維持して
  Englishへ自然にlocalizeした(spec Phase 16の方針どおり)。駅・ホテル等の新図鑑文体の
  全面導入は後続工程。
