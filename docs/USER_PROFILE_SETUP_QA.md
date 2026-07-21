# User Profile Setup QA Report

実施日: 2026-07-21 · 対象: ユーザーアイデンティティ基盤(Anzeigename / Nutzer-ID)
環境: Next.js 16.2.10 / @supabase/supabase-js 2.110.7(既存) / dev server + 実ブラウザ + Node直接実行の純関数検証

**Final verdict: Code Complete — Database Migration Pending**
(コードは実Supabaseプロジェクトへ接続し、`is_username_available` RPCが実際に呼び出されエラー〈migration未適用のためfunction not found〉から安全にフォールバックすることを実測。migration自体はまだ本番Supabaseプロジェクトへ適用していない。)

## Files created

- `supabase/migrations/20260720000001_user_identity_profiles.sql` — 列4つ・CHECK制約2つ・unique index・reserved_usernamesテーブル・RPC4種・RLS再宣言
- `src/types/userProfile.ts` — `AppUserProfile`型、行→アプリ型マッパー
- `src/lib/profile/profileValidation.ts` — 純関数(normalizeUsername/validateUsername/validateDisplayName/formatUsername/isReservedUsername/isProfileComplete/getDisplayNameCandidateFromMetadata)
- `src/lib/profile/profileRepository.ts` — fetchOwnProfile/completeUserProfile/updateDisplayName/updateUsername/checkUsernameAvailable
- `src/lib/profile/profileErrors.ts` — mapProfileErrorToGerman
- `src/lib/profile/postAuthRouting.ts` — resolvePostAuthDestination(全認証経路共通の単一ルーティング判定)
- `src/hooks/useUserProfile.ts` — useUserProfile / useRequireCompleteProfile
- `src/components/profile/UsernameField.tsx` — `/profile/setup`・`/profile/edit`共用の「@+入力欄」コンポーネント(debounced availability確認)
- `src/app/profile/setup/page.tsx` — 初回プロフィール設定
- `src/app/profile/edit/page.tsx` — 表示名自由変更+Nutzer-ID確認付き変更
- docs 4点(本ファイル含む)

## Files changed

- `src/types/database.ts` — `UserProfileRow`へ4列追加、`Functions`へRPC4種追加(Insert/Update型は既存どおりRPC経由のみ書き込み可能な設計を維持)
- `src/app/auth/callback/route.ts` — provider側`error`パラメータの早期検出(Google OAuth基盤のcallback分岐を無変更で維持)+`resolvePostAuthDestination`による着地先解決
- `src/app/login/page.tsx` / `src/app/signup/page.tsx` — サインイン/サインアップ成功後、同一の`resolvePostAuthDestination`を使用(重複ロジックなし)
- `src/app/account/page.tsx` — `useRequireCompleteProfile`によるguard追加、Profilセクション(Anzeigename・@username・Profil bearbeiten)追加。既存のE-Mail/Tarif/Fortschritt/Synchronisierung/Abmeldenは無変更

**変更していないもの**(git diffで確認): XP計算・Level計算・Quest・Vocabulary・Kotoba-Zukan・localStorage進捗・`user_progress`のJSON構造・`user_entitlements`・RLSのEntitlement書き込み制限・Google OAuthのfeature flag・メール認証フロー本体・service role key。

## Migration: user_profiles変更

`display_name text` / `username text` / `profile_completed_at timestamptz` / `username_changed_at timestamptz` をすべてnullableで追加(既存ユーザーを壊さない)。既存の`user_id`/`locale`/`created_at`/`updated_at`は無変更。

## Display name

1〜30文字(Unicodeコードポイント基準)、空白のみ/改行/制御文字を拒否、それ以外は自由(HTML風文字列も許可 — Reactがテキストとして安全にレンダリングするため)。クライアント検証(`validateDisplayName`)+DB CHECK制約(`user_profiles_display_name_check`、`[[:cntrl:]]`使用)の二重検証。

## Username

