"use client";

import { BookOpenCheck, GraduationCap, MessageCircleQuestion, MousePointerClick, ShieldAlert, Sparkles, Languages, Eye } from "lucide-react";

type Point = { icon: React.ReactNode; title: string; text: string };

const EXPERT: { kicker: string; title: string; lead: string; points: Point[]; cta: string } = {
  kicker: "You're the expert",
  title: "You're Maria, Procurement Manager at Northwind Supply.",
  lead: "Marketing needs 40 laptops by Friday. Do the purchase the way an experienced manager would, and Ari will learn your job by watching.",
  points: [
    { icon: <MousePointerClick className="h-5 w-5" />, title: "You do the real task", text: "A guide at the top tells you exactly what to click and what to say, one step at a time." },
    { icon: <MessageCircleQuestion className="h-5 w-5" />, title: "Ari asks why, only when it can't tell", text: "When a choice surprises it, Ari asks out loud. Answer by voice; the microphone opens by itself." },
    { icon: <GraduationCap className="h-5 w-5" />, title: "Then Ari teaches the next person", text: "At the end, watch Ari teach a new hire using your answers, including the rules nobody wrote down." },
  ],
  cta: "Start teaching Ari",
};

const NEWCOMER: typeof EXPERT = {
  kicker: "You're the new hire",
  title: "You're Sam, Northwind's new Procurement Manager.",
  lead: "Maria, who did this job for years, has left. Ari watched how Maria worked. Now it will talk you through your first purchase: 30 office chairs.",
  points: [
    { icon: <BookOpenCheck className="h-5 w-5" />, title: "Ari explains every step", text: "What to do, what Maria chose, and whether it's a rule or just Maria's style. The next button glows." },
    { icon: <Eye className="h-5 w-5" />, title: "Ask “why?” or say “Show me”", text: "Ari answers in Maria's own words, or takes the cursor and does the step for you." },
    { icon: <Languages className="h-5 w-5" />, title: "Try Spanish", text: "Ask a question in Spanish and Ari keeps teaching in Spanish." },
    { icon: <ShieldAlert className="h-5 w-5" />, title: "Try breaking the rule", text: "At the approval step, approve it yourself and see what Ari does." },
  ],
  cta: "Start learning",
};

export function IntroOverlay({ mode, onStart }: { mode: "expert" | "newcomer"; onStart: () => void }) {
  const c = mode === "expert" ? EXPERT : NEWCOMER;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-[#1d1a2f]/40 p-4 backdrop-blur-sm">
      <section data-ari="intro" className="ari-pop w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="ari-gradient px-7 py-6 text-white">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/80">
            <Sparkles className="h-4 w-4" /> {c.kicker}
          </p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight">{c.title}</h2>
          <p className="mt-2 text-white/90">{c.lead}</p>
        </div>
        <ul className="space-y-4 px-7 py-6">
          {c.points.map((p) => (
            <li key={p.title} className="flex gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-ari-50 text-ari-600">{p.icon}</span>
              <span>
                <span className="block font-semibold text-zinc-900">{p.title}</span>
                <span className="block text-sm text-zinc-600">{p.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-4 border-t border-zinc-100 px-7 py-5">
          <p className="text-xs text-zinc-500">Best in Chrome, sound on. Allow the microphone when asked.</p>
          <button data-ari="start-session" onClick={onStart} className="shrink-0 rounded-2xl px-5 py-3 font-semibold text-white shadow-lg shadow-ari-500/30 ari-gradient">
            {c.cta}
          </button>
        </div>
      </section>
    </div>
  );
}
