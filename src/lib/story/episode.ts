// The Maria episode as a script of beats, and a small pure director that walks
// through it. Rendering-independent: the story page runs each beat (3D walk,
// a real click on a data-ari element, speech, a pop-up) and reports back.
import type { CoreInput, StepId } from "@/lib/apprentice/types";
import type { WorkspaceEvent } from "@/lib/workspace/events";

export type Who = "maria" | "ari";

// A data-ari selector value (e.g. "select-brightline"), or a spot on the floor.
export type WalkTarget = string | { x: number; z: number };

export type Beat =
  | { kind: "say"; who: Who; text: string; question?: boolean } // question: Ari speaking the Core's ask
  | { kind: "walkTo"; who: Who; target: WalkTarget }
  // Maria presses a real UI element. high: out of reach, use the telescoping pointer.
  // emits: the workspace event the press produces. The real UI emits it itself;
  // tests feed it to the Core, and a skip can replay it.
  | { kind: "press"; target: string; high?: boolean; emits?: WorkspaceEvent }
  | { kind: "type"; target: string; text: string; emits?: WorkspaceEvent } // type, then commit (Enter)
  // Wait for the Core's next ask; the director then turns it into an Ari "say".
  // expect: what the rule Judge asks here (Claude may phrase it differently).
  | { kind: "await-question"; expect?: string }
  | { kind: "answer"; text: string } // Maria says it aloud; feed it to the Core as an expert utterance
  | { kind: "popup"; step: StepId } // show the classified reason for this step's card
  | { kind: "gesture"; who: Who; name: "wave" }
  | { kind: "wait"; ms: number }
  | { kind: "petHop" }
  | { kind: "petTrotIn" } // Ari trots in and sits beside Maria
  | { kind: "petTalk" }
  // Show a button that leaves the story (the last beat: on to /learn?from=story).
  // It stays up; nothing comes after it, so no beat-done is needed.
  | { kind: "cta"; label: string; href: string };

// Where the story hands over to the newcomer: the last beat and "Skip to learning".
export const LEARN_HREF = "/learn?from=story";

export type Chapter = { title: string; start: number };

const R = "req-laptops";

const sections: { title: string; beats: Beat[] }[] = [
  {
    title: "Meet Maria",
    beats: [
      { kind: "wait", ms: 600 },
      { kind: "petTrotIn" },
      { kind: "say", who: "maria", text: "Hi! I'm Maria, the procurement manager here at Northwind. This is one of my last days, so they gave me this little one to learn the way I do things." },
      { kind: "say", who: "ari", text: "And I'll pass it all on to the next person!" },
      { kind: "petHop" },
      { kind: "await-question", expect: "Hi Maria, what are you working on today?" },
      { kind: "answer", text: "40 laptops for Marketing, due Friday." },
    ],
  },
  {
    title: "Get three quotes",
    beats: [
      { kind: "walkTo", who: "maria", target: `inbox-${R}` },
      { kind: "press", target: `inbox-${R}`, emits: { type: "request_opened", requestId: R } },
      { kind: "wait", ms: 800 },
      { kind: "press", target: "go-to-vendors", emits: { type: "screen_opened", screen: "vendors" } },
      { kind: "walkTo", who: "maria", target: "tick-apex" },
      { kind: "press", target: "tick-apex" },
      { kind: "press", target: "tick-brightline" },
      { kind: "press", target: "tick-coreparts" },
      { kind: "press", target: "request-quotes", emits: { type: "quotes_requested", requestId: R, vendorIds: ["apex", "brightline", "coreparts"] } },
      { kind: "wait", ms: 800 },
    ],
  },
  {
    title: "Pick the vendor",
    beats: [
      { kind: "press", target: "history-apex", emits: { type: "delivery_history_opened", vendorId: "apex" } },
      { kind: "wait", ms: 1200 },
      { kind: "walkTo", who: "maria", target: "select-brightline" },
      { kind: "press", target: "select-brightline", emits: { type: "vendor_selected", requestId: R, vendorId: "brightline", previousVendorId: null } },
      { kind: "petHop" },
      { kind: "await-question", expect: "Why Brightline Systems over the cheaper Apex Tech?" },
      { kind: "answer", text: "Apex shipped late twice last year, and Friday is a hard deadline." },
      { kind: "popup", step: "vendor" },
    ],
  },
  {
    title: "Score it",
    beats: [
      { kind: "walkTo", who: "maria", target: "nav-scoring" },
      { kind: "press", target: "nav-scoring", emits: { type: "screen_opened", screen: "scoring" } },
      { kind: "walkTo", who: "maria", target: "score-brightline" },
      { kind: "type", target: "score-brightline", text: "82", emits: { type: "score_entered", requestId: R, vendorId: "brightline", score: 82 } },
      { kind: "petHop" },
      { kind: "await-question", expect: "Where does that number come from?" },
      { kind: "answer", text: "40% price, 60% delivery record. It's Finance's formula, nobody wrote it down." },
      { kind: "popup", step: "scoring" },
    ],
  },
  {
    title: "Route the approval",
    beats: [
      { kind: "walkTo", who: "maria", target: "nav-approvals" },
      { kind: "press", target: "nav-approvals", emits: { type: "screen_opened", screen: "approvals" } },
      { kind: "walkTo", who: "maria", target: "route-cfo" },
      { kind: "press", target: "route-cfo", high: true, emits: { type: "approval_routed", requestId: R, vendorId: "brightline", amount: 38400, to: "cfo" } },
      { kind: "petHop" },
      { kind: "await-question", expect: "The procedure doesn't require that for $38,400. Why send it to the CFO?" },
      { kind: "answer", text: "New suppliers over $25k always go to the CFO first. It's not written down anywhere." },
      { kind: "popup", step: "approval" },
    ],
  },
  {
    title: "Place the order",
    beats: [
      { kind: "press", target: "issue-po", emits: { type: "po_issued", requestId: R, vendorId: "brightline", amount: 38400 } },
      { kind: "wait", ms: 1000 },
    ],
  },
  {
    title: "Goodbye",
    beats: [
      { kind: "say", who: "maria", text: "And that's how it's done. Look after them for me, little one." },
      { kind: "gesture", who: "maria", name: "wave" },
      { kind: "petHop" },
      { kind: "say", who: "ari", text: "Got it! Let's teach the next person." },
      { kind: "cta", label: "Start learning with Ari", href: LEARN_HREF },
    ],
  },
];

