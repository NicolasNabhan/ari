"use client";

import { useState } from "react";
import { CalendarDays, CircleCheck, LoaderCircle, PlugZap, Video, type LucideIcon } from "lucide-react";
import { markConnected, sampleSourcesFor, type Connector } from "@/lib/context/knowledgeStore";
import { ingest } from "./ingest";

const CONNECTORS: { id: Connector; name: string; blurb: string; icon: LucideIcon; tone: string; steps: string[] }[] = [
  {
    id: "zoom",
    name: "Zoom",
    blurb: "Cloud recordings and their transcripts",
    icon: Video,
    tone: "from-sky-400 to-indigo-500",
    steps: ["Opening Zoom…", "Signing in as Maria…", "Finding recorded meetings…"],
  },
  {
    id: "calendar",
    name: "Google Calendar",
    blurb: "Meetings on Maria's calendar, with notes",
    icon: CalendarDays,
    tone: "from-emerald-400 to-teal-500",
    steps: ["Opening Google Calendar…", "Signing in as Maria…", "Reading this week's meetings…"],
  },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Connect a meeting tool. A demo connection: no real OAuth, it brings in
// Maria's sample meetings as if they had synced.
export function Connectors({ connected, onSynced }: { connected: Connector[]; onSynced: (firstSourceId: string) => void }) {
  const [busy, setBusy] = useState<Connector | null>(null);
  const [step, setStep] = useState("");
  const [synced, setSynced] = useState<Partial<Record<Connector, number>>>({});

  async function connect(c: (typeof CONNECTORS)[number]) {
    setBusy(c.id);
    for (const s of c.steps) {
      setStep(s);
      await wait(600);
    }
    const meetings = sampleSourcesFor(c.id);
    setStep(`Syncing ${meetings.length} meetings…`);
    await Promise.all(meetings.map((m) => ingest(m)));
    markConnected(c.id);
    setSynced((x) => ({ ...x, [c.id]: meetings.length }));
    setBusy(null);
    onSynced(meetings[0].id);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {CONNECTORS.map((c) => {
        const isOn = connected.includes(c.id);
        const isBusy = busy === c.id;
        return (
          <div key={c.id} data-ari={`connect-${c.id}`} className="ari-lift rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white ${c.tone}`}>
                <c.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-zinc-900">{c.name}</p>
                <p className="truncate text-xs text-zinc-500">{c.blurb}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              {isOn ? (
                <span className="ari-rise inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                  <CircleCheck className="h-4 w-4" /> Connected{synced[c.id] ? ` · ${synced[c.id]} meetings synced` : ""}
                </span>
              ) : isBusy ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-ari-700">
                  <LoaderCircle className="h-4 w-4 animate-spin" /> {step}
                </span>
              ) : (
                <button
                  onClick={() => connect(c)}
                  disabled={!!busy}
                  className="ari-lift inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-ari-700 ring-1 ring-ari-200 disabled:opacity-40"
                >
                  <PlugZap className="h-4 w-4" /> Connect {c.name}
                </button>
              )}
              <span title="No real sign-in happens: this brings in Maria's sample meetings." className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                Demo connection
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
