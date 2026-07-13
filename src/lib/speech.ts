/**
 * Japanese text-to-speech via the browser's Web Speech API (speechSynthesis).
 * No external APIs or audio files — must only be called from a user-gesture context
 * (e.g. an onClick), since some browsers restrict speech synthesis otherwise.
 */

const FEMALE_VOICE_NAME_HINTS = [
  "kyoko",
  "nanami",
  "haruka",
  "sayaka",
  "google 日本語",
  "microsoft nanami",
];

function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function isJapaneseVoice(voice: SpeechSynthesisVoice): boolean {
  const lang = voice.lang.toLowerCase();
  return lang === "ja-jp" || lang === "ja" || lang.startsWith("ja-");
}

function pickJapaneseVoice(): SpeechSynthesisVoice | undefined {
  try {
    const voices = window.speechSynthesis.getVoices();
    const japaneseVoices = voices.filter(isJapaneseVoice);
    if (japaneseVoices.length === 0) return undefined;

    const femaleVoice = japaneseVoices.find((voice) =>
      FEMALE_VOICE_NAME_HINTS.some((hint) => voice.name.toLowerCase().includes(hint))
    );
    return femaleVoice ?? japaneseVoices[0];
  } catch {
    return undefined;
  }
}

/** Speaks `text` aloud in Japanese. No-op outside the browser or without speech support. */
export function speakJapanese(text: string): void {
  if (!isSpeechSupported()) return;
  if (!text) return;

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.85;
    utterance.pitch = 1.08;
    utterance.volume = 1.0;

    const voice = pickJapaneseVoice();
    if (voice) {
      utterance.voice = voice;
    }

    window.speechSynthesis.speak(utterance);
  } catch {
    // Speech synthesis is a nice-to-have; never let it break the app.
  }
}

/** Cancels any speech currently in progress or queued. */
export function stopSpeech(): void {
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore.
  }
}
