"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "@/lib/supabase/config";

export type AppSupabaseClient = SupabaseClient<Database>;

let browserClient: AppSupabaseClient | null = null;

/**
 * Browser Supabase client for Client Components. Uses only the public URL and the
 * publishable key; the session lives in cookies (managed by @supabase/ssr) so the
 * server sees the same auth state. Returns `null` when Supabase is not configured —
 * callers must treat that as "anonymous-only mode", never as an error.
 */
export function getSupabaseBrowserClient(): AppSupabaseClient | null {
  const config = getSupabaseConfig();
  if (config === null) return null;
  if (browserClient === null) {
    browserClient = createBrowserClient<Database>(config.url, config.publishableKey);
  }
  return browserClient;
}