export const MARIA_EPISODE: Beat[] = sections.flatMap((s) => s.beats);

export const MARIA_CHAPTERS: Chapter[] = sections.reduce<Chapter[]>(
  (acc, s, i) => [...acc, { title: s.title, start: i === 0 ? 0 : acc[i - 1].start + sections[i - 1].beats.length }],
  [],
);

// The chapter a beat index belongs to (for the progress indicator).
export function chapterAt(chapters: Chapter[], index: number): { chapter: Chapter; number: number } {
  let n = 0;
  for (let i = 0; i < chapters.length; i++) if (chapters[i].start <= index) n = i;
  return { chapter: chapters[n], number: n + 1 };
}

// What the Core sees from the episode: Maria's workspace events and spoken
// answers, in order. Tests replay it; a skip can fast-forward the Core with it.
export function episodeCoreInputs(beats: Beat[], at: () => number = () => 0): CoreInput[] {
  const inputs: CoreInput[] = [];
  for (const b of beats) {
    if ((b.kind === "press" || b.kind === "type") && b.emits) inputs.push({ kind: "workspace_event", event: b.emits, at: at() });
    if (b.kind === "answer") inputs.push({ kind: "utterance", speaker: "expert", text: b.text, lang: "en-US", at: at() });
  }
  return inputs;
}

// ---------------------------------------------------------------- director

export type DirectorEvent =
  | { kind: "beat-done"; seq?: number } // seq: ignore a late report for a beat that's no longer current
  | { kind: "core-asked"; text: string }
  | { kind: "pause" }
  | { kind: "resume" }
  | { kind: "skip" };

export type DirectorState = {
  beats: Beat[];
  index: number; // the scripted beat we're on (beats.length when done)
  running: Beat | null; // what to run now: null while paused between beats, or when done
  seq: number; // bumps every time a new beat starts; run a beat when seq changes
  paused: boolean;
  questions: string[]; // Core asks not yet spoken (they can arrive before the await-question beat)
  done: boolean;
};

export function initDirector(beats: Beat[], opts: { paused?: boolean } = {}): DirectorState {
  const paused = !!opts.paused;
  return settle({ beats, index: 0, running: null, seq: 0, paused, questions: [], done: beats.length === 0 });
}

// Start the beat at `index` if nothing is running and we're allowed to.
function settle(s: DirectorState): DirectorState {
  if (s.index >= s.beats.length) return { ...s, running: null, done: true };
  if (s.paused) return s;
  const beat = s.beats[s.index];
  if (s.running === null) s = { ...s, running: beat, seq: s.seq + 1 };
  // An await-question with an ask in hand becomes Ari speaking it.
  if (s.running?.kind === "await-question" && s.questions.length > 0) {
    const [text, ...rest] = s.questions;
    s = { ...s, running: { kind: "say", who: "ari", text, question: true }, seq: s.seq + 1, questions: rest };
  }
  return s;
}

export function directorReducer(s: DirectorState, e: DirectorEvent): DirectorState {
  if (s.done) return s;
  switch (e.kind) {
    case "beat-done":
      if (!s.running || (e.seq !== undefined && e.seq !== s.seq)) return s;
      if (s.running.kind === "await-question") return s; // only an ask moves it on
      return settle({ ...s, index: s.index + 1, running: null });
    case "core-asked":
      return settle({ ...s, questions: [...s.questions, e.text] });
    case "pause":
      return { ...s, paused: true }; // the beat in flight finishes; nothing new starts
    case "resume":
      return settle({ ...s, paused: false });
    case "skip":
      return { ...s, index: s.beats.length, running: null, paused: false, done: true };
  }
}

export type DirectorView = {
  beat: Beat | null; // run this (once per seq)
  seq: number;
  step: number; // 1-based scripted beat number
  total: number;
  paused: boolean;
  done: boolean;
};

export function viewOf(s: DirectorState): DirectorView {
  return { beat: s.running, seq: s.seq, step: Math.min(s.index + 1, s.beats.length), total: s.beats.length, paused: s.paused, done: s.done };
}

// Convenience wrapper: const d = createDirector(MARIA_EPISODE); d.next({ kind: "beat-done" }).
export function createDirector(beats: Beat[], opts: { paused?: boolean } = {}) {
  let state = initDirector(beats, opts);
  return {
    view: () => viewOf(state),
    state: () => state,
    next(event: DirectorEvent): DirectorView {
      state = directorReducer(state, event);
      return viewOf(state);
    },
  };
}
