"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { AuthFormField } from "@/components/auth/AuthFormField";
import { AuthNotConfigured } from "@/components/auth/AuthNotConfigured";
import { UsernameField } from "@/components/profile/UsernameField";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { sanitizeInternalRedirect } from "@/lib/auth/redirect";
import { completeUserProfile } from "@/lib/profile/profileRepository";
import { mapProfileError } from "@/lib/profile/profileErrors";
import {
  getDisplayNameCandidateFromMetadata,
  isProfileComplete,
  validateDisplayName,
  validateUsername,
} from "@/lib/profile/profileValidation";

export default function ProfileSetupPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProfileSetupContent />
    </Suspense>
  );
}

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

interface FieldErrors {
  displayName?: string | null;
  username?: string | null;
}

function ProfileSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, isConfigured } = useAuth();
  const { locale, messages } = useLanguage();
  const { profile, isLoading: profileLoading } = useUserProfile();

  const nextPath = sanitizeInternalRedirect(searchParams.get("next"));

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  // Tracks which signed-in user id the Google-metadata prefill has already run for
  // (or null if never). Compared-and-set during render (see below), the React-
  // documented way to "adjust state when data changes" without a synchronous
  // setState-in-effect — https://react.dev/learn/you-might-not-need-an-effect.
  const [prefillDoneForUserId, setPrefillDoneForUserId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const displayNameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  // Not signed in -> login first, preserving the full way back (setup, then the
  // original destination) through a nested `next`.
  useEffect(() => {
    if (!isConfigured || authLoading || user !== null) return;
    const setupUrl = `/profile/setup?next=${encodeURIComponent(nextPath)}`;
    router.replace(`/login?next=${encodeURIComponent(setupUrl)}`);
  }, [isConfigured, authLoading, user, router, nextPath]);

  // Already complete? Nothing to set up — go straight to the real destination
  // (re-visiting /profile/setup directly must not let someone redo it here).
  useEffect(() => {
    if (profileLoading || profile === null) return;
    if (isProfileComplete(profile)) {
      router.replace(nextPath);
    }
  }, [profileLoading, profile, router, nextPath]);

  if (!isConfigured) {
    return <AuthNotConfigured />;
  }
  if (authLoading || user === null || profileLoading || profile === null) {
    return <LoadingFallback />;
  }
  if (isProfileComplete(profile)) {
    return <LoadingFallback />;
  }

  // One-time prefill from Google metadata, compared-and-set during render (not in a
  // useEffect) per https://react.dev/learn/you-might-not-need-an-effect — runs at
  // most once per signed-in user id. Only fills an EMPTY field on an account with no
  // saved display name yet, so it never overrides something already typed/stored,
  // and never writes to the DB by itself (the user must still press "speichern").
  if (prefillDoneForUserId !== user.id) {
    setPrefillDoneForUserId(user.id);
    if (displayName === "" && profile.displayName === null) {
      const metadata = (user.user_metadata ?? null) as Record<string, unknown> | null;
      const candidate = getDisplayNameCandidateFromMetadata(metadata);
      if (candidate !== "") {
        setDisplayName(candidate);
      }
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    const displayNameError = validateDisplayName(displayName, locale);
    const usernameError = validateUsername(username, locale);
    if (displayNameError || usernameError) {
      setFieldErrors({ displayName: displayNameError, username: usernameError });
      setFormError(null);
      if (displayNameError) displayNameRef.current?.focus();
      else usernameRef.current?.focus();
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setPending(true);

    const client = getSupabaseBrowserClient();
    if (client === null) {
      setPending(false);
      return;
    }

    try {
      await completeUserProfile(client, displayName, username);
      router.push(nextPath);
      router.refresh();
    } catch (error) {
      setPending(false);
      const code = (error as { code?: string } | null)?.code;
      if (code === "P0103" || code === "23505") {
        setFieldErrors({ username: messages.profileErrors.usernameTaken });
      } else {
        setFormError(mapProfileError(error as { code?: string } | null, locale));
        window.setTimeout(() => alertRef.current?.focus(), 0);
      }
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-extrabold text-[var(--color-ink)]">
          {messages.profile.setupTitle}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          {messages.profile.setupSubtitle}
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-5">
          <AuthFormField
            ref={displayNameRef}
            id="profile-setup-display-name"
            label={messages.profile.displayNameLabel}
            type="text"
            value={displayName}
            onChange={setDisplayName}
            autoComplete="name"
            hint={messages.profile.displayNameHint}
            error={fieldErrors.displayName}
            disabled={pending}
          />

          <UsernameField
            ref={usernameRef}
            id="profile-setup-username"
            value={username}
            onChange={setUsername}
            disabled={pending}
            error={fieldErrors.username}
          />

          {formError ? (
            <div
              ref={alertRef}
              role="alert"
              tabIndex={-1}
              className="rounded-xl border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm font-semibold break-words text-[var(--color-danger)]"
            >
              {formError}
            </div>
          ) : null}

          <Button type="submit" variant="primary" disabled={pending} className="w-full">
            {pending ? messages.common.saving : messages.profile.saveProfile}
          </Button>
        </form>
      </Card>
    </main>
  );
}
