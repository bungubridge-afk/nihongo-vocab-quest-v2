"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Quiet one-liner under the quest result card: anonymous players are told once per
 * result screen that an account can keep their progress safe. Renders nothing when
 * signed in, while auth is still resolving, or when Supabase is not configured —
 * never a modal, never blocks the flow.
 */
export function SaveProgressHint() {
  const { user, isLoading, isConfigured } = useAuth();
  const { messages } = useLanguage();

  if (!isConfigured || isLoading || user !== null) {
    return null;
  }

  return (
    <p className="mt-4 text-sm text-[var(--color-ink-soft)]">
      {messages.auth.saveProgressHint}{" "}
      <Link
        href="/signup"
        className="font-semibold text-[var(--color-primary-dark)] hover:underline"
      >
        {messages.auth.saveProgressCta}
      </Link>
    </p>
  );
}
