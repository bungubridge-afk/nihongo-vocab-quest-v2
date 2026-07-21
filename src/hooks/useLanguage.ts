"use client";

import { useContext } from "react";
import { LanguageContext, type LanguageContextValue } from "@/i18n/LanguageContext";

/**
 * Access the app language: `locale`, the `messages` catalog for the current
 * locale, `setLocale`, `isChanging`, plus `pick` (for `{en,de}` content) and
 * `format` (for `{placeholder}` interpolation). Throws if used outside the
 * provider, which only happens through a wiring mistake.
 */
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (context === null) {
    throw new Error("useLanguage must be used inside <LanguageProvider>");
  }
  return context;
}
