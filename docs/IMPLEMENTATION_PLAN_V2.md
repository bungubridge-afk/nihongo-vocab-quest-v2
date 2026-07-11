# Nihongo Vocab Quest v2 — 実装計画書

本ドキュメントは [docs/APP_SPEC_V2.md](./APP_SPEC_V2.md) の仕様をもとに、v2実装を実際の作業として進めるための計画をまとめたものである。

**このドキュメント作成時点では、アプリ本体のコード（`src/app/page.tsx`、`src/lib` など）は一切変更していない。** 本ファイルは計画の整理のみを目的とする。

---

## 1. v2実装の基本方針

- v2は現行版（v1）の修正版ではなく、**まっさらな再構築**である。
- ただし [docs/APP_SPEC_V2.md](./APP_SPEC_V2.md) の仕様を正とする。実装中に仕様と食い違う判断が必要になった場合は、仕様書側を更新してからコードを書く。
- 既存v1コードを無批判にコピーしない。v1の実装は「参考にしてよい実装例」であり、そのまま移植する対象ではない。
- 必要な設計だけを引き継ぐ（`calculateLevelFromXp`のロジック、Café 5問の内容、フィードバック仕様、`readJSON`の堅牢性パターンなど、仕様書が明示的に「踏襲する」としている部分のみ）。
- Duolingo風の学習マップ構造（縦方向・ノードベース・現在地の強調）は参考にするが、色・キャラクター・ブランド表現は完全コピーしない。
- MVPではOpenAI APIは実装しない（KI-Coachはプレースホルダーのみ）。
- MVPでは外部UIライブラリ（コンポーネントキット、CSSフレームワークなど）を使わない。生CSS（`globals.css`）でデザインシステムを組む。
- 進捗管理は完全にlocalStorageベースで行う。DBやログインは実装しない。

---

## 2. 実装順序

### Phase 1: Foundation
1. 型定義（`src/types/learning.ts`）
2. `vocabData`（`src/lib/vocabData.ts`）
3. `questData`（`src/lib/questData.ts`）
4. `levelSystem`（`src/lib/levelSystem.ts`）
5. `storage`（`src/lib/storage.ts`）
6. `quizBuilder`（`src/lib/quizBuilder.ts`）

### Phase 2: UI Foundation
7. `globals.css` のデザインシステム
8. 共通UIコンポーネント設計
   - Button
   - Card
   - Badge
   - ProgressPill
   - QuestNode
   - FeedbackPanel

### Phase 3: Core Screens
9. Onboarding
10. Home / Quest Map
11. Lesson
12. Result
13. Word Collection
14. Word Practice
15. Review / Abschluss-Review

### Phase 4: QA
16. build確認
17. `localStorage.clear` 確認
18. Level 0 → Level 1確認
19. Café → Reise解放確認
20. Word Practice確認
21. かな漏洩確認

---

## 3. 各ファイルの役割と実装内容

### `src/types/learning.ts`
- 型定義一式
- `VocabItem`（`id`, `japanese`, `kana`, `romaji`, `german`, `exampleJapanese`, `exampleKana`, `exampleGerman`, `shortTip`, `detailTip`, `categoryId`, `unlockLevel` を含む）
- `QuizQuestion`（`QuestionType`ごとの共用フィールド + `phrase-choice`用の`answerKana`/`answerRomaji`/`answerGerman`）
- `QuestionType`（`meaning-choice` / `japanese-choice` / `fill-blank` / `phrase-choice` など、6章の5問構成に必要な種別を網羅）
- `QuestCategory`（`id`（内部IDとして`"boss"`を含む）, `displayName`（`"Abschluss-Review"`等）, `stageTitle`, `unlockLevel`（表示目安のみ）, `rewardXp`, `questions`, `bossQuestion`, `bossRewardXp`, `bossRewardText`, `collectedCards`, `requiresAllCategoriesDone`）
- `CardStatus`（`"locked" | "sammelbar" | "gesammelt" | "üben" | "gelernt"`。`"mastered"`はMVPでは含めない）
- `PlayerProgress`（`level`, `xp`, `collectedCards`, `completedCategories`, `unlockedCategories`, `currentCategory`, `knownWords`, `weakWords`）
- `OnboardingProfile`（5問の回答 + `createdAt`）

