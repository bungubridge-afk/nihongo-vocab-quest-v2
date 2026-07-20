/**
 * Client-side validation + German error mapping for the auth forms. Raw Supabase
 * error text is never shown to users (it is English and can leak internals); every
 * path maps to a fixed German message, and unknown errors collapse into one generic
 * message that reveals nothing about account existence.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (email === "") return "Bitte gib deine E-Mail-Adresse ein.";
  if (!EMAIL_PATTERN.test(email)) {
    return "Bitte gib eine gültige E-Mail-Adresse ein.";
  }
  return null;
}

export function validatePassword(value: string): string | null {
  if (value.trim() === "") return "Bitte gib ein Passwort ein.";
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein.`;
  }
  return null;
}

export function validatePasswordConfirm(
  password: string,
  confirm: string
): string | null {
  if (confirm === "") return "Bitte bestätige dein Passwort.";
  if (password !== confirm) return "Die Passwörter stimmen nicht überein.";
  return null;
}

export const GENERIC_AUTH_ERROR =
  "Das hat leider nicht geklappt. Bitte versuche es später erneut.";

interface AuthErrorLike {
  code?: string;
  message?: string;
  status?: number;
}

/**
 * Maps a Supabase auth error to a fixed German message. Sign-in failures share one
 * message for wrong email and wrong password (no account enumeration).
 */
export function mapAuthErrorToGerman(error: AuthErrorLike | null): string {
  if (error === null) return GENERIC_AUTH_ERROR;
  switch (error.code) {
    case "invalid_credentials":
      return "E-Mail-Adresse oder Passwort ist nicht korrekt.";
    case "email_not_confirmed":
      return "Bitte bestätige zuerst deine E-Mail-Adresse über den Link in deinem Postfach.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Zu viele Versuche. Bitte warte einen Moment und versuche es erneut.";
    case "weak_password":
      return `Bitte wähle ein stärkeres Passwort (mindestens ${MIN_PASSWORD_LENGTH} Zeichen).`;
    case "same_password":
      return "Das neue Passwort muss sich vom alten unterscheiden.";
    case "session_expired":
    case "session_not_found":
      return "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.";
    case "otp_expired":
      return "Der Link ist abgelaufen. Bitte fordere einen neuen an.";
    default:
      return GENERIC_AUTH_ERROR;
  }
}

const GOOGLE_START_ERROR =
  "Die Anmeldung mit Google konnte nicht gestartet werden. Bitte versuche es erneut.";

/**
 * Same mapping as `mapAuthErrorToGerman`, but for failures to *start* the Google
 * OAuth flow (the `signInWithOAuth` call itself, before any redirect happens).
 * Known cases (e.g. rate limiting) keep their specific message; anything unmapped
 * falls back to the Google-specific copy instead of the generic one, since the user
 * just clicked "Mit Google fortfahren" and that's the action that failed.
 */
export function mapGoogleOAuthErrorToGerman(error: AuthErrorLike | null): string {
  const mapped = mapAuthErrorToGerman(error);
  return mapped === GENERIC_AUTH_ERROR ? GOOGLE_START_ERROR : mapped;
}
