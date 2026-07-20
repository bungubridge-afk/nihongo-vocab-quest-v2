# Google OAuth QA Report

実施日: 2026-07-19 · 対象: Supabaseメール認証へのGoogle OAuth追加
環境: Next.js 16.2.10 / @supabase/supabase-js 2.110.7(既存) / dev server + 実ブラウザ

**Final verdict: Code Complete — Google Provider Setup Pending**
(実際にSupabaseの認可エンドポイントへの遷移まで実測し、コード側が完全に正しく動作することを確認。Supabaseプロジェクト側でGoogle Providerが未設定のため「Unsupported provider: provider is not enabled」で停止 — これは想定どおりの状態で、コードの不具合ではない。)

## 変更ファイル

**作成**: `src/lib/auth/oauth.ts`(`buildOAuthCallbackUrl`)/ `src/components/auth/GoogleAuthButton.tsx` / `src/components/auth/SocialAuthButtons.tsx` / docs 2点

**変更**: `src/lib/supabase/config.ts`(`isGoogleAuthEnabled()`追加)/ `src/lib/auth/validation.ts`(`mapGoogleOAuthErrorToGerman`追加)/ `src/app/globals.css`(spinnerアニメーション+reduced-motion)/ `src/app/login/page.tsx`・`src/app/signup/page.tsx`(SocialAuthButtons統合)/ `src/app/auth/callback/route.ts`(provider-side error分岐)/ `.env.example`(フラグ追記)

user_progress構造・XP・Level・Quest・Vocabulary・RLS・SQL・Entitlement・localStorage進捗・service role keyは無変更(いずれも触れていない)。

## Google button

`SocialAuthButtons`(Google button + 「oder」区切り)を`/login`・`/signup`の両方、既存フォームの直前に配置。実測順: 「Mit Google fortfahren → oder → E-Mail-Adresse → Passwort → …」で仕様どおり。

- スタイル: 既存`Button`の`secondary` variant(白背景・枠線・ink文字)を再利用 — 白枠だけの汎用ボタンではなく、公式4色「G」ロゴ(標準比率・色そのまま)を左に配置
- 実測: 高さ45px(≥44px)、focus-visibleは全ボタン共通のグローバルCSSルールを継承
- ローディング状態: クリック直後に4色ロゴ→スピナー(`.auth-spinner`、reduced-motion時は静止)+ラベル「Wird geöffnet …」に切替、ボタンdisabled
- 二重送信防止: `if (pending) return;`ガード + ボタン自体がdisabled化。実ブラウザで連続2クリックしてもOAuth開始は1回のみであることを確認
- エラー表示: 開始失敗時のみボタン下に`role="alert"`で表示、生Supabaseエラーは一切表示しない

## Feature Flag

`NEXT_PUBLIC_ENABLE_GOOGLE_AUTH`(`.env.example`に`false`で追記)。`isGoogleAuthEnabled()` = `isSupabaseConfigured() && flag === "true"`。

4状態を独立プロセスで実測(Node直接実行、`.env.local`は変更せず環境変数のみ操作):

| Supabase設定 | flag | 結果 |
|---|---|---|
| 未設定 | 未設定 | `false` |
| 設定済み | `false` | `false` |
| 設定済み | `true` | `true` |
| 未設定 | `true` | `false`(Supabase未設定が優先、誤表示なし) |

ブラウザでも実測: flag off時はGoogleボタンが完全に非表示・メールフォームは正常動作。flag on時はGoogleボタンが表示される(検証後`.env.local`はテスト前の状態へ復元済み)。

## OAuth開始処理

`client.auth.signInWithOAuth({ provider: "google", options: { redirectTo } })`を使用。`redirectTo`は`buildOAuthCallbackUrl(origin, nextPath)`で構築し、内部で`sanitizeInternalRedirect`を必ず通す(既存の関数をそのまま再利用、新規実装なし)。

