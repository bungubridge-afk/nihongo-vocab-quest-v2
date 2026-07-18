import type { User } from "@supabase/supabase-js";
import type { ProductKey, UserEntitlement } from "@/types/entitlement";
import { hasPremiumAccess } from "@/types/entitlement";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchUserEntitlements } from "@/lib/entitlements/getEntitlements";
import { summaryHasProduct } from "@/lib/entitlements/access";
import { getServerUser, requireUser } from "@/lib/auth/server";

/**
 * Server-side access decisions for future paid content (Area 2, Listening, …).
 * These are the ONLY functions future paid Route Handlers / Server Components may
 * rely on — client state, query params and localStorage are never trusted. Everything
 * fails closed: no user, no config, or a fetch error all mean no access.
 */

export class PremiumRequiredError extends Error {
  constructor() {
    super("Premium access required");
    this.name = "PremiumRequiredError";
  }
}

/** Entitlements of the signed-in user; [] when signed out, unconfigured or on error. */
export async function getServerEntitlements(): Promise<UserEntitlement[]> {
  const supabase = await createSupabaseServerClient();
  if (supabase === null) return [];
  const user = await getServerUser();
  if (user === null) return [];
  try {
    return await fetchUserEntitlements(supabase);
  } catch {
    return [];
  }
}

export async function hasServerPremiumAccess(): Promise<boolean> {
  const entitlements = await getServerEntitlements();
  return hasPremiumAccess(entitlements);
}

/** Whether the signed-in user has active access to one specific product. */
export async function hasProductAccess(productKey: ProductKey): Promise<boolean> {
  const entitlements = await getServerEntitlements();
  return summaryHasProduct(entitlements, productKey);
}

/**
 * Guard for future paid Route Handlers / Server Components:
 * throws AuthRequiredError (no user) or PremiumRequiredError (user without Premium).
 */
export async function requirePremiumAccess(): Promise<User> {
  const user = await requireUser();
  const entitlements = await getServerEntitlements();
  if (!hasPremiumAccess(entitlements)) {
    throw new PremiumRequiredError();
  }
  return user;
}
