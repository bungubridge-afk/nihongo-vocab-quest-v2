"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { AuthFormField } from "@/components/auth/AuthFormField";
import { AuthNotConfigured } from "@/components/auth/AuthNotConfigured";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  mapAuthErrorToGerman,
  validatePassword,
  validatePasswordConfirm,
} from "@/lib/auth/validation";

interface FieldErrors {
  password?: string | null;
  confirm?: string | null;
}

/**
 * Reached via the recovery link (auth/callback verifies the token and creates a
 * session). Without that session the form cannot work, so an expired/invalid link
 * shows a calm notice with a way to request a new one.
 */
export default function ResetPasswordPage() {
  const { user, isLoading, isConfigured } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  if (!isConfigured) {
    return <AuthNotConfigured />;
  }

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm font-semibold text-[var(--color-ink-soft)]">Lädt…</p>
      </main>
    );
  }

  if (user === null && !succeeded) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md text-center">
          <h1 className="text-xl font-extrabold text-[var(--color-ink)]">
            Link abgelaufen
          </h1>
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
            Dieser Link zum Zurücksetzen ist abgelaufen oder ungültig. Bitte fordere
            einen neuen an.
          </p>
          <div className="mt-5">
            <Link
              href="/forgot-password"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 font-bold text-white hover:bg-[var(--color-primary-dark)]"
            >
              Neuen Link anfordern
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  if (succeeded) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md text-center">
          <h1 className="text-xl font-extrabold text-[var(--color-ink)]">
            Passwort aktualisiert
          </h1>
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
            Dein neues Passwort ist gespeichert. Du bist weiterhin angemeldet.
          </p>
          <div className="mt-5">
            <Link
              href="/account"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 font-bold text-white hover:bg-[var(--color-primary-dark)]"
            >
              Zum Konto
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    const passwordError = validatePassword(password);
    const confirmError = passwordError ? null : validatePasswordConfirm(password, confirm);
    if (passwordError || confirmError) {
      setFieldErrors({ password: passwordError, confirm: confirmError });
      setFormError(null);
      if (passwordError) passwordRef.current?.focus();
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

    const { error } = await client.auth.updateUser({ password });

    setPending(false);
    if (error) {
      setFormError(mapAuthErrorToGerman(error));
      window.setTimeout(() => alertRef.current?.focus(), 0);
      return;
    }

    setSucceeded(true);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-extrabold text-[var(--color-ink)]">
          Neues Passwort festlegen
        </h1>

        <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
          <AuthFormField
            ref={passwordRef}
            id="reset-password"
            label="Neues Passwort"
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
            id="reset-password-confirm"
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
            {pending ? "Wird gespeichert …" : "Passwort aktualisieren"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
