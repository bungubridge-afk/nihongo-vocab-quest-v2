import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { assertServerSupabaseConfigured } from "@/lib/supabase/config";

export type AppServerSupabaseClient = SupabaseClient<Database>;

/**
 * Cookie-based Supabase client for Server Components, Server Actions and Route
 * Handlers. A fresh client per request — never cached across requests. Returns `null`
 * when Supabase is not configured; server code then behaves exactly like "no user".
 */
export async function createSupabaseServerClient(): Promise<AppServerSupabaseClient | null> {
  const config = assertServerSupabaseConfigured();
  if (config === null) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component, where Next.js forbids writing cookies.
          // Safe to ignore: the proxy (src/proxy.ts) refreshes sessions and writes
          // cookies for every matched request.
        }
      },
    },
  });
}
