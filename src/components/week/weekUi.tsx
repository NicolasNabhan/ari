"use client";

import { useEffect, useState } from "react";
import { Coffee, FileText, Lightbulb, Mail, MessageSquareText, Palette, ShieldAlert, Target, Users, ClipboardCheck, Inbox, type LucideIcon } from "lucide-react";
import type { Level } from "@/lib/apprentice/reasonTypes";
import type { ContextSource, ScheduleKind, Weekday } from "@/lib/context/types";
import { toMinutes } from "@/lib/context/patterns";

// One block to draw on the calendar or the day timeline, from the expert's
// schedule or the newcomer's plan.
export type Block = {
  id: string;
  day: Weekday;
  start: string;
  minutes: number;
  kind: ScheduleKind;
  title: string;
  with?: string[];
  notes?: string;
  sourceId?: string;
  noticed?: boolean; // Ari noticed a pattern here
  highlight?: boolean; // part of the pattern Ari is asking about
  advice?: string;
  level?: Level;
  role?: "attend" | "do" | "break";
  taskId?: string;
};

export const KIND: Record<ScheduleKind, { label: string; icon: LucideIcon; block: string; dot: string; chip: string }> = {
  meeting: { label: "Meeting", icon: Users, block: "bg-sky-50 border-sky-200 text-sky-900 hover:bg-sky-100", dot: "bg-sky-400", chip: "bg-sky-50 text-sky-700 ring-sky-200" },
  break: { label: "Break", icon: Coffee, block: "bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100", dot: "bg-emerald-400", chip: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  task: { label: "Task", icon: ClipboardCheck, block: "bg-ari-50 border-ari-200 text-ari-700 hover:bg-ari-100", dot: "bg-ari-500", chip: "bg-ari-50 text-ari-700 ring-ari-200" },
  focus: { label: "Focus", icon: Target, block: "bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100", dot: "bg-amber-400", chip: "bg-amber-50 text-amber-800 ring-amber-200" },
  admin: { label: "Admin", icon: Inbox, block: "bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100", dot: "bg-coral-400", chip: "bg-rose-50 text-rose-700 ring-rose-200" },
};

export const SOURCE_ICON: Record<ContextSource["kind"], { icon: LucideIcon; label: string }> = {
  meeting: { icon: MessageSquareText, label: "Transcript" },
  file: { icon: FileText, label: "File" },
  email: { icon: Mail, label: "Email" },
};

export const LEVEL: Record<Exclude<Level, "unknown">, { label: string; icon: LucideIcon; className: string }> = {
  must: { label: "Must follow", icon: ShieldAlert, className: "bg-rose-50 text-rose-700 ring-rose-200" },
  advice: { label: "Strong advice", icon: Lightbulb, className: "bg-amber-50 text-amber-800 ring-amber-200" },
  choice: { label: "Your choice", icon: Palette, className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
};

export function LevelBadge({ level }: { level?: Level }) {
  if (!level || level === "unknown") return null;
  const { label, icon: Icon, className } = LEVEL[level];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${className}`}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

export const DAY_START = 8 * 60 + 30;
export const DAY_END = 17 * 60 + 30;

export function endOf(start: string, minutes: number) {
  const t = toMinutes(start) + minutes;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

export const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

// The current time, ticking every 30 seconds. Null until mounted.
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick(); // time is only known in the browser
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

// Answers the expert gave to Ari's pattern questions, kept in this browser.
export type PatternAnswer = { verdict: "yes" | "no"; text?: string };
const ANSWERS_KEY = "ari.week.answers";

export function usePatternAnswers() {
  const [answers, setAnswers] = useState<Record<string, PatternAnswer>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ANSWERS_KEY);
      // Browser storage is only readable after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setAnswers(JSON.parse(raw));
    } catch {
      // Blocked storage: answers just won't be remembered.
    }
  }, []);
  function answer(id: string, a: PatternAnswer | null) {
    setAnswers((prev) => {
      const next = { ...prev };
      if (a) next[id] = a;
      else delete next[id];
      try {
        localStorage.setItem(ANSWERS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }
  return { answers, answer };
}
