"use client";

import { forwardRef } from "react";

export interface AuthFormFieldProps {
  id: string;
  label: string;
  type: "email" | "password" | "text";
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  error?: string | null;
  /** Extra description below the label, linked via aria-describedby. */
  hint?: string;
  disabled?: boolean;
  inputMode?: "email" | "text";
}

/**
 * Labeled input with the app's card styling and full a11y wiring: explicit label,
 * aria-invalid, aria-describedby pointing at hint and error, 44px+ touch target and
 * password-manager-friendly autocomplete values.
 */
export const AuthFormField = forwardRef<HTMLInputElement, AuthFormFieldProps>(
  function AuthFormField(
    { id, label, type, value, onChange, autoComplete, error, hint, disabled, inputMode },
    ref
  ) {
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy =
      [hintId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-bold text-[var(--color-ink)]">
          {label}
        </label>
        {hint ? (
          <p id={hintId} className="text-xs text-[var(--color-ink-soft)]">
            {hint}
          </p>
        ) : null}
        <input
          ref={ref}
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          inputMode={inputMode}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[
            "min-h-11 w-full rounded-xl border-2 bg-white px-3 py-2 text-base text-[var(--color-ink)]",
            "placeholder:text-[var(--color-ink-soft)]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
            error
              ? "border-[var(--color-danger)]"
              : "border-[var(--color-secondary-border)]",
            disabled ? "opacity-60" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        />
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
