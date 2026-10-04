// The big picture around the expert's work: their whole week (meetings,
// breaks, recurring tasks), the files and meetings their decisions depend on,
// numbers that change across the week, and where their eyes went.
// Shared by the week view, the files & meetings hub, eye tracking and the
// newcomer's plan.

import type { Level } from "@/lib/apprentice/reasonTypes";
import type { KnowledgeSource } from "@/lib/apprentice/types";

export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
export const WEEKDAYS: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export type ScheduleKind = "meeting" | "break" | "task" | "focus" | "admin";

// One block on the expert's calendar.
export type ScheduleItem = {
  id: string;
  day: Weekday;
  start: string; // "14:00"
  minutes: number;
  kind: ScheduleKind;
  title: string;
  with?: string[]; // people in the meeting
  notes?: string;
  sourceId?: string; // the meeting or file it produced (see ContextSource)
};

// Something outside the workspace a decision can depend on.
export type ContextSource = {
  id: string;
  kind: "meeting" | "file" | "email";
  title: string;
  day: Weekday;
  time?: string;
  from?: string; // who sent it, or who ran the meeting
  // Meetings: the transcript, one line per turn ("Speaker: text"). Files: the text.
  text: string;
  // How it got here: a connected calendar/Zoom, an upload, or a live recording.
  origin: "connected" | "uploaded" | "recorded" | "sample";
};

// A fact or rule pulled from a source, ready to link to a decision.
export type ExtractedKnowledge = {
  id: string;
  sourceId: string;
  text: string; // in plain words
  quote?: string; // the exact words in the source
  source: KnowledgeSource; // "Told by a person" for meetings, "Company document" for files…
  level?: Level; // must / advice / choice, when it's clearly one
  step?: string; // the decision it explains ("vendor", "scoring", "approval"…), if any
};

// A number that changes across the week (e.g. a supplier's daily discount).
export type WeeklyObservation = { day: Weekday; subject: string; metric: string; value: number; unit?: string };

// Something only visible when looking at the whole week.
export type Pattern = {
  id: string;
  kind: "trend" | "recurring-slot" | "by-weekday";
  summary: string; // "Brightline's discount drops 10 points a day after Tuesday"
  evidence: string[]; // "Tue 50%", "Wed 40%", "Thu 30%"
  days: Weekday[];
  confidence: number; // 0..1
  level?: Level;
  question?: string; // what Ari asks the expert to confirm it
  advice?: string; // what the newcomer should do because of it
};

// Where the expert looked, merged into dwell time on one thing on screen.
export type AttentionRecord = {
  target: string; // the data-ari value (or a region name) that was looked at
  label: string; // human words: "Apex delivery history"
  screen: string;
  ms: number; // total dwell time
  firstAt: number;
};
