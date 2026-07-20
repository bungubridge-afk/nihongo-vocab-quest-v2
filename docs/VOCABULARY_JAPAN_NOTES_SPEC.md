# Vocabulary Japan Notes Spec

Stand: 2026-07-19 · 対象: Kotoba-Zukan詳細dialogの「Japan-Notiz」

## Purpose

26語すべてに「日本ではそうなんだ」「ドイツ語とは少し違って面白い」「日本で実際に見つけてみたい」と感じられる短い文化メモを追加する。単語を日本の日常・表記・言語習慣・旅行場面と接続し、次のQuestと実際の日本への興味を高める。

## 最重要方針

**面白さより正確性。** 不確実な文化情報より、安定した言語・表記上の事実を優先する。

禁止: 根拠のない日本人一般論 / 「日本人は必ず〜」等の断定 / ステレオタイプ / 観光誇張 / 嘘の語源 / 地域差の無視(地域差は「Tokio〜、Osaka〜」と明示) / ドイツとの優劣比較 / 新しい学習文法の導入 / 検索対象への追加。

範囲限定語(„oft" „viele" „meist" „häufig")を適切に使用する。新出語は1件まで+訳併記。

## Data model

- `src/types/vocabularyCulture.ts` — `CultureNoteType`("daily-life" | "language" | "writing" | "travel" | "etymology")、`VocabularyCultureNote { vocabId, type, japanNoteGerman }`
- `src/lib/vocabularyCultureData.ts` — `Record<VocabCollectionId, VocabularyCultureNote>`(型レベルで26語網羅を強制)、`getCultureNote(vocabId)`、型ラベル`CULTURE_NOTE_TYPE_LABEL`(Alltag/Sprache/Schrift/Unterwegs/Wortherkunft)

各メモは1〜3文のドイツ語、空文字なし、320字以内。学習データ(vocabData)とは完全分離し、問題生成・XP・検索indexには一切使用しない。

## UI

詳細dialog内、**Zukan-Notizの直後・Beispielの前**に表示:

```
[提灯SVG] JAPAN-NOTIZ · Alltag        ← tealのkicker、独自inline SVG(aria-hidden)
本文(teal-soft背景の角丸ボックス)
```

セクション順: Zukan-Notiz → **Japan-Notiz** → Beispiel → So setzt du es ein → Merke → shortTip → Locker & Höflich → Mehr wissen(折りたたみ) → Karte üben。
(仕様の推奨順ではMehr wissenがLocker/Höflichの前だが、「折りたたみの補足資料を最後に置く」現行階層の方が学習上自然なため軽微調整として維持 — 仕様の調整許可条項に基づく。)

## Privacy

- 文化メモは**発見済みカードのdialogでのみ**`getCultureNote()`を呼んで表示。hiddenカードはdialog自体を開けないため構造的に読み込み不可
- 一覧・hiddenカードのDOM/aria/data属性に文化メモを一切含めない(実測済み)
- 検索indexへ不含(「Rolltreppen」等の文化メモ語句で検索しても0件 — 実ブラウザで確認)

## Fact-risk levels

- **Low**: 安定した言語・表記事実(語源、読み、助詞、看板表記等)
- **Medium**: 日常文化に関する限定的説明(hedging必須)
- **High**: 使用禁止 — 該当したら別のメモへ差し替え

全26件の判定は [VOCABULARY_JAPAN_NOTES_REVIEW.md](VOCABULARY_JAPAN_NOTES_REVIEW.md)。

## 既存説明の監査結果(Phase 1)

- **修正1件**: bread(パン)の旧shortTip「klingt fast wie das deutsche Wort」/detailTip「wird ähnlich wie im Deutschen ausgesprochen」— パンとBrotは音が似ておらず誤り。ポルトガル語由来(pão)の記述は正確なため維持し、ドイツ語類似の主張のみ削除する最小修正を実施
- その他(hotel/toiletの英語由来、先生の医師等への使用と自称不可、すみません多用途、今日のは=wa発音、に/で/と/がの助詞説明、casual≠乱暴・polite≠唯一の正解)はすべて正確と確認

## Non-goals

クイズへの文化問題追加、検索対象化、hiddenカードでのティザー表示、音声読み上げ、地域文化の網羅。
