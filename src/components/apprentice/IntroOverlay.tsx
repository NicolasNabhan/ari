"use client";

import { BookOpenCheck, CalendarDays, GraduationCap, MessageCircleQuestion, MousePointerClick, ShieldAlert, Sparkles, Languages, Eye } from "lucide-react";

type Point = { icon: React.ReactNode; title: string; text: string };

const EXPERT: { kicker: string; title: string; lead: string; points: Point[]; cta: string } = {
  kicker: "You're the expert",
  title: "You're Maria, Procurement Manager at Northwind Supply.",
  lead: "This is the office simulator. You play Maria, the expert. Marketing needs 40 laptops by Friday: do the purchase, and Ari, our learner bot in the bottom-right corner, analyses your work and learns your job.",
  points: [
    { icon: <MousePointerClick className="h-5 w-5" />, title: "You do the real task", text: "A guide at the top tells you exactly what to click and what to say, one step at a time." },
    { icon: <MessageCircleQuestion className="h-5 w-5" />, title: "Ari asks why, only when it can't tell", text: "When a choice surprises it, Ari asks out loud. Answer by voice; the microphone opens by itself." },
    { icon: <GraduationCap className="h-5 w-5" />, title: "Then Ari teaches the next person", text: "At the end, watch Ari teach a new hire using your answers, including the rules nobody wrote down." },
  ],
  cta: "Start teaching Ari",
};

const NEWCOMER: typeof EXPERT = {
  kicker: "Step 2 · Ari teaches the new employee",
  title: "Now test whether Ari learned well, and whether it can teach.",
  lead: "Maria, the expert, has left the office. You're Sam, the new employee, in the same office simulator. You'll learn from Ari: it starts with your schedule, because that shapes the whole job, then takes you through your first purchase, 30 office chairs.",
  points: [
    { icon: <CalendarDays className="h-5 w-5" />, title: "Schedule first", text: "Your week, your day, and the patterns Ari spotted across Maria's week. Then the specifics." },
    { icon: <BookOpenCheck className="h-5 w-5" />, title: "Ari explains every step", text: "What to do, what Maria chose, and whether it's a rule or just Maria's style. The next button glows." },
    { icon: <Eye className="h-5 w-5" />, title: "Ask “why?” or say “Show me”", text: "Ari answers in Maria's own words, or takes the cursor and does the step for you." },
    { icon: <Languages className="h-5 w-5" />, title: "Try Spanish", text: "Ask a question in Spanish and Ari keeps teaching in Spanish." },
    { icon: <ShieldAlert className="h-5 w-5" />, title: "Try breaking the rule", text: "At the approval step, approve it yourself and see what Ari does." },
  ],
  cta: "Start learning from Ari",
};

const WALKTHROUGH: typeof EXPERT = {
  kicker: "Step 1 · Ari learns from Maria",
  title: "Watch Ari learn from Maria, the expert.",
  lead: "This is the office simulator. Maria, a simulated veteran Procurement Manager, buys 40 laptops for Marketing. Ari, our learner bot in the bottom-right corner, watches her work and learns her job.",
  points: [
    { icon: <MousePointerClick className="h-5 w-5" />, title: "Maria does the real work", text: "She says what she's doing, then clicks through the office simulator: inbox, vendors, scoring, approval." },
    { icon: <MessageCircleQuestion className="h-5 w-5" />, title: "Ari asks why, only when it can't tell", text: "It watches what she reads and does, and asks only when a choice doesn't add up." },
    { icon: <Sparkles className="h-5 w-5" />, title: "Ari sorts what it learns", text: "Must-follow rules, strong advice, personal choices, and the rules nobody wrote down, on the right." },
    { icon: <GraduationCap className="h-5 w-5" />, title: "Go at your own pace", text: "Use Next for each moment and Next step to jump a whole part. Back works the same way." },
  ],
  cta: "Start step 1",
};

export function IntroOverlay({ mode, onStart }: { mode: "expert" | "newcomer" | "walkthrough"; onStart: () => void }) {
  const c = mode === "expert" ? EXPERT : mode === "walkthrough" ? WALKTHROUGH : NEWCOMER;
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
          <p className="text-xs text-zinc-500">{mode === "walkthrough" ? "Best in Chrome, sound on." : "Best in Chrome, sound on. Allow the microphone when asked."}</p>
          <button data-ari="start-session" onClick={onStart} className="shrink-0 rounded-2xl px-5 py-3 font-semibold text-white shadow-lg shadow-ari-500/30 ari-gradient">
            {c.cta}
          </button>
        </div>
      </section>
    </div>
  );
}