### `src/lib/vocabData.ts`
- 単語カードデータ（`VocabItem[]`）
- Caféの5語: `coffee`, `water`, `bread`, `drink`, `eat`
- Reise / Schule / Freunde 用の初期語彙（各カテゴリの`collectedCards`に対応する最小セットを用意。件数は仕様書9章の「0 / 29 Karten」に整合させる）
- 各項目に `exampleJapanese` / `exampleKana` / `exampleGerman` を必須で持たせる（Word Practiceの助詞・動詞穴埋め生成に使うため）
- `shortTip` / `detailTip` を全項目に用意する
- `categoryId` はQuest Mapのカテゴリに属さない語（例: `"starter"`）を許容する型にする（9章の`isOutsideQuestMap`判定のため）
- `unlockLevel` は表示目安として保持するが、Sammelbar判定には使わない

### `src/lib/questData.ts`
- クエストカテゴリ定義（`QUEST_CATEGORIES: QuestCategory[]`）
- Café / Erste Bestellung の5問（6章の内容をそのまま定数化。Q1〜Q4通常問題 + Q5 Abschluss-Challenge）
- Reise / Schule / Freunde / Abschluss-Review（`boss`）の枠を用意（Reise以降の設問内容はMVPでは最小構成でよいが、`rewardXp`・`collectedCards`・`unlockLevel`は5章の表と一致させる）
- `rewardXp`: cafe=50, reise=80, schule=100, freunde=110, boss=150
- `unlock`条件は`questData`自体には持たせず、`levelSystem`側の`completedCategories`ベースのロジックに委譲する（データとロジックを分離する）
- `collectedCards`: 各カテゴリ完了時に付与するカードIDのリスト

### `src/lib/levelSystem.ts`
- `calculateLevelFromXp(xp: number): number`（4章のコードをそのまま踏襲。`LEVEL_1_THRESHOLD = 50`, `XP_PER_LEVEL = 100`）
- `xpForNextLevel(currentXp: number): number`（次のレベル閾値までの残りXPを返す表示用ヘルパー）
- `getNextUnlock(completedCategories: CategoryId[]): CategoryId | null`（4章の解放ルール表をそのまま実装。`completedCategories`ベース、`unlockLevel`は参照しない）
- `completedCategories`ベースの解放ルール実装:
  - 初期: `["cafe"]`が解放済み
  - `cafe`完了 → `reise`解放
  - `reise`完了 → `schule`解放
  - `schule`完了 → `freunde`解放
  - `freunde`完了 → `boss`解放（Abschluss-Review。`requiresAllCategoriesDone`は「4カテゴリ全完了」と等価なのでこの実装で自然に満たされる）
- ここに`unlockLevel`を使った判定ロジックを**書かない**ことを明記するコメントは書かない（コードでロジックが分離されていれば自明なため、コメント不要）

### `src/lib/storage.ts`
- localStorage getter/setter一式（11章のキー: `nvq_profile`, `nvq_xp`, `nvq_collected_cards`, `nvq_completed_categories`, `nvq_unlocked_categories`, `nvq_known_words`, `nvq_weak_words`）
- 廃止するキー（`nvq_progress`, `nvq_streak`, `nvq_recent_reviews`, `nvq_level`, `nvq_boss_clears`）は一切実装しない
- 壊れたlocalStorageへの耐性: `readJSON`相当の関数で`JSON.parse`を`try/catch`し、失敗時はフォールバック値を返す
- 初期値: `xp: 0`, `collectedCards: []`, `completedCategories: []`, `unlockedCategories: ["cafe"]`, `knownWords: []`, `weakWords: []`
- `getLevel()`: `nvq_level`のようなキャッシュを持たず、`calculateLevelFromXp(getXP())`で都度算出
- `recordCategoryCompletion(categoryId, rewardXp, cardIds)`: カテゴリ初回クリア時にXP加算・カード追加・`completedCategories`追加・`unlockedCategories`への次カテゴリ追加を1つの関数にまとめる
- **二重付与防止**: `recordCategoryCompletion`の冒頭で`completedCategories`に対象IDが既に含まれるかを確認し、含まれていれば何もせず早期returnする（XP・カード・完了フラグのいずれも変化させない）

