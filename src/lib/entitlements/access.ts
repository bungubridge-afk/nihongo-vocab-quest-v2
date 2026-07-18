import type { ProductKey, UserEntitlement } from "@/types/entitlement";
import {
  getActiveProducts,
  hasPremiumAccess,
  hasProductAccessFromEntitlements,
} from "@/types/entitlement";

/**
 * Read-side access summary shared by the client provider and the server helpers.
 * Fail-closed by construction: an empty or unknown entitlement list is always Free.
 */

export interface AccessSummary {
  isPremium: boolean;
  activeProducts: ProductKey[];
}

export const FREE_ACCESS: AccessSummary = { isPremium: false, activeProducts: [] };

export function buildAccessSummary(
  entitlements: readonly UserEntitlement[],
  now: Date = new Date()
): AccessSummary {
  return {
    isPremium: hasPremiumAccess(entitlements, now),
    activeProducts: getActiveProducts(entitlements, now),
  };
}

export function summaryHasProduct(
  entitlements: readonly UserEntitlement[],
  productKey: ProductKey,
  now: Date = new Date()
): boolean {
  return hasProductAccessFromEntitlements(entitlements, productKey, now);
}
