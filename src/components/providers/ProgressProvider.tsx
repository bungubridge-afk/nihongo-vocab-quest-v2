"use client";

import {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { SyncStatus } from "@/types/auth";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getActiveBackendId,
  subscribeToBackendChanges,
} from "@/lib/progress/progressStore";
import {
  activateForUser,
  deactivateToAnonymous,
  getSyncSnapshot,
  importLocalProgress,
  subscribeToSync,
  syncNow,
  type SyncSnapshot,
} from "@/lib/progress/progressSyncService";

export interface ProgressContextValue {
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  canImportLocalProgress: boolean;
  syncNow: () => Promise<void>;
  importLocalProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

/**
 * Binds the auth state to the progress store: signed-in users get their per-user
 * cache + cloud sync, everyone else stays on the anonymous localStorage progress.
 *
 * Children are keyed by (backend id, data epoch): when the active store switches
 * (login/logout) or the sync service rewrites visible progress (remote adopt/merge),
 * the subtree remounts and every page re-runs its one-time mount read of
 * `src/lib/storage.ts` — no page needed to change for cloud sync.
 */
export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isConfigured } = useAuth();
  const [snapshot, setSnapshot] = useState<SyncSnapshot>(() => getSyncSnapshot());
  const [backendId, setBackendId] = useState<string>(() => getActiveBackendId());

  useEffect(() => {
    const unsubscribeSync = subscribeToSync(setSnapshot);
    const unsubscribeBackend = subscribeToBackendChanges(setBackendId);
    return () => {
      unsubscribeSync();
      unsubscribeBackend();
    };
  }, []);

  useEffect(() => {
    if (!isConfigured || isLoading) return;
    if (user !== null) {
      const client = getSupabaseBrowserClient();
      if (client !== null) {
        void activateForUser(client, user.id);
      }
    } else {
      void deactivateToAnonymous();
    }
  }, [user, isLoading, isConfigured]);

  const handleSyncNow = useCallback(() => syncNow(), []);
  const handleImport = useCallback(() => importLocalProgress(), []);

  const value: ProgressContextValue = {
    syncStatus: snapshot.status,
    lastSyncedAt: snapshot.lastSyncedAt,
    canImportLocalProgress: snapshot.canImportLocalProgress,
    syncNow: handleSyncNow,
    importLocalProgress: handleImport,
  };

  return (
    <ProgressContext.Provider value={value}>
      <Fragment key={`${backendId}:${snapshot.dataEpoch}`}>{children}</Fragment>
    </ProgressContext.Provider>
  );
}

export function useProgressSync(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (context === null) {
    throw new Error("useProgressSync must be used inside <ProgressProvider>");
  }
  return context;
}
