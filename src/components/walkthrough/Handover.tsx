"use client";

import Link from "next/link";
import { ArrowRight, DoorOpen, FileWarning, GraduationCap, Lightbulb, Palette, ShieldAlert, Sparkles, type LucideIcon } from "lucide-react";
import type { Level } from "@/lib/apprentice/reasonTypes";
import type { DecisionCard } from "@/lib/apprentice/types";
import { learnedFrom } from "@/lib/walkthrough/summary";

const LEVEL: Record<Level, { label: string; icon: LucideIcon; className: string }> = {
  must: { label: "Must follow", icon: ShieldAlert, className: "bg-rose-50 text-rose-700 ring-rose-200" },
  advice: { label: "Strong advice", icon: Lightbulb, className: "bg-amber-50 text-amber-800 ring-amber-200" },
  choice: { label: "Your choice", icon: Palette, className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  unknown: { label: "Per procedure", icon: Sparkles, className: "bg-ari-50 text-ari-700 ring-ari-200" },
};

// The end of step 1: what Ari learned, then Maria leaves the office.
export function Handover({ cards }: { cards: DecisionCard[] }) {
  const learned = learnedFrom(cards);
  return (
    <div className="fixed inset-0 z-[45] grid place-items-center bg-[#1d1a2f]/45 p-4 pb-28 backdrop-blur-sm">
      <section data-ari="handover" className="ari-pop w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="p-6 text-white ari-gradient-animated">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/80">
            <Sparkles className="h-4 w-4" /> End of step 1
          </p>
          <h2 className="mt-1 text-2xl font-semibold">What Ari learned from Maria</h2>
        </div>
        <ul className="ari-stagger grid max-h-[46vh] gap-2 overflow-y-auto p-5 sm:grid-cols-2">
          {learned.map((l) => {
            const level = LEVEL[l.level];
            return (
              <li key={l.id} className="rounded-2xl border border-zinc-200/70 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-zinc-900">{l.title}</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${level.className}`}>
                    <level.icon className="h-3 w-3" /> {level.label}
                  </span>
                  {l.unwritten && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-500 to-coral-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                      <FileWarning className="h-3 w-3" /> Unwritten rule
                    </span>
                  )}
                </div>
                <p className="mt-1 text-zinc-500">{l.chosen}</p>
                {l.reason && <p className="mt-1 text-zinc-700">{l.fromMaria ? <q>{l.reason}</q> : l.reason}</p>}
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col gap-4 border-t border-zinc-100 bg-zinc-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-3 text-zinc-700">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-coral-500 text-white">
              <DoorOpen className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold text-zinc-900">Maria has left the office.</span>A new employee is arriving, and Ari will pass down her job.
            </span>
          </p>
          <Link href="/learn" data-ari="start-step-2" className="ari-lift inline-flex shrink-0 items-center gap-2 rounded-2xl px-5 py-3 font-semibold text-white shadow-lg shadow-ari-500/30 ari-gradient">
            <GraduationCap className="h-5 w-5" /> Start step 2 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
