// Maria's week at Northwind Supply: the big picture around the laptop
// purchase. Sample data standing in for a connected calendar, Zoom and her
// files. It's consistent with the workspace demo: Apex shipped late twice,
// Finance's 40/60 scoring formula, the CFO rule for new suppliers over
// $25,000, the Friday deadline for Marketing's laptops.

import type { ContextSource, ScheduleItem, WeeklyObservation } from "./types";

export const MARIA_SCHEDULE: ScheduleItem[] = [
  // Monday
  { id: "mon-standup", day: "Mon", start: "09:00", minutes: 15, kind: "meeting", title: "Ops stand-up", with: ["Ops team"] },
  { id: "mon-finance", day: "Mon", start: "09:30", minutes: 30, kind: "meeting", title: "Weekly Finance sync", with: ["Dana (Finance)"], sourceId: "mtg-finance-sync" },
  { id: "mon-requests", day: "Mon", start: "10:00", minutes: 90, kind: "task", title: "Triage new purchase requests" },
  { id: "mon-lunch", day: "Mon", start: "12:30", minutes: 45, kind: "break", title: "Lunch" },
  { id: "mon-quotes", day: "Mon", start: "14:00", minutes: 120, kind: "task", title: "Request quotes for open requests" },
  // Tuesday
  { id: "tue-standup", day: "Tue", start: "09:00", minutes: 15, kind: "meeting", title: "Ops stand-up", with: ["Ops team"] },
  { id: "tue-supplies", day: "Tue", start: "09:30", minutes: 30, kind: "task", title: "Order office supplies (OfficeHub)", notes: "Always Tuesday morning" },
  { id: "tue-focus", day: "Tue", start: "10:00", minutes: 120, kind: "focus", title: "Compare quotes and score vendors" },
  { id: "tue-lunch", day: "Tue", start: "12:30", minutes: 45, kind: "break", title: "Lunch" },
  { id: "tue-email", day: "Tue", start: "15:00", minutes: 60, kind: "admin", title: "Supplier emails" },
  // Wednesday
  { id: "wed-standup", day: "Wed", start: "09:00", minutes: 15, kind: "meeting", title: "Ops stand-up", with: ["Ops team"] },
  { id: "wed-approvals", day: "Wed", start: "10:00", minutes: 90, kind: "task", title: "Route approvals" },
  { id: "wed-lunch", day: "Wed", start: "12:30", minutes: 45, kind: "break", title: "Lunch" },
  { id: "wed-break", day: "Wed", start: "14:00", minutes: 10, kind: "break", title: "Short break" },
  { id: "wed-cfo", day: "Wed", start: "15:00", minutes: 20, kind: "meeting", title: "CFO approvals check-in", with: ["Raj (CFO)"], sourceId: "mtg-cfo-checkin" },
  // Thursday
  { id: "thu-standup", day: "Thu", start: "09:00", minutes: 15, kind: "meeting", title: "Ops stand-up", with: ["Ops team"] },
  { id: "thu-vendor", day: "Thu", start: "11:00", minutes: 45, kind: "meeting", title: "Vendor review call", with: ["Apex Tech", "Brightline Systems"], sourceId: "mtg-vendor-review" },
  { id: "thu-lunch", day: "Thu", start: "12:30", minutes: 45, kind: "break", title: "Lunch" },
  { id: "thu-break", day: "Thu", start: "14:00", minutes: 15, kind: "break", title: "Coffee break" },
  { id: "thu-pos", day: "Thu", start: "14:15", minutes: 105, kind: "task", title: "Issue purchase orders" },
  // Friday
  { id: "fri-standup", day: "Fri", start: "09:00", minutes: 15, kind: "meeting", title: "Ops stand-up", with: ["Ops team"] },
  { id: "fri-deliveries", day: "Fri", start: "10:00", minutes: 60, kind: "task", title: "Check deliveries due this week" },
  { id: "fri-lunch", day: "Fri", start: "12:30", minutes: 60, kind: "break", title: "Team lunch" },
  { id: "fri-wrap", day: "Fri", start: "16:00", minutes: 30, kind: "admin", title: "Weekly wrap-up: open POs and spend report" },
];

