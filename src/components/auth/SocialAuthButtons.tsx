"use client";

import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { isGoogleAuthEnabled } from "@/lib/supabase/config";

export interface SocialAuthButtonsProps {
  nextPath: string;
}

/**
 * Social sign-in options shown above the email/password form on /login and /signup.
 * Renders nothing when the Google flag is off (or Supabase isn't configured) — no
 * dead button, no layout shift to account for, the email form just starts at the top.
 */
export function SocialAuthButtons({ nextPath }: SocialAuthButtonsProps) {
  if (!isGoogleAuthEnabled()) return null;

  return (
    <div className="flex flex-col gap-4">
      <GoogleAuthButton nextPath={nextPath} />
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="h-px flex-1 bg-[var(--color-secondary-border)]" />
        <span className="text-xs font-semibold text-[var(--color-ink-soft)]">oder</span>
        <span aria-hidden="true" className="h-px flex-1 bg-[var(--color-secondary-border)]" />
      </div>
    </div>
  );
}
