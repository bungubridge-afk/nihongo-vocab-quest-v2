"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { AuthFormField } from "@/components/auth/AuthFormField";
import { AuthNotConfigured } from "@/components/auth/AuthNotConfigured";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { sanitizeInternalRedirect } from "@/lib/auth/redirect";
import {
  mapAuthErrorToGerman,
  validateEmail,
  validatePassword,
} from "@/lib/auth/validation";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginContent />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <p className="text-sm font-semibold text-[var(--color-ink-soft)]">Lädt…</p>
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

  // Already signed in? Straight to the target page — no double login.
  useEffect(() => {
    if (!isLoading && user !== null) {
      router.replace(nextPath);
    }
  }, [isLoading, user, router, nextPath]);

  if (!isConfigured) {
    return <AuthNotConfigured />;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    const emailError = validateEmail(email);
    const passwordError =
      password.trim() === "" ? validatePassword(password) : null;
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
      setFormError(mapAuthErrorToGerman(error));
      // Move focus to the alert so keyboard/screen-reader users hear it immediately.
      window.setTimeout(() => alertRef.current?.focus(), 0);
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-extrabold text-[var(--color-ink)]">Anmelden</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Melde dich an, um deinen Fortschritt in der Cloud zu speichern.
        </p>

        {callbackFailed && formError === null ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm font-semibold break-words text-[var(--color-danger)]"
          >
            Die Bestätigung hat nicht geklappt. Der Link ist möglicherweise abgelaufen —
            bitte melde dich an oder fordere einen neuen Link an.
          </p>
        ) : null}

        {oauthFailed && formError === null ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm font-semibold break-words text-[var(--color-danger)]"
          >
            Die Anmeldung mit Google wurde abgebrochen oder konnte nicht abgeschlossen
            werden. Bitte versuche es erneut.
          </p>
        ) : null}

        <div className="mt-5">
          <SocialAuthButtons nextPath={nextPath} />
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
          <AuthFormField
            ref={emailRef}
            id="login-email"
            label="E-Mail-Adresse"
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
            label="Passwort"
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
            {pending ? "Wird angemeldet …" : "Anmelden"}
          </Button>
        </form>

        <div className="mt-5 flex flex-col gap-2 text-sm">
          <Link
            href="/forgot-password"
            className="inline-flex min-h-11 items-center font-semibold text-[var(--color-primary-dark)] hover:underline"
          >
            Passwort vergessen?
          </Link>
          <p className="text-[var(--color-ink-soft)]">
            Noch kein Konto?{" "}
            <Link
              href={
                nextPath === "/account"
                  ? "/signup"
                  : `/signup?next=${encodeURIComponent(nextPath)}`
              }
              className="font-semibold text-[var(--color-primary-dark)] hover:underline"
            >
              Registrieren
            </Link>
          </p>
        </div>
      </Card>
    </main>
  );
}
