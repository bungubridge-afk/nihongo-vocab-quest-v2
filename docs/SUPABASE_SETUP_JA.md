# Supabase セットアップ手順(日本語)

初心者向けに、Nihongo Quest の有料版基盤(アカウント + クラウド進捗保存)を動かすための Supabase 設定手順をまとめます。所要時間はおよそ 20〜30 分です。

> ⚠️ 大原則
> - **secret key(`sb_secret_...`)と service role key は絶対にコピーしない・スクリーンショットに写さない・Gitへ保存しない。** 今回の機能では一切不要です。
> - `.env.local` は Git に入れない(`.gitignore` 済み)。コミット前に `git status` に `.env.local` が出ていないことを確認する。

## 1. Supabase Project 作成

1. https://supabase.com にアクセスし、GitHub などでサインアップ/ログイン。
2. 「New project」をクリック。
3. Organization を選び、以下を入力:
   - Name: `nihongo-quest`(任意)
   - Database Password: 自動生成のまま「Copy」してパスワードマネージャーへ保存(このパスワードもGit・スクショ禁止)
   - Region: `Central EU (Frankfurt)` などユーザーに近い場所
4. 「Create new project」を押し、数分待つ。

## 2. Project URL の取得

1. 左メニュー最下部の歯車「Project Settings」→「API Keys」または「Data API」を開く。
2. 「Project URL」(例: `https://abcdefghijkl.supabase.co`)をコピー。

## 3. Publishable key の取得

1. 同じ「API Keys」画面で **「Publishable key」**(`sb_publishable_...` で始まる)をコピー。
2. すぐ下に **secret keys**(`sb_secret_...`)がありますが、**触らない**こと。
   - 旧形式の「anon public」キーしか表示されない場合は、それを Publishable key の代わりに使えます。

## 4. `.env.local` 作成

1. プロジェクトルートの `.env.example` をコピーして `.env.local` を作る。
2. 次の2行を実値で埋める:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijkl.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxx
```

3. `npm run dev` を再起動する(環境変数は再起動時にのみ読み込まれる)。
4. ヘッダー右上に「Anmelden」が表示されれば読み込み成功。

## 5. SQL Migration 適用

1. Supabase 左メニュー「SQL Editor」→「New query」。
2. リポジトリの `supabase/migrations/20260718000001_paid_foundation.sql` の中身を**全文**貼り付ける。
3. 「Run」をクリック。`Success. No rows returned` と出れば成功。
4. 左メニュー「Table Editor」に `user_profiles` / `user_progress` / `user_entitlements` の3テーブルが見えることを確認。

## 6〜9. URL 設定(Site URL / Redirect URL)

1. 左メニュー「Authentication」→「URL Configuration」。
2. **Site URL**: 本番のURL(例: `https://nihongo-quest.vercel.app`)。まだ無ければ `http://localhost:3000`。
3. **Redirect URLs** に以下を**すべて**追加:
   - `http://localhost:3000/auth/callback`(ローカル開発用)
   - `https://<あなたのVercelドメイン>/auth/callback`(本番用)
   - Vercel の Preview も使うなら `https://*-<team>.vercel.app/auth/callback` のようなワイルドカード
4. 「Save」。

## 10. Email confirmation 設定

1. 「Authentication」→「Sign In / Providers」→「Email」。
2. 「Confirm email」が **ON**(デフォルト)であることを確認。ONのままにする:
   - ONだと signup 後に確認メールが届き、リンクを踏むと `/auth/callback` 経由でログインされる。
3. 送信数制限: 標準のメール送信は開発用で1時間あたりの上限が小さい。本格運用前に「Authentication → Emails → SMTP Settings」で独自SMTP(Resend等)を設定する。

## 11〜12. Vercel 環境変数

1. Vercel のプロジェクト →「Settings」→「Environment Variables」。
2. 以下を追加:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = Publishable key
3. 環境は **Production / Preview / Development すべて**にチェック(Previewで動作確認したい場合)。
4. 保存後、**Redeploy** して反映。
5. `SUPABASE_SERVICE_ROLE_KEY` は**追加しない**(今回不要。Stripe Webhook実装時に初めてサーバー専用で追加する)。

## 13. 動作確認

1. `/signup` で新規登録 → 「Fast geschafft!」画面。
2. 届いたメールのリンクをクリック → `/account` に到達しメールアドレスが表示される。
3. Supabase「Table Editor」→ `user_profiles` と `user_progress` に自分の行が1つずつあること(triggerの動作確認)。
4. 匿名でCafé を完了したブラウザでログインした場合: `/account` の Fortschritt に XP 50 / Karten 5 が表示され、`user_progress.progress` にも反映されている。
5. リロードしても進捗が維持される。

## 14. RLS 確認(2ユーザー)

1. User A / User B の2アカウントを作る(メールエイリアス `you+a@gmail.com` / `you+b@gmail.com` が便利)。
2. SQL Editor で次を実行し、**サービスロールとしては**両方の行が見えることを確認:
   ```sql
   select user_id, progress->>'xp' as xp from public.user_progress;
   ```
3. アプリ側の確認: User B でログインしても User A の XP・カードが一切表示されないこと。
4. クライアントからの越境が拒否されることの確認(ブラウザのDevTools Consoleで、ログイン中に):
   ```js
   // 他人のprogressは0件しか返らない(エラーではなく空)
   // 自分へのentitlement insertはRLSで拒否される
   ```
   Account画面での目視+次項のentitlementテストで十分です。

5. **User A が自分へ Premium を付与できないこと**: ログイン状態のブラウザ Console で
   ```js
   const { createClient } = window; // アプリはクライアントを公開していないため、
   ```
   …アプリは Supabase クライアントをグローバルに公開していないので、そもそもUIからは不可能。API的な確認をしたい場合は `curl` で publishable key + ユーザーの access token を使い `POST /rest/v1/user_entitlements` を叩くと `42501 (RLS violation)` などの権限エラーになることを確認する。

## 15. 手動テスト用 Entitlement 付与

自分を Premium にしてUI表示を確認する(SQL Editor で実行、`<USER-ID>` は Authentication → Users からコピー):

```sql
insert into public.user_entitlements (user_id, product_key, status, source)
values ('<USER-ID>', 'premium_lifetime', 'active', 'manual');
```

→ アプリの `/account` をリロードすると「Tarif: Premium」になる。

期限付きサブスクのテスト:

```sql
insert into public.user_entitlements (user_id, product_key, status, source, ends_at)
values ('<USER-ID>', 'premium_subscription', 'active', 'manual', now() + interval '7 days')
on conflict (user_id, product_key)
do update set status = 'active', ends_at = now() + interval '7 days';
```

## 16. Entitlement 削除

```sql
delete from public.user_entitlements
where user_id = '<USER-ID>' and product_key = 'premium_lifetime';
```

→ `/account` が「Kostenlos」に戻る。

## トラブルシューティング

| 症状 | 原因と対処 |
|---|---|
| ヘッダーに Anmelden が出ない | `.env.local` の値が空/タイポ、またはdev server未再起動 |
| 確認メールが届かない | 標準メールの送信上限。時間を置くか独自SMTPを設定 |
| メールリンクで「Die Bestätigung hat nicht geklappt」 | リンク期限切れ、またはRedirect URLs未登録。手順6〜9を確認 |
| signup後にテーブルへ行ができない | Migration未適用でtriggerが無い。手順5を再実行(既存ユーザーは初回保存時にRPCが自己修復でINSERTする) |
| 「Synchronisierung fehlgeschlagen」 | ネットワーク/RLS。オンラインなら Account の「Erneut versuchen」 |
