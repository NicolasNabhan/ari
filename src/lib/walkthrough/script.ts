// Maria's session as a script the judge steps through. Every line, click and
// glance is here, so the wording can change without touching the presenter.
// Ari's questions are not written here: they come from the Apprentice Core,
// exactly as they would live ("ari-asks" shows whatever Ari is asking then).
import type { WorkspaceAction } from "./workspaceState";

export type Speaker = "maria" | "ari";

// Something Maria reads before she acts (her eye tracking, simulated).
export type Read = { target: string; label: string; ms: number };

// One click: where Maria's cursor goes, and what it does there.
export type Click = { target: string; action: WorkspaceAction };

export type Beat =
  | { kind: "ari-asks" } // Ari speaks the question the Core is asking now
  | { kind: "say"; speaker: Speaker; text: string } // a scripted line
  | { kind: "answer"; text: string } // Maria answers Ari out loud
  | { kind: "act"; line?: string; reads?: Read[]; clicks: Click[] } // Maria says what she's doing, then clicks
  | { kind: "end"; line: string; target: string } // Maria ends the session; Ari starts its review
  | { kind: "handover" }; // Maria leaves; the new employee is next

export type Part = { id: string; title: string; beats: Beat[] };

const REQ = "req-laptops";

export const SCRIPT: Part[] = [
  {
    id: "opening",
    title: "Getting started",
    beats: [
      { kind: "ari-asks" },
      { kind: "answer", text: "40 laptops for Marketing, due Friday." },
      {
        kind: "say",
        speaker: "ari",
        text: "Got it: 40 laptops by Friday. Before you start, can I turn on eye tracking? I'd like to see exactly what you're reading, so I learn the details, not just the clicks.",
      },
      { kind: "say", speaker: "maria", text: "Of course, go ahead!" },
      { kind: "say", speaker: "ari", text: "Eye tracking is on. I'll watch quietly, and only ask when something doesn't add up." },
    ],
  },
  {
    id: "vendor",
    title: "Choosing a vendor",
    beats: [
      {
        kind: "act",
        line: "Let's start with Tom's laptop request.",
        reads: [{ target: `inbox-${REQ}`, label: "Tom's laptop request", ms: 1800 }],
        clicks: [{ target: `inbox-${REQ}`, action: { type: "open_request", requestId: REQ } }],
      },
      {
        kind: "act",
        line: "Forty laptops for the new Marketing hires, needed by Friday. I'll go get quotes.",
        reads: [{ target: `request-detail-${REQ}`, label: "Laptop request details", ms: 3200 }],
        clicks: [{ target: "go-to-vendors", action: { type: "go", screen: "vendors" } }],
      },
      {
        kind: "act",
        line: "The procedure wants three quotes for anything over five thousand dollars, so I'll ask all three vendors.",
        clicks: [
          { target: "tick-apex", action: { type: "tick", vendorId: "apex" } },
          { target: "tick-brightline", action: { type: "tick", vendorId: "brightline" } },
          { target: "tick-coreparts", action: { type: "tick", vendorId: "coreparts" } },
          { target: "request-quotes", action: { type: "request_quotes", requestId: REQ } },
        ],
      },
      { kind: "say", speaker: "ari", text: "Three quotes, straight from the procedure. I understand that one, so I'll stay quiet." },
      {
        kind: "act",
        line: "Apex is the cheapest… but let me check their delivery record first.",
        reads: [
          { target: "vendor-apex", label: "Apex Tech quote", ms: 2100 },
          { target: "vendor-brightline", label: "Brightline Systems quote", ms: 1600 },
        ],
        clicks: [{ target: "history-apex", action: { type: "toggle_history", vendorId: "apex" } }],
      },
      {
        kind: "act",
        line: "Two late orders. I'm going with Brightline.",
        reads: [{ target: "history-panel-apex", label: "Apex Tech delivery history", ms: 4200 }],
        clicks: [{ target: "select-brightline", action: { type: "select_vendor", requestId: REQ, vendorId: "brightline" } }],
      },
      { kind: "ari-asks" },
      { kind: "answer", text: "Apex shipped late twice last year, and Friday is a hard deadline." },
    ],
  },
  {
    id: "scoring",
    title: "Scoring",
    beats: [
      {
        kind: "act",
        line: "Now the scoring sheet Finance shares with us.",
        clicks: [{ target: "nav-scoring", action: { type: "go", screen: "scoring" } }],
      },
      {
        kind: "act",
        line: "Brightline gets an 82.",
        reads: [{ target: "score-row-brightline", label: "Brightline Systems in the scoring sheet", ms: 1500 }],
        clicks: [
          { target: "score-brightline", action: { type: "type_score", vendorId: "brightline", text: "82" } },
          { target: "score-brightline", action: { type: "enter_score", requestId: REQ, vendorId: "brightline" } },
        ],
      },
      { kind: "ari-asks" },
      { kind: "answer", text: "40% price, 60% delivery record. It's Finance's formula, nobody wrote it down." },
      { kind: "say", speaker: "ari", text: "A formula that only lives in Finance's head. That's exactly what the next person would miss." },
    ],
  },
  {
    id: "approval",
    title: "Approval",
    beats: [
      {
        kind: "act",
        line: "Time to route the approval.",
        clicks: [{ target: "nav-approvals", action: { type: "go", screen: "approvals" } }],
      },
      {
        kind: "act",
        line: "This one goes to the CFO.",
        reads: [{ target: "approval-summary", label: "Approval summary", ms: 2600 }],
        clicks: [{ target: "route-cfo", action: { type: "route", requestId: REQ, to: "cfo" } }],
      },
      { kind: "ari-asks" },
      { kind: "answer", text: "New suppliers over $25k always go to the CFO first. It's not written down anywhere." },
      {
        kind: "act",
        line: "And now the purchase order.",
        clicks: [{ target: "issue-po", action: { type: "issue_po", requestId: REQ } }],
      },
    ],
  },
  {
    id: "review",
    title: "Ari checks what it learned",
    beats: [
      { kind: "end", line: "That's the purchase done, Ari.", target: "end-session" },
      { kind: "ari-asks" },
      { kind: "answer", text: "Yes" },
      { kind: "ari-asks" },
      { kind: "answer", text: "Yes, that's right." },
      { kind: "ari-asks" },
      { kind: "answer", text: "Yes." },
      {
        kind: "say",
        speaker: "ari",
        text: "Thank you. I also learned from your calendar, your files and your meetings, and that will matter for the next person.",
      },
      { kind: "say", speaker: "maria", text: "Take good care of the next person, Ari." },
      { kind: "handover" },
    ],
  },
];
