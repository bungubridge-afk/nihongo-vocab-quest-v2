"use client";

import { Suspense } from "react";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { EntitlementProvider } from "@/components/providers/EntitlementProvider";
import { ProgressProvider } from "@/components/providers/ProgressProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { LanguageRedirectGate } from "@/components/providers/LanguageRedirectGate";
import type { AppLocale } from "@/i18n/types";

/**
 * Client provider stack for the whole app. Order matters: entitlements and progress
 * both depend on the auth state, and LanguageProvider sits inside AuthProvider so it
 * can read the session to sync the per-account locale. Everything degrades gracefully
 * when Supabase is not configured — the providers then behave as a permanent
 * anonymous session, and the language still works from the cookie alone.
 */
export function AppProviders({
  initialLocale,
  children,
}: {
  initialLocale: AppLocale;
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <LanguageProvider initialLocale={initialLocale}>
        <Suspense fallback={null}>
          <LanguageRedirectGate />
        </Suspense>
        <EntitlementProvider>
          <ProgressProvider>{children}</ProgressProvider>
        </EntitlementProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