3〜20文字、`^[a-z0-9][a-z0-9_]{1,18}[a-z0-9]$`、DB常時小文字保存・UI表示のみ`@`前置。**Normalization**: trim→`@`除去→lowercase。**Uniqueness**: `unique index on (lower(username))` + RPC内`unique_violation`捕捉の二重保証(TOCTOU安全)。**Reserved words**: 16語、クライアント定数とDBテーブルの両方に同一リストを保持(自動検証で完全一致を確認)。

## RPC

`is_username_available`(SECURITY DEFINER, boolean以外返さない)/ `complete_user_profile`(SECURITY INVOKER, 初回設定)/ `update_display_name` / `update_username`(いずれもSECURITY INVOKER)。全関数`search_path = ''`固定。カスタムerrcode(P0101〜P0104)は既存の`raise exception`デフォルトコード(P0001)と衝突しないよう明示的に割り当て。

## RLS

`user_profiles`の3ポリシー(自分の行のみSELECT/INSERT/UPDATE)は既存のpaid-foundation migrationと同一内容を再宣言(冪等)。他ユーザーのprofileへのSELECTポリシーは**一切追加していない**(公開プロフィールは将来工程)。`reserved_usernames`はRLS有効・ポリシーなしでクライアントから完全に遮断。

## /profile/setup

ドイツ語UI、Google metadata(`full_name`/`name`)からのAnzeigename候補プレフィル(未保存・本人確認なしでは確定しない、メールの`@`前を使わない)、debounced username availability(550ms、3文字未満は問い合わせなし、同一値の重複リクエストをスキップ、unmount/rerun安全)。送信中二重防止・44px・aria-describedby/aria-invalid/role=alert・エラー時focus移動を実装。

## /profile/edit

表示名は即時自由変更。Nutzer-ID変更は「ändern」ボタンで編集モードへ切替→`window.confirm`による明示確認→保存という独立した確認付き操作。存在しない30日クールダウン等の制限はUIに一切表示していない。

## Account

Profilセクション(Anzeigenameと@username、Profil bearbeitenリンク)を追加。内部UUIDは表示せず、メールアドレスとProfil情報を明確に区別して別カードに配置。`useRequireCompleteProfile`によりプロフィール未完成ユーザーは`/profile/setup`へ自動誘導(コンテンツのフラッシュ表示なし)。

## Post-auth routing

`resolvePostAuthDestination(profile, next)`が唯一の判定箇所。`/auth/callback`(メール確認+Google OAuth共通)・`/login`(パスワードログイン成功後+既にログイン済みでの再訪問)・`/signup`(即時セッション確立時+既にログイン済みでの再訪問)の**全経路**がこの同一関数を呼び出す(自動検証でハードコードされた重複ルーティングが存在しないことを確認)。プロフィール取得失敗は「未完成」扱いへフェイルセーフ。

## Email login

無変更・無回帰。空欄フォーム送信時の適切なエラー表示+focus移動を実測。

## Google OAuth

feature flagの仕組み・callbackのcode/token_hash処理は無変更。Google metadata prefillは`getDisplayNameCandidateFromMetadata`で実装し、メール由来の推測は一切行わない(自動検証で関数本体に`@`分割ロジックが存在しないことを構造確認)。

## Existing user

既存ユーザー(display_name/username共にnull)は次回ログイン時に`resolvePostAuthDestination`が`isProfileComplete`をfalse判定し`/profile/setup`へ誘導。`user_progress`・XP・カード・`user_entitlements`・`user_id`には一切触れない設計(SQL migrationは`user_profiles`のみを対象、progress/entitlementテーブルへの変更なし)。

## User A/B・progress/entitlement維持

手順は[USER_PROFILE_SUPABASE_SETUP_JA.md](USER_PROFILE_SUPABASE_SETUP_JA.md)の6章に記載。今回はmigration未適用のため実データでの検証は未実施(Live Verification Pending)。コードレベルでは`useUserProfile`が`user.id`をキーに完全に分離されたfetch状態を持つ設計(EntitlementProvider/ProgressProviderと同一パターン)であり、Progress/Entitlementのテーブル・RLS・トリガーは今回のmigrationで一切変更していないため、既存の分離保証がそのまま適用される。

