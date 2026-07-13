/**
 * Lightweight sound effects generated with the Web Audio API (no audio files).
 * Must only be called from within a user-gesture event handler (e.g. an
 * onClick), since browsers restrict audio playback outside of that context.
 */

type AudioContextConstructor = typeof AudioContext;

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: AudioContextConstructor;
}

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (sharedAudioContext) return sharedAudioContext;

  const Ctor: AudioContextConstructor | undefined =
    window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
  if (!Ctor) return null;

  try {
    sharedAudioContext = new Ctor();
    return sharedAudioContext;
  } catch {
    return null;
  }
}

interface Tone {
  frequency: number;
  startOffset: number;
  duration: number;
  peakGain: number;
  type: OscillatorType;
}

function playTones(tones: Tone[]) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    for (const tone of tones) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = tone.type;
      oscillator.frequency.setValueAtTime(tone.frequency, now + tone.startOffset);

      const start = now + tone.startOffset;
      const end = start + tone.duration;
      const attack = Math.min(0.015, tone.duration / 4);
      const release = Math.min(0.04, tone.duration / 2);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(tone.peakGain, start + attack);
      gain.gain.setValueAtTime(tone.peakGain, Math.max(start + attack, end - release));
      gain.gain.linearRampToValueAtTime(0, end);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start(start);
      oscillator.stop(end + 0.02);
    }
  } catch {
    // Audio playback is a nice-to-have; never let it break the app.
  }
}

/** Bright, light "poron" — a short ascending three-note chime. */
export function playCorrectSound() {
  playTones([
    { frequency: 660, startOffset: 0, duration: 0.07, peakGain: 0.08, type: "triangle" },
    { frequency: 880, startOffset: 0.06, duration: 0.07, peakGain: 0.08, type: "triangle" },
    { frequency: 1320, startOffset: 0.12, duration: 0.08, peakGain: 0.07, type: "sine" },
  ]);
}

/** Soft, short descending tone — gentle, not a harsh buzzer. */
export function playIncorrectSound() {
  playTones([
    { frequency: 220, startOffset: 0, duration: 0.1, peakGain: 0.05, type: "sine" },
    { frequency: 160, startOffset: 0.08, duration: 0.12, peakGain: 0.045, type: "sine" },
  ]);
}
