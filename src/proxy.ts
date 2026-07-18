import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 proxy (the renamed middleware convention; middleware.ts is deprecated).
 * Only job: keep the Supabase auth session fresh so Server Components and Route
 * Handlers always see valid cookies. No redirects, no gating — Area 1 stays public.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static assets and images entirely — session refresh is only useful for
  // pages, Server Actions and Route Handlers.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|woff2?)$).*)",
  ],
};
