import { ANONYMOUS_STORAGE_KEYS } from "@/lib/progress/localProgressRepository";

/**
 * Detects a pre-i18n visitor: any of the legacy anonymous progress keys present in
 * localStorage means this browser was already learning before the language
 * selection existed — and the app shipped German-only, so that visitor is treated
 * as a German user (locale "de") instead of being interrupted by /language.
 * See docs/LOCALIZATION_ARCHITECTURE.md ("Legacy users").
 *
 * Read-only: this helper never writes, migrates or deletes any progress key.
 */
export function hasLegacyAnonymousProgress(): boolean {
  if (typeof window === "undefined") return false;
  try {
    for (const key of Object.values(ANONYMOUS_STORAGE_KEYS)) {
      if (window.localStorage.getItem(key) !== null) return true;
    }
  } catch {
    // localStorage unavailable (private mode) — treat as a fresh browser.
  }
  return false;
}
