# Vocabulary Japan Notes QA

実施日: 2026-07-19 · 対象: 26語のJapan-Notiz追加+既存説明の事実性監査
環境: Next.js 16.2.10 / dev server + 実ブラウザ(DOM検証)

**Final verdict: PASS** — 26件完成(High-risk 0件)、hidden privacy維持、build/lint 0/0、回帰なし、Auth/Supabase影響ゼロ。

## Files created

- `src/types/vocabularyCulture.ts` — CultureNoteType / VocabularyCultureNote
- `src/lib/vocabularyCultureData.ts` — 26件のJapan-Notiz(`Record<VocabCollectionId, …>`で型レベル網羅強制)+ getCultureNote + 型ラベル
- docs: VOCABULARY_JAPAN_NOTES_SPEC.md / VOCABULARY_JAPAN_NOTES_REVIEW.md / VOCABULARY_JAPAN_NOTES_QA.md

## Files changed

- `src/app/vocabulary/page.tsx` — dialogへJAPAN-NOTIZセクション(提灯inline SVG、teal-softボックス、Zukan-Notiz直後)追加。文化データの読み込みはdialog内の`getCultureNote()`1箇所のみ
- `src/lib/vocabData.ts` — **bread(パン)の事実修正のみ**: 旧shortTip「klingt fast wie das deutsche Wort」/detailTip「wird ähnlich wie im Deutschen ausgesprochen」はパン≠Brotの音で誤りのため削除し、正確なポルトガル語由来(pão)ベースの記述へ最小修正

Auth / Supabase / SQL / Progress / XP / Quest / Practice / localStorage / Entitlementは無変更。

## 26 Japan-Notiz概要

| 分類 | 件数 | 例 |
|---|---|---|
| language | 10 | 薬を飲む(drink)、主語省略(eat)、行く=gehen/fahren、どちら(where)、駅近(near)、こんにちは由来(today)、田中先生(teacher)、会う+に(meet)、明日の複数読み、好きの状態述語性(like) |
| daily-life | 6 | コンビニ/自販機コーヒー、飲食店の無料の水、公衆トイレ、すみません=感謝/呼びかけ、エスカレーター地域差(right)、4月始業(school) |
| writing | 5 | 駅名標3表記(station)、3文字種+日本語(japaneseLanguage)、勉強の字義(study)、友だち/友達(friend)、電話の構成字(talk) |
| travel | 4 | 旅館(hotel)、都市部の運行間隔(train)、左側通行(left)、徒歩◯分(far) |
| etymology | 1 | パン=ポルトガル語pão・16世紀伝来(bread) |

全文と事実リスク判定(Low 19 / Medium 7 / **High 0**)は [VOCABULARY_JAPAN_NOTES_REVIEW.md](VOCABULARY_JAPAN_NOTES_REVIEW.md)。

## 文化情報の監査

- 「日本人は必ず〜」形の断定 0件。範囲限定語(oft/viele/meist/häufig)を全Medium項目に使用
- 地域差(エスカレーターの立ち位置)は「Tokio meist links, Osaka oft rechts – ein bekannter regionaler Unterschied」と**地域差として明示**
- 語源はポルトガル語pão(定説)のみ。漢字の字義説明(勉強・電話)は語源断定ではなく構成字の事実
- casualを乱暴と説明しない/politeを唯一の正解にしない(where・既存register説明と整合)
- 新出語は各メモ最大1件+訳併記(薬・旅館・徒歩・駅近・どちら・電話)

## Hidden privacy(実測+自動検証)

- 文化データの読み込みは**発見済みカードのdialogのみ**(ページ内`getCultureNote()`呼び出し1箇所を静的検証)。hiddenカードはdialogを開けないため構造的に不可
- 一覧DOMに文化メモ語句(Rolltreppen/Linksverkehr/Ryokan等)の漏れなし(実測)
- 検索index不含: 全26メモの先頭24字がどのhaystackにも不在(自動検証)+実ブラウザで「Rolltreppen」検索=0 Wortkarten
- getter計測: 一覧・検索・グループ化のデータパイプラインは文化レコードに一切アクセスせず(0タッチ)、dialog経由では開いたカードのキーのみアクセス

## 自動検証: 25/25 PASS(一時ファイル削除済み)

26件・ID重複/欠落/余剰なし・vocabId整合・型有効・空文字なし・320字以内・1〜3文・英語トークンなし・本文/冒頭重複なし・断定語句なし・検索index不含・hidden非アクセス・bread修正の反映(誤り文言消滅+ポルトガル語由来維持)。

## Mobile / Accessibility(実測)

- 320px: dialogはviewport内(内部のみスクロール)、Japan-Notiz折返し正常(scrollWidthはみ出しなし)、ページ横スクロールなし。768pxも確認。他幅はdialog構造不変(前回全幅検証済み)のため代表幅で確認
- セクション順: Zukan-Notiz → Japan-Notiz · Alltag → Beispiel → So setzt du es ein → Merke → Mehr wissen(実測)。dialogが1セクション長くなったが内部スクロールで問題なし
- 提灯SVGはaria-hidden、意味は可視テキスト「JAPAN-NOTIZ · Alltag」等が担持。h3見出しで階層維持、Esc/close/focus復帰は既存機構のまま

## Build / Lint / Regression

- `npm.cmd run build` 0エラー / `npm.cmd run lint` 0エラー・0警告(.env.local設定済み)
- 回帰(実測): Home(Zukan入口・マップ)、grouped Zukan、検索(eki=0件・DOM漏れなし)、Practice(coffee出題)、コンソール/hydrationエラー0

## Remaining issues

1. Medium判定7件は日常慣行の記述であり将来の変化があり得る — 年1回程度の内容見直しを推奨
2. REVIEW表の言語監査はモデルによるドイツ語校閲。ネイティブ話者による最終校閲を出版前に推奨
