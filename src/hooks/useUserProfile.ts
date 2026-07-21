"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppUserProfile } from "@/types/userProfile";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchOwnProfile } from "@/lib/profile/profileRepository";
import { isProfileComplete } from "@/lib/profile/profileValidation";

export interface UseUserProfileResult {
  profile: AppUserProfile | null;
  isLoading: boolean;
  /** Re-runs the fetch — call after a successful save so the UI reflects it. */
  refetch: () => void;
}

interface FetchedProfile {
  userId: string;
  /** The refetchToken this fetch was started for — lets "loading" be derived by
   *  comparing against the current token instead of a separate setState call. */
  refetchToken: number;
  profile: AppUserProfile | null;
}

/**
 * Client-side read of the signed-in user's own profile. Loading/staleness is
 * entirely derived from comparing the fetched record's (userId, refetchToken)
 * against the current ones — no synchronous setState inside the effect body — so a
 * user switch (sign out -> sign in as someone else) or a manual refetch can never
 * show a stale profile while the new fetch is in flight. Mirrors the same
 * fetched-state-keyed-by-identity pattern used by EntitlementProvider.
 */
export function useUserProfile(): UseUserProfileResult {
  const { user, isConfigured, isLoading: authLoading } = useAuth();
  const [fetched, setFetched] = useState<FetchedProfile | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  useEffect(() => {
    if (!isConfigured || authLoading || user === null) return;
    const client = getSupabaseBrowserClient();
    if (client === null) return;

    const userId = user.id;
    let cancelled = false;

    fetchOwnProfile(client)
      .then((profile) => {
        if (cancelled) return;
        setFetched({ userId, refetchToken, profile });
      })
      .catch(() => {
        if (cancelled) return;
        // Fail closed toward "incomplete": a fetch error must never be treated as
        // "profile is fine" — the caller's completeness check on `null` is false.
        setFetched({ userId, refetchToken, profile: null });
      });

    return () => {
      cancelled = true;
    };
  }, [user, isConfigured, authLoading, refetchToken]);

  const refetch = useCallback(() => setRefetchToken((token) => token + 1), []);

  if (user === null) {
    return { profile: null, isLoading: authLoading, refetch };
  }
  const isFresh =
    fetched !== null && fetched.userId === user.id && fetched.refetchToken === refetchToken;
  if (!isFresh) {
    return { profile: null, isLoading: true, refetch };
  }
  return { profile: fetched.profile, isLoading: false, refetch };
}

/**
 * Guards a page behind "profile setup is done". Used by /account and /profile/edit
 * (Phase 13) — deliberately NOT used by Home, Area 1, Vocabulary or Practice, so an
 * incomplete profile never blocks free learning. Redirects to /profile/setup with
 * the current URL preserved as `next`, so completing setup returns the user right
 * back to where they were headed.
 */
export function useRequireCompleteProfile(): UseUserProfileResult {
  const router = useRouter();
  const { user, isConfigured, isLoading: authLoading } = useAuth();
  const result = useUserProfile();

  useEffect(() => {
    if (!isConfigured || authLoading || user === null) return;
    if (result.isLoading) return;
    if (result.profile !== null && isProfileComplete(result.profile)) return;

    const current =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/account";
    router.replace(`/profile/setup?next=${encodeURIComponent(current)}`);
  }, [isConfigured, authLoading, user, result.isLoading, result.profile, router]);

  return result;
}
