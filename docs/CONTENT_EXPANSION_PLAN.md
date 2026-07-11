# Nihongo Vocab Quest — Content Expansion Plan

**Status of this document:** Planning only. No application code (`src/app`, `src/lib`, `src/components`, `src/types`) was changed to produce this plan, and nothing described here is implemented yet.

---

## 1. 目的

- 現在のMVPは**Café**が最も完成度が高い（`docs/QA_REPORT_V2.md`で唯一のカテゴリとして厳密に内容検証されている：5問固定、正確なフィードバック、かな漏洩なし）。
- **Reise / Schule / Freunde / Abschluss-Review** は`src/lib/questData.ts` / `src/lib/vocabData.ts`上で機能的には完全に動く（同じ5問構成・同じ`quizBuilder.ts`のロジックを共有）が、内容そのものはCaféほど作り込まれておらず、まだ仮データに近い。
- `docs/MONETIZATION_PLAN.md`が明記する通り、課金制を目指すなら**決済実装（Stripe/DB/Auth）より先に、有料候補となる学習コンテンツの質を上げる必要がある**。中身が薄いカテゴリに「Premium」ラベルを付けても、ユーザーの信頼は得られない。
- この設計書は、次に追加・改善する**語彙・問題・例文・Tips**の方針を決めるものであり、実装そのものは行わない。

---

## 2. 現在のコンテンツ状態

| カテゴリ | 状態 | 役割 | 重要度 |
|---|---|---|---|
| Café | MVP基準では完成（5語彙・5問、`docs/QA_REPORT_V2.md`で内容検証済み） | 無料体験カテゴリ | — |
| Reise | 仮データ（5語彙・5問、機能はCaféと同一構造だが内容の作り込みが浅い） | 有料化候補の最初のカテゴリ | 高い |
| Schule | 仮データ（5語彙・5問） | 日常学習・学校生活 | 中〜高 |
| Freunde | 仮データ（5語彙・5問） | 友達との約束・会話 | 高い |
| Abschluss-Review | 仮データ（5問、全カテゴリ混合の総合復習として設計済みだが内容は薄い） | まとめ・総合復習 | 高い |

Café改善余地: 問題数追加（現状5問→将来10問化、§8 Phase E参照）、表現バリエーション追加。

---

## 3. 各カテゴリの学習シーン設計

### Reise

**テーマ:** 日本到着後、駅・ホテル・トイレ・移動で使う表現

**学習ゴール:**
- 駅がどこか聞ける
- ホテルに行きたいと言える
- 電車に乗る/行く表現がわかる
- トイレを探せる

**候補語彙**（現行5語: 駅・ホテル・電車・トイレ・行く に対する拡張候補）:
駅 / ホテル / 電車 / トイレ / 行く / どこ / ください / すみません / 右 / 左 / 近い / 遠い

**候補フレーズ:**
- 駅はどこですか。
- トイレはどこですか。
- ホテルに行きます。
- 電車で行きます。
- すみません、駅はどこですか。
- 右です。
- 左です。

### Schule

**テーマ:** 日本語学習・学校・授業・今日の勉強

**学習ゴール:**
- 日本語を勉強していると言える
- 先生/学校/今日など基本語彙がわかる
- 学習状況を簡単に言える

**候補語彙**（現行5語: 学校・先生・日本語・勉強する・今日 に対する拡張候補）:
学校 / 先生 / 日本語 / 勉強する / 今日 / 明日 / 宿題 / 分かる / 分からない / 読む / 書く / 聞く

**候補フレーズ:**
- 日本語を勉強します。
- 今日、日本語を勉強します。
- 先生に聞きます。
- 宿題をします。
- 分かりません。
- ひらがなを読みます。

### Freunde

**テーマ:** 友達との約束・会う・話す・好きなもの

**学習ゴール:**
- 友達と会うと言える
- 明日会う約束ができる
- 好きなものを言える
- 簡単な会話表現がわかる

