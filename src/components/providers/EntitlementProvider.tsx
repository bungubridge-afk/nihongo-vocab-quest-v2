"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ProductKey } from "@/types/entitlement";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchUserEntitlements } from "@/lib/entitlements/getEntitlements";
import {
  buildAccessSummary,
  FREE_ACCESS,
  type AccessSummary,
} from "@/lib/entitlements/access";

export interface EntitlementContextValue {
  isPremium: boolean;
  activeProducts: ProductKey[];
  isLoading: boolean;
}

const EntitlementContext = createContext<EntitlementContextValue | null>(null);

const SIGNED_OUT_VALUE: EntitlementContextValue = {
  ...FREE_ACCESS,
  isLoading: false,
};

interface FetchedAccess {
  userId: string;
  summary: AccessSummary;
}

/**
 * Client-side read of the signed-in user's entitlements. Strictly fail closed: signed
 * out, Supabase unconfigured, or any fetch error all mean Free. The context value is
 * derived at render (fetched state is keyed by user id), so a user switch can never
 * leak the previous user's Premium state. This value is for UI display only — real
 * access control for future paid routes happens server-side
 * (src/lib/entitlements/server.ts).
 */
export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const { user, isConfigured, isLoading: authLoading } = useAuth();
  const [fetched, setFetched] = useState<FetchedAccess | null>(null);

  useEffect(() => {
    if (!isConfigured || authLoading || user === null) return;

    const client = getSupabaseBrowserClient();
    if (client === null) return;

    const userId = user.id;
    let cancelled = false;

    fetchUserEntitlements(client)
      .then((entitlements) => {
        if (cancelled) return;
        setFetched({ userId, summary: buildAccessSummary(entitlements) });
      })
      .catch(() => {
        if (cancelled) return;
        // Fail closed: on error nobody is accidentally promoted to Premium.
        setFetched({ userId, summary: FREE_ACCESS });
      });

    return () => {
      cancelled = true;
    };
  }, [user, isConfigured, authLoading]);

  let value: EntitlementContextValue;
  if (!isConfigured || user === null) {
    value = SIGNED_OUT_VALUE;
  } else if (fetched !== null && fetched.userId === user.id) {
    value = { ...fetched.summary, isLoading: false };
  } else {
    value = { ...FREE_ACCESS, isLoading: true };
  }

  return (
    <EntitlementContext.Provider value={value}>
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlements(): EntitlementContextValue {
  const context = useContext(EntitlementContext);
  if (context === null) {
    throw new Error("useEntitlements must be used inside <EntitlementProvider>");
  }
  return context;
}
