# Nihongo Vocab Quest — v2 仕様書

本ドキュメントは、現行版（`nihongo-vocab-quest`、Next.js App Router実装）を参考にしながら、
まっさらな別プロジェクトとして v2 を作り直すための仕様をまとめたものである。

**このドキュメントの作成時点では、アプリ本体のコードは一切変更していない。新規Next.jsプロジェクトも未作成。**
本ファイルは仕様の整理のみを目的とする。

---

## 0. 現行版からの主な変更点（サマリ）

v2で変えること:
- ホーム画面を「カテゴリカード一覧」から「縦方向のQuest Map（学習マップ）」に変更する
- 単語帳の「Üben」ボタンを、カテゴリ全体の再挑戦ではなく **単語1つだけの個別練習** に変更する（新規: Word Practice画面）
- Onboardingの結果でXPやカードを一切付与しないことを明文化する（現行も未付与だが、v2では仕様として固定する）
- localStorageのキーを整理し、使っていない・使う予定のないキー（`nvq_progress`, `nvq_streak`, `nvq_recent_reviews`, `nvq_level`, `nvq_boss_clears`）を廃止する
- 内部カテゴリID `boss` は維持しつつ、ユーザー表示は必ず「Abschluss-Review」「Abschluss-Challenge」にすることを維持する
- **カテゴリの解放判定をXPレベルの閾値ではなく`completedCategories`（直前のカテゴリ完了）ベースに変更する。** 理由と詳細は[4章「カテゴリ報酬とレベル閾値の整合性に関する注意」](#カテゴリ報酬とレベル閾値の整合性に関する注意v2実装前に要決定)を参照。`unlockLevel`の数値は表示上の目安としてのみ残す。

v2でも引き継ぐこと:
- カテゴリ構成（Café → Reise → Schule → Freunde → Abschluss-Review）
- レベル閾値の表（0〜49=Lv0, 50〜149=Lv1, 150〜279=Lv2, 280〜449=Lv3, 450以上=Lv4〜。詳細は[4章](#4-level--xp--unlock仕様)の表を参照。「50XPでLevel1、以降100XP刻み」は表の要約に過ぎず、正は必ず表と`calculateLevelFromXp`の実装を参照する）
- Café「Erste Bestellung」5問の内容とフィードバック仕様
- クイズ品質ルール（実用文、不自然な文の禁止、デタラメ選択肢は1問1つまで）
- `calculateLevelFromXp` によるレベル算出（キャッシュ値を信頼しない）
- KI-Coach・Settingsのプレースホルダー方針

---

## 1. アプリ概要

**アプリ名:** Nihongo Vocab Quest v2

**目的:**
ドイツ語話者が、日本語の初級単語をゲーム感覚で覚えるためのWebアプリ。

**学習思想:**
- 単語をただ暗記するのではなく、場面ごとの短い実用文で覚える
- 単語カードを集める感覚で学習を継続する
- RPGのレベルアップのように、進むほど少しずつ難しい単語が出る
- Duolingo風の学習マップを参考に、次に何をすべきか分かりやすくする
- ただしDuolingoのデザインを完全コピーしない（構造のみ参考にする）
- キャラクターやブランド要素は真似しない

**ターゲット:**
- ドイツ語話者
- 日本語完全初心者〜A1初級
- 日本旅行、友人・パートナー、日本文化、学校、カフェなどで使える基本語彙を学びたい人

---

## 2. v2の画面一覧

### 2.1 Onboarding

- **目的:** 学習者のモチベーションやレベル感を把握し、パーソナライズされた導線を演出する。
- **表示内容:** 複数選択式の質問（例: 学習動機、現在のレベル、集めたい単語の種類、学習スタイル、最初の目標）。現行版の5問構成（`motivation` / `startLevel` / `collectFocus` / `trainingStyle` / `questGoal`）を踏襲する。回答後は「Quest-Pack作成中」のローディング演出を挟む。
- **ユーザー操作:** 各質問に対して1つ選択 → 自動で次の質問へ。戻るボタンあり。
- **使用するデータ:** `OnboardingProfile`（回答内容 + `createdAt`）を保存。
- **MVPで実装する範囲:** 5問の選択式質問、ローディング演出、プロフィール保存。
- **将来追加する範囲:** 回答内容に応じた出題語彙のパーソナライズ、プロフィール編集画面。

**重要:** Onboarding完了は「プロフィールの保存」のみを行う。XP・カード・Levelには一切影響しない（[4章](#4-level--xp--unlock仕様)参照）。

### 2.2 Home / Quest Map

- **目的:** 現在の進捗を一目で把握し、「次に何をすべきか」を1クリックで提示する。
- **表示内容:** [3章](#3-home--quest-map-の仕様)に詳細を記載。
- **ユーザー操作:** 「Starten」ボタンで現在地ノードのLessonへ遷移。Word Collection / Review への導線。
- **使用するデータ:** `PlayerProgress`（level, xp, collectedCards, completedCategories, unlockedCategories, currentCategory）。
- **MVPで実装する範囲:** 縦方向マップ、現在地/クリア済み/ロック中ノードの表示、Starten導線。
- **将来追加する範囲:** マップのスクロールアニメーション、ノードごとのミニプレビュー、デイリークエスト表示。

### 2.3 Lesson

- **目的:** 1カテゴリぶんの問題（通常問題+Abschluss-Challenge）を解かせ、単語カードとXPを獲得させる。
- **表示内容:** 問題文、選択肢、進捗（n/total）、カテゴリ名とステージ名、回答後フィードバック（[8章](#8-回答後フィードバック仕様)参照）。
- **ユーザー操作:** 選択肢をクリック → 即時判定 → フィードバック確認 → 「Weiter」で次の問題へ。
- **使用するデータ:** `QuestCategory.questions` + `bossQuestion`（固定データ、[6章](#6-café--erste-bestellung-の5問)参照）。
- **MVPで実装する範囲:** 現行版と同じ4問+Abschluss-Challenge構成、回答後フィードバック全項目、XP/カード付与（初回クリアのみ）。
- **将来追加する範囲:** 問題タイプの多様化（reorder, typingの本格導入）、ヒント機能、間違えた問題だけの即時リトライ。

### 2.4 Result

- **目的:** レッスン完了後の達成感を演出し、獲得したもの（XP・カード・レベルアップ・カテゴリ解放）を正確に伝える。
- **表示内容:** 獲得XP、正答数、Abschluss-Challenge成否、レベルアップ表示、報酬チップ一覧、獲得カード/弱点カード一覧。
- **ユーザー操作:** 「Noch einmal」でリトライ、「Zurück zur Karte」でQuest Mapへ。
- **使用するデータ:** レッスン中に集計した `AnswerRecord[]`、`category.bossRewardXp`、`category.bossRewardText`。
- **MVPで実装する範囲:** 現行版と同等（表示報酬=実報酬の一致を厳守）。
- **将来追加する範囲:** SNSシェア用のサマリーカード、連続学習日数の表示。

### 2.5 Word Collection

- **目的:** 単語帳ではなく「カードコレクション」として、集めた単語を眺める楽しさを提供する。
- **表示内容:** [9章](#9-word-collection仕様)に詳細を記載。
- **ユーザー操作:** 検索、カテゴリフィルタ、カードごとの「Üben」ボタン（→Word Practiceへ遷移）。
- **使用するデータ:** `vocabData`、`collectedCards`、`unlockedCategories`、`knownWords`、`weakWords`。
- **MVPで実装する範囲:** カード一覧、状態表示（locked/sammelbar/gesammelt/üben）、検索・フィルタ、Übenボタン。
- **将来追加する範囲:** Mastered状態の導入、カードの並び替え、コレクション達成率のバッジ。

### 2.6 Word Practice

- **目的:** 特定の1単語だけを集中して練習できるようにする（現行版にはない新規画面）。
- **表示内容:** [10章](#10-word-practice仕様)に詳細を記載。単語カード情報 + その単語だけを使った5問。
- **ユーザー操作:** Word Collectionから「Üben」→ 単語専用の練習セッションを実施 → 完了後はWord Collectionへ戻る。
- **使用するデータ:** クエリパラメータ `word`、対象 `VocabItem` 1件から動的生成した問題。
- **MVPで実装する範囲:** 1単語につき5問固定パターン（意味→和訳、和訳→意味、助詞穴埋め、動詞穴埋め、フレーズ選択）。
- **将来追加する範囲:** 誤答した単語を自動的に復習キューに戻す、間隔反復（SRS）による再出題。

### 2.7 Review / Abschluss-Review

- **目的:** 全カテゴリの内容を横断して復習し、「Abschluss-Review」として学習の節目を演出する。
- **表示内容:** 弱点単語（`weakWords`）のリスト、Abschluss-Reviewカテゴリへの導線。
- **ユーザー操作:** 「Wiederholen starten」で弱点単語中心のLessonを開始。
- **使用するデータ:** `weakWords`、`QUEST_CATEGORIES`の`boss`カテゴリ（表示名は必ずAbschluss-Review）。
- **MVPで実装する範囲:** 弱点単語リストの表示、Abschluss-Reviewカテゴリの解放条件チェックと起動。
- **将来追加する範囲:** 弱点単語だけを集めた動的Lesson生成、復習の優先度スコアリング。

現行版では本画面は「bald verfügbar」のプレースホルダーのみ（[review/page.tsx](../src/app/review/page.tsx)参照）。v2ではMVPスコープで最低限の弱点リスト表示まで実装する。

### 2.8 KI-Coach placeholder

- **目的:** 将来のAIチャット/添削機能の受け皿を示す。
- **表示内容:** 「bald verfügbar」のメッセージ、機能の簡単な説明。
- **ユーザー操作:** ホームへ戻るのみ。
- **使用するデータ:** なし。
- **MVPで実装する範囲:** プレースホルダーページのみ（現行版の[writing/page.tsx](../src/app/writing/page.tsx)を踏襲）。
- **将来追加する範囲:** 自由記述の日本語文をAIが添削するチャット機能。

### 2.9 Settings placeholder

- **目的:** 将来の設定画面（通知、学習リセット、言語切替など）の受け皿を示す。
- **表示内容:** 「bald verfügbar」のメッセージ、ナビゲーション上は無効化されたリンクとして表示。
- **ユーザー操作:** なし（クリック不可）。
- **使用するデータ:** なし。
- **MVPで実装する範囲:** ナビゲーション上に無効状態のメニュー項目として表示するのみ。
- **将来追加する範囲:** プロフィールリセット、学習データのエクスポート/インポート、通知設定。

---

## 3. Home / Quest Map の仕様

v2では、ホーム画面を単なるカテゴリカード一覧にしない。Duolingoのような縦方向の学習マップを参考にする。
**ただし完全コピーは禁止。参考にするのは構造だけ。**

### 必要な構成

- 現在のLevel
- XP
- 集めたカード数
- 次の解放カテゴリ
- 縦に並ぶステージノード
- 現在地ノード
- クリア済みノード
- ロック中ノード
- Abschluss-Challengeノード
- Reviewノード
- 報酬表示
- 「Starten」ボタン

### レイアウト例

```
Level 0
0 XP
0 Karten

現在地:
Café: Erste Bestellung

次:
Reise

マップ:
Startpunkt
 ↓
Café: Erste Bestellung        [current]
 ↓
Reise: Ankunft in Japan       [locked]
 ↓
Schule                        [locked]
 ↓
Freunde                       [locked]
 ↓
Abschluss-Review              [review / locked]
```

### ノード状態

| 状態 | 意味 |
|---|---|
| `current` | プレイヤーが次にプレイすべきノード。Startenボタンが有効。 |
| `completed` | 既にクリア済み。再挑戦は可能だが報酬は再付与しない。 |
| `unlocked` | レベル条件は満たしているが、まだ現在地ではない（例: 将来複数ノード同時開放時）。 |
| `locked` | レベル条件未達。タップ不可、グレーアウト表示。 |
| `review` | Abschluss-Review専用の状態。全カテゴリ完了まで`locked`表示。 |

MVPでは同時にプレイ可能なノードは1つ（=current）のみとし、`unlocked`状態は将来の並行ルート拡張のために型として予約しておく。

---

## 4. Level / XP / Unlock仕様

### 初期状態

```
level: 0
xp: 0
collectedCards: []
completedCategories: []
unlockedCategories: ["cafe"]
currentCategory: "cafe"
```

### レベル閾値

| XP範囲 | Level |
|---|---|
| 0〜49 XP | Level 0 |
| 50〜149 XP | Level 1 |
| 150〜279 XP | Level 2 |
| 280〜449 XP | Level 3 |
| 450 XP以上 | Level 4以降 |

現行版の `calculateLevelFromXp`（[levelSystem.ts](../src/lib/levelSystem.ts)）と同じロジックを引き継ぐ:
Level 1到達の閾値を50XPの定数として固定し、以降は100XPごとに1レベル。

```ts
const LEVEL_1_THRESHOLD = 50;
const XP_PER_LEVEL = 100;

function calculateLevelFromXp(xp: number): number {
  if (xp < LEVEL_1_THRESHOLD) return 0;
  return Math.floor((xp - LEVEL_1_THRESHOLD) / XP_PER_LEVEL) + 1;
}
```

**この閾値表が正であり、「Level 0スタート・50XPでLevel 1・以降100XP刻み」という短い言い回しは、この表を要約しただけの表現である。実装時は必ず上記の表とコード（境界値は範囲の下限を含む＝以上）を参照すること。**

### カテゴリ報酬とレベル閾値の整合性に関する注意（v2実装前に要決定）

カテゴリの `rewardXp`（[5章](#5-カテゴリ構成)参照）を上記のレベル閾値表にそのまま当てはめると、**Café完了後とReise完了後の累積XPは、Reiseの次のカテゴリ（Schule）が期待する「Level 2」に届かない**という不整合がある。

| 状態 | 獲得XP | 累積XP | 到達Level |
|---|---|---|---|
| 初期状態 | — | 0 XP | Level 0 |
| Café完了後 | +50 XP | 50 XP | Level 1 |
| Reise完了後 | +80 XP | **130 XP** | **まだLevel 1**（Level 2の閾値は150XP） |

つまり、現状の数値（Café: +50, Reise: +80, Level 2閾値: 150XP）のままだと、「SchuleはLevel 2で解放される」という設計にした場合、Reiseを完了してもSchuleが解放されないという矛盾が起きる。

v2実装前に、以下のいずれかを選んで解消する必要がある（本書では**推奨案を次項の通り決定済み**とする）。

- **案A:** Reise報酬を100XPにして、Café+Reise = 150XPにする（＝XP閾値の方に報酬を合わせる）
- **案B:** Schuleのunlock条件をLevel 2ではなく「Reise完了」にする（＝カテゴリ完了ベースに変える）
- **案C:** Level 2閾値を130XPに調整する（＝XP閾値の方を報酬に合わせる）

### 推奨: カテゴリ解放は `completedCategories` を基準にする（案B採用）

**v2では、カテゴリの解放条件を「XPレベルの閾値」ではなく「直前のカテゴリを完了したかどうか（`completedCategories`）」を基準にする。** `unlockLevel` の数値（0, 1, 2, 3, 4）は表示用の目安・演出（「Level 2で解放」という文言など）としては残してよいが、**実際のロック解除ロジックの判定には使わない**。

具体的な解放ルール:

| 完了したカテゴリ | 解放されるカテゴリ |
|---|---|
| （初期状態） | `cafe` |
| `cafe` 完了 | `reise` |
| `reise` 完了 | `schule` |
| `schule` 完了 | `freunde` |
| `freunde` 完了 | `boss`（Abschluss-Review） |

理由:
- 学習マップ型アプリでは、XPの累積値だけで解放判定をすると、上記のようにカテゴリ報酬の数値設計とレベル閾値の数値設計を常に手動で整合させ続ける必要があり、報酬バランスを調整するたびにレベル閾値も見直す羽目になり壊れやすい。
- 「前のステージをクリアしたら次が開く」という完了ベースの判定は、ユーザーの体感（「Reiseをクリアしたのに次が開かない」という違和感の防止）にも合っており、Duolingo型の学習マップの基本構造とも一致する。
- Level／XPは「今の実力・報酬の蓄積」を示す指標として維持し、「次に何が解放されるか」の判定とは役割を分離する。これにより、カテゴリごとの`rewardXp`を後から調整してもロック解除ロジックには影響しない。

このため、v2の `unlockedCategories` は「レベルから毎回再計算する値」ではなく、**「カテゴリ完了イベントの都度、次のカテゴリIDを追加していく永続データ」**として扱う（初期値 `["cafe"]`、`cafe`完了時に`"reise"`を追加、以降同様）。

### Caféクリア後の状態

```
level: 1
xp: 50
collectedCards: [coffee, water, bread, drink, eat]  // 5 Karten
completedCategories: [cafe]
unlockedCategories: [cafe, reise]
```

表示:
- Level 1
- 50 XP
- 5 Karten
- 「Café abgeschlossen」
- 「Reise freigeschaltet」

### 重要ルール

1. **Onboarding完了だけではXPやカードを付与しない。** プロフィール保存のみ。
2. **XPはカテゴリ初回クリア時だけ付与する。** カテゴリのAbschluss-Challengeに正解して初めて、そのカテゴリの `rewardXp` を一括付与する（各設問ごとの個別XPは合算しない）。
3. **再プレイではXPを二重付与しない。** `completedCategories` に既に含まれるカテゴリを再度クリアしても、XP・カード・カテゴリ完了フラグは変化しない（練習のみ）。
4. **表示報酬と実際の報酬を必ず一致させる。** Result画面に出すXP・カード・カテゴリ解放のチップは、実際に `storage` に書き込まれた値から生成し、決め打ちの文言と数値がズレないようにする。
5. **カテゴリ解放の判定はXPレベルではなく`completedCategories`で行う。** 詳細と理由は次項「カテゴリ報酬とレベル閾値の整合性に関する注意」および[5章](#5-カテゴリ構成)を参照。

---

## 5. カテゴリ構成

v2の初期カテゴリは以下とする（現行版の`questData.ts`をそのまま引き継ぐ）。

**注意:** 下表の `unlockLevel` は表示・演出用の目安であり、実際の解放判定には使わない。実際の解放判定は必ず `completedCategories`（直前のカテゴリを完了したか）で行う（[4章「推奨: カテゴリ解放は`completedCategories`を基準にする」](#推奨-カテゴリ解放は-completedcategories-を基準にする案b採用)を参照）。

| # | カテゴリID | 表示名 | stageTitle | unlockLevel（表示目安） | 解放条件（実際の判定） | rewardXp |
|---|---|---|---|---|---|---|
| 1 | `cafe` | Café | Erste Bestellung | 0 | 常に解放済み（初期状態） | 50 |
| 2 | `reise` | Reise | Ankunft in Japan | 1 | `cafe` 完了 | 80 |
| 3 | `schule` | Schule | Lernen und Alltag | 2 | `reise` 完了 | 100 |
| 4 | `freunde` | Freunde | Treffen und Pläne | 3 | `schule` 完了 | 110 |
| 5 | `boss`（内部ID） | Abschluss-Review | — | 4 | `cafe`/`reise`/`schule`/`freunde` の**全完了** | 150 |

### Café

- `collectedCards`: `coffee`, `water`, `bread`, `drink`, `eat`

### Abschluss-Review の解放条件

Café / Reise / Schule / Freunde を **すべて完了した後** に解放する（`requiresAllCategoriesDone: true`。他カテゴリ同様、`unlockLevel`単独では判定しない）。

### 重要: 「Boss」という言葉の扱い

- 画面上で **“Boss” という言葉を使わない**。
- 内部IDとして `boss` を使うのは許容する（`CategoryId = "boss"`、`isBoss`フラグなど）。
- ユーザー表示は必ず **「Abschluss-Review」** または **「Abschluss-Challenge」** にする。

---

## 6. Café / Erste Bestellung の5問

Caféは最初のクエストであり、Level 0 → Level 1 の導線として非常に重要。
構成: **通常問題4問 + Abschluss-Challenge 1問**。

### Q1（meaning-choice）

```
prompt: コーヒー
instruction: Wähle die richtige Bedeutung.
choices: [Kaffee, Wasser, Brot, essen]
answer: Kaffee
```

answer explanation: コーヒー / koohii / Kaffee

Beispiel: コーヒーをください。（Einen Kaffee bitte.）

shortTip: 「ください」は注文やお願いで使える基本表現です。

detailTip: 「コーヒーをください」は、カフェや店で使える丁寧なお願いです。カジュアルには「コーヒーください」と言うこともあります。

### Q2（japanese-choice）

```
prompt: trinken
instruction: Wähle die passende Wortkarte.
choices: [飲む, 食べる, 水, パン]
answer: 飲む
```

Beispiel: 水を飲みます。（みずをのみます。／ Ich trinke Wasser.）

### Q3（fill-blank）

```
prompt: パンを____。
instruction: Ergänze den Satz.
choices: [食べます, 飲みます, 行きます, 好きです]
answer: 食べます
```

Beispiel: パンを食べます。（パンをたべます。／ Ich esse Brot.）

### Q4（phrase-choice）

```
prompt: Wasser bitte.
instruction: Wähle den natürlichen japanischen Satz.
choices:
  - 水をください。
  - 水を飲みます。
  - パンをください。
  - コーヒーを飲みます。
answer: 水をください。
```

answerKana: みずをください。
answerRomaji: mizu o kudasai
answerGerman: Wasser bitte.

shortTip: 「〜をください」は注文やお願いで使えます。

detailTip: 「水をください」は、店やレストランで使える実用表現です。「ください」は丁寧なお願いです。「水を飲みます」は「Ich trinke Wasser.」なので、注文の意味にはなりません。

### Q5（phrase-choice, label: Abschluss-Challenge）

```
prompt: Kaffee und Brot bitte.
instruction: Wähle den natürlichen japanischen Satz.
choices:
  - コーヒーとパンをください。
  - コーヒーを飲みます。パンを食べます。
  - コーヒーを食べます。パンを飲みます。
  - 水と駅をください。
answer: コーヒーとパンをください。
```

answerKana: コーヒーとパンをください。
answerRomaji: koohii to pan o kudasai
answerGerman: Kaffee und Brot bitte.

shortTip: 「AとB」は「A und B」です。

detailTip: 「と」は名詞をつなぐ時に使います。例: コーヒーとパン = Kaffee und Brot。「〜をください」を付けると、注文表現になります。

---

## 7. クイズ品質ルール

クイズは文法的に正しいだけでは不十分。**場面で使える文**にする。

### OK

- 実際に使える文
- A1初級者がそのまま覚えられる文
- 1問につき学習ポイント1つ
- 場面カテゴリに合った文
- 短く自然な日本語

### NG

- 不自然な日本語
- 単語を無理やり並べただけの文
- 場面に合わない文
- 正解が実用的でない文
- 問題中にかなで答えを漏らすこと（`prompt`や`promptKana`が正解を先出ししない — 現行版の`buildFillBlankQuestion`/`buildParticleChoiceQuestion`がkanaを出題時に伏せ、フィードバックでのみ見せている実装を踏襲する）

### 不正解選択肢

- 完全なデタラメは1問に最大1つまで
- 意味違い、動詞違い、助詞違いを混ぜる
- すべての不正解をめちゃくちゃな文にしない

---

## 8. 回答後フィードバック仕様

回答後には以下を表示する。

- Richtig / Leider falsch
- Richtige Antwort
- かな
- romaji
- ドイツ語訳
- Beispiel
- shortTip
- Mehr anzeigen / Weniger anzeigen
- detailTip

### phrase-choiceの場合

単語情報ではなく、**フレーズ全体の情報**を表示する。

例（正解が「水をください。」の場合）:
```
水をください。
みずをください。
mizu o kudasai
Wasser bitte.
```

**NG例:** 正解が「水をください。」なのに、`みず・mizu・Wasser`（単語1つ分の情報）だけを表示すること。

実装上のポイント（現行版[lesson/page.tsx](../src/app/lesson/page.tsx)の分岐を踏襲）:
`question.type === "phrase-choice"` の場合は `answerKana` / `answerRomaji` / `answerGerman` を使い、
それ以外は該当する `VocabItem` の `kana` / `romaji` / `german` にフォールバックする。

---

## 9. Word Collection仕様

単語帳ではなく、**カードコレクション**として設計する。

### カード状態

- `locked`
- `sammelbar`
- `gesammelt`
- `üben`
- `gelernt`

**Masteredは v2 の MVP では使わない。**

### 初期状態

- Caféの5枚: Sammelbar
- Reise以降: locked
- 0 / 29 Karten

### Caféクリア後

- Caféの5枚: Gesammelt
- Reiseカード: Sammelbar
- Schule / Freunde / その他: locked
- 5 / 29 Karten

### Sammelbar条件

カードが `sammelbar` になるのは、次の **両方** を満たす場合のみ:

1. `categoryId` が `unlockedCategories` に含まれている
2. `collectedCards` にまだ含まれていない

**`unlockLevel` だけでSammelbarにしない。** カテゴリ未解放の単語（例: `categoryId: "starter"` のように、どのQuest Mapカテゴリにも属さない単語）は、レベル条件を満たしていても `locked` のままにする（現行版[vocabulary/page.tsx](../src/app/vocabulary/page.tsx)の `isOutsideQuestMap` 判定を踏襲）。

---

## 10. Word Practice仕様

v2では、単語カードの **Übenボタン** を押したら、**その単語だけ**を練習するようにする。

例: 水カードのÜben → `/practice?word=water` → 水に関する問題だけ出す

### 水の個別練習例

| # | prompt | answer |
|---|---|---|
| Q1 | 水 | Wasser |
| Q2 | Wasser | 水 |
| Q3 | 水____飲みます。 | を |
| Q4 | 水を____。 | 飲みます |
| Q5 | Wasser bitte. | 水をください。 |

**重要:** 水カードから練習したのに、関係ない単語の問題を出してはいけない。5問すべてが対象単語（および、その単語の例文に含まれる助詞・動詞）に閉じていること。

これは現行版の `buildLessonQuiz`（複数単語からランダム抽出）とは異なる新規のビルダー関数（例: `buildWordPracticeQuiz(wordId: string)`）が必要になる。既存の `buildMeaningChoiceQuestion` / `buildJapaneseChoiceQuestion` / `buildParticleChoiceQuestion` / `buildFillBlankQuestion` は単語1つを軸に問題を作る設計なので流用可能。フレーズ選択（Q5相当）のみ、対象単語の `exampleJapanese` から新規に組み立てる。

---

## 11. storage仕様

### localStorage keys（v2）

| キー | 内容 | 初期値 |
|---|---|---|
| `nvq_profile` | Onboarding回答 | `null` |
| `nvq_xp` | 累計XP | `0` |
| `nvq_collected_cards` | 収集済みカードID配列 | `[]` |
| `nvq_completed_categories` | 完了カテゴリID配列 | `[]` |
| `nvq_unlocked_categories` | 解放済みカテゴリID配列 | `["cafe"]` |
| `nvq_known_words` | 正解済み単語ID配列 | `[]` |
| `nvq_weak_words` | 弱点単語ID配列 | `[]` |

現行版にある `nvq_progress`（lessonsCompleted等）、`nvq_streak`、`nvq_recent_reviews`、`nvq_level`（キャッシュ）、`nvq_boss_clears` はv2では廃止する。理由:
- `nvq_level` はキャッシュ用途のみで、実際には常に `getLevel()` がXPから再計算しており、書き込みも読み込みも意味を持っていない。
- `nvq_progress` / `nvq_streak` / `nvq_recent_reviews` はUIのどこからも参照されていない死んだデータであり、v2ではストレージ層を単純化するために削除する。
- `nvq_boss_clears` は `nvq_completed_categories` と実質的に重複している（Abschluss-Challengeをクリアした時だけカテゴリが完了扱いになる設計のため）。

### getLevel

- `nvq_level` のような古いキャッシュ値を信頼しない。
- XPから `calculateLevelFromXp` で算出する。

```ts
export function getLevel(): number {
  return calculateLevelFromXp(getXP());
}
```

### 初期値まとめ

```
xp: 0
collectedCards: []
completedCategories: []
unlockedCategories: ["cafe"]
knownWords: []
weakWords: []
```

### 堅牢性

壊れたlocalStorage値（不正なJSON、想定外の型）があってもアプリが落ちないようにする。現行版の `readJSON` と同様、`JSON.parse` を `try/catch` で包み、失敗時はフォールバック値を返す実装を踏襲する。

---

## 12. v2で使う主要ファイル構成

```
src/types/learning.ts     … 型定義（OnboardingProfile, VocabItem, QuestCategory, QuizQuestion, PlayerProgress など）
src/lib/vocabData.ts      … 全単語データ（VocabItem[]）
src/lib/questData.ts      … カテゴリ定義とCafé等の固定問題データ（QUEST_CATEGORIES）
src/lib/levelSystem.ts    … XP→Level算出、カテゴリの解放判定、次に進むべきカテゴリの判定
src/lib/storage.ts        … localStorage読み書き（プロフィール、XP、カード、カテゴリ進捗、既知/弱点単語）
src/lib/quizBuilder.ts    … 単語1つから問題を動的生成するビルダー群（meaning-choice, japanese-choice, fill-blank, particle-choice など）＋ v2新規の単語専用practiceビルダー
src/app/page.tsx          … Home / Quest Map（Onboardingを含む初回分岐）
src/app/lesson/page.tsx   … Lesson + Result（カテゴリ単位の学習フロー）
src/app/practice/page.tsx … Word Practice（単語1つだけの練習セッション、v2新規）
src/app/vocabulary/page.tsx … Word Collection（カードコレクション画面）
src/app/review/page.tsx   … Review / Abschluss-Review（弱点単語の復習導線）
src/app/globals.css       … グローバルスタイル（Tailwindベース、現行版のカラートークンを踏襲）
```

---

## 13. 実装順序

1. 新規Next.js作成
2. 型定義（`src/types/learning.ts`）
3. データ定義（`vocabData.ts`, `questData.ts`）
4. storage（`storage.ts`）
5. levelSystem（`levelSystem.ts`）
6. quizBuilder（`quizBuilder.ts`、単語専用practiceビルダーを含む）
7. 共通UI（ボタン、カード、進捗バーなどの基礎コンポーネント）
8. Onboarding
9. Quest Map（Home）
10. Lesson
11. Result
12. Word Collection
13. Word Practice
14. Review
15. QA（Café〜Abschluss-Reviewの一気通貫プレイテスト、localStorage破損時の挙動確認）
16. GitHub / Vercel（リポジトリ作成、デプロイ設定）

---

## 14. 完了条件

このドキュメント作成後、以下を報告する。

- 作成したファイル
- 仕様書に含めた主要項目
- v2で引き継ぐべき仕様
- v2で作り直すべき理由
- 次に作成すべきプロンプト