## Mobile widths(実測)

320 / 360 / 375 / 390 / 430 / 768 / 1280 すべてで横スクロールなしを確認。`/profile/setup`・`/profile/edit`は未ログイン時に`/login`へ即座にリダイレクトされるため(実測で確認、下記「発見・修正したバグ」参照)、UsernameFieldコンポーネント単体を一時的な検証専用ルート(QA後に完全削除)で全幅レンダリングし、`@`プレフィックスと入力欄の重なりなし・44px高さ・横スクロールなしを実測。

## 発見・修正したバグ

**`/profile/edit`が未ログイン時に無限「Lädt…」状態になっていた**: `useRequireCompleteProfile`は「ログイン済みだがプロフィール未完成」の場合のみ`/profile/setup`へリダイレクトする設計で、「そもそも未ログイン」のケースは各ページが個別に処理する既存の慣習(`/account`は独自の`useEffect`で処理)だったが、`/profile/edit`にこのガードを追加し忘れていた。ブラウザQATで発見し、`/account`と同一パターンの`useEffect`(`/login?next=%2Fprofile%2Fedit`へリダイレクト)を追加して修正、実測で解消を確認。

## Security

`git grep`ベースの構造検証で: service role key文字列なし・`dangerouslySetInnerHTML`実使用なし(コメント内の言及のみ、props形式では0件)・`{user.id}`等の生UUID描画なし。RLS/RPC設計は上記のとおり。SQLインジェクションは全RPCがplpgsqlのバインド変数(`p_username`等)を使用しdynamic SQLを一切使わないため構造的に不可。

## Automated validation: 102/102 PASS(一時ファイル削除済み)

Username(長さ2/3/20/21文字、正規化、日本語/ハイフン/空白/先頭・末尾アンダースコア拒否、予約語16件、大文字小文字無視の等価性)、Display name(空/空白のみ/1/30/31文字、Unicodeコードポイント長〈絵文字での検証含む〉、日本語許可、改行/タブ/CR拒否、HTML風文字列は非拒否)、Completeness(4パターン)、Routing(未完成/null/安全next/悪意next×4種/Google prefill/メール非使用の構造確認)、エラーマッピング(生SQLSTATE非露出)、SQL migrationとのreserved words完全一致・正規表現一致・unique_violation捕捉の存在確認、guard対象ページ(/account, /profile/edit)と非対象ページ(Home/Lesson/Vocabulary/Practice)の構造確認。

## Build / Lint

`npm.cmd run build` 0エラー(全16ルート+Proxy、Supabase設定済み状態)。`npm.cmd run lint` 0エラー・0警告。実装過程で発見した`react-hooks/set-state-in-effect`違反3件(useUserProfile.ts、profile/setup/page.tsx)はReact公式推奨の「レンダー中に比較して調整する」パターンへ書き換えて解消(EntitlementProviderで確立済みの本プロジェクトの既存パターンを踏襲)。

## Supabase live verification

**部分的に実施**: 実Supabaseプロジェクトの`is_username_available` RPCへ実際にリクエストが送られ、migration未適用のため失敗し、UIが「Verfügbarkeit konnte nicht geprüft werden — wird beim Speichern erneut versucht.」へ安全にフォールバックすることを実ブラウザで確認(クラッシュなし・生エラー非表示)。migration自体の適用、`complete_user_profile`での実際のプロフィール作成、User A/B分離の実データ確認は**未実施**。

## Remaining issues

1. Migration本体が本番Supabaseプロジェクトへ未適用 — 適用手順は[USER_PROFILE_SUPABASE_SETUP_JA.md](USER_PROFILE_SUPABASE_SETUP_JA.md)
2. Migration適用後、User A/B作成・username競合・progress/entitlement維持の実データQA(Phase 21 C/D)が未実施
3. 実Googleアカウントでの`full_name`プレフィル実地確認は未実施(Google Provider自体が実プロジェクトで未設定のため、既存のGoogle OAuth QAドキュメントと同じ制約を継承)
