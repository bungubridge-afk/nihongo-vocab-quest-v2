"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

/**
 * Slim global header. Left: app name (home link). Right: one auth link — "Anmelden"
 * signed out, "Konto" signed in. When Supabase is not configured the auth link is
 * omitted entirely (no dead login entry point) and the header is just the brand.
 * While the initial auth check runs, a fixed-width placeholder prevents the link from
 * visibly flickering between states.
 */
export function AppHeader() {
  const { user, isLoading, isConfigured } = useAuth();

  return (
    <header className="border-b border-[var(--color-secondary-border)] bg-white/70 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-sm font-extrabold tracking-tight text-[var(--color-ink)]"
        >
          Nihongo Quest
        </Link>

        {isConfigured ? (
          isLoading ? (
            <span aria-hidden="true" className="inline-flex min-h-11 w-20" />
          ) : user !== null ? (
            <Link
              href="/account"
              className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-primary-soft)]"
            >
              Konto
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-[var(--color-primary-dark)] hover:bg-[var(--color-primary-soft)]"
            >
              Anmelden
            </Link>
          )
        ) : null}
      </div>
    </header>
  );
}
