import type {
  ConversationSituation,
  SpeechRegister,
  UsageExample,
  VocabItem,
} from "@/types/learning";

/**
 * Pure display/lookup helpers for the register-and-situation foundation (see
 * `docs/REGISTER_SITUATION_FOUNDATION.md`). No React, no UI components — this file only
 * maps enum values to German labels/descriptions and filters `VocabItem.usageExamples`.
 * Every helper treats a missing `usageExamples` array as "no data" (returns `[]`), never
 * throws, and never invents a register for an example that doesn't explicitly have one.
 */

/** Beginner-facing labels (shown in a future UI). `honorific`/`humble` are reserved for a
 *  later keigo expansion — no A0–A1 content uses them yet, but the label exists so the
 *  type is fully covered and nothing has to change here when that content arrives. */
const REGISTER_LABELS: Record<SpeechRegister, string> = {
  neutral: "Neutral",
  casual: "Locker",
  polite: "Höflich",
  honorific: "Respektvoll",
  humble: "Bescheiden",
};

/** Short, beginner-readable German explanation of what each register means. */
const REGISTER_DESCRIPTIONS: Record<SpeechRegister, string> = {
  neutral: "Neutral formuliert, ohne einen deutlichen lockeren oder höflichen Ton.",
  casual: "Eine lockere Form für Freunde, Familie oder vertraute Personen.",
  polite: "Eine höfliche Form für unbekannte Personen, Lehrkräfte oder formellere Situationen.",
  honorific:
    "Eine respektvolle Form, mit der die Handlung einer anderen Person aufgewertet wird.",
  humble:
    "Eine bescheidene Form, mit der die eigene Handlung gegenüber einer anderen Person zurückgenommen wird.",
};

const SITUATION_LABELS: Record<ConversationSituation, string> = {
  general: "Allgemein",
  friend: "Freunde",
  family: "Familie",
  classmate: "Klassenkameraden",
  teacher: "Lehrkraft",
  stranger: "Fremde Person",
  staff: "Servicepersonal",
  work: "Arbeit",
};

/** German label for a register, e.g. for a future "Locker"/"Höflich" badge. */
export function getRegisterLabel(register: SpeechRegister): string {
  return REGISTER_LABELS[register];
}

/** Short German explanation of a register, for a future tooltip/info panel. */
export function getRegisterDescription(register: SpeechRegister): string {
  return REGISTER_DESCRIPTIONS[register];
}

/** German label for a conversation situation, e.g. "mit wem spreche ich?" filters. */
export function getSituationLabel(situation: ConversationSituation): string {
  return SITUATION_LABELS[situation];
}

/** Always returns an array — `[]` when the word has no `usageExamples` yet. */
function getUsageExamples(vocab: VocabItem): UsageExample[] {
  return vocab.usageExamples ?? [];
}

/** All of this word's examples that use a specific register (e.g. only the casual ones). */
export function getUsageExamplesByRegister(
  vocab: VocabItem,
  register: SpeechRegister
): UsageExample[] {
  return getUsageExamples(vocab).filter((example) => example.register === register);
}

/** All of this word's examples that are natural to say in a given situation. */
export function getUsageExamplesForSituation(
  vocab: VocabItem,
  situation: ConversationSituation
): UsageExample[] {
  return getUsageExamples(vocab).filter((example) => example.suitableFor.includes(situation));
}

/** Every example sharing a `contrastGroup` id (e.g. the casual/polite pair for one meaning). */
export function getContrastExamples(vocab: VocabItem, contrastGroup: string): UsageExample[] {
  return getUsageExamples(vocab).filter((example) => example.contrastGroup === contrastGroup);
}
