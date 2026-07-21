# User Profile Supabase セットアップ手順(日本語)

ユーザーアイデンティティ基盤(Anzeigename / Nutzer-ID)のSupabase側設定手順です。前提として、既存のpaid-foundation migration(`20260718000001_paid_foundation.sql`)が既に適用済みであること。

## 1. Migration適用

1. Supabase Dashboard → 該当プロジェクト → 「SQL Editor」→「New query」
2. リポジトリの `supabase/migrations/20260720000001_user_identity_profiles.sql` の中身を**全文**貼り付ける
3. 「Run」をクリック。`Success. No rows returned` と出れば成功
4. 「Table Editor」→ `user_profiles` に `display_name` / `username` / `profile_completed_at` / `username_changed_at` の4列が追加されていることを確認
5. `reserved_usernames` テーブルが新規作成され、16行(admin, account, login等)が入っていることを確認

## 2. RPC確認

「Database」→「Functions」に以下4件が作成されていることを確認:

- `is_username_available(p_username text) returns boolean`
- `complete_user_profile(p_display_name text, p_username text) returns user_profiles`
- `update_display_name(p_display_name text) returns user_profiles`
- `update_username(p_username text) returns user_profiles`

## 3. RLS確認

「Authentication」→「Policies」→ `user_profiles` に以下3件のポリシーがあることを確認(既存のpaid-foundation migrationと同一、今回のmigrationは再宣言のみ):

- `user_profiles_select_own`(SELECT, 自分の行のみ)
- `user_profiles_insert_own`(INSERT, 自分の行のみ)
- `user_profiles_update_own`(UPDATE, 自分の行のみ)

`reserved_usernames` はRLS有効・ポリシーなし(クライアントから一切アクセス不可、`is_username_available`関数〈SECURITY DEFINER〉経由でのみ参照される)。

## 4. Constraints確認

SQL Editorで以下を実行し、CHECK制約が効いていることを確認:

```sql
-- 失敗するはず(3文字未満)
update public.user_profiles set username = 'ab' where user_id = auth.uid();

-- 失敗するはず(大文字を含む)
update public.user_profiles set username = 'MadaJP' where user_id = auth.uid();

-- 失敗するはず(空白のみ)
update public.user_profiles set display_name = '   ' where user_id = auth.uid();
```

いずれも `new row for relation "user_profiles" violates check constraint` エラーになれば正常。

## 5. Existing users(既存ユーザー)

Migration適用前から存在するユーザーの`display_name`/`username`は自動的に`null`のままです(既存のトリガー`handle_new_user`は無変更、今回のmigrationは列追加のみでバックフィルは行いません)。これは意図した挙動です — 次回ログインまたは`/account`アクセス時にアプリ側が自動的に`/profile/setup`へ誘導します。

## 6. テストUser A / User B

1. User A: `you+a@gmail.com` でSignup → `/profile/setup` → Anzeigename「Mada A」、Nutzer-ID `mada_a` を登録
2. User B: `you+b@gmail.com` でSignup → `/profile/setup` → Anzeigename「Mada B」、Nutzer-ID `mada_b` を登録
3. **一意性確認**: User Bで同じブラウザから一度Logout → User Bのセッションのまま Nutzer-ID `mada_a`(User Aが既に取得済み)を登録しようとする → 「Diese Nutzer-ID ist bereits vergeben」エラーになることを確認
4. **RLS確認**: SQL Editor(サービスロール権限)ではなく、実際のクライアントセッションで User A が User B の `user_profiles` 行をSELECTできないことを確認(`/account`のProfilセクションが常に自分の情報のみ表示することで間接的に確認可能)
5. **分離確認**: User A → Logout → User B → Login し、User Aの表示名/Nutzer-IDがUser Bの画面に一切表示されないことを確認

## 6.5. RPC権限ポリシー(Default Privileges) — 実DBライブQAで発見・修正

