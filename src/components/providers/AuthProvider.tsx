"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { AuthContextValue } from "@/types/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { deactivateToAnonymous } from "@/lib/progress/progressSyncService";

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Client-side auth state for the whole app. Renders children immediately (the free
 * app never waits on auth); `isLoading` only gates auth-specific UI like the header
 * link. Safe without Supabase config — then it is a permanent "signed out".
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isConfigured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(isConfigured);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (client === null) {
      // Unconfigured: isLoading already initialized to false via isConfigured.
      return;
    }

    let cancelled = false;

    client.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    const { data: subscription } = client.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (cancelled) return;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    // Flush pending progress saves while the session is still valid, and switch the
    // active store back to anonymous so no signed-in data lingers in the UI.
    await deactivateToAnonymous();
    if (client !== null) {
      try {
        await client.auth.signOut();
      } catch {
        // Even if the server call fails, local auth state is cleared by supabase-js.
      }
    }
    setUser(null);
    setSession(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    if (client === null) return;
    try {
      const { data } = await client.auth.refreshSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
    } catch {
      // Keep current state; the next request/proxy pass will retry.
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, session, isLoading, isConfigured, signOut, refreshSession }),
    [user, session, isLoading, isConfigured, signOut, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
