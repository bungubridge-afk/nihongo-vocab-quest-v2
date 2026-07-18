/**
 * Entitlement domain types + the pure Premium decision function.
 *
 * These mirror the CHECK constraints in `supabase/migrations/*_paid_foundation.sql` —
 * if a value is added here it must be added to the SQL constraint too (and vice versa).
 * Entitlement rows are written only by trusted server-side actors (future Stripe
 * webhook, manual SQL); clients can only SELECT their own rows, so everything in this
 * file is read-side logic.
 */

export type ProductKey =
  | "premium_subscription"
  | "premium_lifetime"
  | "area2_pack";

export type EntitlementStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "expired"
  | "revoked";

export type EntitlementSource = "manual" | "stripe" | "migration" | "promotion";

export interface UserEntitlement {
  id: string;
  userId: string;
  productKey: ProductKey;
  status: EntitlementStatus;
  source: EntitlementSource;
  /** ISO timestamp or null — access is not valid before this instant. */
  startsAt: string | null;
  /** ISO timestamp or null — access is not valid at/after this instant. null = no end. */
  endsAt: string | null;
}

/**
 * Whether a single entitlement row grants access *right now*.
 *
 * Rules (see docs/ENTITLEMENT_SPEC.md):
 * - `active` and `trialing` grant access.
 * - `canceled` keeps access until `ends_at` (Stripe-style "cancel at period end");
 *   a canceled row without `ends_at` grants nothing.
 * - `past_due`, `expired`, `revoked` never grant access (fail closed).
 * - A row outside its `starts_at`/`ends_at` window never grants access.
 */
export function isEntitlementActive(
  entitlement: UserEntitlement,
  now: Date = new Date()
): boolean {
  const time = now.getTime();

  if (entitlement.startsAt !== null) {
    const startsAt = Date.parse(entitlement.startsAt);
    if (Number.isNaN(startsAt) || time < startsAt) return false;
  }
  if (entitlement.endsAt !== null) {
    const endsAt = Date.parse(entitlement.endsAt);
    if (Number.isNaN(endsAt) || time >= endsAt) return false;
  }

  switch (entitlement.status) {
    case "active":
    case "trialing":
      return true;
    case "canceled":
      // Only valid while an explicit paid-until date is in the future (checked above).
      return entitlement.endsAt !== null;
    case "past_due":
    case "expired":
    case "revoked":
      return false;
    default:
      return false;
  }
}

const PREMIUM_PRODUCT_KEYS: ReadonlySet<string> = new Set<ProductKey>([
  "premium_subscription",
  "premium_lifetime",
]);

/**
 * Premium = at least one currently-active `premium_lifetime` or `premium_subscription`
 * entitlement. Unknown product keys never grant Premium. Pure function so the same
 * decision runs identically on client and server (and later against Stripe-written rows).
 */
export function hasPremiumAccess(
  entitlements: readonly UserEntitlement[],
  now: Date = new Date()
): boolean {
  return entitlements.some(
    (entitlement) =>
      PREMIUM_PRODUCT_KEYS.has(entitlement.productKey) &&
      isEntitlementActive(entitlement, now)
  );
}

/** Product keys the user currently has active access to (deduplicated). */
export function getActiveProducts(
  entitlements: readonly UserEntitlement[],
  now: Date = new Date()
): ProductKey[] {
  const active = new Set<ProductKey>();
  for (const entitlement of entitlements) {
    if (isEntitlementActive(entitlement, now)) {
      active.add(entitlement.productKey);
    }
  }
  return [...active];
}

/** Whether the user has active access to one specific product. */
export function hasProductAccessFromEntitlements(
  entitlements: readonly UserEntitlement[],
  productKey: ProductKey,
  now: Date = new Date()
): boolean {
  return entitlements.some(
    (entitlement) =>
      entitlement.productKey === productKey && isEntitlementActive(entitlement, now)
  );
}