### `src/lib/quizBuilder.ts`
- lesson用問題生成: `questData`の固定問題をそのまま返す関数（Café等は固定データのため動的生成は不要）
- practice用問題生成: `buildWordPracticeQuiz(wordId: string): QuizQuestion[]`（10章の5問パターン: 意味→和訳, 和訳→意味, 助詞穴埋め, 動詞穴埋め, フレーズ選択。対象単語1つの`exampleJapanese`/`exampleKana`/`exampleGerman`だけから組み立て、他単語を問題文・選択肢に混入させない）
- 個別ビルダー: `buildMeaningChoiceQuestion` / `buildJapaneseChoiceQuestion` / `buildParticleChoiceQuestion` / `buildFillBlankQuestion`（単語1つを軸に問題を作る設計。Word Practiceから流用可能な形にする）
- フレーズ選択（`buildPhraseChoiceQuestion`相当）は対象単語の`exampleJapanese`から新規に組み立てる
- かな漏洩防止: `prompt` / `promptKana`が出題時に正解のかなを先出ししないようにする（フィードバック表示時にのみkana/romaji/germanを見せる）
- phrase-choiceはフレーズ情報（`answerKana`/`answerRomaji`/`answerGerman`）を優先し、単語単位の情報にフォールバックしない

### `src/app/page.tsx`
- Onboarding（初回訪問時のみ表示。プロフィール未保存 = `nvq_profile`が`null`の場合に分岐）
- Home / Quest Map（プロフィール保存済みの場合の通常表示）
- Onboarding完了はプロフィール保存のみを行い、XP・カード・Levelには一切影響しないことを実装で保証する

### `src/app/lesson/page.tsx`
- カテゴリ別レッスン（`questData`からカテゴリを取得し、通常問題→Abschluss-Challengeの順に出題）
- 正誤判定（選択肢クリック→即時判定）
- フィードバック（8章の全項目: Richtig/Leider falsch, Richtige Antwort, かな, romaji, ドイツ語訳, Beispiel, shortTip, Mehr anzeigen/Weniger anzeigen, detailTip）
- Abschluss-Challenge（Q5相当）に正解した時点でカテゴリの`rewardXp`を一括付与し、`recordCategoryCompletion`を呼ぶ
- 結果画面への遷移（Result表示は同ページ内の状態切り替え、または`/lesson`内の別ビューとして実装。仕様書上は独立画面として2.4章に記載されているため、ルーティングかコンポーネント分割かは実装時にPhase 3内で決定する）

### `src/app/practice/page.tsx`
- `/practice?word=water` のようなクエリパラメータで単語IDを受け取る
- 単語別練習（`buildWordPracticeQuiz(wordId)`を呼び出し、5問固定パターンを出題）
- 選択単語以外の問題を出さない（他単語の語彙・例文を選択肢や問題文に混入させない）
- 完了後はWord Collectionへ戻る導線を用意する

### `src/app/vocabulary/page.tsx`
- Word Collection（カードコレクションとしての一覧表示）
- カード状態: `Sammelbar` / `Gesammelt` / `Locked` / `Üben` / `Gelernt`（`Mastered`はMVPでは実装しない）
- Sammelbar判定: `categoryId`が`unlockedCategories`に含まれ、かつ`collectedCards`に未収集の場合のみ（`unlockLevel`だけでは判定しない。Quest Mapに属さない`categoryId`（例: `"starter"`）は常に`locked`）
- 検索・カテゴリフィルタ
- `Üben`ボタンから`/practice?word=<id>`へ遷移

### `src/app/review/page.tsx`
- 復習画面（弱点単語`weakWords`のリスト表示）
- Abschluss-Reviewカテゴリ（`boss`）の解放条件チェックと起動導線
- MVPではリスト表示とAbschluss-Review起動導線のみで、動的な弱点集中Lesson生成はplaceholder相当でも可（仕様書2.7章の「将来追加する範囲」に該当するため）

