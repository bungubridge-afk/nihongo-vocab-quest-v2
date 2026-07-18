import type { SyncStatus } from "@/types/auth";
import type { AppSupabaseClient } from "@/lib/supabase/client";
import type { AppProgress } from "@/lib/progress/progressTypes";
import {
  hasMeaningfulProgress,
  isSameProgress,
  mergeProgress,
} from "@/lib/progress/progressTypes";
import {
  anonymousBackend,
  clearSyncState,
  clearUserCache,
  createUserCacheBackend,
  markAnonymousImported,
  readAnonymousMeta,
  readSyncState,
  writeSyncState,
  type ProgressBackend,
} from "@/lib/progress/localProgressRepository";
import {
  setActiveBackend,
  setActiveProgress,
  subscribeToProgressWrites,
} from "@/lib/progress/progressStore";
import {
  fetchRemoteProgress,
  saveRemoteProgress,
  type RemoteProgress,
} from "@/lib/progress/supabaseProgressRepository";

/**
 * Client-side singleton that keeps the signed-in user's progress in sync with
 * Supabase.
 *
 * Principles (docs/AUTH_PROGRESS_SYNC_SPEC.md):
 * - UI writes are instant and local; the cloud save is async and debounced. A failed
 *   remote save never fails a learning action — it becomes a retryable sync error.
 * - First login on a browser with anonymous progress imports it only while the remote
 *   row is untouched (revision 0) and the anonymous progress has not been claimed by a
 *   different account. Otherwise remote wins and the import becomes an explicit
 *   Account-page action.
 * - Saves go through the `save_user_progress` RPC with an expected revision — a
 *   conflicting writer (another device) is merged, never silently overwritten.
 */

export interface SyncSnapshot {
  status: SyncStatus;
  lastSyncedAt: string | null;
  userId: string | null;
  /** Anonymous browser progress exists, is unclaimed, and could be merged in manually. */
  canImportLocalProgress: boolean;
  /**
   * Bumped whenever the service itself rewrites the visible progress (remote adopt,
   * merge). The ProgressProvider remounts consumers so pages re-read fresh data.
   */
  dataEpoch: number;
}

const SAVE_DEBOUNCE_MS = 600;

interface ServiceState {
  client: AppSupabaseClient | null;
  userId: string | null;
  backend: ProgressBackend | null;
  status: SyncStatus;
  lastSyncedAt: string | null;
  revision: number;
  dirty: boolean;
  dataEpoch: number;
  writeCounter: number;
  debounceTimer: number | null;
  saveInFlight: Promise<void> | null;
  activationToken: number;
}

const state: ServiceState = {
  client: null,
  userId: null,
  backend: null,
  status: "local",
  lastSyncedAt: null,
  revision: 0,
  dirty: false,
  dataEpoch: 0,
  writeCounter: 0,
  debounceTimer: null,
  saveInFlight: null,
  activationToken: 0,
};

type SyncListener = (snapshot: SyncSnapshot) => void;
const listeners = new Set<SyncListener>();

export function getSyncSnapshot(): SyncSnapshot {
  const anonymous = anonymousBackend.getProgress();
  const meta = readAnonymousMeta();
  return {
    status: state.status,
    lastSyncedAt: state.lastSyncedAt,
    userId: state.userId,
    canImportLocalProgress:
      state.userId !== null &&
      meta.importedIntoUserId === null &&
      hasMeaningfulProgress(anonymous),
    dataEpoch: state.dataEpoch,
  };
}

export function subscribeToSync(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  const snapshot = getSyncSnapshot();
  for (const listener of listeners) listener(snapshot);
}

function persistSyncState(): void {
  if (state.userId === null) return;
  writeSyncState(state.userId, {
    revision: state.revision,
    lastSyncedAt: state.lastSyncedAt,
    dirty: state.dirty,
  });
}

/** Apply server-truth progress to the user cache without re-triggering a save loop. */
function adoptProgressLocally(progress: AppProgress): void {
  if (state.backend === null) return;
  const current = state.backend.getProgress();
  setActiveProgress(progress, { silent: true });
  if (!isSameProgress(current, progress)) {
    state.dataEpoch += 1;
  }
}

function markSynced(remote: RemoteProgress): void {
  state.revision = remote.revision;
  state.lastSyncedAt = new Date().toISOString();
  state.dirty = false;
  state.status = "synced";
  persistSyncState();
}

// ---------------------------------------------------------------------------
// Debounced save pipeline
// ---------------------------------------------------------------------------

function scheduleSave(): void {
  if (typeof window === "undefined") return;
  if (state.userId === null || state.client === null) return;
  if (state.debounceTimer !== null) {
    window.clearTimeout(state.debounceTimer);
  }
  state.debounceTimer = window.setTimeout(() => {
    state.debounceTimer = null;
    void performSave();
  }, SAVE_DEBOUNCE_MS);
}

