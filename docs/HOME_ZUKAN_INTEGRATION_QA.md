# Home Zukan Integration QA

実施日: 2026-07-19 · 対象: Home図鑑入口の統合 + Vocabularyの階層表示化
環境: Next.js 16.2.10 / dev server + 実ブラウザ(DOM・computed style検証)

**Final verdict: PASS** — 導線重複解消、KOMPLETT廃止、章グループ表示、回帰なし、build/lint 0/0。

## 変更ファイル

- `src/app/page.tsx` — 旧「Wortkarten-Sammlung」白ボタン+「Karten / Zur Sammlung」ピルを削除し、`ZukanEntryCard`(+`ZukanBookIcon`)へ統合
- `src/app/globals.css` — `.zukan-entry-card`(青→teal独自グラデーション+書籍ウォーターマーク装飾)
- `src/app/vocabulary/page.tsx` — Area 1見出し、章ベースCategoryPanel、章セクショングループ表示、カード番号文脈、収集ルール更新

Auth / Supabase / SQL / progress / localStorageキーは無変更(`git status`証跡)。

## Home: 旧UIと新Zukan入口

**Before**: 「Karten 5 / Zur Sammlung」stat ピル+白背景黒文字の汎用「Wortkarten-Sammlung」ボタン(導線が2重、見た目が安っぽい)。

**After**: 単一の `ZukanEntryCard`(`max-w-xl`):
- 独自inline SVG書籍アイコン(白/20丸背景)+右下に薄いウォーターマーク(opacity 0.14、静的)
- 「DEIN KOTOBA-ZUKAN」kicker+「5 Wörter entdeckt」(**総数の分母なし** — 将来増えるため)+「Neue japanische Wörter aus deinen Quests.」
- CTAチップ「Zukan öffnen」— カード全体が1つの`<button>`でnested buttonなし
- `linear-gradient(120deg, blue → #2a7fae → teal)` 独自グラデーション(computed styleで適用実測)。課金風の金色・点滅なし。静的でQuestマップより控えめ
- Level/XPピル・Wiederholung・Lernplan anpassenは維持

**実測**: 旧ボタン消滅・ピル消滅・重複ゼロ、tap-scale+グローバルfocus-visible+reduced motion(transition無効化は既存@mediaでカバー)。

## Vocabulary: Area progress表示

「X / 26 Wörter entdeckt + Y % des Zukans vollständig」→
**「AREA 1 · ERSTE SCHRITTE IN JAPAN / 5 / 26 Einträge in Area 1 entdeckt / [bar] / Deine Sammlung wächst mit jeder Etappe.」**
「全図鑑のY%完成」と誤解される表現を排除。数値は `getAreaProgress("area1", isDiscovered)` による**エリアスコープ**で、progressbarのaria-labelも「Area 1: X von Y」。

## カテゴリパネル(KOMPLETT廃止)

旧「5 / 5 entdeckt + Komplett/Kapitel geschafft」+カテゴリ全体バー → 新:

```
[icon] Café
5 Wörter entdeckt              ← 分母なし(カテゴリ最終数は未確定)
Kapitel 1 von 1: Erste Bestellung
[章のprogress bar]              ← カテゴリ全体バーは廃止
5 / 5 entdeckt  [KAPITEL ABGESCHLOSSEN]
Weitere Kapitel folgen.         ← 常時表示
```

現在章 = 最初の未完了章(全完了なら最終章)。「Café komplett」系の表現は全廃(innerText検索で0件を実測)。

## 章グループ表示

カテゴリフィルター=Alle かつ 検索なし: Café→Reise→Schule→Freunde の章セクション順に表示。各セクション見出し(左ボーダー付き): 「CAFÉ · KAPITEL 1」kicker / 章タイトル(h2, aria-labelledby) / 章説明 / 「x / y entdeckt」+「Kapitel abgeschlossen」スタンプ。セクション内カードはentryOrder順。

- **検索中**: フラットな簡略リスト(「kaffee」=1件、章見出し0を実測)
- **hidden privacy**: 「eki」=0件+DOM漏れなし(実測)
- **Sprachstil=Locker**: Schule/Freundeの2セクションのみ表示、0件章(Café/Reise)はスキップ(実測)

## カード番号文脈

カード下部が「Café」→「**Café · Kapitel 1**」(hidden含む、短形式)。章メンバーシップはセクション見出しで公開済みの構造情報のため新規リークなし。

## 収集ルール

Step 4を「Kapitel abschließen — Entdecke alle Wörter eines Kapitels.」へ変更し、注記追加:「Zu jeder Kategorie kommen später neue Kapitel dazu. „Kapitel abgeschlossen" bedeutet also nicht, dass eine Kategorie für immer vollständig ist.」初期状態は折りたたみのまま。

## Mobile widths(実測、横スクロールなし)

| 幅 | Home入口カード | パネル列 | カード列 |
|---|---|---|---|
| 320 | 158px・CTA下段全幅44px | 1 | 1 |
| 360 / 375 / 390 | 142px | 1 | 2 |
| 430 | ✓ | 2(テキストはみ出しなし) | 2 |
| 768 | 86px・CTA同行(単一行) | 2 | 3 |
| 1280 | 単一行 | 4 | 4 |

修正過程: 320pxで入口カードが239pxに縦積みになる問題を発見 → CTAチップを狭幅では専用行(`w-full` + flex-wrap)、sm以上で同一行に戻す構成へ修正(実測158pxに改善)。

## Accessibility

入口カード=単一button(44px+、focus-visibleグローバル、装飾SVGはaria-hidden)。章見出しh2+`aria-labelledby`セクション。progressbarはテキスト併記。KAPITEL ABGESCHLOSSENスタンプはテキスト+アイコン。

## Regression(実測)

Home(マップ・Level/XP・自動スクロールターゲット存在)、Lesson(Reise出題)、Vocabulary(dialog showModal/検索/フィルタ)、コンソールエラー0、hydrationエラー0。Auth/Supabase Provider無変更。

## Build / Lint

`npm.cmd run build` 0エラー(全14ルート+Proxy)/ `npm.cmd run lint` 0エラー・0警告(.env.local設定済み状態)。

## 備考

dev serverのTurbopackキャッシュが編集前のCSSチャンクを配信し新ルールが見えない事象があった(本番ビルドには含まれることを確認済み)。globals.cssへのHMRトリガーで解消 — コード起因ではない。
