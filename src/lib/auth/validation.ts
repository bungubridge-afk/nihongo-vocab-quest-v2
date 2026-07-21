import { formatMessage, getMessages } from "@/i18n/getMessages";
import type { AppLocale } from "@/i18n/types";

/**
 * Client-side validation + localized error mapping for the auth forms. Raw Supabase
 * error text is never shown to users (it is English and can leak internals); every
 * path maps to a fixed message in the current app language, and unknown errors
 * collapse into one generic message that reveals nothing about account existence.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(value: string, locale: AppLocale): string | null {
  const m = getMessages(locale).authErrors;
  const email = value.trim();
  if (email === "") return m.emailRequired;
  if (!EMAIL_PATTERN.test(email)) return m.emailInvalid;
  return null;
}

export function validatePassword(value: string, locale: AppLocale): string | null {
  const m = getMessages(locale).authErrors;
  if (value.trim() === "") return m.passwordRequired;
  if (value.length < MIN_PASSWORD_LENGTH) {
    return formatMessage(m.passwordTooShort, { min: MIN_PASSWORD_LENGTH });
  }
  return null;
}

export function validatePasswordConfirm(
  password: string,
  confirm: string,
  locale: AppLocale
): string | null {
  const m = getMessages(locale).authErrors;
  if (confirm === "") return m.passwordConfirmRequired;
  if (password !== confirm) return m.passwordMismatch;
  return null;
}

interface AuthErrorLike {
  code?: string;
  message?: string;
  status?: number;
}

/**
 * Maps a Supabase auth error to a fixed message in `locale`. Sign-in failures share
 * one message for wrong email and wrong password (no account enumeration).
 */
export function mapAuthError(error: AuthErrorLike | null, locale: AppLocale): string {
  const m = getMessages(locale).authErrors;
  if (error === null) return m.generic;
  switch (error.code) {
    case "invalid_credentials":
      return m.invalidCredentials;
    case "email_not_confirmed":
      return m.emailNotConfirmed;
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return m.rateLimit;
    case "weak_password":
      return formatMessage(m.weakPassword, { min: MIN_PASSWORD_LENGTH });
    case "same_password":
      return m.samePassword;
    case "session_expired":
    case "session_not_found":
      return m.sessionExpired;
    case "otp_expired":
      return m.otpExpired;
    default:
      return m.generic;
  }
}

/**
 * Same mapping as `mapAuthError`, but for failures to *start* the Google OAuth flow
 * (the `signInWithOAuth` call itself, before any redirect happens). Known cases keep
 * their specific message; anything unmapped falls back to the Google-specific copy.
 */
export function mapGoogleOAuthError(error: AuthErrorLike | null, locale: AppLocale): string {
  const m = getMessages(locale).authErrors;
  const mapped = mapAuthError(error, locale);
  return mapped === m.generic ? m.googleStart : mapped;
}
