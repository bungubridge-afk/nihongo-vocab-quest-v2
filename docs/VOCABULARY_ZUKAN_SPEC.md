# Vocabulary Zukan Spec

Stand: 2026-07-19 · 対象: `/vocabulary`(Kotoba-Zukan)

## Concept

Vocabularyページは単なるカード一覧ではなく、「Questで発見した日本語を収集・閲覧・練習するゲーム的な日本語図鑑」= **Dein Kotoba-Zukan**。発見→収集→登録→カテゴリ制覇→コンプリートという図鑑体験を、既存の学習データ・進捗仕様を一切変えずに表示レイヤーだけで実現する。既存作品(ポケモン等)の名称・画像・デザインは使用しない。

「Kotoba-Zukan」は初心者に不明なため、タイトル直下に必ずドイツ語説明を併記する:
- Untertitel: „Dein Sammellexikon für japanische Wörter."
- Begriffserklärung: „‚Kotoba' (言葉) heißt Wort · ‚Zukan' (図鑑) heißt Sammellexikon."

## User goal

10秒以内に「ここは集めた単語の図鑑で、Questで増え、練習で状態が育つ」と理解でき、未発見のシルエットが次のQuestへの動機になる。

## Collection rules(表示コピー、実コードと一致)

折りたたみ「Wie funktioniert die Sammlung?」内:

1. **Quest abschließen** — Neue Wörter werden nach einer Etappe entdeckt.(`recordCategoryCompletion`がcollectedCardIdsへ追加)
2. **Karte sammeln** — Entdeckte Wörter erscheinen vollständig in deinem Zukan.
3. **Wort trainieren** — Durch Übung wird eine Karte von „Im Training“ zu „Vertraut“.(practice全問正解→knownWords、ミスあり→weakWords)
4. **Kapitel abschließen** — Entdecke alle Wörter eines Kapitels.

ルール直下に注記(章追加の予告): „Zu jeder Kategorie kommen später neue Kapitel dazu. ‚Kapitel abgeschlossen' bedeutet also nicht, dass eine Kategorie für immer vollständig ist."

## Statuses

| ZukanStatus | 元のCardStatus | 表示 | 説明コピー |
|---|---|---|---|
| unentdeckt | locked / sammelbar | Unentdeckt(?アイコン, グレー) | Noch nicht in einer Quest gesammelt. |
| entdeckt | gesammelt | Entdeckt(カード+チェック, 青) | Gesammelt, aber noch nicht als sicher gelernt markiert. |
| training | ueben | Im Training(循環矢印, ゴールド) | Dieses Wort solltest du noch einmal üben. |
| vertraut | gelernt | Vertraut(星, グリーン) | Dieses Wort hast du in der Übung sicher beantwortet. |

- 判定は `src/lib/zukanStatus.ts` の純関数。優先順: weak → known → collected → sammelbar → locked。
  - **注**: 旧実装はcollectedをknownより先に判定していたため「Gelernt」が実質到達不能だった(known⊆collected)。本改修でknownを先に判定し「Vertraut」を到達可能にした(進捗データ・practice判定は不変、表示のみ)。
- すべての状態バッジ = テキスト+アイコン+色+aria-label。色だけで区別しない。

## Page header (Area progress)

ページ上部の総合表示はエリアスコープ: 「AREA 1 · ERSTE SCHRITTE IN JAPAN」kicker+「X / Y Einträge in Area 1 entdeckt」+ progressbar +「Deine Sammlung wächst mit jeder Etappe.」。**「Y % des Zukans vollständig」のような全図鑑パーセント表現は禁止**(コレクションは将来も増えるため)。数値は `getAreaProgress` による現在公開分のみ。

## Categories

4パネル(Café/Reise/Schule/Freunde)。各パネルの内容:

- 独自inline SVGアイコン(cup/torii/book/chat)+カテゴリ名
- 「N Wörter entdeckt」(**分母なし** — カテゴリの最終語数は未確定)
- 現在章: 「Kapitel 1 von 1: Erste Bestellung」(現在章=最初の未完了章、全完了なら最終章)
- **章の**progress bar(カテゴリ全体バーは将来総数未確定のため廃止)
- 「x / y entdeckt」+ 章完了時のみ「Kapitel abgeschlossen」スタンプ
- 常時フッター「Weitere Kapitel folgen.」

「Café komplett」等のカテゴリ単位完成表示は**全廃**。パネルはaria-pressed付きトグルボタンで、既存カテゴリフィルターと同一のstateを操作する。

## Grouped display

検索なしの一覧はArea 1 → Kategorie → Kapitel → Eintragの章セクションで表示(Café→Reise→Schule→Freunde順)。各セクション見出し: 「CAFÉ · KAPITEL 1」kicker / 章タイトル(h2+aria-labelledby) / 章説明 / 「x / y entdeckt」+「Kapitel abgeschlossen」。セクション内はentryOrder順。検索中はフラットな結果リストへ簡略化(hidden privacy維持)。Sprachstilフィルター中はグループ維持・0件章は非表示。

