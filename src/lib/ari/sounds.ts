"use client";

// Clean interface sounds, synthesized with the Web Audio API (no audio files).
// Everything is quiet with a soft attack, so it sits under the voices.
type Note = { freq: number; at: number; dur: number; type?: OscillatorType; gain?: number; slideTo?: number };
// A short burst of filtered noise (taps, clicks, air).
type Noise = { at: number; dur: number; filter: BiquadFilterType; freq: number; freqTo?: number; q?: number; gain?: number; attack?: number };

let ctx: AudioContext | null = null;
let muted = false;
const muteListeners = new Set<(muted: boolean) => void>();

// Mutes the sound effects (and the story voice, which follows this switch).
export function setSoundsMuted(on: boolean) {
  if (muted === on) return;
  muted = on;
  muteListeners.forEach((fn) => fn(on));
}

export function soundsMuted() {
  return muted;
}

export function onSoundsMutedChange(fn: (muted: boolean) => void): () => void {
  muteListeners.add(fn);
  return () => muteListeners.delete(fn);
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// A tiny room: a short, decaying noise impulse, built once.
let reverb: ConvolverNode | null = null;
function room(a: AudioContext): ConvolverNode {
  if (reverb) return reverb;
  const seconds = 0.6;
  const length = Math.floor(a.sampleRate * seconds);
  const ir = a.createBuffer(2, length, a.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = ir.getChannelData(c);
    // Deterministic pseudo-noise so every run sounds the same.
    let seed = 1234 + c * 77;
    for (let i = 0; i < length; i++) {
      seed = (seed * 16807) % 2147483647;
      const n = (seed / 2147483647) * 2 - 1;
      data[i] = n * Math.pow(1 - i / length, 3.2);
    }
  }
  reverb = a.createConvolver();
  reverb.buffer = ir;
  reverb.connect(a.destination);
  return reverb;
}

let noiseBuffer: AudioBuffer | null = null;
function whiteNoise(a: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  noiseBuffer = a.createBuffer(1, a.sampleRate, a.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

// Plays notes and noise bursts through one master gain; `wet` sends a little
// of it into the room.
function play(notes: Note[], volume = 0.12, opts: { noise?: Noise[]; wet?: number } = {}) {
  if (muted) return;
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + 0.01;
  const master = a.createGain();
  master.gain.value = volume;
  master.connect(a.destination);
  if (opts.wet) {
    const send = a.createGain();
    send.gain.value = opts.wet;
    master.connect(send).connect(room(a));
  }
  for (const n of notes) {
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = n.type ?? "sine";
    osc.frequency.setValueAtTime(n.freq, t0 + n.at);
    if (n.slideTo) osc.frequency.exponentialRampToValueAtTime(n.slideTo, t0 + n.at + n.dur);
    // Soft attack and a smooth tail, so nothing clicks.
    g.gain.setValueAtTime(0.0001, t0 + n.at);
    g.gain.exponentialRampToValueAtTime(n.gain ?? 1, t0 + n.at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.at + n.dur);
    osc.connect(g).connect(master);
    osc.start(t0 + n.at);
    osc.stop(t0 + n.at + n.dur + 0.05);
  }
  for (const n of opts.noise ?? []) {
    const src = a.createBufferSource();
    src.buffer = whiteNoise(a);
    src.loop = true; // the random start offset never runs off the end
    const f = a.createBiquadFilter();
    f.type = n.filter;
    f.Q.value = n.q ?? 1;
    f.frequency.setValueAtTime(n.freq, t0 + n.at);
    if (n.freqTo) f.frequency.exponentialRampToValueAtTime(n.freqTo, t0 + n.at + n.dur);
    const g = a.createGain();
    const attack = n.attack ?? 0.004;
    g.gain.setValueAtTime(0.0001, t0 + n.at);
    g.gain.exponentialRampToValueAtTime(n.gain ?? 1, t0 + n.at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.at + n.dur);
    src.connect(f).connect(g).connect(master);
    src.start(t0 + n.at, Math.random() * 0.5);
    src.stop(t0 + n.at + n.dur + 0.05);
  }
}

// Footsteps alternate feet: a slightly different pitch each step.
let stepFoot = 0;

export const sounds = {
  // Ari is about to ask something: two bright rising notes.
  question: () => play([{ freq: 660, at: 0, dur: 0.18 }, { freq: 990, at: 0.11, dur: 0.28 }], 0.1),
  // The microphone opened.
  micOn: () => play([{ freq: 520, at: 0, dur: 0.12, slideTo: 780 }], 0.07),
  // The answer was heard.
  micOff: () => play([{ freq: 780, at: 0, dur: 0.12, slideTo: 520 }], 0.06),
  // A new decision card appeared.
  card: () => play([{ freq: 1200, at: 0, dur: 0.07, type: "triangle", gain: 0.6 }, { freq: 1600, at: 0.05, dur: 0.09, type: "triangle", gain: 0.4 }], 0.06),
  // A step is done.
  success: () =>
    play(
      [
        { freq: 523.25, at: 0, dur: 0.2 },
        { freq: 659.25, at: 0.09, dur: 0.22 },
        { freq: 783.99, at: 0.18, dur: 0.35 },
      ],
      0.08,
    ),
  // Ari stops a rule from being broken: a gentle two-tone alert.
  warning: () => play([{ freq: 740, at: 0, dur: 0.16, type: "triangle" }, { freq: 554, at: 0.17, dur: 0.3, type: "triangle" }], 0.12),
  // Soft tap for clicks on main actions.
  tap: () => play([{ freq: 880, at: 0, dur: 0.05, type: "triangle", gain: 0.5 }], 0.04),
  // Opening a panel.
  whoosh: () => play([{ freq: 300, at: 0, dur: 0.22, slideTo: 900, type: "sine", gain: 0.5 }], 0.05),

  // --- Story ---

  // One soft footstep (a muted heel tap); call once per step.
  footstep: () => {
    const left = stepFoot++ % 2 === 0;
    const base = left ? 118 : 104;
    play([{ freq: base, at: 0, dur: 0.09, slideTo: base * 0.6, gain: 0.9 }], 0.07, {
      noise: [{ at: 0, dur: 0.06, filter: "lowpass", freq: left ? 900 : 760, q: 0.7, gain: 0.5, attack: 0.003 }],
    });
  },
  // Ari hops: a round, bouncy "boop".
  boop: () => play([{ freq: 420, at: 0, dur: 0.16, slideTo: 760, gain: 0.9 }, { freq: 760, at: 0.1, dur: 0.12, slideTo: 640, gain: 0.35 }], 0.07),
  // Ari is curious and about to ask: a questioning "hmm?" that bends up at the end.
  curious: () =>
    play(
      [
        { freq: 587.33, at: 0, dur: 0.2, type: "triangle", gain: 0.7 },
        { freq: 698.46, at: 0.16, dur: 0.34, slideTo: 932.33, type: "triangle", gain: 0.6 },
        { freq: 1396.9, at: 0.16, dur: 0.3, slideTo: 1864.7, gain: 0.12 },
      ],
      0.07,
      { wet: 0.25 },
    ),
  // A button is pressed on screen: a crisp click with a little room.
  press: () =>
    play([{ freq: 1850, at: 0, dur: 0.035, type: "triangle", gain: 0.5 }, { freq: 240, at: 0, dur: 0.05, slideTo: 160, gain: 0.5 }], 0.08, {
      noise: [{ at: 0, dur: 0.025, filter: "highpass", freq: 2500, q: 0.8, gain: 0.6, attack: 0.002 }],
      wet: 0.35,
    }),
  // Knowledge captured: a short shimmering sparkle that rises.
  captured: () =>
    play(
      [
        { freq: 1318.5, at: 0, dur: 0.22, gain: 0.6 },
        { freq: 1568, at: 0.06, dur: 0.22, gain: 0.55 },
        { freq: 2093, at: 0.12, dur: 0.26, gain: 0.5 },
        { freq: 2637, at: 0.18, dur: 0.4, gain: 0.45 },
        { freq: 3136, at: 0.26, dur: 0.45, type: "triangle", gain: 0.2 },
      ],
      0.045,
      { wet: 0.5, noise: [{ at: 0.05, dur: 0.5, filter: "bandpass", freq: 6000, freqTo: 9000, q: 4, gain: 0.25, attack: 0.08 }] },
    ),
  // Between scenes: a gentle breath of air that sweeps up and fades.
  transition: () =>
    play([], 0.09, {
      noise: [{ at: 0, dur: 0.6, filter: "bandpass", freq: 350, freqTo: 2600, q: 1.4, gain: 0.8, attack: 0.25 }],
      wet: 0.2,
    }),
};

export type SoundName = keyof typeof sounds;
