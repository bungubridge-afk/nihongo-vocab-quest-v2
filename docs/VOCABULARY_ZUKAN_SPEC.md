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
4. **Zukan vervollständigen** — Entdecke alle Wörter einer Kategorie.

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

## Categories

4パネル(Café/Reise/Schule/Freunde)。各: 独自inline SVGアイコン(cup/torii/book/chat)、`discovered/total`、ミニprogress bar、未完なら「Noch N Wörter」、完成時は「Komplett」スタンプ(回転ゴールド枠)。パネルはaria-pressed付きトグルボタンで、既存カテゴリフィルターと同一のstateを操作する。

## Card overview(コンパクトカード)

収集済み: 図鑑番号(#001形式)/状態バッジ/kanji/kana·romaji/German/カテゴリ名/「Locker & Höflich」対応表示(usageExamplesあり時のみ)/発音ボタン(44×44)/「Eintrag öffnen」ボタン(44px)。一覧では例文一覧・Muster・Verwandt・detailTip・usageExamples全文を表示しない(詳細へ移動)。カード全体はbuttonにせず、nested button問題を回避。

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
