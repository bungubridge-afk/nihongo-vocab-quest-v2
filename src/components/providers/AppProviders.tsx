"use client";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { EntitlementProvider } from "@/components/providers/EntitlementProvider";
import { ProgressProvider } from "@/components/providers/ProgressProvider";

/**
 * Client provider stack for the whole app. Order matters: entitlements and progress
 * both depend on the auth state. Everything degrades gracefully when Supabase is not
 * configured — the providers then behave as a permanent anonymous session.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <EntitlementProvider>
        <ProgressProvider>{children}</ProgressProvider>
      </EntitlementProvider>
    </AuthProvider>
  );
}
