// App-wide store for the files & meetings hub: the sources Ari has, the
// knowledge pulled from each, and which items the expert taught to Ari.
// Kept in localStorage so /teach and /learn share it. Use with useKnowledge().

import { useSyncExternalStore } from "react";
import type { StepId } from "@/lib/apprentice/types";
import { citationsFrom, setCitations } from "./knowledge";
import { MARIA_SOURCES } from "./mariaWeek";
import type { ContextSource, ExtractedKnowledge } from "./types";

export type Engine = "claude" | "rules";
export type Connector = "zoom" | "calendar";

export type KnowledgeState = {
  sources: ContextSource[];
  items: Record<string, ExtractedKnowledge[]>; // by source id
  engines: Record<string, Engine>; // how each source's knowledge was extracted
  accepted: string[]; // ids of items taught to Ari
  connected: Connector[];
};

const KEY = "ari.knowledge.v1";
const EMPTY: KnowledgeState = { sources: [], items: {}, engines: {}, accepted: [], connected: [] };

let state: KnowledgeState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as Partial<KnowledgeState>) };
  } catch {
    // ignore broken storage
  }
  publishCitations();
}

function publishCitations() {
  setCitations(citationsFrom(acceptedItems(state), state.sources));
}

function set(next: KnowledgeState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage full or blocked: keep it in memory
  }
  publishCitations();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  load();
  return state;
}

export function useKnowledge(): KnowledgeState {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export function getKnowledge(): KnowledgeState {
  load();
  return state;
}

// Load the store as soon as the module runs in the browser, so teach mode can
// cite meetings even before any hub component has rendered.
load();

export function acceptedItems(s: KnowledgeState): ExtractedKnowledge[] {
  return Object.values(s.items)
    .flat()
    .filter((k) => s.accepted.includes(k.id));
}

// Knowledge taught to Ari that explains one decision step, with its source.
export function taughtFor(s: KnowledgeState, step: StepId): { item: ExtractedKnowledge; source?: ContextSource }[] {
  return acceptedItems(s)
    .filter((k) => k.step === step)
    .map((item) => ({ item, source: s.sources.find((x) => x.id === item.sourceId) }));
}

export function addSource(source: ContextSource) {
  load();
  set({ ...state, sources: [source, ...state.sources.filter((s) => s.id !== source.id)] });
}

export function setItems(sourceId: string, items: ExtractedKnowledge[], engine: Engine) {
  load();
  set({ ...state, items: { ...state.items, [sourceId]: items }, engines: { ...state.engines, [sourceId]: engine } });
}

export function removeSource(sourceId: string) {
  load();
  const items = { ...state.items };
  const gone = new Set((items[sourceId] ?? []).map((k) => k.id));
  delete items[sourceId];
  set({ ...state, sources: state.sources.filter((s) => s.id !== sourceId), items, accepted: state.accepted.filter((id) => !gone.has(id)) });
}

export function teach(ids: string[]) {
  load();
  set({ ...state, accepted: [...new Set([...state.accepted, ...ids])] });
}

export function unteach(id: string) {
  load();
  set({ ...state, accepted: state.accepted.filter((x) => x !== id) });
}

// The sample meetings and files a connector brings in (a demo connection, no real OAuth).
export function sampleSourcesFor(connector: Connector | "files"): ContextSource[] {
  if (connector === "files") return MARIA_SOURCES.filter((s) => s.kind !== "meeting").map((s) => ({ ...s, origin: "sample" as const }));
  return MARIA_SOURCES.filter((s) => s.kind === "meeting").map((s) => ({ ...s, origin: "connected" as const }));
}

export function markConnected(connector: Connector) {
  load();
  if (!state.connected.includes(connector)) set({ ...state, connected: [...state.connected, connector] });
}

export function resetKnowledge() {
  set(EMPTY);
}
