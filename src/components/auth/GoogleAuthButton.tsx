"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildOAuthCallbackUrl } from "@/lib/auth/oauth";
import { mapGoogleOAuthErrorToGerman } from "@/lib/auth/validation";

export interface GoogleAuthButtonProps {
  /** Sanitized internal path to return to after a successful sign-in. */
  nextPath: string;
}

/**
 * "Mit Google fortfahren" button. Starts Supabase's OAuth flow and lets the browser
 * navigate away to Google's consent screen — this component never handles the OAuth
 * callback itself (that's the shared /auth/callback route). Self-contained pending +
 * error state so it can be dropped into both /login and /signup without coordinating
 * with the email/password form on the same page.
 */
export function GoogleAuthButton({ nextPath }: GoogleAuthButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (pending) return;
    setPending(true);
    setError(null);

    const client = getSupabaseBrowserClient();
    if (client === null) {
      // Supabase not configured — SocialAuthButtons already guards against rendering
      // this button in that case, but stay defensive rather than throw.
      setPending(false);
      return;
    }

    const redirectTo = buildOAuthCallbackUrl(window.location.origin, nextPath);
    const { error: oauthError } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (oauthError) {
      setPending(false);
      setError(mapGoogleOAuthErrorToGerman(oauthError));
      return;
    }

    // Success: the browser is about to navigate to Google. Stay disabled/pending so a
    // second click can't fire while that navigation is still in flight.
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={handleClick}
        className="w-full gap-3"
      >
        {pending ? (
          <SpinnerIcon className="auth-spinner h-5 w-5 shrink-0" />
        ) : (
          <GoogleGlyphIcon className="h-5 w-5 shrink-0" />
        )}
        {pending ? "Wird geöffnet …" : "Mit Google fortfahren"}
      </Button>
      {error ? (
        <p role="alert" className="text-sm font-semibold break-words text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Official Google "G" mark (four brand colors) — standard, unmodified proportions. */
function GoogleGlyphIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3a9 9 0 1 0 9 9" opacity="0.85" />
    </svg>
  );
}
