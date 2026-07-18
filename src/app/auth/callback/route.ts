import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeInternalRedirect } from "@/lib/auth/redirect";

const VALID_OTP_TYPES: readonly EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

/**
 * Auth callback for e-mail confirmation links (signup, recovery, e-mail change).
 * Supports both flows Supabase can send: PKCE (`?code=`) and token-hash OTP links
 * (`?token_hash=&type=`). The redirect target is always sanitized to an in-app path —
 * never an external URL — and tokens are never logged.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const next = sanitizeInternalRedirect(searchParams.get("next"));

  const failureUrl = `${origin}/login?error=callback`;

  const supabase = await createSupabaseServerClient();
  if (supabase === null) {
    // Unconfigured environment: the login page explains the situation.
    return NextResponse.redirect(`${origin}/login`);
  }

  if (code !== null) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(failureUrl);
  }

  const type = VALID_OTP_TYPES.find((candidate) => candidate === rawType) ?? null;
  if (tokenHash !== null && type !== null) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(failureUrl);
  }

  // No usable auth parameters — nothing to verify.
  return NextResponse.redirect(failureUrl);
}
