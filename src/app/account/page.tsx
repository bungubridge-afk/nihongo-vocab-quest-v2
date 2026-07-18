"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card } from "@/components/ui";
import { AuthNotConfigured } from "@/components/auth/AuthNotConfigured";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/components/providers/EntitlementProvider";
import { useProgressSync } from "@/components/providers/ProgressProvider";
import {
  getCollectedCards,
  getCompletedCategories,
  getLevel,
  getXP,
} from "@/lib/storage";
import type { SyncStatus } from "@/types/auth";

const SYNC_STATUS_LABEL: Record<SyncStatus, string> = {
  local: "Nur auf diesem Gerät",
  syncing: "Wird synchronisiert …",
  synced: "Synchronisiert",
  error: "Synchronisierung fehlgeschlagen",
};

const SYNC_STATUS_BADGE: Record<SyncStatus, "gray" | "blue" | "green" | "yellow"> = {
  local: "gray",
  syncing: "blue",
  synced: "green",
  error: "yellow",
};

interface ProgressSummary {
  xp: number;
  level: number;
  cards: number;
  completed: number;
}

function formatSyncTime(iso: string | null): string | null {
  if (iso === null) return null;
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(time));
}

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoading, isConfigured, signOut } = useAuth();
  const { isPremium, isLoading: entitlementsLoading } = useEntitlements();
  const {
    syncStatus,
    lastSyncedAt,
    canImportLocalProgress,
    syncNow,
    importLocalProgress,
  } = useProgressSync();

  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [busy, setBusy] = useState<"sync" | "import" | "signout" | null>(null);

  // Signed out → login, keeping the way back. Waits for the auth check to finish so a
  // signed-in user with a slow session lookup is not bounced incorrectly.
  useEffect(() => {
    if (isConfigured && !isLoading && user === null) {
      router.replace("/login?next=%2Faccount");
    }
  }, [isConfigured, isLoading, user, router]);

  useEffect(() => {
    // One-time client-only read after hydration, same pattern as every other page.
    // The ProgressProvider remounts this page whenever the underlying store changes,
    // so the summary always reflects the signed-in user's data.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSummary({
      xp: getXP(),
      level: getLevel(),
      cards: getCollectedCards().length,
      completed: getCompletedCategories().length,
    });
  }, [syncStatus]);

  if (!isConfigured) {
    return <AuthNotConfigured />;
  }

  if (isLoading || user === null || summary === null) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm font-semibold text-[var(--color-ink-soft)]">Lädt…</p>
      </main>
    );
  }

  const syncTimeLabel = formatSyncTime(lastSyncedAt);

  async function handleSyncNow() {
    if (busy !== null) return;
    setBusy("sync");
    try {
      await syncNow();
    } finally {
      setBusy(null);
    }
  }

  async function handleImport() {
    if (busy !== null) return;
    const confirmed = window.confirm(
      "Lokalen Fortschritt in dieses Konto übernehmen?\n\n" +
        "Dein Konto-Fortschritt bleibt erhalten: XP, Karten und Etappen werden zusammengeführt, nichts wird gelöscht."
    );
    if (!confirmed) return;
    setBusy("import");
    try {
      await importLocalProgress();
    } finally {
      setBusy(null);
    }
  }

  async function handleSignOut() {
    if (busy !== null) return;
    setBusy("signout");
    try {
      await signOut();
      router.push("/");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-ink)] sm:text-3xl">
            Konto
          </h1>
        </div>

        <Card variant="default">
          <p className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
            E-Mail-Adresse
          </p>
          <p className="mt-1 font-semibold break-all text-[var(--color-ink)]">
            {user.email ?? "—"}
          </p>

          <p className="mt-4 text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
            Tarif
          </p>
          <div className="mt-1">
            {entitlementsLoading ? (
              <Badge variant="gray">Wird geprüft …</Badge>
            ) : isPremium ? (
              <Badge variant="yellow">Premium</Badge>
            ) : (
              <Badge variant="gray">Kostenlos</Badge>
            )}
          </div>
        </Card>

        <Card variant="default">
          <p className="font-bold text-[var(--color-ink)]">Gespeicherter Fortschritt</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
                XP
              </p>
              <p className="text-lg font-extrabold text-[var(--color-ink)]">{summary.xp}</p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
                Level
              </p>
              <p className="text-lg font-extrabold text-[var(--color-ink)]">
                {summary.level}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
                Karten
              </p>
              <p className="text-lg font-extrabold text-[var(--color-ink)]">
                {summary.cards}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
                Etappen
              </p>
              <p className="text-lg font-extrabold text-[var(--color-ink)]">
                {summary.completed} / 5
              </p>
            </div>
          </div>
        </Card>

        <Card variant="default">
          <p className="font-bold text-[var(--color-ink)]">Synchronisierung</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={SYNC_STATUS_BADGE[syncStatus]}>
              {SYNC_STATUS_LABEL[syncStatus]}
            </Badge>
            {syncTimeLabel ? (
              <span className="text-sm text-[var(--color-ink-soft)]">
                Zuletzt: {syncTimeLabel}
              </span>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSyncNow}
              disabled={busy !== null || syncStatus === "syncing"}
            >
              {syncStatus === "error" ? "Erneut versuchen" : "Jetzt synchronisieren"}
            </Button>
          </div>
        </Card>

        {canImportLocalProgress ? (
          <Card variant="soft">
            <p className="font-bold text-[var(--color-ink)]">
              Lokaler Fortschritt gefunden
            </p>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              Auf diesem Gerät gibt es Fortschritt, der noch keinem Konto zugeordnet
              ist. Du kannst ihn mit deinem Konto zusammenführen — dabei geht nichts
              verloren.
            </p>
            <div className="mt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleImport}
                disabled={busy !== null}
              >
                {busy === "import"
                  ? "Wird übernommen …"
                  : "Lokalen Fortschritt importieren"}
              </Button>
            </div>
          </Card>
        ) : null}

        <div>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            disabled={busy !== null}
            className="text-[var(--color-danger)]"
          >
            {busy === "signout" ? "Wird abgemeldet …" : "Abmelden"}
          </Button>
        </div>
      </div>
    </main>
  );
}
