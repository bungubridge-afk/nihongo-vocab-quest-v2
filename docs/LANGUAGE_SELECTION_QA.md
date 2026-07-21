# Language Selection QA

Stand: 2026-07-21 · 環境: Next.js 16.2.10 / dev server + 実ブラウザ(in-app preview)+ 静的自動検証

## 実ブラウザで確認済み(dev server, localhost:3000)

| 項目 | 結果 |
|---|---|
| 既存進捗ありブラウザ(legacy)がHomeで `de` 表示・`/language`へ中断されない | ✅ Case B。5語/50XP/1-5ステージがドイツ語で完全表示 |
| Headerのswitcherで DE→EN 即時切替 | ✅ route維持(`/`のまま)、全UI+コンテンツが自然な英語へ |
| 切替後も進捗維持 | ✅ 5語/50XP/1-5ステージ不変(XP/Quest不変) |
| aria-live通知 | ✅ 「Language changed to English.」を確認 |
| `<html lang>` 更新 | ✅ 切替後 `en`、SSRでも cookie から `en`/`de` |
| メタデータ(タブタイトル)locale追従 | ✅ EN:「Nihongo Quest – Learn Japanese」/ DE:「… – Japanisch lernen」 |
| `/language` 画面 | ✅ 英独併記(「Choose your app language」+「Wähle deine App-Sprache」)、radiogroup、国旗/国名なし、English/Deutsch同格 |
| Login switcher EN↔DE 双方向 | ✅ 「Sign in」↔「Anmelden」即時、原文独語を保持 |
| モバイル375px / Login | ✅ 横スクロールなし(scrollWidth 375 = innerWidth 375)、switcher表示 |
| console error | ✅ なし(onlyErrors=0件) |

## 自動検証(`scratchpad/validate.mjs` 相当、build後に実行)

- Locale正規化: `en`/`de` valid、`EN`/`de-AT`→正規化、`fr`/空/不正値→null
  ([`src/i18n/localeValidation.ts`](../src/i18n/localeValidation.ts) の
  `normalizeLocale`/`isSupportedLocale`/`getBrowserLocaleCandidate`)
- カタログキー一致: `en.ts` の `: Messages` 注釈によりコンパイル時強制(build 0エラー=一致)
- Onboarding選択肢配列の en/de 件数一致: `[6,6,6,6,5]` 一致 ✅
- コンテンツ辞書カバレッジ: 587件すべて英語エントリあり(0 missing)✅

## Precedence(優先順位)対応

| ケース | 実装 | 状態 |
|---|---|---|
| A. 新規(cookieなし・進捗なし)→ `/language` | `LanguageRedirectGate` | 実装済み・構造確認。ブラウザ言語は候補のみ・自動確定しない |
| B. 既存匿名(進捗あり)→ `de` | `hasLegacyAnonymousProgress()` | 実ブラウザで確認 ✅ |
| C. ログイン済み → `user_profiles.locale` 復元 | `LanguageProvider` profile同期 | 構造実装済み(実DBログインQAは下記Pending) |
| D. 認証前選択→signup維持→DB同期 | migration `locale` default NULL + back-fill | 構造実装済み(実DBログインQAはPending) |

## Cookie / DB

- Cookie `nvq_locale`: `en`/`de` のみ、`SameSite=Lax`、`Path=/`、Max-Age 1年、秘密情報なし。
  不正値は `normalizeLocale` で無視。
- ログイン時 `user_profiles.locale` を優先。切替時は自分のprofile行の `locale` 列のみ
  更新(user_progress不変・XP revision非増加・Entitlement非影響)。DB保存失敗は
  非致命(cookie/UIは切替済み、`isChanging` で通知)。

## Remaining / Pending

- **実DBログインでのUser A/B locale分離**(A=English, B=Deutsch の
  Login→Logout→再Login で言語混在しないこと)は、認証がパスワード入力を要し本セッションの
  制約で未実施。構造(`LanguageProvider` が `user.id` をキーに同期、cookie SameSite=Lax で
  OAuth往復維持)は実装済み。
- migration `20260721000002_user_profiles_locale_check.sql`(locale の CHECK制約 +
  default NULL 化)は本番未適用。適用可否は完了報告参照。
