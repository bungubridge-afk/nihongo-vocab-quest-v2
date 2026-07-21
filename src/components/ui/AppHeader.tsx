"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

/**
 * Slim global header. Left: app name (home link). Right: the compact language
 * switcher plus one auth link — "Sign in"/"Anmelden" signed out, "Account"/"Konto"
 * signed in. When Supabase is not configured the auth link is omitted entirely (no
 * dead login entry point), but the language switcher still shows — language works
 * without any account. While the initial auth check runs, a fixed-width placeholder
 * prevents the auth link from visibly flickering between states.
 */
export function AppHeader() {
  const { user, isLoading, isConfigured } = useAuth();
  const { messages } = useLanguage();

  return (
    <header className="border-b border-[var(--color-secondary-border)] bg-white/70 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-sm font-extrabold tracking-tight text-[var(--color-ink)]"
        >
          {messages.common.appName}
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="compact" />

          {isConfigured ? (
            isLoading ? (
              <span aria-hidden="true" className="inline-flex min-h-11 w-20" />
            ) : user !== null ? (
              <Link
                href="/account"
                className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-primary-soft)]"
              >
                {messages.header.account}
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-[var(--color-primary-dark)] hover:bg-[var(--color-primary-soft)]"
              >
                {messages.header.signIn}
              </Link>
            )
          ) : null}
        </div>
      </div>
    </header>
  );
}
