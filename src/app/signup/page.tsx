"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { AuthFormField } from "@/components/auth/AuthFormField";
import { AuthNotConfigured } from "@/components/auth/AuthNotConfigured";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { sanitizeInternalRedirect } from "@/lib/auth/redirect";
import {
  mapAuthErrorToGerman,
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
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <p className="text-sm font-semibold text-[var(--color-ink-soft)]">Lädt…</p>
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
    if (!isLoading && user !== null && !submitted) {
      router.replace("/account");
    }
  }, [isLoading, user, submitted, router]);

  if (!isConfigured) {
    return <AuthNotConfigured />;
  }

  if (submitted) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md text-center">
          <h1 className="text-xl font-extrabold text-[var(--color-ink)]">
            Fast geschafft!
          </h1>
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
            Wir haben eine E-Mail an die angegebene Adresse geschickt — sofern sie noch
            nicht registriert war. Bitte öffne den Bestätigungslink, um dein Konto zu
            aktivieren.
          </p>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            Bereits ein Konto? Dann kannst du dich einfach anmelden.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 font-bold text-white hover:bg-[var(--color-primary-dark)]"
            >
              Zur Anmeldung
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[var(--color-secondary-border)] bg-[var(--color-secondary)] px-5 py-2.5 font-bold text-[var(--color-ink)] hover:bg-[var(--color-primary-soft)]"
            >
              Weiter üben
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError = passwordError ? null : validatePasswordConfirm(password, confirm);
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
      setFormError(mapAuthErrorToGerman(error));
      window.setTimeout(() => alertRef.current?.focus(), 0);
      return;
    }

    // Email confirmation disabled in the project? Then a session exists right away.
    if (data.session !== null) {
      router.push(nextPath);
      router.refresh();
      return;
    }

    setPending(false);
    setSubmitted(true);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-extrabold text-[var(--color-ink)]">
          Kostenloses Konto erstellen
        </h1>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-[var(--color-ink-soft)]">
          <li>Area 1 bleibt kostenlos.</li>
          <li>Mit einem Konto kannst du deinen Fortschritt speichern.</li>
        </ul>

        <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
          <AuthFormField
            ref={emailRef}
            id="signup-email"
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
            id="signup-password"
            label="Passwort"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            hint="Mindestens 8 Zeichen."
            error={fieldErrors.password}
            disabled={pending}
          />
          <AuthFormField
            ref={confirmRef}
            id="signup-password-confirm"
            label="Passwort bestätigen"
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
            {pending ? "Konto wird erstellt …" : "Kostenloses Konto erstellen"}
          </Button>
        </form>

        <p className="mt-5 text-sm text-[var(--color-ink-soft)]">
          Bereits registriert?{" "}
          <Link
            href={
              nextPath === "/account"
                ? "/login"
                : `/login?next=${encodeURIComponent(nextPath)}`
            }
            className="font-semibold text-[var(--color-primary-dark)] hover:underline"
          >
            Anmelden
          </Link>
        </p>
      </Card>
    </main>
  );
}