async function performSave(): Promise<void> {
  if (state.saveInFlight !== null) {
    // A save is running; it re-checks dirtiness when it finishes.
    return state.saveInFlight;
  }
  const run = doSave().finally(() => {
    state.saveInFlight = null;
  });
  state.saveInFlight = run;
  return run;
}

async function doSave(): Promise<void> {
  const client = state.client;
  const backend = state.backend;
  if (client === null || backend === null || state.userId === null) return;
  if (!state.dirty) return;

  const token = state.activationToken;
  const writesBefore = state.writeCounter;
  const progress = backend.getProgress();

  state.status = "syncing";
  notify();

  try {
    const result = await saveRemoteProgress(client, progress, state.revision);
    if (token !== state.activationToken) return; // user switched mid-flight

    if (result.saved) {
      markSynced(result.remote);
    } else {
      await resolveConflict(progress, result.remote, token);
      if (token !== state.activationToken) return;
    }

    if (state.writeCounter !== writesBefore) {
      // New writes arrived while saving — keep them queued.
      state.dirty = true;
      persistSyncState();
      scheduleSave();
    }
  } catch {
    if (token !== state.activationToken) return;
    state.dirty = true;
    state.status = "error";
    persistSyncState();
  }
  notify();
}

/**
 * The expected revision no longer matched (e.g. another device saved). Merge instead
 * of overwriting; if even the merged save conflicts again, keep the server state and
 * surface a sync error — never last-write-wins.
 */
async function resolveConflict(
  localProgress: AppProgress,
  remote: RemoteProgress,
  token: number
): Promise<void> {
  const client = state.client;
  if (client === null) return;
  const merged = mergeProgress(localProgress, remote.progress);

  if (isSameProgress(merged, remote.progress)) {
    adoptProgressLocally(remote.progress);
    markSynced(remote);
    return;
  }

  const retry = await saveRemoteProgress(client, merged, remote.revision);
  if (token !== state.activationToken) return;

  if (retry.saved) {
    adoptProgressLocally(merged);
    markSynced(retry.remote);
  } else {
    adoptProgressLocally(retry.remote.progress);
    state.revision = retry.remote.revision;
    state.dirty = false;
    state.status = "error";
    persistSyncState();
  }
}

// ---------------------------------------------------------------------------
// Activation / deactivation
// ---------------------------------------------------------------------------

let writeSubscriptionInstalled = false;
let onlineListenerInstalled = false;

function installGlobalListeners(): void {
  if (!writeSubscriptionInstalled) {
    writeSubscriptionInstalled = true;
    subscribeToProgressWrites(() => {
      state.writeCounter += 1;
      if (state.userId === null) return;
      state.dirty = true;
      persistSyncState();
      if (state.status !== "syncing") {
        state.status = "syncing";
        notify();
      }
      scheduleSave();
    });
  }
  if (!onlineListenerInstalled && typeof window !== "undefined") {
    onlineListenerInstalled = true;
    window.addEventListener("online", () => {
      if (state.userId !== null && state.dirty) {
        void performSave();
      }
    });
  }
}

/**
 * Called by the ProgressProvider once the auth state resolves to a signed-in user.
 * Switches the active store to the per-user cache, then reconciles with the server.
 */