### `src/app/globals.css`
- デザインシステム（カラートークン、タイポグラフィ、スペーシング）
- Quest Map用ノードのスタイル（円形ノード、接続線、current/completed/locked/reviewの状態別スタイル）
- カードUI（Word Collection用カード、Lesson用選択肢カード）
- レスポンシブ対応（PC/スマホ両対応。Quest Mapは縦方向スクロールが基本のため、幅方向のブレイクポイントのみ考慮すればよい）

---

## 4. 最初に実装するMVP範囲

最初のMVPでは、以下を必ず完成させる。

- `localStorage.clear`後にOnboardingが表示される
- Onboarding完了後、Level 0 / 0 XP / 0 Karten
- HomeはQuest Map形式で表示される
- Café / Erste Bestellungが現在地（current）ノードになっている
- Caféは5問構成（Q1〜Q4通常問題 + Q5 Abschluss-Challenge）
- Q4: `Wasser bitte.` → `水をください。`
- Q5: `Kaffee und Brot bitte.` → `コーヒーとパンをください。`
- 回答後にBeispiel / shortTip / detailTipが表示される
- Caféクリア後、Level 1 / 50 XP / 5 Karten
- Reiseがunlockされる
- Word CollectionでCaféの5枚がGesammelt表示になる
- ReiseカードがSammelbar表示になる
- Word CollectionのÜbenから`/practice?word=...`に遷移できる
- 水カードを選んだら、水だけの問題が出る（他単語が混入しない）

---

## 5. 今回やらないこと

MVPでは以下を実装しない。

- OpenAI API接続
- 本格的なログイン
- DB接続
- 課金
- 音声認識
- 複雑なアニメーション
- Duolingoの完全コピー
- キャラクター作成
- Mastered状態
- 高度なSRSアルゴリズム

---

## 6. UI方針

Home / Quest Mapは以下の方向で設計する。

- 単なるカテゴリカード一覧にしない
- 縦方向の学習マップとして構成する
- 丸いステージノードを使う
- 現在地ノードを強調表示する
- クリア済みノードはチェック表示にする
- ロック中ノードは薄く（グレーアウト）表示する
- Abschluss-Challengeは少し特別な見た目にする
- Abschluss-Reviewは最後に配置する
- PCでもスマホでもレイアウトが破綻しないようにする
- Duolingo風の構造（縦方向・ノードベース・現在地強調）は参考にするが、色・キャラクター・ブランド表現はコピーしない

---

## 7. 品質ルール

- 問題中にかなで答えを漏らさない
- 回答後にはかな・romaji・ドイツ語訳を出してよい
- phrase-choiceでは単語情報ではなくフレーズ全体の情報を出す
- 正解文は場面で実際に使える文にする
- 不正解は完全なデタラメだけにしない（意味違い・動詞違い・助詞違いを混ぜ、デタラメは1問最大1つまで）
- 表示報酬と実際のXP付与を一致させる（Result画面の数値は`storage`に書き込まれた実値から生成する）
- 再プレイでXPを二重付与しない（`completedCategories`に既にあるカテゴリは再クリアしてもXP・カード・完了フラグが変化しない）
- `unlockLevel`だけでSammelbarにしない
- `unlockedCategories`を基準にSammelbar判定する

---

## 8. QAチェックリスト

実装後、最低限以下を確認する。

- [ ] `npm.cmd run build` 成功
- [ ] TypeScriptエラーなし
- [ ] `localStorage.clear`後にOnboarding表示
- [ ] Onboarding完了後 Level 0 / 0 XP / 0 Karten
- [ ] Café未完了状態が正しく表示される
- [ ] Reiseがlocked表示になっている
- [ ] Café Q4（`Wasser bitte.` → `水をください。`）が正しい
- [ ] Café Q5（`Kaffee und Brot bitte.` → `コーヒーとパンをください。`）が正しい
- [ ] 回答後Tip展開（Mehr anzeigen/Weniger anzeigen）が動く
- [ ] Caféクリア後 Level 1 / 50 XP / 5 Karten
- [ ] Reiseがunlockedになる
- [ ] Word Collectionの状態（Sammelbar/Gesammelt/Locked）が正しい
- [ ] `/practice?word=water`で水だけの問題が出る
- [ ] かな漏洩なし（出題時に答えのかなが見えない）
- [ ] 「Boss」というユーザー表示がどこにもない（内部IDとしての`"boss"`のみ許容）
