import { de } from "@/i18n/messages/de";
import { en } from "@/i18n/messages/en";
import type { AppLocale } from "@/i18n/types";

/**
 * The message-catalog shape is DEFINED by the German catalog (the original,
 * complete app copy) and every other locale must satisfy it. `en.ts` is annotated
 * `: Messages`, so a key present in de.ts but missing/misnamed in en.ts is a
 * compile error — this is the build-time "en/de keys must match" guarantee the
 * spec asks for.
 */
export type Messages = typeof de;

const CATALOGS: Record<AppLocale, Messages> = { en, de };

/** Returns the full message catalog for a locale. Pure, synchronous, no I/O —
 *  both catalogs are plain module objects bundled at build time. */
export function getMessages(locale: AppLocale): Messages {
  return CATALOGS[locale];
}
