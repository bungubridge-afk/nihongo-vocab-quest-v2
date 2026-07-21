"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import { AuthNotConfigured } from "@/components/auth/AuthNotConfigured";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useRequireCompleteProfile } from "@/hooks/useUserProfile";
import { useEntitlements } from "@/components/providers/EntitlementProvider";
import { useProgressSync } from "@/components/providers/ProgressProvider";
import { formatMessage } from "@/i18n/getMessages";
import { formatUsername, isProfileComplete } from "@/lib/profile/profileValidation";
import {
  getCollectedCards,
  getCompletedCategories,
  getLevel,
  getXP,
} from "@/lib/storage";
import type { SyncStatus } from "@/types/auth";

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

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoading, isConfigured, signOut } = useAuth();
  const { locale, messages } = useLanguage();
  const { profile, isLoading: profileLoading } = useRequireCompleteProfile();
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

  // Also waits on the profile guard: renders nothing of the account content until
  // we know the profile is loaded AND complete, so an incomplete-profile user never
  // sees a flash of "Free"/progress before useRequireCompleteProfile redirects them.
  if (
    isLoading ||
    user === null ||
    summary === null ||
    profileLoading ||
    profile === null ||
    !isProfileComplete(profile)
  ) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm font-semibold text-[var(--color-ink-soft)]">
          {messages.common.loading}
        </p>
      </main>
    );
  }

  const syncTimeLabel = formatSyncTime(lastSyncedAt, locale);

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
    const confirmed = window.confirm(messages.account.importConfirm);
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
            {messages.account.title}
          </h1>
        </div>

        <Card variant="default">
          <p className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
            {messages.account.profileLabel}
          </p>
          <p className="mt-1 font-semibold break-words text-[var(--color-ink)]">
            {profile.displayName ?? ""}
          </p>
          <p className="text-sm break-words text-[var(--color-ink-soft)]">
            {profile.username ? formatUsername(profile.username) : ""}
          </p>
          <div className="mt-3">
            <Link
              href="/profile/edit"
              className="inline-flex min-h-11 items-center rounded-xl border border-[var(--color-secondary-border)] bg-[var(--color-secondary)] px-3 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-primary-soft)]"
            >
              {messages.account.editProfile}
            </Link>
          </div>
        </Card>

        <Card variant="default">
          <p className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
            {messages.account.emailLabel}
          </p>
          <p className="mt-1 font-semibold break-all text-[var(--color-ink)]">
            {user.email ?? "—"}
          </p>

          <p className="mt-4 text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
            {messages.account.planLabel}
          </p>
          <div className="mt-1">
            {entitlementsLoading ? (
              <Badge variant="gray">{messages.account.planChecking}</Badge>
            ) : isPremium ? (
              <Badge variant="yellow">{messages.account.planPremium}</Badge>
            ) : (
              <Badge variant="gray">{messages.account.planFree}</Badge>
            )}
          </div>
        </Card>

        <Card variant="default">
          <p className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
            {messages.account.languageLabel}
          </p>
          <div className="mt-2">
            <LanguageSwitcher variant="full" />
          </div>
        </Card>

        <Card variant="default">
          <p className="font-bold text-[var(--color-ink)]">{messages.account.savedProgress}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
                {messages.account.xp}
              </p>
              <p className="text-lg font-extrabold text-[var(--color-ink)]">{summary.xp}</p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
                {messages.account.level}
              </p>
              <p className="text-lg font-extrabold text-[var(--color-ink)]">{summary.level}</p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
                {messages.account.cards}
              </p>
              <p className="text-lg font-extrabold text-[var(--color-ink)]">{summary.cards}</p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
                {messages.account.stages}
              </p>
              <p className="text-lg font-extrabold text-[var(--color-ink)]">
                {formatMessage(messages.account.stagesValue, { done: summary.completed })}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="default">
          <p className="font-bold text-[var(--color-ink)]">{messages.account.sync}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={SYNC_STATUS_BADGE[syncStatus]}>
              {messages.account.syncStatus[syncStatus]}
            </Badge>
            {syncTimeLabel ? (
              <span className="text-sm text-[var(--color-ink-soft)]">
                {formatMessage(messages.account.lastSynced, { time: syncTimeLabel })}
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
              {syncStatus === "error" ? messages.account.syncRetry : messages.account.syncNow}
            </Button>
          </div>
        </Card>

        {canImportLocalProgress ? (
          <Card variant="soft">
            <p className="font-bold text-[var(--color-ink)]">
              {messages.account.localProgressFoundTitle}
            </p>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              {messages.account.localProgressFoundBody}
            </p>
            <div className="mt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleImport}
                disabled={busy !== null}
              >
                {busy === "import" ? messages.account.importing : messages.account.importLocal}
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
            {busy === "signout" ? messages.account.signingOut : messages.account.signOut}
          </Button>
        </div>
      </div>
    </main>
  );
}

/** Localized last-synced timestamp. Uses the app locale's regional format (en-GB
 *  keeps day/month order familiar to English users; de-DE for German). */
function formatSyncTime(iso: string | null, locale: "en" | "de"): string | null {
  if (iso === null) return null;
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  const intlLocale = locale === "de" ? "de-DE" : "en-GB";
  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(time));
}
