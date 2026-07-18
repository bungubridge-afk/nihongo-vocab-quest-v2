import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserEntitlementRow } from "@/types/database";
import type { UserEntitlement } from "@/types/entitlement";

/**
 * Reads the signed-in user's entitlement rows. RLS guarantees only own rows come
 * back; there is deliberately no way to write entitlements from app code. Works with
 * both the browser and the server Supabase client.
 */

function mapRow(row: UserEntitlementRow): UserEntitlement {
  return {
    id: row.id,
    userId: row.user_id,
    productKey: row.product_key,
    status: row.status,
    source: row.source,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

/**
 * Throws on query errors so callers can distinguish "no entitlements" from "could not
 * check" — callers must fail closed (treat errors as no Premium), never open.
 */
export async function fetchUserEntitlements(
  client: SupabaseClient<Database>
): Promise<UserEntitlement[]> {
  const { data, error } = await client
    .from("user_entitlements")
    .select("id, user_id, product_key, status, source, starts_at, ends_at, created_at, updated_at, metadata");

  if (error) {
    throw new Error(`user_entitlements fetch failed: ${error.code ?? "unknown"}`);
  }
  return (data ?? []).map(mapRow);
}
