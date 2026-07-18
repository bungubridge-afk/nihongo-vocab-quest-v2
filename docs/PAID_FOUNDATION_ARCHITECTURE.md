# Paid Foundation Architecture

Stand: 2026-07-18 · Next.js 16.2.10 (App Router, Turbopack) · React 19.2.4 · @supabase/ssr 0.12.3 · @supabase/supabase-js 2.110.7

このドキュメントは、有料版に向けた基盤(Auth / Database / Progress / Entitlement)の全体構成を説明する。Stripe決済そのものは未実装で、このパスの外にある。

## 全体構成

```
Browser (Client Components)
├── AppProviders (src/components/providers/AppProviders.tsx)
│   ├── AuthProvider        … Supabase session (cookieベース, @supabase/ssr)
│   ├── EntitlementProvider … isPremium / activeProducts (表示用, fail closed)
│   └── ProgressProvider    … active progress store + cloud sync
├── ページ群 … 進捗は必ず src/lib/storage.ts 経由(保存先を知らない)
└── getSupabaseBrowserClient (publishable keyのみ)

Server (Node runtime)
├── src/proxy.ts            … Next.js 16のproxy規約(旧middleware)。セッション更新のみ
├── createSupabaseServerClient … Server Component / Route Handler / Server Action用
├── src/lib/auth/server.ts  … getServerUser / requireUser
└── src/lib/entitlements/server.ts … getServerEntitlements / requirePremiumAccess / hasProductAccess

Supabase
├── auth.users              … メール・パスワード(アプリDBへ複製しない)
├── public.user_profiles    … アプリ設定 (RLS: 本人のみ)
├── public.user_progress    … AppProgress JSON + revision (RLS: 本人のみ)
├── public.user_entitlements… 購入権限 (RLS: 本人SELECTのみ, client write不可)
└── RPC save_user_progress  … revision条件付き保存 (security invoker)
```

## Auth

- 公式 @supabase/ssr の現行方式(getAll/setAll cookie)。deprecatedなauth-helpersは不使用。
- Next.js 16では `middleware.ts` が非推奨のため **`src/proxy.ts`**(named export `proxy`、Nodeランタイム固定)を使用。役割はセッションcookieの更新のみで、リダイレクトやアクセス制御は行わない(Area 1は常に公開)。
- ルート: `/login` `/signup` `/forgot-password` `/reset-password` `/auth/callback`(Route Handler) `/account`。すべてドイツ語UI。
- `/auth/callback` はPKCE (`?code=`) とtoken-hash OTP (`?token_hash=&type=`) の両方に対応。redirect先は `sanitizeInternalRedirect` で必ずアプリ内パスに制限。
- Supabase未設定 (`isSupabaseConfigured() === false`) の場合、認証UIは案内文のみ表示し、無料アプリは従来どおり動作する。

## Progress

- 正規形は `AppProgress`(src/lib/progress/progressTypes.ts): profile / xp / collectedCardIds / completedCategories / unlockedCategories / knownWords / weakWords。Levelは常にXPから導出し保存しない。
- `src/lib/storage.ts` は従来と同一のシグネチャのまま **facade** となり、`progressStore.ts` のactive backendへ委譲する。
  - 匿名: レガシーキー(`nvq_profile` 等7キー)をそのまま使用 — 既存ユーザーの進捗を1バイトも動かさない。
  - ログイン済み: `nvq_user_progress_cache_v1:<user-id>` の単一JSONキャッシュ。
- `ProgressProvider` はauth状態に応じてbackendを切替え、`(backendId, dataEpoch)` をkeyに子ツリーを再マウントさせる。各ページは既存の「マウント時に一度読む」パターンのまま無変更でクラウド対応になる。
- 同期は `progressSyncService.ts`(600msデバウンス、revision条件付き保存、mergeによる競合解決、online復帰時再試行)。詳細は AUTH_PROGRESS_SYNC_SPEC.md。

## Entitlement / Free & Premium

