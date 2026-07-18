import type { Session, User } from "@supabase/supabase-js";

/**
 * Auth state exposed to the UI via AuthProvider/useAuth. `isConfigured` false means
 * Supabase env vars are missing — the app then runs permanently in anonymous mode and
 * auth screens show a friendly notice instead of forms.
 */
export interface AuthState {
  user: User | null;
  session: Session | null;
  /** True until the initial session lookup has finished (or immediately false when unconfigured). */
  isLoading: boolean;
  isConfigured: boolean;
}

export interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

/** Cloud-sync lifecycle for the progress of the signed-in user. */
export type SyncStatus = "local" | "syncing" | "synced" | "error";
