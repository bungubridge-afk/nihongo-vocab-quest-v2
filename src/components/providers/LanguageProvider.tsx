"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getMessages, formatMessage } from "@/i18n/getMessages";
import { LanguageContext, type LanguageContextValue } from "@/i18n/LanguageContext";
import { pickText, type AppLocale, type LocalizedText } from "@/i18n/types";
import { readLocaleCookie, writeLocaleCookie } from "@/lib/locale/localeCookie";
import {
  fetchProfileLocale,
  saveProfileLocale,
} from "@/lib/locale/localeProfileRepository";

/**
 * The single app-wide language provider (mounted once, inside AppProviders, under
 * AuthProvider so it can read the session). Responsibilities:
 *
 * - Hold the current `locale` + its message catalog, seeded from the server-chosen
 *   `initialLocale` so SSR and first client render agree (no hydration flip).
 * - `setLocale`: update state + cookie instantly, announce the change for screen
 *   readers, update `<html lang>`, and — if signed in — persist to the user's
 *   profile in the background. Never touches progress/XP/entitlements, never
 *   navigates, never signs out.
 * - On sign-in, adopt the account's stored locale (DB is the per-user source of
 *   truth across devices); if the account has none yet, back-fill it from the
 *   current choice so it's remembered next time.
 *
 * Progress and language are fully independent: switching language mutates only the
 * cookie and (for signed-in users) the profile's `locale` column.
 */
export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: AppLocale;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);
  const [isChanging, setIsChanging] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  // Which user id we've already reconciled the DB locale for — prevents repeating
  // the profile fetch on every render while still re-running on a real user switch.
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null);

  const messages = useMemo(() => getMessages(locale), [locale]);

  // Keep <html lang> honest for assistive tech whenever the locale changes on the
  // client (SSR already set the correct value for the very first paint).
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const applyLocale = useCallback(
    (next: AppLocale, announce: boolean) => {
      setLocaleState((current) => {
        if (announce && current !== next) {
          setAnnouncement(getMessages(next).language.changedAnnouncement);
        }
        return next;
      });
      writeLocaleCookie(next);
    },
    []
  );

  // On sign-in (or user switch): the account's stored locale wins across devices.
  // If the account has none yet, seed it from the current cookie-based choice.
  // Only ever sets state inside the async resolution (never synchronously in the
  // effect body), and re-runs for a genuinely different user id — signing the same
  // user back out and in keeps the already-synced marker, which is harmless because
  // their cookie already holds the right locale.
  useEffect(() => {
    if (user === null || syncedUserId === user.id) return;

    const client = getSupabaseBrowserClient();
    if (client === null) return;

    const userId = user.id;
    let cancelled = false;
    fetchProfileLocale(client).then((profileLocale) => {
      if (cancelled) return;
      setSyncedUserId(userId);
      if (profileLocale !== null) {
        // Adopt the account's language (may differ from this device's cookie).
        applyLocale(profileLocale, false);
      } else {
        // Account has no locale yet — back-fill it from the current choice.
        void saveProfileLocale(client, userId, locale);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user, syncedUserId, locale, applyLocale]);

  const setLocale = useCallback(
    (next: AppLocale) => {
      applyLocale(next, true);

      // Persist to the signed-in user's profile in the background. A failure is
      // non-fatal: the cookie + UI already switched, so the language is correct on
      // this device even if the account sync couldn't be written right now.
      if (user !== null) {
        const client = getSupabaseBrowserClient();
        if (client !== null) {
          setIsChanging(true);
          saveProfileLocale(client, user.id, next).finally(() => {
            setIsChanging(false);
          });
        }
      }
    },
    [applyLocale, user]
  );

  const pick = useCallback((text: LocalizedText) => pickText(text, locale), [locale]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      messages,
      isChanging,
      setLocale,
      pick,
      format: formatMessage,
    }),
    [locale, messages, isChanging, setLocale, pick]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
      {/* Polite live region: announces "Language changed to …" after a switch,
          in the newly selected language, without stealing focus. */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </LanguageContext.Provider>
  );
}

/** Re-reads the cookie on the client — used only by a thin bootstrap when the
 *  server couldn't determine the locale (kept for completeness/testability). */
export function readClientLocale(): AppLocale | null {
  return readLocaleCookie();
}
