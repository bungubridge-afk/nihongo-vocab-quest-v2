"use client";

import { createContext } from "react";
import type { AppLocale, LocalizedText } from "@/i18n/types";
import type { Messages } from "@/i18n/messages";

/**
 * Shape of the one app-wide language context. Kept in its own module so the
 * provider component and the `useLanguage` hook can share it without a circular
 * import, and so fast-refresh stays happy (a file exporting a component plus a
 * hook plus a context tends to invalidate more than necessary otherwise).
 */
export interface LanguageContextValue {
  locale: AppLocale;
  messages: Messages;
  /** True while a locale switch is being persisted (cookie + optional DB sync). */
  isChanging: boolean;
  /** Switches the app language: updates state + cookie immediately, and syncs to
   *  the signed-in user's profile in the background. Never navigates or signs out. */
  setLocale: (locale: AppLocale) => void;
  /** Picks the current-locale variant out of a `{ en, de }` content value. */
  pick: (text: LocalizedText) => string;
  /** Formats a raw catalog string with `{placeholder}` values. Prefer reading via
   *  `messages` directly; this is the escape hatch for interpolated strings. */
  format: (template: string, values?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);