- 判定は純関数 `hasPremiumAccess(entitlements, now?)`(src/types/entitlement.ts)。クライアント(表示)とサーバー(将来の強制)で同一ロジック。
- クライアント: `EntitlementProvider` → `isPremium` / `activeProducts` / `isLoading`。未ログイン・未設定・取得失敗はすべて **Free (fail closed)**。
- サーバー: `requirePremiumAccess()` / `hasProductAccess(productKey)` を将来の有料Route Handler / Server Componentで使用する。localStorage・query param・client stateによるPremium化は構造的に不可能(RLSでclient writeを拒否、判定はDB行のみ)。
- 表示は /account の「Tarif: Kostenlos / Premium」チップのみ。購入ボタン・Coming Soonは置かない。

## 信頼境界

| 層 | 信頼するもの | 信頼しないもの |
|---|---|---|
| Browser | 表示用のisPremium、ローカルキャッシュ | — |
| RLS (Postgres) | `auth.uid()` | クライアントの主張するuser_id・entitlement書込み |
| Server helpers | `supabase.auth.getUser()`(トークン再検証) | cookieの生値、client state |
| 将来のStripe Webhook | Stripe署名検証 + service role key(サーバーのみ) | クライアント |

- service role keyは現在コードベースのどこからも参照しない(.env.exampleにも載せない)。必要になるのはStripe Webhook実装時で、その際もNEXT_PUBLIC_を付けずサーバー専用。
- publishable key / URLのみ `NEXT_PUBLIC_` で公開。

## データフロー(代表例)

1. 匿名でQuest完了 → storage.recordCategoryCompletion → 匿名backendのlocalStorageへ即時保存。ネットワークなし。
2. Signup → 確認メール → /auth/callback → セッション確立 → DB triggerが `user_profiles` + `user_progress`(初期値, revision 0)を作成。
3. 初回ログイン → ProgressProvider → activateForUser → remote fetch → revision 0なら匿名進捗をimportしてRPC保存(revision 1)、匿名進捗を「このアカウントがimport済み」とマーク。
4. 以降の学習操作 → user cacheへ即時保存 + 600ms後にRPC保存(revision +1)。競合時はmergeして再保存、解決不能ならremote維持+同期エラー表示。
5. サインアウト → 可能ならflush → 匿名backendへ復帰 → 同期済みならuser cacheを消去(共有端末で他人の進捗を残さない)。

## 将来のStripe接続

- Webhook (`checkout.session.completed` 等) → service roleで `user_entitlements` へ upsert(user_id + product_keyの一意制約が冪等性を担保)。
- `metadata` にはStripeの customer id / subscription id など**秘密でない**参照だけを入れる(カード情報・決済秘密は禁止)。
- status遷移のマッピング案は ENTITLEMENT_SPEC.md の「Stripe webhook future mapping」を参照。
- キャンセルは `status = canceled` + `ends_at = 現在の期間終了` で期間末まで有効。

## 将来のArea 2

- コンテンツ追加時、サーバー側は `requirePremiumAccess()` または `hasProductAccess("area2_pack")` でルートを守る。
- クライアントの `isPremium` はロック表示の出し分けにのみ使う。UI非表示だけに頼らない。

## Remaining risks

- Supabase実環境での動作(signup mail、trigger、RLS)は未検証 — 「Supabase Live Verification Pending」。手順は SUPABASE_SETUP_JA.md、チェックリストは AUTH_DB_QA.md。
- 複数端末の**同時**編集はrevision+mergeで進捗消失は防ぐが、リアルタイム同期ではない(最後にfetchした側が手動同期/再ログインで揃う)。
- 匿名進捗の「import済み」マークはブラウザローカルのため、localStorageを消すと再import判定が復活する(remoteに進捗があれば自動importはされず、手動importの選択肢が出るだけ — 破壊はしない)。
- 同一ユーザーの未同期キャッシュがある状態で別ブラウザから大きく進めた場合、mergeはunion/maxで安全だが「削除」系の操作(現状アプリに存在しない)を将来足すならmerge規則の再設計が必要。
