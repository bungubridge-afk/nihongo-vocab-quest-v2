# Vocabulary Zukan QA Report

実施日: 2026-07-19 · 対象: `/vocabulary` の Kotoba-Zukan 刷新
環境: Next.js 16.2.10 / React 19.2.4 / dev server + 実ブラウザ(テキスト・DOM検証)

**Final verdict: PASS** — Auth/Supabase無変更、回帰なし、build/lintクリーン、自動検証50/50。

## Files created

- `src/types/vocabularyCollection.ts` — 図鑑メタデータ型 + ZukanStatus
- `src/lib/vocabularyCollectionData.ts` — 26語のエントリ(番号・図鑑説明・使用場面・記憶フック)+ 4カテゴリパネルデータ + helpers
- `src/lib/zukanStatus.ts` — status判定純関数(getCardStatus / isHiddenStatus / getZukanStatus)
- docs: VOCABULARY_ZUKAN_SPEC.md / VOCABULARY_ZUKAN_QA.md / VOCABULARY_ZUKAN_CONTENT_REVIEW.md

## Files changed

- `src/app/vocabulary/page.tsx` — 全面刷新(タイトル/総合収集率/カテゴリパネル/収集ルール/コンパクトカード/hiddenシルエット/詳細dialog)
- `src/app/globals.css` — zukan用スタイル追加(dialog・backdrop・シルエット・光沢・Komplettスタンプ・reduced motion)
- `src/components/ui/Button.tsx` — 任意`ariaPressed` prop追加(フィルターチップ用、追加のみ)

**変更なし**(git statusで確認): Auth/Supabase/proxy/Provider/progress repository/sync/storage facade/SQL/localStorageキー/XP/Level/Quest/questData/vocabData。

## Inventory(ベースライン)

全26語(Café 5 / Reise 11 / Schule 5 / Freunde 5)。usageExamplesあり10語(Schule+Freunde全語)、なし16語(Café+Reise)。全語 rarity="common" → 「Common」バッジは実ルールのない偽レアリティと判定し廃止(Phase 4)。テストブラウザのベースライン: collected 5(Café)、hidden 21、weak 0、known 0。

## Category / Total progress(実測)

- 総合: 「5 / 26 Wörter entdeckt」「19 % des Zukans vollständig」+ progressbar(role=progressbar, aria-valuenow)
- パネル: Café 5/5「Komplett」スタンプ、Reise 0/11「Noch 11 Wörter」、Schule 0/5、Freunde 0/5
- パネルクリック → aria-pressed=true + 既存カテゴリフィルターと同一state(チップ側もpressed=trueを実測)、再クリックで解除
- discovered = 非hidden(collected/known/weak)のみ、hiddenのみ未発見として計数(自動検証済み)。新しい保存値なし。

## Status mapping

weak→Im Training / known→Vertraut / collected→Entdeckt / locked+sammelbar→Unentdeckt。各状態 = テキスト+SVGアイコン+色+aria-label(説明文入り)。

**発見・修正した表示バグ**: 旧`getCardStatus`はcollectedをknownより先に判定しており、known⊆collected(practiceはcollected前提)のため「Gelernt」が実質到達不能だった。knownを先に判定する順へ修正(進捗データ・practice・privacy判定は不変)。これによりルール3「Im Training → Vertraut」の遷移が実コードと一致。

## Hidden cards

「#???」+ Unentdecktバッジ + 破線フレームの「?」シルエット + 「Schließe Quests ab, um diese Karte zu entdecken.」+ カテゴリ名のみ。DOM検査で kanji/kana/romaji/German/例文/図鑑説明の漏れゼロを実測(21枚)。カテゴリ表示は旧実装でも表示されていた情報で、新規リークなし。

## Search privacy(実測+自動検証)

