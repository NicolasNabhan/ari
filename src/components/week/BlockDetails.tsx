"use client";

import { Clock, ListChecks, Sparkles, Users, X } from "lucide-react";
import { DAY_NAMES, type DetectedPattern } from "@/lib/context/patterns";
import type { ContextSource } from "@/lib/context/types";
import { KIND, LevelBadge, SOURCE_ICON, endOf, type Block } from "./weekUi";

// What's behind one block: when, who, the meeting or file it came with, and
// what Ari noticed about it.
export function BlockDetails({
  block,
  sources,
  patterns,
  onClose,
  onOpenTask,
}: {
  block: Block;
  sources: ContextSource[];
  patterns: DetectedPattern[];
  onClose: () => void;
  onOpenTask?: (taskId: string) => void;
}) {
  const k = KIND[block.kind];
  const Icon = k.icon;
  const related = patterns.filter((p) => p.itemIds.includes(block.id) || p.itemIds.includes(block.id.replace(/^plan-/, "")));
  // Its own meeting or file, else the one backing what Ari noticed here.
  const sourceId = block.sourceId ?? related.flatMap((p) => p.sourceIds)[0];
  const source = sources.find((s) => s.id === sourceId);
  return (
    <div className="ari-pop w-full rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-xl shadow-ari-500/10">
      <div className="flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ${k.chip}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-zinc-900">{block.title}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {DAY_NAMES[block.day]} {block.start}–{endOf(block.start, block.minutes)}
            </span>
            <span>{block.minutes} min</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${k.chip}`}>{k.label}</span>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" aria-label="Close details">
          <X className="h-4 w-4" />
        </button>
      </div>
      {block.with?.length ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-zinc-600">
          <Users className="h-4 w-4 text-zinc-400" /> With {block.with.join(", ")}
        </p>
      ) : null}
      {block.notes && <p className="mt-2 text-sm text-zinc-600">{block.notes}</p>}
      {block.advice && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <span className="flex-1">{block.advice}</span>
          <LevelBadge level={block.level} />
        </div>
      )}
      {source && <SourcePreview source={source} />}
      {related.length > 0 && !block.advice && (
        <div className="mt-3 space-y-1.5">
          {related.map((p) => (
            <div key={p.id} className="flex items-start gap-2 rounded-xl bg-ari-50 p-2.5 text-sm text-ari-700">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{p.summary}</span>
              <LevelBadge level={p.level} />
            </div>
          ))}
        </div>
      )}
      {block.taskId && onOpenTask && (
        <button onClick={() => onOpenTask(block.taskId!)} className="ari-lift mt-3 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold text-white shadow-md shadow-ari-500/30 ari-gradient">
          <ListChecks className="h-4 w-4" /> How this task works
        </button>
      )}
    </div>
  );
}

function SourcePreview({ source }: { source: ContextSource }) {
  const { icon: Icon, label } = SOURCE_ICON[source.kind];
  const lines = source.text.split("\n").slice(0, 3);
  return (
    <div className="mt-3 rounded-xl bg-zinc-50 p-3 text-sm ring-1 ring-zinc-100">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        <Icon className="h-3.5 w-3.5" /> {label}: {source.title}
      </div>
      <div className="space-y-1">
        {lines.map((line, i) => {
          const [who, ...rest] = line.split(": ");
          return source.kind === "meeting" && rest.length ? (
            <p key={i} className="text-zinc-600">
              <span className="font-semibold text-zinc-800">{who}:</span> {rest.join(": ")}
            </p>
          ) : (
            <p key={i} className="text-zinc-600">
              {line}
            </p>
          );
        })}
        {source.text.split("\n").length > 3 && <p className="text-xs text-zinc-400">…</p>}
      </div>
    </div>
  );
}
