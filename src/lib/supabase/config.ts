/**
 * Central place that decides whether the optional Supabase account layer is available.
 *
 * The whole free app (Area 1, localStorage progress) must keep working when these env
 * vars are missing — every Supabase code path first asks `isSupabaseConfigured()` and
 * falls back to anonymous mode otherwise. Only publishable values live here; the service
 * role key is intentionally not read anywhere in the app (it is only needed by future
 * Stripe webhooks / admin jobs, which run outside this bundle).
 */

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

// NEXT_PUBLIC_ vars are inlined at build time, so they must be referenced literally.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = SUPABASE_URL.trim();
  const publishableKey = SUPABASE_PUBLISHABLE_KEY.trim();
  if (url === "" || publishableKey === "" || !isValidHttpUrl(url)) {
    return null;
  }
  return { url, publishableKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

let hasWarnedMissingConfig = false;

/**
 * Server-side guard for code that only makes sense with Supabase configured. Never
 * throws in a way that takes the free app down: callers get `null` and degrade, but in
 * production a missing configuration is logged once so a deploy misconfiguration cannot
 * go unnoticed. No secret values are ever logged.
 */
export function assertServerSupabaseConfigured(): SupabaseConfig | null {
  const config = getSupabaseConfig();
  if (config === null && !hasWarnedMissingConfig) {
    hasWarnedMissingConfig = true;
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY sind nicht gesetzt. " +
          "Konto-Funktionen sind deaktiviert; die kostenlose App läuft weiter."
      );
    }
  }
  return config;
}