実Supabaseプロジェクトへの実DBライブQAで、`20260720000001`の`revoke all on function ... from public;`だけでは**`anon`ロールが4つのRPC全てを実行できてしまう**ことが判明した(`complete_user_profile`等は内部の`auth.uid() is null`チェックで実害なく拒否されていたが、それは権限設定が効いていたからではなく関数自身の自己防御によるもの。`is_username_available`には該当チェックが無く、未認証のまま実際のavailability結果〈true/false〉を取得できてしまっていた)。

原因: Supabaseはプロジェクト作成時、`public`スキーマの新規関数に対して`anon`/`authenticated`/`service_role`へ**直接**EXECUTE権限を自動付与するdefault privilegesルールを持つ。`revoke all on function ... from public`はPostgresが自動付与する`PUBLIC`疑似ロール分のみを取り消し、この直接付与には効かない。

修正(`20260721000001_profile_rpc_grant_hardening.sql`):

1. 4関数(`is_username_available(text)` / `complete_user_profile(text, text)` / `update_display_name(text)` / `update_username(text)`)それぞれに対し、`revoke all ... from public, anon, authenticated;` → `grant execute ... to authenticated;` を明示実行(`anon`を名指しでrevokeするのが今回の要点)。
2. 今後の再発防止として:
   ```sql
   alter default privileges for role postgres in schema public
     revoke execute on functions
     from public, anon, authenticated, service_role;
   ```
   を追加。`ALTER DEFAULT PRIVILEGES`は**今後postgresロールが作成する関数にのみ**適用され、既存関数(`save_user_progress`含む)の権限やuser_progress/user_entitlements等の既存テーブルには一切影響しない。適用後は、**新しいRPCを追加する migration は必ず明示的な`grant execute ... to <role>;`を書かないと、authenticatedからも含め誰からも呼べない関数になる**(anon.uid()チェックの書き忘れが「silentにanonへ公開される」のではなく「即座に全ロールから permission denied になる」形でQA時に気づけるようにするための意図的な変更)。今後profile関連に限らずRPCを追加する際は、このルールを踏まえて必ず対象ロールへのGRANTをmigrationに含めること。

## 7. Rollback

今回のmigrationは列追加・新規テーブル・新規関数のみで、既存の`user_progress`/`user_entitlements`/既存RLSポリシーには一切触れていません。ロールバックする場合:

```sql
drop trigger if exists reject_reserved_username_trigger on public.user_profiles;
drop function if exists public.reject_reserved_username();
drop function if exists public.update_username(text);
drop function if exists public.update_display_name(text);
drop function if exists public.complete_user_profile(text, text);
drop function if exists public.is_username_available(text);
drop table if exists public.reserved_usernames;

alter table public.user_profiles
  drop constraint if exists user_profiles_username_format_check,
  drop constraint if exists user_profiles_display_name_check;

drop index if exists public.user_profiles_username_unique_idx;

alter table public.user_profiles
  drop column if exists display_name,
  drop column if exists username,
  drop column if exists profile_completed_at,
  drop column if exists username_changed_at;
```

ロールバック後、アプリ側コードは`fetchOwnProfile`が失敗し「常に未完成扱い」へフェイルセーフに戻る(クラッシュしない設計だが、`/profile/setup`が保存できない状態になるため、ロールバック時はアプリのデプロイも合わせて戻すことを推奨)。

### 20260721000001(RPC権限ハードニング)のロールバック

先に必ずdefault privilegesを戻すこと。これを戻さないまま上記の関数群を再作成すると、新規関数扱いとなり今度は誰からもEXECUTEできない関数として作られてしまう:

```sql
alter default privileges for role postgres in schema public
  grant execute on functions
  to public, anon, authenticated, service_role;
```

その後、4関数の権限を元(6.5節導入前、`20260720000001`適用直後)の状態、すなわち`anon`にも実質EXECUTE可能な状態へ戻したい場合は各関数に`grant execute ... to anon;`を追加で実行する — ただし6.5節の脆弱性を再導入することになるため、通常はこのロールバックを行う理由はない。
