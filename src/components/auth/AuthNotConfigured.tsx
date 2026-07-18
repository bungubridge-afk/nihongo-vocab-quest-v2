"use client";

import Link from "next/link";
import { Card } from "@/components/ui";

/**
 * Shown on all auth routes when the Supabase env vars are missing. The free app is
 * fully usable without them, so this is a calm notice, not an error screen — and it
 * never surfaces config details or secret values.
 */
export function AuthNotConfigured() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md text-center">
        <h1 className="text-xl font-extrabold text-[var(--color-ink)]">Konto</h1>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          Die Kontofunktion ist in dieser Umgebung nicht konfiguriert.
        </p>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Du kannst Area 1 weiterhin kostenlos und ohne Konto spielen. Dein Fortschritt
          wird auf diesem Gerät gespeichert.
        </p>
        <div className="mt-5">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 font-bold text-white hover:bg-[var(--color-primary-dark)]"
          >
            Zurück zur Karte
          </Link>
        </div>
      </Card>
    </main>
  );
}
