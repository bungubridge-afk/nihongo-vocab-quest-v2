"use client";

import { forwardRef, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { checkUsernameAvailable } from "@/lib/profile/profileRepository";
import { normalizeUsername, validateUsername } from "@/lib/profile/profileValidation";

export type UsernameAvailability =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "own"
  | "unknown";

export interface UsernameFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Submit-time validation/server error. When set, the live availability status
   *  line is suppressed so a stale "Available" can never sit next to a fresh
   *  "already taken" server error for the same value. */
  error?: string | null;
  /** The user's own current username, if any — typing it back in shows "own"
   *  (no network call) and never blocks submission as "taken". */
  currentUsername?: string | null;
}

const DEBOUNCE_MS = 550;

interface AvailabilityCheck {
  value: string;
  result: boolean | null;
}

/**
 * Shared "@ + handle" input used by both /profile/setup and /profile/edit. Debounces
 * the availability RPC (only after local format validation passes and the value is
 * at least 3 characters), dedupes repeated checks of the same normalized value, and
 * is unmount/rerun-safe via the standard `cancelled` flag pattern. The live status is
 * purely advisory — final uniqueness is always re-verified by the DB at save time.
 */
export const UsernameField = forwardRef<HTMLInputElement, UsernameFieldProps>(
  function UsernameField({ id, value, onChange, disabled, error, currentUsername }, ref) {
    const { locale, messages } = useLanguage();
    const [checked, setChecked] = useState<AvailabilityCheck | null>(null);

    const formatError = validateUsername(value, locale);
    const normalized = normalizeUsername(value);

    useEffect(() => {
      if (formatError !== null || normalized.length < 3) return;
      if (currentUsername != null && normalized === currentUsername) return;
      // Already have a fresh result for this exact value — no need to re-check.
      if (checked !== null && checked.value === normalized) return;

      const client = getSupabaseBrowserClient();
      if (client === null) return;

      let cancelled = false;
      const timer = window.setTimeout(() => {
        checkUsernameAvailable(client, normalized).then((result) => {
          if (cancelled) return;
          setChecked({ value: normalized, result });
        });
      }, DEBOUNCE_MS);

      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }, [normalized, formatError, currentUsername, checked]);

    let availability: UsernameAvailability;
    if (formatError !== null || normalized.length < 3) {
      availability = "idle";
    } else if (currentUsername != null && normalized === currentUsername) {
      availability = "own";
    } else if (checked !== null && checked.value === normalized) {
      availability =
        checked.result === null ? "unknown" : checked.result ? "available" : "taken";
    } else {
      availability = "checking";
    }

    const hintId = `${id}-hint`;
    const statusId = `${id}-status`;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy =
      [hintId, error ? undefined : statusId, errorId].filter(Boolean).join(" ") ||
      undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-bold text-[var(--color-ink)]">
          {messages.profile.usernameFieldLabel}
        </label>
        <p id={hintId} className="text-xs text-[var(--color-ink-soft)]">
          {messages.profile.usernameFieldHint}
        </p>
        <div
          className={[
            "flex items-stretch overflow-hidden rounded-xl border-2 bg-white transition-colors",
            "focus-within:border-[var(--color-primary)]",
            error
              ? "border-[var(--color-danger)]"
              : "border-[var(--color-secondary-border)]",
            disabled ? "opacity-60" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span
            aria-hidden="true"
            className="flex min-h-11 shrink-0 items-center pr-0.5 pl-3 text-base font-semibold text-[var(--color-ink-soft)]"
          >
            @
          </span>
          <input
            ref={ref}
            id={id}
            name={id}
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className="min-h-11 min-w-0 flex-1 bg-transparent py-2 pr-3 text-base text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:outline-none"
            placeholder="mada_jp"
          />
        </div>

        {!error ? (
          <p id={statusId} aria-live="polite" className="text-xs">
            <UsernameStatusText availability={availability} />
          </p>
        ) : null}

        {error ? (
          <p
            id={errorId}
            role="alert"
            className="text-sm font-semibold break-words text-[var(--color-danger)]"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

function UsernameStatusText({ availability }: { availability: UsernameAvailability }) {
  const { messages } = useLanguage();
  switch (availability) {
    case "checking":
      return (
        <span className="text-[var(--color-ink-soft)]">{messages.profile.usernameChecking}</span>
      );
    case "available":
      return (
        <span className="font-semibold text-[var(--color-primary-dark)]">
          {messages.profile.usernameAvailable}
        </span>
      );
    case "taken":
      return (
        <span className="font-semibold text-[var(--color-danger)]">
          {messages.profile.usernameTaken}
        </span>
      );
    case "own":
      return (
        <span className="text-[var(--color-ink-soft)]">{messages.profile.usernameOwn}</span>
      );
    case "unknown":
      return (
        <span className="text-[var(--color-ink-soft)]">{messages.profile.usernameUnknown}</span>
      );
    case "idle":
    default:
      return (
        <span className="text-[var(--color-ink-soft)]">{messages.profile.usernameIdle}</span>
      );
  }
}