export const MARIA_SOURCES: ContextSource[] = [
  {
    id: "mtg-finance-sync",
    kind: "meeting",
    title: "Weekly Finance sync",
    day: "Mon",
    time: "09:30",
    from: "Dana (Finance)",
    origin: "sample",
    text: [
      "Dana: Quick one on vendor scoring. When you compare quotes, use our formula: forty percent price, sixty percent delivery record.",
      "Maria: Still sixty on delivery? Even when one is much cheaper?",
      "Dana: Yes. A late laptop costs us more than the difference. It's not in the procedure, it's just how Finance wants it.",
      "Maria: Got it. I'll keep entering the weighted score in the sheet.",
      "Dana: And send me the spend report on Fridays like always.",
    ].join("\n"),
  },
  {
    id: "mtg-cfo-checkin",
    kind: "meeting",
    title: "CFO approvals check-in",
    day: "Wed",
    time: "15:00",
    from: "Raj (CFO)",
    origin: "sample",
    text: [
      "Raj: One thing I want to be clear about. Any new supplier, anything over twenty-five thousand, comes to me first.",
      "Maria: Even if I'm allowed to approve it myself under the procedure?",
      "Raj: Even then. We got burned by a new supplier last year. I want to see those.",
      "Maria: Understood, I'll route them to you.",
    ].join("\n"),
  },
  {
    id: "mtg-vendor-review",
    kind: "meeting",
    title: "Vendor review call",
    day: "Thu",
    time: "11:00",
    from: "Maria",
    origin: "sample",
    text: [
      "Maria: Apex, the last two laptop orders arrived late. Eleven days and six days.",
      "Apex rep: Our warehouse moved, it should be better now.",
      "Maria: I hope so. For anything with a hard deadline I'll go with whoever delivers on time.",
      "Brightline rep: We've been on time for every order this year.",
    ].join("\n"),
  },
  {
    id: "file-officehub",
    kind: "email",
    title: "OfficeHub weekly flash discounts",
    day: "Mon",
    time: "08:05",
    from: "OfficeHub",
    origin: "sample",
    text: "This week's flash discount on office supplies: Tuesday 50% off, Wednesday 40% off, Thursday 30% off. Orders placed Friday to Monday pay full price.",
  },
  {
    id: "file-procedure",
    kind: "file",
    title: "Purchasing procedure v4.pdf",
    day: "Mon",
    from: "Operations",
    origin: "sample",
    text: "§2 For any purchase over $5,000, request at least 3 quotes from approved vendors. §3 Choose the lowest compliant quote unless there is a documented reason. §4 Managers may approve purchases up to $50,000; above that, the CFO approves.",
  },
];

// Numbers that only make sense across the week.
export const MARIA_OBSERVATIONS: WeeklyObservation[] = [
  { day: "Tue", subject: "OfficeHub", metric: "discount", value: 50, unit: "%" },
  { day: "Wed", subject: "OfficeHub", metric: "discount", value: 40, unit: "%" },
  { day: "Thu", subject: "OfficeHub", metric: "discount", value: 30, unit: "%" },
  { day: "Fri", subject: "OfficeHub", metric: "discount", value: 0, unit: "%" },
  { day: "Mon", subject: "OfficeHub", metric: "discount", value: 0, unit: "%" },
];

// How Maria does the recurring tasks Ari has no recorded lesson for, in short
// steps (keyed by schedule item id). Purchase-request steps come from lessons.
export const MARIA_TASK_STEPS: Record<string, string[]> = {
  "mon-requests": ["Open the Inbox and read each new purchase request", "Check who needs it, how many and by when", "Start with the ones with a hard deadline"],
  "mon-quotes": ["Open each request in Requests", "Tick the approved vendors in Vendors & quotes"],
  "wed-approvals": ["Open Approvals for each request with a vendor picked"],
  "thu-pos": ["Check the approval came back for each request"],
  "tue-supplies": ["Open the OfficeHub order form", "Re-order the usual office supplies", "Order before noon so it ships the same day"],
  "tue-email": ["Answer suppliers' questions about open quotes", "Chase any quote that hasn't arrived"],
  "fri-deliveries": ["List the purchase orders due this week", "Check each one arrived on the promised date", "Email the supplier about anything late"],
  "fri-wrap": ["List the open purchase orders", "Write the spend report for the week", "Send it to Dana in Finance"],
};
