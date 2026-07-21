# Username Policy

Stand: 2026-07-21 · 実装: `src/lib/profile/profileValidation.ts`(クライアント側) + `supabase/migrations/20260720000001_user_identity_profiles.sql`(DB側、最終権威)

## Format

- 3〜20文字(Unicodeコードポイント基準 — `[...value].length`。PostgresのC`har_length()`と一致させるため、JavaScriptの`.length`〈UTF-16コード単位〉は使わない)
- 使用可能文字: 小文字英字・数字・アンダースコア(`a-z0-9_`)
- 先頭と末尾は英数字(アンダースコア不可)
- 正規表現: `^[a-z0-9][a-z0-9_]{1,18}[a-z0-9]$`(3文字ちょうどのケース、例: `abc`も正しく通過することを自動検証済み)
- ハイフン・空白・日本語・絵文字・大文字(正規化前)は拒否

## Normalization

1. 前後の空白をtrim
2. 先頭の`@`があれば除去(ユーザーが`@mada_jp`と貼り付けても動作するため)
3. 小文字化

DBには常に正規化済み(小文字・`@`なし)の値のみ保存する。UI表示時のみ`@`を前置する(`formatUsername()`)。

## Uniqueness

- 大文字小文字を無視して一意。`create unique index ... on user_profiles (lower(username)) where username is not null`
- クライアント側の`is_username_available` RPCは**補助的な確認のみ**であり保証ではない。最終的な一意性はDBのunique indexが保証する
- 同時に同じusernameを登録しようとした場合、DBレベルで1件だけ成功する。`complete_user_profile`/`update_username` RPCは`unique_violation`例外を捕捉し`username_taken`エラーへ正規化する(TOCTOU競合に対して安全)

## Reserved words

以下の16語は予約済みで、いかなるユーザーも取得できない(クライアント側`RESERVED_USERNAMES`定数とDB側`reserved_usernames`テーブルの両方に同一リストを保持):

```
admin, administrator, support, help, official,
nihongo, nihongoquest, moderator, system, root,
api, account, login, signup, settings, profile
```

予約判定はクライアント側(即時フィードバック用)、RPC(`is_username_available`/`complete_user_profile`/`update_username`)、そして`user_profiles`への`BEFORE INSERT OR UPDATE OF username`トリガー`reject_reserved_username`(最終権威)の三重で行われる。トリガーはRPCを経由しない直接UPDATE(例: `supabase-js`の`.from('user_profiles').update(...)`)でも予約語を拒否するため、RLSの「自分の行のみ」制限だけでは保証できない値レベルの制約を担保する。

## Changes

- **今回のMVP**: `/profile/edit`から変更可能。変更は独立した確認ダイアログを要する操作として実装(表示名の自由変更とは明確に区別)
- 変更時は再度フォーマット検証・availability確認・DB unique制約による最終検証を経る
- `username_changed_at`列に変更日時を記録(初回設定時にも設定される)
- **今回実装しないもの**: 30日クールダウン等の変更頻度制限。UIには存在しない制限を一切表示しない

## Future public URLs

usernameは将来`/u/mada_jp`のような公開プロフィールURLのスラッグとして使用される想定。現行の文字セット制限(`a-z0-9_`のみ)はURLセーフであり、追加のエンコーディングなしでパス segment として利用できる。

## Abuse considerations

- 予約語リストにより、公式アカウントや管理機能を騙る可能性のある固有IDの取得を防止
- usernameの変更時に旧usernameが即座に解放される設計のため、将来「なりすまし」目的での連続的なusername取得・解放が懸念される場合は、変更頻度制限(30日クールダウン等)や変更履歴の保持を将来検討する
- Unicode文字を許可しない(a-z0-9_のみ)ことで、視覚的に類似した文字(Unicode confusable文字)によるなりすましリスクをusername自体からは排除している。Display nameはUnicodeを許可するため、なりすまし対策は主にusernameの一意性・予約語制御に依存する設計
