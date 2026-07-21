import { getMessages, type Messages } from "@/i18n/messages";

export { getMessages };
export type { Messages };

/**
 * Fills `{placeholder}` slots in a catalog string. Values are coerced to strings;
 * an unreferenced placeholder is left as-is (so a copy typo is visible, not
 * silently dropped). Deliberately tiny — the app never needs ICU plurals here
 * because count-dependent strings (word/words, entry/entries) are modeled as
 * separate keys chosen by the caller (see e.g. vocabulary.wordDiscovered vs
 * wordsDiscovered), which keeps English and German plural rules independent.
 */
export function formatMessage(
  template: string,
  values?: Record<string, string | number>
): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match
  );
}