export async function activateForUser(
  client: AppSupabaseClient,
  userId: string
): Promise<void> {
  if (state.userId === userId) return;
  installGlobalListeners();

  state.activationToken += 1;
  const token = state.activationToken;

  const backend = createUserCacheBackend(userId);
  const persisted = readSyncState(userId);

  state.client = client;
  state.userId = userId;
  state.backend = backend;
  state.revision = persisted.revision;
  state.lastSyncedAt = persisted.lastSyncedAt;
  state.dirty = persisted.dirty;
  state.status = "syncing";
  setActiveBackend(backend);
  notify();

  let remote: RemoteProgress | null;
  try {
    remote = await fetchRemoteProgress(client);
  } catch {
    if (token !== state.activationToken) return;
    // Offline / server error: keep showing the cached progress, mark retryable.
    state.status = "error";
    notify();
    return;
  }
  if (token !== state.activationToken) return;

  // A missing row (signup trigger failed) behaves like an untouched initial row;
  // the save RPC self-heals by inserting it.
  const remoteRevision = remote?.revision ?? 0;
  const remoteProgress = remote?.progress ?? backend.getProgress();

  const anonymous = anonymousBackend.getProgress();
  const meta = readAnonymousMeta();
  const anonymousImportable =
    hasMeaningfulProgress(anonymous) && meta.importedIntoUserId === null;
  const cacheProgress = backend.getProgress();
  const cacheDirty = persisted.dirty && hasMeaningfulProgress(cacheProgress);

  if (remoteRevision === 0) {
    // Case A: server row untouched. Import what this browser has: unsent cache writes
    // and/or unclaimed anonymous progress.
    let base = remote?.progress ?? cacheProgress;
    if (cacheDirty) base = mergeProgress(cacheProgress, base);
    if (anonymousImportable) base = mergeProgress(anonymous, base);

    if (hasMeaningfulProgress(base) && !isSameProgress(base, remoteProgress)) {
      adoptProgressLocally(base);
      state.dirty = true;
      try {
        const result = await saveRemoteProgress(client, base, remoteRevision);
        if (token !== state.activationToken) return;
        if (result.saved) {
          if (anonymousImportable) markAnonymousImported(userId);
          markSynced(result.remote);
        } else {
          await resolveConflict(base, result.remote, token);
          if (token !== state.activationToken) return;
          // resolveConflict mutates state.status; read via the snapshot so TS does
          // not keep the pre-await narrowing.
          if (anonymousImportable && getSyncSnapshot().status === "synced") {
            markAnonymousImported(userId);
          }
        }
      } catch {
        if (token !== state.activationToken) return;
        state.status = "error";
        persistSyncState();
      }
    } else {
      adoptProgressLocally(remoteProgress);
      if (remote !== null) markSynced(remote);
      else {
        state.status = "synced";
        state.lastSyncedAt = new Date().toISOString();
        persistSyncState();
      }
    }
  } else {
    // Case B/C: the account already has real progress — remote wins for display.
    // Unsent cache writes from this browser are merged and pushed; anonymous progress
    // is never auto-imported here (explicit Account action instead).
    if (cacheDirty) {
      const merged = mergeProgress(cacheProgress, remoteProgress);
      if (isSameProgress(merged, remoteProgress)) {
        adoptProgressLocally(remoteProgress);
        if (remote !== null) markSynced(remote);
      } else {
        adoptProgressLocally(merged);
        state.dirty = true;
        try {
          const result = await saveRemoteProgress(client, merged, remoteRevision);
          if (token !== state.activationToken) return;
          if (result.saved) markSynced(result.remote);
          else await resolveConflict(merged, result.remote, token);
        } catch {
          if (token !== state.activationToken) return;
          state.status = "error";
          persistSyncState();
        }
      }
    } else {
      adoptProgressLocally(remoteProgress);
      if (remote !== null) markSynced(remote);
    }
  }

  if (token !== state.activationToken) return;
  notify();
}

/**
 * Best-effort flush + switch back to the anonymous store. Called before sign-out.
 * The per-user cache is cleared only when everything reached the server — unsynced
 * progress is kept (namespaced by user id) so it survives an offline sign-out.
 */
export async function deactivateToAnonymous(): Promise<void> {
  const userId = state.userId;
  if (userId === null) {
    setActiveBackend(anonymousBackend);
    return;
  }

  if (state.debounceTimer !== null && typeof window !== "undefined") {
    window.clearTimeout(state.debounceTimer);
    state.debounceTimer = null;
  }
  if (state.dirty) {
    try {
      await performSave();
    } catch {
      // Offline sign-out: the dirty cache stays under the user-scoped key.
    }
  }

  const fullySynced = !state.dirty;
  state.activationToken += 1;
  state.client = null;
  state.userId = null;
  state.backend = null;
  state.status = "local";
  state.lastSyncedAt = null;
  state.revision = 0;
  state.dirty = false;
  state.dataEpoch += 1;
  setActiveBackend(anonymousBackend);

  if (fullySynced) {
    // Privacy on shared machines: no other user's progress lingers once it is safely
    // in the cloud. (Sync bookkeeping goes with it.)
    clearUserCache(userId);
    clearSyncState(userId);
  }
  notify();
}

/** Manual "Jetzt synchronisieren" / retry action. */
export async function syncNow(): Promise<void> {
  if (state.userId === null || state.client === null) return;
  if (!state.dirty) {
    // Nothing local to push — refresh from the server instead.
    state.status = "syncing";
    notify();
    try {
      const remote = await fetchRemoteProgress(state.client);
      if (remote !== null) {
        adoptProgressLocally(remote.progress);
        markSynced(remote);
      } else {
        state.status = "synced";
      }
    } catch {
      state.status = "error";
    }
    notify();
    return;
  }
  await performSave();
}

/**
 * Explicit Account-page action for the "both sides have progress" case: merge the
 * anonymous browser progress into the account's progress and save. Marks the
 * anonymous progress as claimed on success so it is never imported twice.
 */
export async function importLocalProgress(): Promise<void> {
  if (state.userId === null || state.backend === null) return;
  const anonymous = anonymousBackend.getProgress();
  if (!hasMeaningfulProgress(anonymous)) return;
  const meta = readAnonymousMeta();
  if (meta.importedIntoUserId !== null) return;

  const userId = state.userId;
  const merged = mergeProgress(anonymous, state.backend.getProgress());
  setActiveProgress(merged); // non-silent: flows through the normal dirty/save pipeline
  state.dataEpoch += 1;
  await performSave();
  if (state.userId === userId && state.status === "synced") {
    markAnonymousImported(userId);
    notify();
  }
}
