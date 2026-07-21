"use client";

import Link from "next/link";
import { Card } from "@/components/ui";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Shown on all auth routes when the Supabase env vars are missing. The free app is
 * fully usable without them, so this is a calm notice, not an error screen — and it
 * never surfaces config details or secret values.
 */
export function AuthNotConfigured() {
  const { messages } = useLanguage();
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md text-center">
        <h1 className="text-xl font-extrabold text-[var(--color-ink)]">
          {messages.auth.notConfiguredTitle}
        </h1>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          {messages.auth.notConfiguredBody}
        </p>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          {messages.auth.notConfiguredFree}
        </p>
        <div className="mt-5">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 font-bold text-white hover:bg-[var(--color-primary-dark)]"
          >
            {messages.auth.backToMap}
          </Link>
        </div>
      </Card>
    </main>
  );
}
