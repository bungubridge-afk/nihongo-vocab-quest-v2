import type { AppProgress } from "@/lib/progress/progressTypes";
import {
  createInitialProgress,
  sanitizeProgress,
} from "@/lib/progress/progressTypes";

/**
 * Local (browser) storage backends for progress.
 *
 * Two kinds exist:
 * - The anonymous backend keeps using the exact legacy `nvq_*` keys that shipped with
 *   the free app — existing players lose nothing, and the app without Supabase behaves
 *   byte-for-byte like before.
 * - Per-user cache backends store one JSON blob under a key namespaced by user id, so
 *   two accounts on the same browser can never read each other's cached progress and
 *   the anonymous progress stays untouched while someone is signed in.
 */

export interface ProgressBackend {
  /** "anonymous" or "user:<id>" — used to detect store switches (remount epoch). */
  readonly id: string;
  getProgress(): AppProgress;
  setProgress(next: AppProgress): void;
}

/** Legacy keys — must never change, they hold real users' existing progress. */
export const ANONYMOUS_STORAGE_KEYS = {
  profile: "nvq_profile",
  xp: "nvq_xp",
  collectedCards: "nvq_collected_cards",
  completedCategories: "nvq_completed_categories",
  unlockedCategories: "nvq_unlocked_categories",
  knownWords: "nvq_known_words",
  weakWords: "nvq_weak_words",
} as const;

export const USER_PROGRESS_CACHE_KEY_PREFIX = "nvq_user_progress_cache_v1:";
export const USER_SYNC_STATE_KEY_PREFIX = "nvq_progress_sync_state_v1:";
export const ANONYMOUS_META_KEY = "nvq_anonymous_progress_meta_v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readRaw(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readJSON<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable (private mode, quota) — progress stays in memory only.
  }
}

function removeKey(key: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Anonymous backend (legacy multi-key layout)
// ---------------------------------------------------------------------------

export const anonymousBackend: ProgressBackend = {
  id: "anonymous",
  getProgress(): AppProgress {
    return sanitizeProgress({
      profile: readJSON<unknown>(ANONYMOUS_STORAGE_KEYS.profile, null),
      xp: readJSON<unknown>(ANONYMOUS_STORAGE_KEYS.xp, 0),
      collectedCardIds: readJSON<unknown>(ANONYMOUS_STORAGE_KEYS.collectedCards, []),
      completedCategories: readJSON<unknown>(
        ANONYMOUS_STORAGE_KEYS.completedCategories,
        []
      ),
      unlockedCategories: readJSON<unknown>(
        ANONYMOUS_STORAGE_KEYS.unlockedCategories,
        createInitialProgress().unlockedCategories
      ),
      knownWords: readJSON<unknown>(ANONYMOUS_STORAGE_KEYS.knownWords, []),
      weakWords: readJSON<unknown>(ANONYMOUS_STORAGE_KEYS.weakWords, []),
    });
  },
  setProgress(next: AppProgress): void {
    if (next.profile === null) {
      removeKey(ANONYMOUS_STORAGE_KEYS.profile);
    } else {
      writeJSON(ANONYMOUS_STORAGE_KEYS.profile, next.profile);
    }
    writeJSON(ANONYMOUS_STORAGE_KEYS.xp, next.xp);
    writeJSON(ANONYMOUS_STORAGE_KEYS.collectedCards, next.collectedCardIds);
    writeJSON(ANONYMOUS_STORAGE_KEYS.completedCategories, next.completedCategories);
    writeJSON(ANONYMOUS_STORAGE_KEYS.unlockedCategories, next.unlockedCategories);
    writeJSON(ANONYMOUS_STORAGE_KEYS.knownWords, next.knownWords);
    writeJSON(ANONYMOUS_STORAGE_KEYS.weakWords, next.weakWords);
  },
};

// ---------------------------------------------------------------------------
// Per-user cache backend (single blob, namespaced by user id)
// ---------------------------------------------------------------------------

export function createUserCacheBackend(userId: string): ProgressBackend {
  const storageKey = `${USER_PROGRESS_CACHE_KEY_PREFIX}${userId}`;
  return {
    id: `user:${userId}`,
    getProgress(): AppProgress {
      return sanitizeProgress(readJSON<unknown>(storageKey, null));
    },
    setProgress(next: AppProgress): void {
      writeJSON(storageKey, next);
    },
  };
}

export function clearUserCache(userId: string): void {
  removeKey(`${USER_PROGRESS_CACHE_KEY_PREFIX}${userId}`);
}

// ---------------------------------------------------------------------------
// Per-user sync state (revision bookkeeping, survives reloads)
// ---------------------------------------------------------------------------

export interface PersistedSyncState {
  /** Last remote revision this browser knows it is based on. */
  revision: number;
  /** ISO timestamp of the last confirmed remote save/load, or null. */
  lastSyncedAt: string | null;
  /** True when the cache holds writes that have not reached the server yet. */
  dirty: boolean;
}

const INITIAL_SYNC_STATE: PersistedSyncState = {
  revision: 0,
  lastSyncedAt: null,
  dirty: false,
};

export function readSyncState(userId: string): PersistedSyncState {
  const raw = readJSON<unknown>(`${USER_SYNC_STATE_KEY_PREFIX}${userId}`, null);
  if (typeof raw !== "object" || raw === null) return { ...INITIAL_SYNC_STATE };
  const record = raw as Record<string, unknown>;
  return {
    revision:
      typeof record.revision === "number" &&
      Number.isFinite(record.revision) &&
      record.revision >= 0
        ? Math.floor(record.revision)
        : 0,
    lastSyncedAt:
      typeof record.lastSyncedAt === "string" ? record.lastSyncedAt : null,
    dirty: record.dirty === true,
  };
}

export function writeSyncState(userId: string, state: PersistedSyncState): void {
  writeJSON(`${USER_SYNC_STATE_KEY_PREFIX}${userId}`, state);
}

export function clearSyncState(userId: string): void {
  removeKey(`${USER_SYNC_STATE_KEY_PREFIX}${userId}`);
}

// ---------------------------------------------------------------------------
// Anonymous import bookkeeping (prevents importing the same browser progress
// into a second account, and prevents repeated imports into the same account)
// ---------------------------------------------------------------------------

export interface AnonymousProgressMeta {
  importedIntoUserId: string | null;
  importedAt: string | null;
}

export function readAnonymousMeta(): AnonymousProgressMeta {
  const raw = readJSON<unknown>(ANONYMOUS_META_KEY, null);
  if (typeof raw !== "object" || raw === null) {
    return { importedIntoUserId: null, importedAt: null };
  }
  const record = raw as Record<string, unknown>;
  return {
    importedIntoUserId:
      typeof record.importedIntoUserId === "string" ? record.importedIntoUserId : null,
    importedAt: typeof record.importedAt === "string" ? record.importedAt : null,
  };
}

export function markAnonymousImported(userId: string): void {
  writeJSON(ANONYMOUS_META_KEY, {
    importedIntoUserId: userId,
    importedAt: new Date().toISOString(),
  } satisfies AnonymousProgressMeta);
}
