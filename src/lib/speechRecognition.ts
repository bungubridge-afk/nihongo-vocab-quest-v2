/**
 * Japanese speech recognition via the browser's Web Speech API (SpeechRecognition /
 * webkitSpeechRecognition). SSR-safe: nothing touches `window` at module scope, and a
 * recognizer is only ever created inside `startJapaneseRecognition`, which callers must
 * invoke from a user gesture (mic button click). Recognition being unavailable or failing
 * must never break the app — every entry point degrades to a no-op / error callback.
 */

/**
 * Minimal typings for the Web Speech API recognition interfaces. TypeScript's standard DOM
 * lib does not ship SpeechRecognition (it is still prefixed in Chromium), so we declare only
 * the members we actually use instead of pulling in `any`.
 */
interface MinimalRecognitionAlternative {
  transcript: string;
}

interface MinimalRecognitionResult {
  readonly length: number;
  [index: number]: MinimalRecognitionAlternative;
}

interface MinimalRecognitionResultList {
  readonly length: number;
  [index: number]: MinimalRecognitionResult;
}

interface MinimalRecognitionEvent {
  results: MinimalRecognitionResultList;
}

interface MinimalRecognitionErrorEvent {
  error: string;
}

interface MinimalSpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: MinimalRecognitionEvent) => void) | null;
  onerror: ((event: MinimalRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => MinimalSpeechRecognition;

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

function getRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const win = window as WindowWithSpeechRecognition;
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

/** Whether this browser supports speech recognition at all. Always false during SSR. */
export function isSpeechRecognitionSupported(): boolean {
  return getRecognitionConstructor() !== null;
}

export type RecognitionFailure = "no-speech" | "permission-denied" | "unavailable";

export interface RecognitionCallbacks {
  /** Called with every alternative transcript the engine produced (best guess first). */
  onResult: (transcripts: string[]) => void;
  /** Called instead of onResult when recognition ended without a usable result. */
  onFailure: (reason: RecognitionFailure) => void;
  /** Always called exactly once when the session is over (after onResult/onFailure). */
  onEnd: () => void;
}

export interface RecognitionHandle {
  /** Stops listening and discards any pending result. Safe to call multiple times. */
  abort: () => void;
}

/**
 * Starts a single-shot Japanese recognition session. Returns null when unsupported (the
 * caller should already have checked `isSpeechRecognitionSupported`, but a null return keeps
 * a race from throwing). Exactly one of onResult/onFailure fires, followed by onEnd.
 */
export function startJapaneseRecognition(callbacks: RecognitionCallbacks): RecognitionHandle | null {
  const Ctor = getRecognitionConstructor();
  if (!Ctor) return null;

  let recognition: MinimalSpeechRecognition;
  try {
    recognition = new Ctor();
  } catch {
    return null;
  }

  let settled = false;
  let ended = false;

  function settle(action: () => void) {
    if (settled) return;
    settled = true;
    action();
  }

  function finish() {
    if (ended) return;
    ended = true;
    // A session that ends without result or error (e.g. stop() with no speech captured)
    // still needs a terminal callback so the UI can leave the "listening" state.
    settle(() => callbacks.onFailure("no-speech"));
    callbacks.onEnd();
  }

  recognition.lang = "ja-JP";
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 3;

  recognition.onresult = (event) => {
    const transcripts: string[] = [];
    for (let i = 0; i < event.results.length; i += 1) {
      const result = event.results[i];
      for (let j = 0; j < result.length; j += 1) {
        const transcript = result[j]?.transcript?.trim();
        if (transcript) transcripts.push(transcript);
      }
    }
    settle(() => {
      if (transcripts.length > 0) {
        callbacks.onResult(transcripts);
      } else {
        callbacks.onFailure("no-speech");
      }
    });
  };

  recognition.onerror = (event) => {
    settle(() => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        callbacks.onFailure("permission-denied");
      } else if (event.error === "no-speech" || event.error === "aborted") {
        callbacks.onFailure("no-speech");
      } else {
        callbacks.onFailure("unavailable");
      }
    });
  };

  recognition.onend = () => {
    finish();
  };

  try {
    recognition.start();
  } catch {
    // start() throws when a session is already running; report and bail cleanly.
    settle(() => callbacks.onFailure("unavailable"));
    finish();
    return null;
  }

  return {
    abort: () => {
      // Mark as settled first so the aborted session cannot fire a late onResult/onFailure
      // into a component that has moved on (or unmounted).
      settled = true;
      try {
        recognition.abort();
      } catch {
        // Ignore — aborting an already-finished session is fine.
      }
      finish();
    },
  };
}

/**
 * Normalizes a spoken transcript (or an accepted reference sentence) for comparison:
 * Unicode NFKC (full/half-width), lowercase, whitespace and Japanese/Latin punctuation
 * stripped, and katakana folded to hiragana so コーヒー and こーひー compare equal.
 * Kanji↔kana differences are NOT bridged here — accepted transcript lists must contain
 * both spellings (e.g. 水をください and みずをください).
 */
export function normalizeSpokenJapanese(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s。、．，！？!?.,·・「」『』()（）]/gu, "")
    .replace(/[ァ-ヶ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));
}

/**
 * True when any recognized transcript exactly matches (after normalization) one of the
 * accepted sentences. Deliberately full-sentence equality — no partial/substring matching,
 * so saying just the key word (e.g. only „みず“) does not count as a correct utterance.
 */
export function matchesAcceptedTranscripts(
  transcripts: string[],
  acceptedTranscripts: string[]
): boolean {
  const accepted = new Set(acceptedTranscripts.map(normalizeSpokenJapanese));
  return transcripts.some((transcript) => accepted.has(normalizeSpokenJapanese(transcript)));
}