**候補語彙**（現行5語: 友だち・会う・話す・明日・好き に対する拡張候補）:
友だち / 会う / 話す / 明日 / 好き / カフェ / 一緒に / 行こう / 何 / 時間 / 映画 / ごはん

**候補フレーズ:**
- 明日、友だちに会います。
- 友だちと話します。
- カフェに行きます。
- 一緒に行きませんか。
- 映画が好きです。
- ごはんを食べます。

### Abschluss-Review

**テーマ:** Café / Reise / Schule / Freunde の総合復習

**学習ゴール:**
- 複数カテゴリの語彙を混ぜて理解できる
- 実用的な短文を選べる
- 似た表現の違いを判断できる

**候補問題:**
- Wasser bitte. → 水をください。
- Wo ist der Bahnhof? → 駅はどこですか。
- Ich lerne Japanisch. → 日本語を勉強します。
- Ich treffe morgen einen Freund. → 明日、友だちに会います。
- Kaffee und Brot bitte. → コーヒーとパンをください。

Abschluss-Reviewは新規語彙を追加するカテゴリではなく、Café/Reise/Schule/Freundeの語彙・フレーズを**混ぜて再出題する**ことが役割の中心。したがって語彙拡充の優先度は他4カテゴリより低く、他カテゴリの拡充が進んだ後に自動的に素材が増える構造にする。

---

## 4. 問題構成方針

各カテゴリは最終的に以下の構成を目指す。

| 段階 | 問題数/カテゴリ |
|---|---|
| MVP拡張版 | 10問 |
| 将来的な有料版 | 20問以上 |

**1カテゴリの基本構成（10問版）:**
1. meaning-choice
2. japanese-choice
3. fill-blank
4. particle-choice
5. phrase-choice
6. meaning-choice 応用
7. fill-blank 応用
8. phrase-choice 応用
9. short scenario choice
10. Abschluss-Challenge

**重要な原則:**
- いきなり20問にしない。
- まずは各カテゴリ**10問化**を目指す。
- 問題数を増やす前に、**1問ごとの品質を優先**する（§5参照）。

現行の`quizBuilder.ts`の`buildLessonQuestions`は`category.questions`をそのまま返すだけの薄いラッパーであり、10問化・20問化そのものは`questData.ts`側の配列を増やすだけで機能的には対応できる（ロジック変更は基本的に不要）。ただし`particle-choice`タイプは現状のLessonフロー（`questData.ts`内の手書き問題）ではまだ使われていない点に注意し、追加時は`src/types/learning.ts`の既存`QuestionType`定義内で完結させる。

---

## 5. 良い問題の条件

- 初級者が実際に使う場面である。
- ドイツ語UIと日本語例文の対応が自然である。
- 1問につき学習ポイントは1つ。
- 正解が明確である。
- 不正解選択肢も学習になる（意味違い・動詞違い・助詞違いを混ぜる）。
- 完全なデタラメ選択肢ばかりにしない（1問最大1つまで）。
- 回答前にkana/romaji/detailTipで答えを漏らさない。
- 回答後にkana/romaji/German/Beispiel/Tipsを出す。
- phrase-choiceでは**文全体のromaji**を出す（`quizBuilder.ts`の`EXAMPLE_ROMAJI`ルックアップと同じ考え方を、Reise/Schule/Freunde/Abschluss-Reviewの新規フレーズにも適用する。単語単位romajiへのフォールバックは行わない）。
- 「Boss」は使わず「Abschluss-Challenge」を使う。
- 「Mastered」はまだ使わない。

---

## 6. Tips作成方針

**shortTip:**
- 1文で短く。
- 初級者がすぐ理解できる。
- 文法用語を多用しない。

**detailTip:**
- 2〜4文。
- ドイツ語話者向けに説明する。
- なぜその表現が自然かを説明する。
- 似た表現との違いを簡単に示す。

**例:**

