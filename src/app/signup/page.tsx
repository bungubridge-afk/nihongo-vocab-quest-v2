"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { AuthFormField } from "@/components/auth/AuthFormField";
import { AuthNotConfigured } from "@/components/auth/AuthNotConfigured";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { sanitizeInternalRedirect } from "@/lib/auth/redirect";
import { fetchOwnProfile } from "@/lib/profile/profileRepository";
import { resolvePostAuthDestination } from "@/lib/profile/postAuthRouting";
import {
  mapAuthError,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from "@/lib/auth/validation";

export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SignupContent />
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
  email?: string | null;
  password?: string | null;
  confirm?: string | null;
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, isConfigured } = useAuth();
  const { locale, messages } = useLanguage();
  const { profile, isLoading: profileLoading } = useUserProfile();

  const nextPath = sanitizeInternalRedirect(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading || user === null || submitted || profileLoading) return;
    router.replace(resolvePostAuthDestination(profile, nextPath));
  }, [isLoading, user, submitted, profileLoading, profile, router, nextPath]);

  if (!isConfigured) {
    return <AuthNotConfigured />;
  }

  if (submitted) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md text-center">
          <h1 className="text-xl font-extrabold text-[var(--color-ink)]">
            {messages.auth.signupDoneTitle}
          </h1>
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
            {messages.auth.signupDoneBody}
          </p>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            {messages.auth.signupDoneAlready}
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 font-bold text-white hover:bg-[var(--color-primary-dark)]"
            >
              {messages.auth.toLogin}
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[var(--color-secondary-border)] bg-[var(--color-secondary)] px-5 py-2.5 font-bold text-[var(--color-ink)] hover:bg-[var(--color-primary-soft)]"
            >
              {messages.auth.keepPracticing}
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    const emailError = validateEmail(email, locale);
    const passwordError = validatePassword(password, locale);
    const confirmError = passwordError
      ? null
      : validatePasswordConfirm(password, confirm, locale);
    if (emailError || passwordError || confirmError) {
      setFieldErrors({ email: emailError, password: passwordError, confirm: confirmError });
      setFormError(null);
      if (emailError) emailRef.current?.focus();
      else if (passwordError) passwordRef.current?.focus();
      else confirmRef.current?.focus();
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

    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });

    if (error) {
      setPending(false);
      // "Already registered" shows the same neutral confirmation view as a fresh
      // signup — no account enumeration through this form.
      if (error.code === "user_already_exists" || error.code === "email_exists") {
        setSubmitted(true);
        return;
      }
      setFormError(mapAuthError(error, locale));
      window.setTimeout(() => alertRef.current?.focus(), 0);
      return;
    }

    // Email confirmation disabled in the project? Then a session exists right away
    // — route through the same profile-completeness check as every other entry
    // point (a brand-new account is always incomplete, so this reliably lands on
    // /profile/setup, but the check stays generic rather than hardcoded).
    if (data.session !== null) {
      let signedUpProfile: Awaited<ReturnType<typeof fetchOwnProfile>> = null;
      try {
        signedUpProfile = await fetchOwnProfile(client);
      } catch {
        signedUpProfile = null;
      }
      router.push(resolvePostAuthDestination(signedUpProfile, nextPath));
      router.refresh();
      return;
    }

    setPending(false);
    setSubmitted(true);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-extrabold text-[var(--color-ink)]">
            {messages.auth.signupTitle}
          </h1>
          <LanguageSwitcher variant="compact" />
        </div>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-[var(--color-ink-soft)]">
          <li>{messages.auth.signupBenefit1}</li>
          <li>{messages.auth.signupBenefit2}</li>
        </ul>

        <div className="mt-5">
          <SocialAuthButtons nextPath={nextPath} />
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
          <AuthFormField
            ref={emailRef}
            id="signup-email"
            label={messages.auth.email}
            type="email"
            inputMode="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            error={fieldErrors.email}
            disabled={pending}
          />
          <AuthFormField
            ref={passwordRef}
            id="signup-password"
            label={messages.auth.password}
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            hint={messages.auth.passwordMinHint}
            error={fieldErrors.password}
            disabled={pending}
          />
          <AuthFormField
            ref={confirmRef}
            id="signup-password-confirm"
            label={messages.auth.passwordConfirm}
            type="password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            error={fieldErrors.confirm}
            disabled={pending}
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
            {pending ? messages.auth.signupPending : messages.auth.signupSubmit}
          </Button>
        </form>

        <p className="mt-5 text-sm text-[var(--color-ink-soft)]">
          {messages.auth.alreadyRegistered}{" "}
          <Link
            href={
              nextPath === "/account"
                ? "/login"
                : `/login?next=${encodeURIComponent(nextPath)}`
            }
            className="font-semibold text-[var(--color-primary-dark)] hover:underline"
          >
            {messages.auth.loginSubmit}
          </Link>
        </p>
      </Card>
    </main>
  );
}
