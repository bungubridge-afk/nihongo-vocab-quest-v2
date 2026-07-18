import type { AppSupabaseClient } from "@/lib/supabase/client";
import type { AppProgress } from "@/lib/progress/progressTypes";
import {
  PROGRESS_SCHEMA_VERSION,
  sanitizeProgress,
} from "@/lib/progress/progressTypes";

/**
 * Remote persistence for the signed-in user's progress. Thin, side-effect-free wrapper
 * around the `user_progress` table + `save_user_progress` RPC — all merge/conflict
 * policy lives in the sync service, all authorization lives in RLS.
 */

export interface RemoteProgress {
  progress: AppProgress;
  revision: number;
  schemaVersion: number;
}

export interface RemoteSaveResult {
  /** False = revision conflict; `remote` then holds the newer server state. */
  saved: boolean;
  remote: RemoteProgress;
}

/**
 * Fetch the signed-in user's progress row. Returns `null` when the row does not exist
 * (e.g. signup trigger failed); throws on network/permission errors so the caller can
 * surface a retryable sync error.
 */
export async function fetchRemoteProgress(
  client: AppSupabaseClient
): Promise<RemoteProgress | null> {
  const { data, error } = await client
    .from("user_progress")
    .select("progress, revision, schema_version")
    .maybeSingle();

  if (error) {
    throw new Error(`user_progress fetch failed: ${error.code ?? "unknown"}`);
  }
  if (data === null) return null;

  return {
    progress: sanitizeProgress(data.progress),
    revision: typeof data.revision === "number" ? data.revision : 0,
    schemaVersion:
      typeof data.schema_version === "number"
        ? data.schema_version
        : PROGRESS_SCHEMA_VERSION,
  };
}

/**
 * Conditional save: only succeeds when the server row still has `expectedRevision`.
 * On conflict the server state comes back so the caller can merge and retry — the RPC
 * never overwrites a newer revision (no last-write-wins).
 */
export async function saveRemoteProgress(
  client: AppSupabaseClient,
  progress: AppProgress,
  expectedRevision: number
): Promise<RemoteSaveResult> {
  const { data, error } = await client.rpc("save_user_progress", {
    p_progress: progress,
    p_expected_revision: expectedRevision,
    p_schema_version: PROGRESS_SCHEMA_VERSION,
  });

  if (error) {
    throw new Error(`save_user_progress failed: ${error.code ?? "unknown"}`);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") {
    throw new Error("save_user_progress returned no row");
  }

  return {
    saved: row.saved === true,
    remote: {
      progress: sanitizeProgress(row.progress),
      revision: typeof row.revision === "number" ? row.revision : 0,
      schemaVersion:
        typeof row.schema_version === "number"
          ? row.schema_version
          : PROGRESS_SCHEMA_VERSION,
    },
  };
}
