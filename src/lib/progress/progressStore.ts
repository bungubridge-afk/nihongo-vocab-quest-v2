import type { AppProgress } from "@/lib/progress/progressTypes";
import type { ProgressBackend } from "@/lib/progress/localProgressRepository";
import { anonymousBackend } from "@/lib/progress/localProgressRepository";

/**
 * The active progress store: a tiny module-level switch that decides where
 * `src/lib/storage.ts` reads and writes. Anonymous by default; the ProgressProvider
 * swaps in a per-user cache backend after login and swaps back on sign-out. UI code
 * never knows which backend is active — that is the whole point.
 */

let activeBackend: ProgressBackend = anonymousBackend;

type WriteListener = (progress: AppProgress) => void;
type BackendListener = (backendId: string) => void;

const writeListeners = new Set<WriteListener>();
const backendListeners = new Set<BackendListener>();

export function getActiveBackendId(): string {
  return activeBackend.id;
}

export function setActiveBackend(backend: ProgressBackend): void {
  if (backend.id === activeBackend.id) return;
  activeBackend = backend;
  for (const listener of backendListeners) listener(backend.id);
}

export function getActiveProgress(): AppProgress {
  return activeBackend.getProgress();
}

/**
 * Write the full progress object to the active backend and notify listeners (the sync
 * service uses this to schedule a debounced cloud save). `silent` is used when the
 * sync service itself applies remote data — that must not re-trigger a save loop.
 */
export function setActiveProgress(next: AppProgress, options?: { silent?: boolean }): void {
  activeBackend.setProgress(next);
  if (options?.silent === true) return;
  for (const listener of writeListeners) listener(next);
}

/** Field-level update helper used by the storage facade. */
export function updateActiveProgress(
  update: (current: AppProgress) => AppProgress
): AppProgress {
  const next = update(activeBackend.getProgress());
  setActiveProgress(next);
  return next;
}

export function subscribeToProgressWrites(listener: WriteListener): () => void {
  writeListeners.add(listener);
  return () => writeListeners.delete(listener);
}

export function subscribeToBackendChanges(listener: BackendListener): () => void {
  backendListeners.add(listener);
  return () => backendListeners.delete(listener);
}
