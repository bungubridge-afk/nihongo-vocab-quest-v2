import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { assertServerSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Session refresh for the proxy (Next.js 16's successor to middleware). Follows the
 * official @supabase/ssr pattern: read cookies from the request, let the client refresh
 * the session if needed, and write updated auth cookies to both the forwarded request
 * and the response (plus the no-cache headers @supabase/ssr provides so CDNs never
 * cache a response that sets auth cookies).
 *
 * When Supabase is not configured this is a pass-through — the free app must never
 * depend on this code path.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const config = assertServerSupabaseConfigured();
  if (config === null) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  try {
    // Validates the JWT and triggers a token refresh when expired; must run before the
    // response is committed so refreshed cookies reach the browser.
    await supabase.auth.getClaims();
  } catch {
    // An auth hiccup (network, malformed cookie) must never take down free pages —
    // the request continues unauthenticated and server helpers see "no user".
  }

  return response;
}
