# Localization Architecture (English / German)

Stand: 2026-07-21 · 対象: 英語・ドイツ語の2言語切替対応

Nihongo Vocab Quest は日本語を**学習対象言語**とし、UI・説明・図鑑・エラー・認証の
**説明言語**として English / Deutsch を切り替えられる。日本語(漢字・かな・ローマ字・
例文・選択肢)は説明言語ではなく、翻訳対象外の共有コンテンツである。

## AppLocale

説明言語は厳密に2値のみ:

```ts
type AppLocale = "en" | "de";
```

単一の真実源は [`src/i18n/config.ts`](../src/i18n/config.ts) の `APP_LOCALES`。
外部由来のlocale(cookie・DB・ブラウザ言語)は必ず
[`src/i18n/localeValidation.ts`](../src/i18n/localeValidation.ts) の
`isSupportedLocale()` / `normalizeLocale()` を通してからでないと AppLocale として
扱えない。`normalizeLocale` は `"EN"→"en"`, `"de-AT"→"de"` のように主サブタグへ
正規化し、`fr` / 空 / 不正値 / 悪意ある値は `null` を返す(独自にlocaleを捏造しない)。

## 2つの翻訳レイヤー

| 対象 | 仕組み | ファイル |
|---|---|---|
| **UIチェーン**(ボタン・見出し・ラベル・エラー・aria) | 型付きメッセージカタログ | `src/i18n/messages/{en,de}.ts` |
| **学習データの説明文**(語義・tip・例文訳・図鑑説明・文化ノート・Quest設問) | ソース(独語)キーの翻訳辞書 | `src/i18n/contentTranslations.ts` |

- **UIカタログ**: `de.ts` が型を定義し、`en.ts` は `: Messages` 注釈で同一キー構造を
  **コンパイル時に強制**される(キー欠落=ビルドエラー)。取得は `getMessages(locale)`、
  `{placeholder}` 補間は `formatMessage()`。
- **コンテンツ辞書**: 独語データファイル(vocabData / questData / subQuestData / …)は
  **無編集の単一ソース**のまま。各独語文字列→英語文字列の対応表を1ファイルに集約し、
  `localizeContent(germanText, locale)` が表示時に解決する。`de` は原文をそのまま返す
  (バイト単位で従来と同一=既存ドイツ語ユーザーの体験を保持)。`en` は辞書引き、
  未登録なら独語へフォールバック(クラッシュしない)。日本語文字列は辞書に存在しない
  ため素通り=「日本語は翻訳しない」が自動的に保証される。

## Provider

アプリ全体で `LanguageProvider` を1つだけ配置
([`src/components/providers/LanguageProvider.tsx`](../src/components/providers/LanguageProvider.tsx))。
`AppProviders` 内、`AuthProvider` の内側にマウントされ、`locale` / `messages` /
`setLocale()` / `isChanging` / `pick()`(`{en,de}`用) / `format()` を提供する。
`useLanguage()` フックで参照する。

`setLocale()` は cookie を更新し即時にUIを切り替え、screen reader へ変更を通知し、
`<html lang>` を更新する。**route・query・auth・progress を一切変えず、Logoutもしない。**

## Cookie と DB(保存先)

競合する保存先を増やさない。基本は2つだけ:

- **Cookie `nvq_locale`**(`en` / `de`, `SameSite=Lax`, `Path=/`, 1年, 非HttpOnly・秘密情報なし)
  — [`src/lib/locale/localeCookie.ts`](../src/lib/locale/localeCookie.ts)。SSR初期表示
  ([`src/lib/locale/getServerLocale.ts`](../src/lib/locale/getServerLocale.ts) が
  `next/headers` の cookies で読む)と client hydration が同一値から始まるため、
  言語がちらつかない。
- **`user_profiles.locale`**(ログインユーザーのみ)— デバイス跨ぎの真実源。

localStorage は locale 用に追加していない(既存の進捗キーは無変更)。

## Locale決定の優先順位

| 状況 | 挙動 | 実装 |
|---|---|---|
| **A. 新規未ログイン**(cookieなし・進捗なし) | `/language` へ誘導。ブラウザ言語は初期選択候補にのみ使用、自動確定しない | `LanguageRedirectGate` |
| **B. 既存匿名**(cookieなし・既存進捗あり) | 従来ドイツ語ユーザーとみなし `de` を静かに保存、中断しない | `LanguageRedirectGate` + `hasLegacyAnonymousProgress()` |
| **C. ログイン済み** | `user_profiles.locale`(en/de)を優先し別端末でも復元。無効なら cookie/legacy にフォールバック。取得失敗でもアプリを壊さない | `LanguageProvider` の profile同期effect |
| **D. 認証前に言語選択→新規登録** | cookieで選択維持。signup直後、DBの `locale` が NULL(未選択)なら cookie の選択を back-fill。OAuth外部遷移(SameSite=Lax)後も維持 | `LanguageProvider` + migration の locale default NULL |

## Routes(URL設計)

内部アプリのルートを `/en` `/de` 配下へ移動していない。既存ルート
(`/`, `/lesson`, `/vocabulary`, `/practice`, `/review`, `/login`, `/signup`,
`/account`, `/profile/*`, `/auth/callback`)を維持し、locale は Provider + Cookie +
`user_profiles.locale` で管理する。これにより既存リンク・Google OAuth callback・
メール認証・Quest URL・進捗復元がすべて保たれる。追加ルートは `/language` のみ。
将来のSEO用公開ページで `/en` `/de` を検討するのは別工程。

## メタデータ / html lang

`app/layout.tsx` の `generateMetadata()` と `<html lang>` は
`getServerLocale()`(cookie)から解決。英語ユーザーにはタブタイトルも英語
(`Nihongo Quest – Learn Japanese`)、ドイツ語ユーザーには独語で表示される。

## 学習データの分離

`id` / `kanji` / `kana` / `romaji` / 日本語例文 / `categoryId` / `chapterId` /
`collectionNumber` / register type は説明言語に依存せず共通。語義・tip・例文訳・
図鑑説明・文化ノート・章タイトル等のみが `localizeContent` を通る。英語版とドイツ語版で
別IDの教材は作らず、進捗(XP / Quest / カード / knownWords / weakWords / 完了章 /
`user_progress` / Entitlement)は完全に共通。