**実ブラウザでの実測**(実Supabaseプロジェクトへ接続):
- ボタンクリック → `https://<project>.supabase.co/auth/v1/authorize?provider=google&redirect_to=...&code_challenge=...&code_challenge_method=s256` へ正しく遷移(PKCE使用を確認)
- `next=/lesson?category=cafe`指定時 → `redirect_to`内に`next%3D%252Flesson%253Fcategory%253Dcafe`として正しく二重エンコードされ伝搬
- `next=https://evil.example`(悪意のある値)指定時 → `redirect_to`内は`next%3D%252Faccount`(安全なデフォルト)に強制フォールバック、`evil.example`は結果URLに一切出現しない
- Supabase側は「Unsupported provider: provider is not enabled」(400)を返却 — Google ProviderがSupabase未設定のため。これはコードの問題ではなく設定未完了によるもの

## Callback

`/auth/callback/route.ts`をメール確認リンクとGoogle OAuthの両方で共有(要求どおり)。追加した分岐は「provider側の`error`パラメータ(例: `access_denied`)を`code`/`token_hash`より先に検出し、生の値を一切読み取らず`/login?error=oauth`へリダイレクト」のみ。既存のcode交換・token_hash検証ロジックは無変更。

実測: `/auth/callback?error=access_denied&error_description=user+denied`へ直接アクセス → `/login?error=oauth`へリダイレクトされ、ページに「Die Anmeldung mit Google wurde abgebrochen oder konnte nicht abgeschlossen werden. Bitte versuche es erneut.」を表示。`access_denied`・`user denied`の文字列はページ内に一切出現しない(生エラー非表示を確認)。

## Redirect安全性

自動検証(純関数`buildOAuthCallbackUrl`、実行後削除)+ ブラウザ実測の両方で確認:

- 安全な内部パス(`/lesson?category=cafe`) → 保持
- 外部URL(`https://evil.example`) → 拒否・デフォルトへ
- protocol-relative(`//evil.example`) → 拒否
- `javascript:` → 拒否
- バックスラッシュ(`/\evil.example`) → 拒否
- 埋め込みコロン(`/foo:bar`) → 拒否
- 非文字列(`42`) → 拒否
- 未指定 → デフォルト`/account`

## 既存メール認証

無変更・無回帰。空欄フォーム送信でメールフィールドへの正しいエラー表示+focus移動を実測。Login/Signupの構造・バリデーション・二重送信防止・パスワードリセットフローは一切変更していない。

## 進捗移行・account分離

コード変更なし — 意図的。`AuthProvider`は`onAuthStateChange`/`getSession`でprovider非依存に動作し、`ProgressProvider`の`activateForUser(client, user.id)`は`auth.users.id`のみをキーにする。同一メールアドレスでのGoogle↔パスワード統合はSupabaseの標準Identity Linking機構に委ね、独自のlinkingコードは一切実装していない(要求どおり)。DB triggerも無変更のため、新規Google ユーザーは通常どおり`user_profiles`/`user_progress`が作成され、既存メールと統合されたユーザーは既存の行がそのまま使われる。

## Mobile widths(実測、横スクロールなし)

320(ボタン255×45px)/360/375/390/430/768/1280 — 全幅で`scrollWidth <= innerWidth`を確認。

## Accessibility

Googleロゴ・区切り線はaria-hidden、可視テキストが意味を担持。フォーカス管理は既存グローバルCSS(`:where(button,...):focus-visible`)を継承。role="alert"でエラー通知。

## Build / Lint / Regression

`npm.cmd run build`・`npm.cmd run lint` 0エラー・0警告(flag off状態、Supabase設定済み)。回帰: Home(Zukan入口・マップ)、メールログイン検証、コンソールエラー0(新規タブでのクリーン検証、外部ドメイン遷移によるテスト手法上のノイズを除外)。

## Google Provider live verification

**未確認**(実Supabaseプロジェクトの認可エンドポイントまで到達し「provider is not enabled」を確認したのみ)。Google Cloud Console側のOAuth Client作成、Supabase DashboardへのClient ID/Secret登録は本ドキュメント執筆時点で未実施。手順は [GOOGLE_OAUTH_SETUP_JA.md](GOOGLE_OAUTH_SETUP_JA.md)。

## Remaining issues

1. Google Cloud Console + Supabase Dashboard側の実設定(Client ID/Secret登録)が未完了 — 設定後にSETUP_JA.md手順11〜12で実ログイン確認が必要
2. 同一メールでのアカウント統合(パスワード↔Google)は実際のGoogleアカウントでの実地テストが未実施(Supabaseの標準機能に委ねる設計のため、コード面のリスクはないが実地確認は推奨)