- hidden語の検索(「eki」)→ 0件、DOM内に駅/えき出現なし。収集済み語(「kaffee」)→ 1件。
- getter計測(Proxy): hidden語のkanji/kana/romaji/germanはindex構築・status判定で一度も読まれない(0タッチ)。
- 図鑑説明はhaystackに不含(自動検証)。`getCardStatus`は型シグネチャ上 `{id, categoryId}` のみ受け取り、text fieldを読めない。
- Sprachstilフィルター: Locker→hidden Schule/Freunde 10枚がシルエットで表示・内容漏れなし(registerタグのみ参照する既存挙動を維持)。

## Compact cards / Detail dialog(実測)

- 一覧カード: 図鑑番号・状態・語・カテゴリ・Locker&Höflich対応・発音(44×44)・「Eintrag öffnen」(44px)。例文一覧/Muster/Verwandt/detailTip/比較全文は一覧から除去し詳細へ移動。nested buttonなし。
- dialog: showModal(`:modal`=true)、aria-labelledby/describedby、タイトル「Zukan-Eintrag #001」、セクション(Zukan-Notiz/Beispiel/So setzt du es ein/Merke/Mehr wissen)、Karte üben、背景スクロールロック(body overflow hidden→復元)、**Escで閉じ→focusが「Eintrag öffnen」へ復帰**を実測。backdropクリック閉じ実装。reduced motionでアニメーション無効。showModal非対応時はopen属性+Escリスナーfallback。
- 320pxでdialogはviewport内(276×655)、内部のみスクロール、ページ横スクロールなし。

## Register / Pronunciation / Practice

- Schule/Freunde: dialog内にUsageExampleComparison(Locker & Höflich)表示。一覧は小さな対応バッジのみ。Café/Reise: 比較UIを一切表示しない(存在しないボタンなし)。
- 発音: 一覧+dialogの両方に44×44ボタン、`speakJapanese`既存実装のまま。
- Karte üben: dialog内から`/practice?word=<id>`へ(practice動作を実測確認)。

## Mobile widths(実測、横スクロールなし)

| 幅 | カード列 | 結果 |
|---|---|---|
| 320 | 1列(安全優先) | ✓ 44px確保、dialog収まり |
| 360 / 375 / 390 / 430 | 2列 | ✓ |
| 768 | 3列 | ✓ |
| 1280 | 4列(パネルも4列) | ✓ |

## Accessibility

lang=de維持、パネル/チップにaria-pressed(実測)、進捗はテキスト+role=progressbar、状態バッジaria-label、装飾SVG全てaria-hidden、focus-visibleグローバル維持、Esc/フォーカス復帰実測、hidden情報をariaへ出さない、見出しh1→h2→h3。

## Regression(実測)

Home(マップ・XP表示)/Lesson(Reise出題+フィードバック)/Practice(coffee出題)/Review/Header(Anmelden表示、Supabase設定済み状態)すべて正常。コンソールエラー0・hydrationエラー0。Auth/Supabase Providerコードは無変更(git status証跡)。

## Automated validation

一時スクリプト(実行後削除)で**50/50 PASS**: 番号1〜26一意・vocabData順、ID欠落/余剰なし、カテゴリ4件・件数5/11/5/5、German空なし、英語トークンなし、説明全ユニーク+冒頭重複なし、Café 5語の確定コピー完全一致、usageExamples 10/16分布、status mapping全ケース、discovered計数規則、hidden getter非アクセス、図鑑説明の検索index不含、React key(id)一意。

## Build / Lint

`npm.cmd run build` 成功(0エラー、全14ルート+Proxy、.env.local設定済み状態)。`npm.cmd run lint` 0エラー・0警告。

## Remaining issues

1. スクリーンショットによる視覚確認は検証環境のブラウザペイン制約(screenshotタイムアウト)によりDOM/テキスト検証で代替。実機での見た目の最終確認を推奨。
2. Sprachstilフィルターがhidden語のregister保有有無を(シルエットの表示/非表示として)従来どおり間接的に示す — 既存仕様の維持であり新規リークではない。
3. 「Vertraut」「Im Training」は今後practiceを行うと初めて出現する(現テストデータではEntdecktのみ実測、状態遷移自体は自動検証でカバー)。
