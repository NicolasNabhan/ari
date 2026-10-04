"use client";

import { useState } from "react";
import { BookOpenCheck, FolderOpen, Info, Library, X } from "lucide-react";
import { useKnowledge, removeSource, sampleSourcesFor } from "@/lib/context/knowledgeStore";
import type { ContextSource } from "@/lib/context/types";
import type { Audience } from "@/lib/workspace/profile";
import { PageTitle } from "@/components/workspace/PageTitle";
import { KIND_ICON, OriginBadge } from "./badges";
import { Connectors } from "./Connectors";
import { FileDrop } from "./FileDrop";
import { ingest } from "./ingest";
import { MeetingRecorder } from "./MeetingRecorder";
import { SourceView } from "./SourceView";

const GROUPS: { kind: ContextSource["kind"]; label: string }[] = [
  { kind: "meeting", label: "Meetings" },
  { kind: "file", label: "Files" },
  { kind: "email", label: "Emails" },
];

// In the order of the week: Monday morning first.
const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const byWhen = (a: ContextSource, b: ContextSource) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || (a.time ?? "").localeCompare(b.time ?? "");

// Files and meetings the work depends on: connect or record meetings, drop
// files, and teach Ari the knowledge it finds in them.
export function ContextHubView({ audience }: { audience: Audience }) {
  const k = useKnowledge();
  const expert = audience === "expert";
  const [picked, setPicked] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const selected = k.sources.find((s) => s.id === picked) ?? k.sources[0];
  const taughtCount = k.accepted.length;

  const added = (id: string, n?: string) => {
    setPicked(id);
    setNote(n ?? null);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle icon={FolderOpen} tone="emerald" title="Files & meetings" subtitle={expert ? "What Ari learns from, beyond your clicks" : "Where Maria's knowledge comes from"} />
        {k.sources.length > 0 && (
          <span className="ari-pop inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-200">
            <BookOpenCheck className="h-4 w-4" /> Ari learned {taughtCount} thing{taughtCount === 1 ? "" : "s"} from {k.sources.length} source{k.sources.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {expert && (
        <div className="space-y-3">
          <Connectors connected={k.connected} onSynced={(id) => added(id)} />
          <div className="grid gap-3 lg:grid-cols-2">
            <MeetingRecorder onAdded={added} />
            <FileDrop onAdded={added} />
          </div>
        </div>
      )}

      {note && (
        <p className="ari-rise flex items-start gap-2 rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-900">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span className="flex-1">{note}</span>
          <button onClick={() => setNote(null)} className="text-sky-500 hover:text-sky-800" title="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </p>
      )}

      {k.sources.length === 0 ? (
        <div className="ari-rise mx-auto mt-6 flex max-w-sm flex-col items-center gap-3 text-center text-sm text-zinc-500">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ari-50 text-ari-500">
            <Library className="h-6 w-6" />
          </span>
          {expert
            ? "Some of what you know only lives in meetings and files. Connect a meeting tool, record a meeting or drop a file, and Ari will learn from it."
            : "Maria hasn't shared any meetings or files yet."}
          {!expert && (
            <button
              onClick={() => [...sampleSourcesFor("zoom"), ...sampleSourcesFor("files")].forEach((s) => void ingest(s))}
              className="ari-lift rounded-xl bg-white px-3 py-1.5 font-medium text-ari-700 ring-1 ring-ari-200"
            >
              Show Maria&apos;s sample week
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <nav className="space-y-4" data-ari="context-sources">
            {GROUPS.map((g) => {
              const sources = k.sources.filter((s) => s.kind === g.kind).sort(byWhen);
              if (!sources.length) return null;
              return (
                <div key={g.kind}>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">{g.label}</p>
                  <ul className="space-y-1.5">
                    {sources.map((s) => {
                      const Icon = KIND_ICON[s.kind];
                      const items = k.items[s.id];
                      const taught = items?.filter((x) => k.accepted.includes(x.id)).length ?? 0;
                      const on = s.id === selected?.id;
                      return (
                        <li key={s.id} className="group relative">
                          <button
                            onClick={() => setPicked(s.id)}
                            className={`w-full rounded-xl border px-3 py-2 text-left transition-all ${
                              on ? "border-ari-300 bg-white shadow-sm ring-4 ring-ari-100" : "border-transparent bg-white/60 hover:bg-white"
                            }`}
                          >
                            <span className="flex items-center gap-2 pr-4">
                              <Icon className={`h-4 w-4 shrink-0 ${on ? "text-ari-600" : "text-zinc-400"}`} />
                              <span className="truncate text-sm font-medium text-zinc-800">{s.title}</span>
                            </span>
                            <span className="mt-1 flex flex-wrap items-center gap-1.5 pl-6 text-[11px] text-zinc-500">
                              {s.day}
                              {s.time && ` ${s.time}`}
                              <OriginBadge origin={s.origin} />
                              {items === undefined ? (
                                <span className="text-ari-500">reading…</span>
                              ) : (
                                <span>
                                  {items.length} found{taught ? `, ${taught} taught` : ""}
                                </span>
                              )}
                            </span>
                          </button>
                          {expert && (
                            <button
                              title="Remove"
                              onClick={() => removeSource(s.id)}
                              className="absolute right-1.5 top-1.5 hidden rounded-md p-0.5 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600 group-hover:block"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
          {selected && (
            <SourceView key={selected.id} source={selected} items={k.items[selected.id]} engine={k.engines[selected.id]} accepted={k.accepted} canTeach={expert} />
          )}
        </div>
      )}
    </section>
  );
}
