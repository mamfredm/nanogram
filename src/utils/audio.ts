/**
 * Synthesizes delightful, juicy audio effects using the Web Audio API without external audio assets.
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

const SOUND_KEY = 'nonogrid_sound_v2';
try {
  const saved = localStorage.getItem(SOUND_KEY);
  if (saved !== null) {
    soundEnabled = saved === 'true';
  }
} catch {
  // ignore localStorage errors
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  try {
    localStorage.setItem(SOUND_KEY, String(enabled));
  } catch {
    // ignore
  }
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      try {
        audioCtx = new AudioCtxClass();
      } catch {
        return null;
      }
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

interface ToneOptions {
  type?: OscillatorType;
  toFreq?: number;
  vol?: number;
  delay?: number;
  attack?: number;
}

function playTone(freq: number, duration: number, opts: ToneOptions = {}): void {
  if (!soundEnabled) return;
  const ctx = getContext();
  if (!ctx) return;

  const t = ctx.currentTime + (opts.delay || 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = opts.type || 'sine';
  osc.frequency.setValueAtTime(freq, t);
  if (opts.toFreq) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(10, opts.toFreq), t + duration);
  }

  const vol = opts.vol || 0.1;
  const attack = opts.attack || 0.008;

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(t);
  osc.stop(t + duration + 0.05);
}

// Pentatonic scale frequencies starting around C4
const PENTATONIC = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.00, // A5
  1046.50, // C6
  1174.66, // D6
  1318.51, // E6
  1567.98, // G6
  1760.00, // A6
];

export const sfx = {
  tick: () => {
    playTone(1600, 0.025, { type: 'sine', vol: 0.03 });
  },

  dragNote: (stepIndex: number) => {
    const idx = Math.min(stepIndex, PENTATONIC.length - 1);
    const freq = PENTATONIC[Math.max(0, idx)];
    playTone(freq, 0.08, { type: 'triangle', vol: 0.06 });
  },

  fill: () => {
    playTone(280, 0.08, { type: 'triangle', toFreq: 180, vol: 0.12 });
  },

  flag: () => {
    playTone(680, 0.05, { type: 'sine', vol: 0.07 });
  },

  erase: () => {
    playTone(340, 0.06, { type: 'sine', toFreq: 260, vol: 0.05 });
  },

  undo: () => {
    playTone(480, 0.05, { vol: 0.06 });
    playTone(360, 0.07, { vol: 0.06, delay: 0.04 });
  },

  lineDone: () => {
    playTone(523.25, 0.18, { type: 'sine', vol: 0.07 }); // C5
    playTone(659.25, 0.22, { type: 'sine', vol: 0.07, delay: 0.06 }); // E5
    playTone(783.99, 0.28, { type: 'sine', vol: 0.08, delay: 0.12 }); // G5
  },

  checkClean: () => {
    playTone(660, 0.12, { type: 'triangle', vol: 0.08 });
    playTone(880, 0.15, { type: 'triangle', vol: 0.09, delay: 0.07 });
    playTone(1174.66, 0.22, { type: 'triangle', vol: 0.09, delay: 0.14 });
  },

  checkBad: () => {
    playTone(220, 0.18, { type: 'sawtooth', toFreq: 140, vol: 0.1 });
  },

  heartLost: () => {
    playTone(300, 0.1, { type: 'sawtooth', toFreq: 180, vol: 0.14 });
    playTone(180, 0.2, { type: 'triangle', toFreq: 90, vol: 0.16, delay: 0.08 });
  },

  hint: () => {
    playTone(783.99, 0.12, { type: 'sine', vol: 0.08 });
    playTone(1046.50, 0.25, { type: 'sine', vol: 0.09, delay: 0.08 });
  },

  win: () => {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((f, i) => {
      playTone(f, 0.35, { type: 'triangle', vol: 0.11, delay: i * 0.08 });
    });
    playTone(1046.50, 0.6, { type: 'sine', vol: 0.06, delay: 0.32 });
    playTone(1318.51, 0.5, { type: 'triangle', vol: 0.08, delay: 0.40 });
  },
};
