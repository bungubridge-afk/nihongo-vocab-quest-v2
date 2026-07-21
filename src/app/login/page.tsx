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
import { mapAuthError, validateEmail, validatePassword } from "@/lib/auth/validation";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginContent />
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
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, isConfigured } = useAuth();
  const { locale, messages } = useLanguage();
  const { profile, isLoading: profileLoading } = useUserProfile();

  const nextPath = sanitizeInternalRedirect(searchParams.get("next"));
  const callbackFailed = searchParams.get("error") === "callback";
  const oauthFailed = searchParams.get("error") === "oauth";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  // Already signed in? Straight to the target page — no double login. Routed
  // through the same resolvePostAuthDestination() as every other auth entry point,
  // so an incomplete profile sends them to /profile/setup here too.
  useEffect(() => {
    if (isLoading || user === null || profileLoading) return;
    router.replace(resolvePostAuthDestination(profile, nextPath));
  }, [isLoading, user, profileLoading, profile, router, nextPath]);

  if (!isConfigured) {
    return <AuthNotConfigured />;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    const emailError = validateEmail(email, locale);
    const passwordError = password.trim() === "" ? validatePassword(password, locale) : null;
    if (emailError || passwordError) {
      setFieldErrors({ email: emailError, password: passwordError });
      setFormError(null);
      if (emailError) emailRef.current?.focus();
      else passwordRef.current?.focus();
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

    const { error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setPending(false);
      setFormError(mapAuthError(error, locale));
      // Move focus to the alert so keyboard/screen-reader users hear it immediately.
      window.setTimeout(() => alertRef.current?.focus(), 0);
      return;
    }

    // Same routing decision as the OAuth/email-confirmation callback: an
    // incomplete profile goes to /profile/setup instead of straight to nextPath.
    let signedInProfile: Awaited<ReturnType<typeof fetchOwnProfile>> = null;
    try {
      signedInProfile = await fetchOwnProfile(client);
    } catch {
      signedInProfile = null;
    }
    router.push(resolvePostAuthDestination(signedInProfile, nextPath));
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-extrabold text-[var(--color-ink)]">
            {messages.auth.loginTitle}
          </h1>
          <LanguageSwitcher variant="compact" />
        </div>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          {messages.auth.loginSubtitle}
        </p>

        {callbackFailed && formError === null ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm font-semibold break-words text-[var(--color-danger)]"
          >
            {messages.auth.callbackError}
          </p>
        ) : null}

        {oauthFailed && formError === null ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm font-semibold break-words text-[var(--color-danger)]"
          >
            {messages.auth.oauthError}
          </p>
        ) : null}

        <div className="mt-5">
          <SocialAuthButtons nextPath={nextPath} />
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
          <AuthFormField
            ref={emailRef}
            id="login-email"
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
            id="login-password"
            label={messages.auth.password}
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            error={fieldErrors.password}
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
            {pending ? messages.auth.loginPending : messages.auth.loginSubmit}
          </Button>
        </form>

        <div className="mt-5 flex flex-col gap-2 text-sm">
          <Link
            href="/forgot-password"
            className="inline-flex min-h-11 items-center font-semibold text-[var(--color-primary-dark)] hover:underline"
          >
            {messages.auth.forgotPassword}
          </Link>
          <p className="text-[var(--color-ink-soft)]">
            {messages.auth.noAccountYet}{" "}
            <Link
              href={
                nextPath === "/account"
                  ? "/signup"
                  : `/signup?next=${encodeURIComponent(nextPath)}`
              }
              className="font-semibold text-[var(--color-primary-dark)] hover:underline"
            >
              {messages.auth.register}
            </Link>
          </p>
        </div>
      </Card>
    </main>
  );
}
