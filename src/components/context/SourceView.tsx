"use client";

import { useState } from "react";
import { BookOpenCheck, Check, GraduationCap, Quote, Sparkles, Undo2 } from "lucide-react";
import { citeSource, highlightRuns, speakerOf } from "@/lib/context/knowledge";
import { teach, unteach, type Engine } from "@/lib/context/knowledgeStore";
import type { ContextSource, ExtractedKnowledge } from "@/lib/context/types";
import { KIND_ICON, LevelBadge, OriginBadge, StepLink } from "./badges";

// One source: its transcript or text with the knowledge highlighted inline,
// and a card per piece of knowledge the expert can teach to Ari.
export function SourceView({
  source,
  items,
  engine,
  accepted,
  canTeach,
}: {
  source: ContextSource;
  items: ExtractedKnowledge[] | undefined;
  engine?: Engine;
  accepted: string[];
  canTeach: boolean;
}) {
  const [focus, setFocus] = useState<string | null>(null);
  const Icon = KIND_ICON[source.kind];
  const list = items ?? [];
  const untaught = list.filter((k) => !accepted.includes(k.id));

  return (
    <article className="ari-rise space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ari-50 text-ari-600">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-zinc-900">{source.title}</h2>
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
              {citeSource(source)}
              {source.from && <> · {source.from}</>}
              <OriginBadge origin={source.origin} />
            </p>
          </div>
        </div>
        {canTeach && untaught.length > 1 && (
          <button
            onClick={() => teach(untaught.map((k) => k.id))}
            className="ari-lift inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold text-white shadow-md shadow-ari-500/30 ari-gradient"
          >
            <GraduationCap className="h-4 w-4" /> Teach all {untaught.length} to Ari
          </button>
        )}
      </header>

      <div className="max-h-72 overflow-y-auto rounded-2xl border border-zinc-200/70 bg-white p-4 text-sm leading-relaxed text-zinc-700 shadow-sm">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{source.kind === "meeting" ? "Transcript" : "Text"}</p>
        {source.kind === "meeting" ? (
          <div className="space-y-1.5">
            {source.text.split("\n").map((line, i) => {
              const m = line.match(/^([^:]{1,40}):\s+(.*)$/);
              return (
                <p key={i}>
                  {m && <span className="mr-1 font-semibold text-zinc-900">{m[1]}:</span>}
                  <Highlighted text={m ? m[2] : line} items={list} focus={focus} onFocus={setFocus} />
                </p>
              );
            })}
          </div>
        ) : (
          <p className="whitespace-pre-wrap">
            <Highlighted text={source.text} items={list} focus={focus} onFocus={setFocus} />
          </p>
        )}
      </div>

      <section>
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          <Sparkles className="h-3.5 w-3.5 text-ari-500" />
          {items === undefined ? "Ari is reading…" : `What Ari found (${list.length})`}
          {engine && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal text-zinc-500">
              {engine === "claude" ? "read by Claude" : "read with Ari's built-in rules"}
            </span>
          )}
        </h3>
        {items !== undefined && list.length === 0 && <p className="mt-2 text-sm text-zinc-500">Nothing here a newcomer would need to know.</p>}
        <div className="ari-stagger mt-3 grid gap-3 xl:grid-cols-2">
          {list.map((k) => (
            <KnowledgeCard
              key={k.id}
              item={k}
              who={speakerOf(k.quote, source)}
              taught={accepted.includes(k.id)}
              canTeach={canTeach}
              focused={focus === k.id}
              onFocus={() => setFocus(focus === k.id ? null : k.id)}
            />
          ))}
        </div>
      </section>
    </article>
  );
}

function Highlighted({ text, items, focus, onFocus }: { text: string; items: ExtractedKnowledge[]; focus: string | null; onFocus: (id: string) => void }) {
  return (
    <>
      {highlightRuns(text, items).map((r, i) =>
        r.itemId ? (
          <mark
            key={i}
            onClick={() => onFocus(r.itemId!)}
            className={`cursor-pointer rounded px-0.5 text-zinc-900 transition-colors ${focus === r.itemId ? "bg-coral-400/40" : "bg-amber-100 hover:bg-amber-200"}`}
          >
            {r.text}
          </mark>
        ) : (
          <span key={i}>{r.text}</span>
        ),
      )}
    </>
  );
}

function KnowledgeCard({
  item,
  who,
  taught,
  canTeach,
  focused,
  onFocus,
}: {
  item: ExtractedKnowledge;
  who?: string;
  taught: boolean;
  canTeach: boolean;
  focused: boolean;
  onFocus: () => void;
}) {
  return (
    <div
      data-ari={`knowledge-${item.id}`}
      onClick={onFocus}
      className={`cursor-pointer rounded-2xl border bg-white p-3.5 text-sm shadow-sm transition-all ${
        focused ? "border-coral-400 ring-4 ring-coral-400/20" : taught ? "border-emerald-200" : "border-zinc-200/70"
      }`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <LevelBadge level={item.level} />
        <StepLink step={item.step} />
      </div>
      <p className="mt-2 font-medium text-zinc-900">{item.text}</p>
      {item.quote && (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-zinc-500">
          <Quote className="mt-0.5 h-3 w-3 shrink-0 text-coral-500" />
          <span>
            <q>{item.quote}</q>
            {who && <span className="whitespace-nowrap"> said {who}</span>}
          </span>
        </p>
      )}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 ring-1 ring-sky-200">{item.source}</span>
        {taught ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <BookOpenCheck className="h-3.5 w-3.5" /> Ari learned this
            </span>
            {canTeach && (
              <button
                title="Untaught"
                onClick={(e) => {
                  e.stopPropagation();
                  unteach(item.id);
                }}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>
            )}
          </span>
        ) : canTeach ? (
          <button
            data-ari="teach-knowledge"
            onClick={(e) => {
              e.stopPropagation();
              teach([item.id]);
            }}
            className="ari-lift inline-flex items-center gap-1 rounded-xl bg-white px-2.5 py-1 text-xs font-semibold text-ari-700 ring-1 ring-ari-200"
          >
            <Check className="h-3.5 w-3.5" /> Teach this to Ari
          </button>
        ) : (
          <span className="text-xs text-zinc-400">Not taught yet</span>
        )}
      </div>
    </div>
  );
}
