import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import {
  createSupabaseServerClient,
  type AppServerSupabaseClient,
} from "@/lib/supabase/server";
import { fetchOwnProfile } from "@/lib/profile/profileRepository";
import { resolvePostAuthDestination } from "@/lib/profile/postAuthRouting";

const VALID_OTP_TYPES: readonly EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

/**
 * Auth callback shared by email confirmation links (signup, recovery, e-mail change)
 * AND the Google OAuth round-trip. Supports every flow Supabase can send: PKCE
 * (`?code=`, used by both email links and OAuth), token-hash OTP links
 * (`?token_hash=&type=`), and a provider-side failure (`?error=…`, e.g. the user
 * cancelled the Google consent screen). The redirect target is always resolved via
 * `resolvePostAuthDestination` (never a raw `next` echo), so a freshly-authenticated
 * user with an incomplete profile is sent to /profile/setup regardless of which auth
 * method they used — the same single choke point the login/signup pages use for the
 * email+password flow. Tokens/provider error details are never logged or shown.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  // Present when the identity provider itself reported a failure (e.g. Google
  // "access_denied" after the user cancels consent) — never a Supabase exchange
  // error. Only its presence is used to pick which German message to show; the raw
  // value/description is intentionally never read further, logged, or displayed.
  const providerError = searchParams.get("error");
  const rawNext = searchParams.get("next");

  const emailFailureUrl = `${origin}/login?error=callback`;
  const oauthFailureUrl = `${origin}/login?error=oauth`;

  const supabase = await createSupabaseServerClient();
  if (supabase === null) {
    // Unconfigured environment: the login page explains the situation.
    return NextResponse.redirect(`${origin}/login`);
  }

  if (providerError !== null) {
    return NextResponse.redirect(oauthFailureUrl);
  }

  if (code !== null) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return buildPostAuthRedirect(origin, supabase, rawNext);
    }
    return NextResponse.redirect(emailFailureUrl);
  }

  const type = VALID_OTP_TYPES.find((candidate) => candidate === rawType) ?? null;
  if (tokenHash !== null && type !== null) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return buildPostAuthRedirect(origin, supabase, rawNext);
    }
    return NextResponse.redirect(emailFailureUrl);
  }

  // No usable auth parameters — nothing to verify.
  return NextResponse.redirect(emailFailureUrl);
}

/**
 * Resolves where a just-authenticated request should land: /profile/setup for an
 * incomplete profile, otherwise the sanitized `next`. A profile fetch failure is
 * treated as "incomplete" by `resolvePostAuthDestination` (fail toward asking for
 * setup, never toward silently skipping it) rather than failing the whole request.
 */
async function buildPostAuthRedirect(
  origin: string,
  supabase: AppServerSupabaseClient,
  rawNext: string | null
): Promise<NextResponse> {
  let profile: Awaited<ReturnType<typeof fetchOwnProfile>> = null;
  try {
    profile = await fetchOwnProfile(supabase);
  } catch {
    profile = null;
  }
  const destination = resolvePostAuthDestination(profile, rawNext);
  return NextResponse.redirect(`${origin}${destination}`);
}
