"use client";

// Clean interface sounds, synthesized with the Web Audio API (no audio files).
type Note = { freq: number; at: number; dur: number; type?: OscillatorType; gain?: number; slideTo?: number };

let ctx: AudioContext | null = null;
let muted = false;

export function setSoundsMuted(on: boolean) {
  muted = on;
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function play(notes: Note[], volume = 0.12) {
  if (muted) return;
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + 0.01;
  const master = a.createGain();
  master.gain.value = volume;
  master.connect(a.destination);
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
}

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
};
