# User Profile Identity Spec

Stand: 2026-07-21 · 対象: ユーザーアイデンティティ基盤(Anzeigename / Nutzer-ID)

## Purpose

メール認証・Google OAuth・将来のApple OAuthすべてで共通利用する、2つの明確に分離されたアイデンティティ概念を導入する。Supabase Authの内部UUIDはユーザーへ一切表示しない。この工程は将来の公開プロフィール・友人機能・週間リーグ・ユーザー検索の**前提**であり、それら自体は実装しない。

## Display name(Anzeigename)

- 自由記述、他ユーザーと重複可能
- trim後1〜30文字(Unicodeコードポイント基準)
- 日本語・ラテン文字・数字・一般記号・絵文字を許可
- 空白のみ・改行・制御文字は拒否
- HTMLタグに見える文字列(`<b>`等)も**有効な入力**として許可する — ReactがプレーンテキストとしてレンダリングするためXSSリスクはなく、`dangerouslySetInnerHTML`はこのアプリのどこでも使用しない
- 変更は`/profile/edit`からいつでも自由に可能(確認ダイアログなし)

実装: `src/lib/profile/profileValidation.ts` の `validateDisplayName()`。DB側は`user_profiles_display_name_check` CHECK制約で同じルールを再検証(最終権威)。

## Username(Nutzer-ID)

- `@mada_jp` のような固有ハンドル。大文字小文字を無視して一意
- DBには`@`を除いた小文字で保存、UIは常に`@`を付けて表示
- 詳細ルールは [USERNAME_POLICY.md](USERNAME_POLICY.md)
- 初回設定後も`/profile/edit`から変更可能(確認ダイアログ必須、詳細は同ドキュメント)

## Internal UUID(Supabase Auth)

`auth.users.id`(UUID)はアプリ内部の外部キーとしてのみ使用し、**いかなる画面にも文字列として表示しない**。React key・DB外部キー・RLSの`auth.uid()`比較にのみ用いる。自動検証で「JSXへ`{user.id}`等を直接描画するパターンが存在しないこと」を構造的に確認済み。

## Auth providers

メール+パスワード、Google OAuth(feature flag制御)、将来のApple OAuthすべてが同一の`user_profiles`行・同一の`resolvePostAuthDestination()`ルーティング判定を共有する。プロバイダ間のアカウント統合(同一メールでのGoogle↔パスワード)はSupabase標準のIdentity Linkingに委ね、独自実装は行わない(既存のGoogle OAuth基盤の設計方針を継承)。

## Initial setup

`/profile/setup`。新規登録・既存ユーザーの初回ログインを問わず、`display_name`・`username`・`profile_completed_at`のいずれかがnull/空なら誘導される。Google OAuthの`user_metadata.full_name`/`name`はAnzeigenameの**候補**としてフォーム欄へ事前入力されるのみで、本人確認・保存は必ずユーザーの明示的な送信操作を要する。メールの`@`より前を表示名として使うことは一切ない。

## Account

`/account`にProfilセクション(Anzeigename・@username・「Profil bearbeiten」リンク)を追加。既存のE-Mail・Tarif・Fortschritt・Synchronisierung・Abmeldenは無変更。メールアドレスは公開プロフィール情報と明確に区別し、Profilセクションには一切含めない。

## Future public profile / friends / leaderboard

usernameは将来のユーザー検索・友人機能・公開プロフィールURL(`/u/mada_jp`等)・週間リーグ表示のための安定ハンドルとして設計されている。現時点では他ユーザーのプロフィールをSELECTするRLSポリシーは**一切存在しない**(自分の行のみ)。公開プロフィール実装時は、新たな限定的SELECTポリシー(例: username/displayName等の公開可能列のみを対象とするビュー)を別途追加する想定。

## Privacy

- メールアドレスは`auth.users`にのみ存在し、`user_profiles`へ複製しない(既存の paid-foundation 設計を継承)
- `is_username_available` RPCはboolean以外(誰が使用中か・user_id・email)を一切返さない
- username availability確認は他ユーザー行を直接SELECTしない(SECURITY DEFINER RPC経由)
- RLSは自分の行のみSELECT/INSERT/UPDATE。他ユーザーのprofileは今回も引き続き取得不可
