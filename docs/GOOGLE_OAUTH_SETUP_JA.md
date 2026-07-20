# Google OAuth セットアップ手順(日本語)

既存のSupabaseメール認証へGoogleログインを追加するための、初心者向け設定手順です。所要時間はおよそ20〜30分。

> ⚠️ 大原則
> - **Google Client Secretは絶対にコピー・スクリーンショット・Git・Claudeとの会話へ貼り付けない。** Client Secretを入力する場所はSupabase Dashboardの1箇所だけです。
> - Client Secretは`.env.local`にも`.env.example`にも**書かない**。アプリのコードは一切Client Secretを扱いません(Supabase側が保持します)。

## 1. Google Cloud Project

1. https://console.cloud.google.com にアクセスしてログイン。
2. 上部のプロジェクト選択メニューから「New Project」。
3. プロジェクト名(例: `nihongo-quest-auth`)を入力して作成。

## 2. OAuth consent screen

1. 左メニュー「APIs & Services」→「OAuth consent screen」。
2. User Type: 個人利用なら「External」を選択。
3. アプリ名(例: `Nihongo Quest`)、サポートメール、開発者連絡先メールを入力。
4. ロゴは任意(未設定でも動作します)。

## 3. Branding

1. 「Branding」タブでアプリ名・ロゴ・ホームページURL・プライバシーポリシーURLを設定できます。
2. 本番公開前に、プライバシーポリシーURLの設定を推奨(Googleの審査要件)。
3. テスト段階では「Testing」モードのまま、テストユーザーに自分のGoogleアカウントを追加すれば動作確認できます。

## 4. Scopes

1. 「Data Access」→「Add or Remove Scopes」。
2. 追加するスコープ: `.../auth/userinfo.email` と `.../auth/userinfo.profile`(基本的なメール・プロフィール情報のみ)。
3. それ以上のスコープ(Gmail・Driveなど)は今回不要 — 追加しないこと。

## 5. Web application OAuth client

1. 左メニュー「Credentials」→「Create Credentials」→「OAuth client ID」。
2. Application type: **Web application**。
3. 名前: 任意(例: `Nihongo Quest Web`)。

## 6. localhost origin(開発用)

「Authorized JavaScript origins」に追加:

```
http://localhost:3000
```

「Authorized redirect URIs」に追加(**Supabase側**のコールバックURL — 手順8で確認する値と同じ):

```
https://<あなたのSupabaseプロジェクトref>.supabase.co/auth/v1/callback
```

## 7. Vercel origin(本番用)

同じ画面の「Authorized JavaScript origins」と「Authorized redirect URIs」に本番ドメインも追加:

```
https://<あなたのVercelドメイン>
```

リダイレクトURIはSupabaseのコールバックURL(手順6と同じもの、Supabaseプロジェクトは1つなのでURLも1つ)。

「Create」をクリックすると **Client ID** と **Client Secret** が表示されます。この画面をそのまま次の手順に使い、他へコピー・スクリーンショットしないこと。

## 8. SupabaseにClient ID/Secret登録

1. Supabase Dashboard → 該当プロジェクト → 「Authentication」→「Sign In / Providers」→「Google」。
2. トグルを「Enable」。
3. **Client ID** と **Client Secret**(手順7で取得した値)を貼り付けて保存。
4. この画面に表示される「Callback URL (for OAuth)」が、手順6・7でGoogle Cloud Consoleに登録したリダイレクトURIと**完全に一致**していることを確認。

## 9. NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true

1. `.env.local`(ローカル開発用)に追記:
   ```
   NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true
   ```
2. これは表示スイッチのみで秘密情報ではありません。`false`または未設定の間は、Googleボタンが表示されずメール認証だけが動作します。
3. `npm run dev` を再起動(環境変数は起動時にのみ読み込まれます)。

## 10. Vercel環境変数

1. Vercel プロジェクト →「Settings」→「Environment Variables」。
2. `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH` = `true` を追加。
3. 既存の `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` が設定済みであることを確認(Google認証もSupabase設定に依存します)。
4. Production / Preview 環境ごとに個別設定可能。まずPreviewで動作確認してからProductionへ反映することを推奨。
5. 保存後、**Redeploy** して反映。

## 11. Login test

1. `/login` を開き、「Mit Google fortfahren」ボタンが表示されることを確認。
2. クリックしてGoogleの同意画面に遷移することを確認。
3. アカウントを選択・許可すると `/account` (または元のページ)へ戻り、ログイン済み状態になることを確認。
4. Supabase「Table Editor」→ `user_profiles` / `user_progress` に新しい行(または既存メールと同じ行への統合)ができていることを確認。

**既存メールアカウントとの統合について**: 同じメールアドレスで既にパスワード登録済みのアカウントがある場合、SupabaseはGoogleでログインしても**自動的に同じアカウントへ統合**します(両方とも「確認済みメール」として扱われるため)。アプリ側で特別な処理は行っておらず、Supabaseの標準Identity Linking機能に委ねています。進捗・カード・XPは失われません。

## 12. Logout test

1. ログイン済み状態で `/account` の「Abmelden」をクリック。
2. `/login` に戻り、ヘッダーが「Anmelden」表示に戻ることを確認。
3. 再度Googleでログインし直し、進捗が正しく復元されることを確認。
4. 別のGoogleアカウント(別メール)でログインし、進捗が混在しないことを確認(既存のアカウント分離の仕組みがそのまま機能します)。

## トラブルシューティング

| 症状 | 原因と対処 |
|---|---|
| Googleボタンが表示されない | `.env.local` の `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH` が `true` になっていない、またはdev server未再起動 |
| クリックすると `provider is not enabled` エラー | Supabase側でGoogle Providerがまだ有効化されていない(手順8) |
| Googleの同意画面で `redirect_uri_mismatch` | Google Cloud ConsoleのリダイレクトURIとSupabaseのCallback URLが一致していない(手順6〜8を再確認) |
| ログイン後「Die Anmeldung mit Google wurde abgebrochen...」と表示される | ユーザーが同意画面でキャンセルした、またはGoogle側でエラーが発生した(生エラーは表示されない設計) |
