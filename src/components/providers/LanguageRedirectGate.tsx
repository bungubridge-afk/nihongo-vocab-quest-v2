"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { readLocaleCookie, writeLocaleCookie } from "@/lib/locale/localeCookie";
import { hasLegacyAnonymousProgress } from "@/lib/locale/legacyProgress";
import { LEGACY_LOCALE, LANGUAGE_SELECT_PATH } from "@/i18n/config";

/**
 * Decides, once per fresh load, whether the visitor still needs to pick a language:
 *
 *  A. No locale cookie AND no legacy progress  → brand-new visitor → send to
 *     /language (carrying the current path as `next` so they return here).
 *  B. No locale cookie BUT legacy progress present → a pre-i18n user → they were
 *     always German, so silently persist "de" and let them continue uninterrupted.
 *  C. A valid locale cookie already exists → nothing to do.
 *
 * Renders nothing. Deliberately excludes /language itself (never bounce the chooser
 * to itself). This is the only place that can trigger the /language redirect, so the
 * rule lives in exactly one spot.
 */
export function LanguageRedirectGate() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname === LANGUAGE_SELECT_PATH) return;

    if (readLocaleCookie() !== null) return; // Case C: already chosen.

    if (hasLegacyAnonymousProgress()) {
      // Case B: existing German user — remember it, don't interrupt them.
      writeLocaleCookie(LEGACY_LOCALE);
      return;
    }

    // Case A: new visitor — let them choose, then come back to where they were.
    const query = searchParams.toString();
    const current = query ? `${pathname}?${query}` : pathname;
    router.replace(`${LANGUAGE_SELECT_PATH}?next=${encodeURIComponent(current)}`);
  }, [pathname, searchParams, router]);

  return null;
}