```
shortTip:
「〜はどこですか」は場所を聞く基本表現です。

detailTip:
「駅はどこですか」は、駅の場所を聞く自然な表現です。「は」は話題を示し、
「どこですか」は「wo ist ...?」に近い意味です。旅行中によく使えます。
```

---

## 7. Premium化を見据えた設計

| 区分 | カテゴリ / 機能 |
|---|---|
| 無料 | Café / Café Word Practice / Café Basic Review |
| 有料候補 | Reise / Schule / Freunde / Abschluss-Review / Advanced Review / AI Coach |

**注意:** 現時点ではPremiumロジック・ロック表示は実装しない（`docs/MONETIZATION_PLAN.md` §8 Phase 2で扱う範囲）。ただし、Reise以降のコンテンツは**将来Premium化しても違和感のない品質**（Caféと同等の自然さ・実用性）を目指して作る。

---

## 8. 実装順序

- **Phase A: Reise を Café と同水準に改善**
  - 語彙を5語から10〜12語に拡張
  - 問題を5問から10問に拡張
  - phrase-choiceを自然にする
  - 文全体romajiを整備
- **Phase B: Schule を改善**（Phase Aと同様の作業をSchuleに適用）
- **Phase C: Freunde を改善**（Phase Aと同様の作業をFreundeに適用）
- **Phase D: Abschluss-Review を本格化**（Phase A〜Cで拡充された語彙・フレーズを混ぜた総合復習として再構成）
- **Phase E: Café を10問化して無料版の質を上げる**（無料体験の満足度を上げ、Premiumとの差を「量」ではなく「カテゴリ数」で作る）

Reiseを最初に選ぶ理由: `docs/MONETIZATION_PLAN.md`で最初の有料候補カテゴリと位置づけられており（§7の表）、かつCafé完了直後に必ず遭遇する「次の一歩」であるため、無料→有料の分岐点として最も体験の質が問われる場所だから。

---

## 9. 今回まだ実装しないこと

- `src/lib/questData.ts` の変更
- `src/lib/vocabData.ts` の変更
- 問題数追加
- UI変更
- Premiumロック表示
- Stripe
- Login
- DB
- OpenAI API

今回は設計だけ。

---

## 10. 次のClaude Code実装Prompt方針

次の実装は **「Reise だけを Café 品質に引き上げる」** に限定する（§8 Phase A）。

**触る候補:**
- `src/lib/vocabData.ts`（Reise語彙を5語→10〜12語に拡張）
- `src/lib/questData.ts`（Reise問題を5問→10問に拡張、phrase-choiceの文全体romaji整備）
- `src/lib/quizBuilder.ts`（必要なら — 例えば`EXAMPLE_ROMAJI`ルックアップにReiseの新規フレーズを追加する場合）

**触らない:**
- UI（`src/app/*`, `src/components/*`）
- storage（`src/lib/storage.ts`）
- payment
- auth

Schule / Freunde / Abschluss-Review / Café10問化（Phase B〜E）は、Phase Aの結果を見てから個別のプロンプトとして依頼する。

---

## 11. 完了報告（この文書の作成時点でのサマリ）

- 作成したファイル: `docs/CONTENT_EXPANSION_PLAN.md`
- コンテンツ拡充方針: 決済実装より先に、Reise/Schule/Freunde/Abschluss-ReviewをCafé同等の品質（自然なフレーズ・文全体romaji・良質なdistractor・ドイツ語話者向けTips）に引き上げる。各カテゴリ10問化をまず目指し、20問化は将来の有料版で扱う。
- 最初に改善すべきカテゴリ: **Reise**（Café完了直後の最初の有料候補カテゴリのため）
- 次に実装すべきこと: 「Reiseだけを Café品質に引き上げる」ことに限定したプロンプトで、`vocabData.ts`/`questData.ts`（必要なら`quizBuilder.ts`）を対象に語彙5→10〜12語・問題5→10問への拡張を行う。
