# Entitlement Spec

購入権限の正式仕様。実装: `src/types/entitlement.ts`(純関数)、`src/lib/entitlements/*`、SQL: `supabase/migrations/20260718000001_paid_foundation.sql`。

## Product keys

| key | 意味 | Premium判定に含む |
|---|---|---|
| `premium_subscription` | 月額/年額サブスクリプション | ✔ |
| `premium_lifetime` | 買い切りPremium | ✔ |
| `area2_pack` | Area 2単体パック(将来) | ✘(単体アクセスのみ) |

未知のproduct_keyはDBのCHECK制約で拒否され、仮に混入してもクライアント判定では常に無効(fail closed)。

## Statuses

| status | アクセス |
|---|---|
| `active` | ✔(期間内なら) |
| `trialing` | ✔(期間内なら) |
| `canceled` | **`ends_at` が未来なら✔**(期間末まで有効)。`ends_at` なしのcanceledは✘ |
| `past_due` | ✘(支払い復旧でStripe側がactiveへ戻す) |
| `expired` | ✘ |
| `revoked` | ✘(返金・不正時の手動剥奪) |

## Sources

`manual`(SQL手動付与) / `stripe`(将来のWebhook) / `migration`(データ移行) / `promotion`(プロモ配布)。判定には影響しない(監査用)。

## Active access rules(正確な定義)

`isEntitlementActive(e, now)`:

1. `starts_at` が未来、またはパース不能 → 無効
2. `ends_at` が過去/現在、またはパース不能 → 無効
3. その上で status が `active` / `trialing` → 有効
4. `canceled` は `ends_at` が設定されている場合のみ有効(1,2を通過している=未来)
5. それ以外(`past_due` / `expired` / `revoked` / 未知) → 無効

`hasPremiumAccess(list, now)` = listの中に productKey ∈ {premium_lifetime, premium_subscription} かつ active な行が1つでもあれば true。

## Expiration / Revocation / Lifetime / Subscription / Area pack

- **Expiration**: `ends_at` 到達で自動的に無効(行の物理削除・status更新は不要。バッチでstatus=expiredに整理してもよい)。
- **Revocation**: `status = 'revoked'` に更新。即時無効。
- **Lifetime**: `premium_lifetime` + `status = active` + `ends_at = null`。
- **Subscription**: `premium_subscription`。更新のたびStripeが `ends_at`(期間終了)を先送りする運用を想定。
- **Area pack**: `area2_pack` はPremiumにならない。将来のArea 2ルートは `hasProductAccess("area2_pack") || hasServerPremiumAccess()` のような判定を行う。

## Client read

- RLS: 本人の行のみSELECT可。INSERT/UPDATE/DELETEはポリシー不在+明示REVOKEで不可。
- `EntitlementProvider` → `{ isPremium, activeProducts, isLoading }`。未ログイン/未設定/取得失敗はFree。
- TypeScriptレベルでも `user_entitlements` の Insert/Update 型を `never` にしてあり、クライアントコードからの書込みはコンパイルエラー。

## Server enforcement

`src/lib/entitlements/server.ts`:

- `getServerEntitlements()` — 本人分のみ(RLS)。エラー時は `[]`。
- `hasServerPremiumAccess()` / `hasProductAccess(productKey)`
- `requirePremiumAccess()` — 未ログインで `AuthRequiredError`、非Premiumで `PremiumRequiredError` をthrow。将来の有料Route Handler / Server Componentの入口で使用。

禁止事項(実装しないこと): `localStorage.getItem("premium")`、query paramによる昇格、client stateのみの有料アクセス許可。

## Stripe webhook future mapping(実装ガイド)

| Stripeイベント | 操作 |
|---|---|
| `checkout.session.completed`(subscription) | upsert `(user_id, premium_subscription)` status=active, ends_at=current_period_end, source=stripe |
| `checkout.session.completed`(one-time lifetime) | upsert `(user_id, premium_lifetime)` status=active, ends_at=null |
| `customer.subscription.updated` | status/ends_atを反映(trialing→active、cancel_at_period_end→canceled+ends_at) |
| `invoice.payment_failed` | status=past_due |
| `customer.subscription.deleted` | status=expired |
| refund/チャージバック | status=revoked(手動 or webhook) |

- user_idの対応付け: Checkout Session作成時に `client_reference_id = auth user id` を渡す。Stripe customer idは `metadata.stripe_customer_id` に保存可(秘密情報ではない参照ID)。
- 書込みはservice role(RLSバイパス)で、Webhook署名検証後にのみ行う。
- `(user_id, product_key)` の一意制約により、Webhookの再送はupsertで冪等。

## Manual test grant

SUPABASE_SETUP_JA.md の手順15/16を参照(SQL Editorからinsert/delete)。アプリからは付与不可能であることが仕様。