> **階層化(2026-07-19)**: カテゴリ完成判定(旧「Komplett」= カテゴリ永続完成)を廃止し、Area → Kategorie → Kapitel → Entry の章ベース完了判定へ移行した。カテゴリは同一カテゴリへの章追加で拡張可能なため、永続的な完成扱いをしない。詳細は [VOCABULARY_COLLECTION_ARCHITECTURE.md](VOCABULARY_COLLECTION_ARCHITECTURE.md)。表示順は `collectionNumber` ではなく area→category→chapter→entryOrder(`sortCollectionEntries`)で決定(Area 1 では結果は 1–26 と一致)。`collectionNumber` は安定した図鑑番号として表示のみに使用。

## Home entry point

Homeからの導線は単一の `ZukanEntryCard`(src/app/page.tsx): 青→teal独自グラデーション、書籍アイコン、「N Wörter entdeckt」(分母なし)、CTA「Zukan öffnen」。旧「Karten / Zur Sammlung」statピルと白い「Wortkarten-Sammlung」ボタンは削除済み(導線重複の解消)。詳細は [HOME_ZUKAN_INTEGRATION_QA.md](HOME_ZUKAN_INTEGRATION_QA.md)。

## Card overview(コンパクトカード)

収集済み: 図鑑番号(#001形式)/状態バッジ/kanji/kana·romaji/German/階層文脈「Café · Kapitel 1」(番号だけで順序を説明しない)/「Locker & Höflich」対応表示(usageExamplesあり時のみ)/発音ボタン(44×44)/「Eintrag öffnen」ボタン(44px)。一覧では例文一覧・Muster・Verwandt・detailTip・usageExamples全文を表示しない(詳細へ移動)。カード全体はbuttonにせず、nested button問題を回避。

未収集: 「#???」/Unentdecktバッジ/破線フレーム+「?」シルエット/「???」/「Schließe Quests ab, um diese Karte zu entdecken.」/カテゴリ名のみ。kanji・kana・romaji・German・例文・図鑑説明・Register・発音・Karte übenは一切出さない(DOMにも含めない)。

グリッド: 320px=1列(安全優先)、360〜639px=2列、768px=3列、1280px=4列。

## Detail entry(dialog)

native `<dialog>` + `showModal()`。見出し「Zukan-Eintrag #NNN」。内容順: 状態+カテゴリバッジ → 語(kanji/kana/romaji/German+発音) → **Zukan-Notiz**(dexDescriptionGerman) → **Beispiel**(既存example) → **So setzt du es ein**(usageRoleGerman) → **Merke**(memoryHookGerman, ゴールド枠) → shortTip → **Locker & Höflich**(UsageExampleComparison、ありの語のみ) → **Mehr wissen**(detailTip+Beispiele/Muster/Verwandt、折りたたみ) → **Karte üben**。

a11y: aria-labelledby/aria-describedby、Esc・閉じるボタン・backdropクリックで閉じる、背景スクロールロック、閉じたら開いたボタンへfocus復帰、reduced motionでアニメーション無効、showModal非対応環境はopen属性+documentのEscリスナーでfallback。外部ライブラリなし。

## Content tone(図鑑説明)

dexDescriptionGerman(1〜2文、単語の性格を図鑑調で)/usageRoleGerman(使う場面)/memoryHookGerman(助詞・型のヒント)。少し楽しく・正確・成人向け・母語話者向けドイツ語・嘘の語源や文化断定なし・英語混入なし・既存作品への言及なし。Café 5語は指定コピーを使用。

## Mobile

320/360/375/390/430/768/1280で横スクロールなし、操作要素44px以上、dialogはviewport内で内部のみスクロール、長いGermanはbreak-wordsで折り返し。

## Accessibility

lang=de維持、全ボタンにaccessible name、aria-pressed(フィルター/パネル)、progressbarはテキスト+aria値、装飾SVGはaria-hidden、focus-visible(グローバル)、キーボードのみで全操作可、hidden情報をariaに出さない、見出し階層 h1→h2(セクション)→h3(dialog内)。

## Privacy(hidden保護)

- `getCardStatus`は型シグネチャ上 `{id, categoryId}` しか受け取れない(text fieldを読めないことを型で保証)。
- 検索indexはhidden除外の述語つき構築(`buildVocabularySearchIndex`)— hiddenのkanji等はindex構築時に**読みすらしない**(getter計測で検証)。
- 図鑑メタデータ(dex説明等)は検索対象に**含めない**。
- 検索中はhiddenカードを結果に出さない。hiddenカードのDOMに秘匿情報を出さない。
- Sprachstilフィルターは従来どおりusageExamplesのregisterタグのみ参照(内容は非表示、既存仕様の維持)。

## Non-goals

偽レアリティ(旧Common/Rareバッジは全26語commonで実ルールなしのため廃止)、ガチャ/ランダム取得、効果音、外部アニメーションライブラリ、課金誘導、XP/Level/Quest解放/localStorageキー/Supabase・Auth系への変更。
