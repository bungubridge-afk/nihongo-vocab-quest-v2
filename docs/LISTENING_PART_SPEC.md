# Listening Part Spec

Status: **Spec only — not implemented.** This document describes a future feature for
Main Quest, Sub Quest, and Review. No code in this repository implements it yet.

## Purpose

- 日本語の音を聞いて理解する練習を追加する。
- 文字だけでなく、音から単語・文を認識できるようにする。
- 現在のLesson / Sub Quest / Reviewは基本的に「読む」練習であり、「聞く」練習が欠けている。
  Listening Partはこのギャップを埋める。

## Scope

- Main Quest (Lesson本編)
- Sub Quest (単語カードからの個別練習)
- Review (weakWordsの復習)

## Voice Source

MVP:
- Web Speech API (`speechSynthesis` / `SpeechSynthesisUtterance`)
- `ja-JP` voice
- female-like voice preferred where available (既存の `src/lib/speech.ts` の
  `speakJapanese()` と同じ選定ロジックを流用する想定)
- 外部API・追加の依存ライブラリは不要

Future:
- External AI TTS
- OpenAI TTS / Google Cloud TTS / ElevenLabs 等が候補
- 音質・自然さ・発音の正確さ向上が目的
- ただし現在は未実装。コスト・レイテンシ・オフライン動作の可否を含めて別途検討が必要

## Difficulty by Level

**Beginner / Level 0-1:**
- 1語〜短いフレーズ
- 1回の音声は1〜5秒程度
- 聞いて正しい日本語表記を選ぶ
- 例:
  - 音声: 水
  - 選択肢: 水 / 駅 / パン / 学校

**Beginner+ / Level 2-3:**
- 短文
- 5〜15秒程度
- 聞いて正しい日本語文を選ぶ
- 例:
  - 音声: 水をください。
  - 選択肢: 水をください。 / 水を飲みます。 / パンをください。 / 駅はどこですか。

**Elementary / Level 4-5:**
- 2〜3文の短い会話
- 15〜30秒程度
- 聞いて意味に合う選択肢を選ぶ

**Future higher level:**
- 1分程度の簡単な聞き取り
- ただし初級MVPではいきなり1分は長すぎるため、段階的に導入する
- レベルごとの秒数・文数は上記を目安とし、実装時にユーザーテストで調整する

## Main Quest Listening

- 各Unit（カテゴリ）の中に1〜2問だけListening問題を入れる
- 最初は最後のChallenge問題の前に配置する（Challengeの難易度を急に上げすぎない）
- 音声を聞いて正しい日本語文を選ぶ
- 既存の5問/10問構成に追加する形で導入するか、既存の1問を置き換えるかは実装時に判断する
- XP・カード付与ロジックは変更しない前提（Listening問題も通常の正誤判定と同様に扱う）

## Sub Quest Listening

- 10問中1〜2問をListeningにする
- 選択単語を必ず音声に含める（現在のSub Questの「選択語が全問の主題」という方針を維持）
- 例: water Sub Quest
  - 音声: 水をください。
  - 正解: 水をください。
  - distractor: 水を飲みます。 / コーヒーをください。 / パンをください。
- water / station / right / left など専用テンプレートを持つ語では、既存の自然な例文を
  そのままListening音声として再利用できる
- 汎用テンプレートの語では `vocab.exampleJapanese` を音声にする想定

## Review Listening

- weakWordsに入った単語を音声で復習する
- 音だけ聞いて選ぶ問題を出す
- 「見て分かる」だけでなく「聞いて分かる」を復習の合格条件に加えることを将来的に検討する
  （ただし今回のフェーズでは判定ロジックの変更はしない）

## Question Types to Add Later

- `listening-word-choice` — 単語の音声を聞いて表記を選ぶ
- `listening-phrase-choice` — 文の音声を聞いて正しい文を選ぶ
- `listening-meaning-choice` — 文の音声を聞いて意味（ドイツ語）を選ぶ
- `listening-order-choice` — 将来的なオプション。聞いた文の語順・構成要素を並べ替える等

これらは既存の `QuestionType`（`meaning-choice` / `japanese-choice` / `fill-blank` /
`particle-choice` / `phrase-choice` / `sentence-meaning-choice` / `mistake-choice` /
`kana-choice` / `typing` / `reorder`）に追加する新しい種別として設計する。

## UX

- 再生ボタン（スピーカーアイコン、Vocabularyの発音アイコンと同じ見た目を流用できる）
- 1問につき再生回数制限は最初はなし
- 将来的には難易度によって再生回数制限を設ける（例: 上級では1回のみ）
- 音量に注意する（既存の効果音・発音機能と同様、控えめな音量を維持する）
- 発音ボタン（Vocabulary）や回答効果音・Result音（`src/lib/sound.ts`）と衝突しないよう、
  再生タイミングを制御する（例: 効果音再生中はListening音声の自動再生を待つ、または
  ユーザー操作でのみ再生する）

## Data Design

- `QuizQuestion` に `audioText?: string` を追加する案
  - Listening問題では `prompt` の代わりに `audioText` を読み上げる
  - `audioText` が設定されている場合、UIは通常のテキストpromptの代わりに再生ボタンを表示する
  - `answer` は既存と同様、文字選択（`choices` の中から選ぶ）
  - TTSは `speakJapanese(audioText)`（`src/lib/speech.ts` の既存関数を再利用）
- 既存の `answerKana` / `answerRomaji` / `exampleJapanese` 等のフィールドはそのまま
  フィードバック表示に使う想定（Listening問題後のフィードバックでも文字・romaji・意味を
  確認できるようにする）

## Implementation Plan

**Phase 1:**
- Sub Questに Listening 1問追加
- Web Speech API使用
- 対象語を絞って試験導入し、品質・UXを確認してから全語に展開する

**Phase 2:**
- Main Quest（Lesson）に Listening 1問追加

**Phase 3:**
- Review に Listening追加

**Phase 4:**
- AI TTS / 音声品質改善の検討
- 必要であれば有料TTS APIの導入を別途検討する（コスト・利用規約を確認する）

## Out of Scope for This Spec

- 実装そのもの（コード変更）は本ドキュメントの範囲外
- `QuizQuestion` 型定義の変更（`audioText?: string` の追加）も本ドキュメントでは提案のみ
- 既存の効果音・発音・XP・カード付与・カテゴリ解放ロジックへの変更は含まない
