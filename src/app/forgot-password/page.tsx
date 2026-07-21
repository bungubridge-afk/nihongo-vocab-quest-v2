"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { AuthFormField } from "@/components/auth/AuthFormField";
import { AuthNotConfigured } from "@/components/auth/AuthNotConfigured";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { mapAuthError, validateEmail } from "@/lib/auth/validation";

export default function ForgotPasswordPage() {
  const { isConfigured } = useAuth();
  const { locale, messages } = useLanguage();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  if (!isConfigured) {
    return <AuthNotConfigured />;
  }

  if (submitted) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md text-center">
          <h1 className="text-xl font-extrabold text-[var(--color-ink)]">
            {messages.auth.forgotDoneTitle}
          </h1>
          <p className="mt-3 text-sm break-words text-[var(--color-ink-soft)]">
            {messages.auth.forgotDoneBody}
          </p>
          <div className="mt-5">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 font-bold text-white hover:bg-[var(--color-primary-dark)]"
            >
              {messages.auth.toLogin}
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    const validationError = validateEmail(email, locale);
    if (validationError) {
      setEmailError(validationError);
      emailRef.current?.focus();
      return;
    }

    setEmailError(null);
    setFormError(null);
    setPending(true);

    const client = getSupabaseBrowserClient();
    if (client === null) {
      setPending(false);
      return;
    }

    const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
    });

    setPending(false);

    // Rate limits surface as real errors; everything else shows the same neutral
    // success view so the form never reveals whether an address is registered.
    if (
      error &&
      (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit")
    ) {
      setFormError(mapAuthError(error, locale));
      window.setTimeout(() => alertRef.current?.focus(), 0);
      return;
    }

    setSubmitted(true);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-extrabold text-[var(--color-ink)]">
          {messages.auth.forgotTitle}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          {messages.auth.forgotSubtitle}
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
          <AuthFormField
            ref={emailRef}
            id="forgot-email"
            label={messages.auth.email}
            type="email"
            inputMode="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            error={emailError}
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
            {pending ? messages.auth.forgotPending : messages.auth.forgotSubmit}
          </Button>
        </form>

        <p className="mt-5 text-sm text-[var(--color-ink-soft)]">
          {messages.auth.forgotRemembered}{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--color-primary-dark)] hover:underline"
          >
            {messages.auth.loginSubmit}
          </Link>
        </p>
      </Card>
    </main>
  );
}
