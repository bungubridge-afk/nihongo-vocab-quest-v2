"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { AuthFormField } from "@/components/auth/AuthFormField";
import { AuthNotConfigured } from "@/components/auth/AuthNotConfigured";
import { UsernameField } from "@/components/profile/UsernameField";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useRequireCompleteProfile } from "@/hooks/useUserProfile";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { updateDisplayName, updateUsername } from "@/lib/profile/profileRepository";
import { mapProfileError } from "@/lib/profile/profileErrors";
import {
  formatUsername,
  isProfileComplete,
  validateDisplayName,
  validateUsername,
} from "@/lib/profile/profileValidation";

function LoadingFallback() {
  const { messages } = useLanguage();
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <p className="text-sm font-semibold text-[var(--color-ink-soft)]">
        {messages.common.loading}
      </p>
    </main>
  );
}

/**
 * Profile editing (Phase 15). Two independent forms, on purpose:
 * - Anzeigename ("display name"): freely, immediately editable — no uniqueness, no
 *   confirmation step, matches how casual a display name is meant to be.
 * - Nutzer-ID ("username"): starts as read-only text with an explicit "ändern"
 *   button; changing it requires re-validating format, re-checking availability
 *   live (via the same UsernameField used in setup), AND an explicit confirm
 *   dialog before the RPC call — a username is a stable public handle, so changing
 *   it deserves more friction than the display name. No 30-day cooldown exists yet
 *   (see docs/USERNAME_POLICY.md "Future"); nothing in this UI claims one does.
 */
export default function ProfileEditPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isConfigured } = useAuth();
  const { locale, messages } = useLanguage();
  const { profile, isLoading: profileLoading, refetch } = useRequireCompleteProfile();

  // Signed out entirely → login, keeping the way back. useRequireCompleteProfile
  // only handles "signed in but profile incomplete" (→ /profile/setup); this page
  // additionally needs its own "not signed in at all" guard, same as /account.
  useEffect(() => {
    if (isConfigured && !authLoading && user === null) {
      router.replace("/login?next=%2Fprofile%2Fedit");
    }
  }, [isConfigured, authLoading, user, router]);

  // Local edit-field state, synced from the loaded profile once per signed-in user
  // (compared-and-set during render below — same pattern as /profile/setup).
  const [initializedForUserId, setInitializedForUserId] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [displayNamePending, setDisplayNamePending] = useState(false);
  const [displayNameSaved, setDisplayNameSaved] = useState(false);

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernamePending, setUsernamePending] = useState(false);

  if (!isConfigured) {
    return <AuthNotConfigured />;
  }
  if (authLoading || user === null || profileLoading || profile === null) {
    return <LoadingFallback />;
  }
  if (!isProfileComplete(profile)) {
    // useRequireCompleteProfile is already redirecting to /profile/setup.
    return <LoadingFallback />;
  }

  if (initializedForUserId !== user.id) {
    setInitializedForUserId(user.id);
    setDisplayName(profile.displayName ?? "");
    setUsername(profile.username ?? "");
  }

  // Captured as its own `const` so the nested `function` declarations below (which
  // TypeScript does not narrow across, unlike arrow functions/JSX in this same
  // scope) can read a properly non-null-typed profile.
  const currentProfile = profile;

  async function handleSaveDisplayName(event: React.FormEvent) {
    event.preventDefault();
    if (displayNamePending) return;

    const validationError = validateDisplayName(displayName, locale);
    if (validationError) {
      setDisplayNameError(validationError);
      setDisplayNameSaved(false);
      return;
    }

    setDisplayNameError(null);
    setDisplayNameSaved(false);
    setDisplayNamePending(true);

    const client = getSupabaseBrowserClient();
    if (client === null) {
      setDisplayNamePending(false);
      return;
    }

    try {
      await updateDisplayName(client, displayName);
      refetch();
      setDisplayNameSaved(true);
    } catch (error) {
      setDisplayNameError(mapProfileError(error as { code?: string } | null, locale));
    } finally {
      setDisplayNamePending(false);
    }
  }

  function handleStartUsernameEdit() {
    setUsername(currentProfile.username ?? "");
    setUsernameError(null);
    setIsEditingUsername(true);
  }

  function handleCancelUsernameEdit() {
    setUsername(currentProfile.username ?? "");
    setUsernameError(null);
    setIsEditingUsername(false);
  }

  async function handleSaveUsername(event: React.FormEvent) {
    event.preventDefault();
    if (usernamePending) return;

    const validationError = validateUsername(username, locale);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    const confirmed = window.confirm(messages.profile.usernameChangeConfirm);
    if (!confirmed) return;

    setUsernameError(null);
    setUsernamePending(true);

    const client = getSupabaseBrowserClient();
    if (client === null) {
      setUsernamePending(false);
      return;
    }

    try {
      await updateUsername(client, username);
      refetch();
      setIsEditingUsername(false);
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === "P0103" || code === "23505") {
        setUsernameError(messages.profileErrors.usernameTaken);
      } else {
        setUsernameError(mapProfileError(error as { code?: string } | null, locale));
      }
    } finally {
      setUsernamePending(false);
    }
  }

  return (
    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/account")}>
            {messages.common.back}
          </Button>
        </div>

        <h1 className="text-2xl font-extrabold text-[var(--color-ink)]">
          {messages.profile.editTitle}
        </h1>

        <Card variant="default">
          <form
            onSubmit={handleSaveDisplayName}
            noValidate
            className="flex flex-col gap-4"
          >
            <AuthFormField
              id="profile-edit-display-name"
              label={messages.profile.displayNameLabel}
              type="text"
              value={displayName}
              onChange={(value) => {
                setDisplayName(value);
                setDisplayNameSaved(false);
              }}
              autoComplete="name"
              hint={messages.profile.displayNameHint}
              error={displayNameError}
              disabled={displayNamePending}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={displayNamePending}
              >
                {displayNamePending ? messages.common.saving : messages.profile.saveDisplayName}
              </Button>
              {displayNameSaved ? (
                <span
                  role="status"
                  className="text-sm font-semibold text-[var(--color-primary-dark)]"
                >
                  {messages.profile.saved}
                </span>
              ) : null}
            </div>
          </form>
        </Card>

        <Card variant="default">
          <p className="text-xs font-bold tracking-wide text-[var(--color-ink-soft)] uppercase">
            {messages.profile.usernameLabel}
          </p>

          {!isEditingUsername ? (
            <>
              <p className="mt-1 font-semibold break-words text-[var(--color-ink)]">
                {profile.username ? formatUsername(profile.username) : ""}
              </p>
              <div className="mt-3">
                <Button variant="secondary" size="sm" onClick={handleStartUsernameEdit}>
                  {messages.profile.changeUsername}
                </Button>
              </div>
            </>
          ) : (
            <form
              onSubmit={handleSaveUsername}
              noValidate
              className="mt-3 flex flex-col gap-4"
            >
              <UsernameField
                id="profile-edit-username"
                value={username}
                onChange={setUsername}
                disabled={usernamePending}
                error={usernameError}
                currentUsername={profile.username}
              />
              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={usernamePending}
                >
                  {usernamePending ? messages.common.saving : messages.profile.saveUsername}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelUsernameEdit}
                  disabled={usernamePending}
                >
                  {messages.common.cancel}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </main>
  );
}
