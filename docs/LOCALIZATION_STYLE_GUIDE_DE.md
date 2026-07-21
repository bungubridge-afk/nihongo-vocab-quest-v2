# German Localization Style Guide

Stand: 2026-07-21 · 対象: `src/i18n/messages/de.ts` と `src/i18n/contentTranslations.ts` のソース独語

ドイツ語は**既存アプリの原文**である。今回の2言語化で独語の意味・トーン・設問数・
Tips・Register比較・図鑑情報・Japan-Notiz・例文・カード順・Quest順は一切変更していない。
既存利用者が「別アプリになった」と感じないことが最優先。

## Current tone(維持)

- du-Form(親しみやすい二人称)。敬称や堅い表現は使わない。
- ゲームらしく短く、温かく、軽い冒険感。子供っぽくない、企業的でない。
- 文法説明は正確に。断定の強さ・地域差(「in Tokio meist links, in Osaka oft rechts」)を
  弱めたり消したりしない。文化的主張は必ずヘッジ(「oft」「viele」「meist」「häufig」)。

## Terminology(一貫したUIラベル)

| 概念 | Deutsch |
|---|---|
| Home / 地図へ | Startseite / Zur Karte |
| 図鑑 | Kotoba-Zukan(ブランド、無変更) |
| Level | Level |
| 復習機能 | Wiederholung |
| 設定 | Einstellungen |
| Quest / 章 / エリア | Quest / Kapitel / Area |
| ログイン / ログアウト | Anmelden / Abmelden |
| Sprachstil | Locker / Höflich |
| ステージ状態 | Bereit / Abgeschlossen / Gesperrt |
| 図鑑状態 | Unentdeckt / Entdeckt / Im Training / Vertraut |

同一概念に複数の訳語を混在させない。

## Grammar / consistency

- 数値・単複依存文字列は英語と同様、**別カタログキー**で管理
  (`wordDiscovered`「1 Wort entdeckt」/ `wordsDiscovered`「N Wörter entdeckt」)。
- Japanese は常に原文のまま。穴埋め設問の `____` と日本語枠は変更しない。
- 引用符は „…" ペアで統一。

## 今回の変更(報告義務)

原文独語に対する**内容変更はゼロ**。明確な誤字・文法ミスの修正も本パスでは発生
しなかった。独語文字列は `contentTranslations.ts` の**キー**として、または
`messages/de.ts` の**値**として、従来と同一のテキストで保持されている
(`localizeContent` は `de` 時に原文をそのまま返す)。

将来ドイツ語を編集する場合:
- `messages/de.ts` の値を変更したら `messages/en.ts` の対応キーも更新すること
  (キー構造はコンパイル時に一致が強制される)。
- 学習データの独語文字列(vocabData 等)を変更したら、`contentTranslations.ts` の
  該当**キー**も同じ文字列へ更新すること(キーは実行時のソース文字列と
  バイト一致が必要)。coverage テスト(`docs/LOCALIZED_CONTENT_QA.md` 参照)で
  未対応を検出できる。
