// Knowledge from meetings and files: a rule-based extractor (the offline
// fallback for /api/extract), plus small helpers to cite where a piece of
// knowledge was said or written and to highlight it inside the source text.
// Pure: no browser or server APIs.

import type { Level } from "@/lib/apprentice/reasonTypes";
import type { KnowledgeSource, StepId } from "@/lib/apprentice/types";
import { northwind } from "@/lib/northwind/seed";
import type { ContextSource, ExtractedKnowledge, Weekday } from "./types";

export const STEP_IDS: StepId[] = ["quotes", "vendor", "scoring", "approval", "po"];

// What each decision step is called when a piece of knowledge is linked to it.
export const STEP_LINK: Record<StepId, string> = {
  quotes: "Getting quotes",
  vendor: "Vendor choice",
  scoring: "Vendor scoring",
  approval: "Approval route",
  po: "Purchase order",
};

export function knowledgeSourceFor(kind: ContextSource["kind"]): KnowledgeSource {
  if (kind === "meeting") return "Told by a person";
  if (kind === "email") return "Company system";
  return "Company document";
}

// "CFO approvals check-in, Wed 15:00"
export function citeSource(source: Pick<ContextSource, "title" | "day" | "time">): string {
  return `${source.title}, ${source.day}${source.time ? ` ${source.time}` : ""}`;
}

// Who said the quote, from the "Name: text" transcript line it sits in.
export function speakerOf(quote: string | undefined, source: ContextSource): string | undefined {
  if (!quote || source.kind !== "meeting") return undefined;
  const line = source.text.split("\n").find((l) => l.includes(quote));
  const m = line?.match(/^([^:]{1,40}):\s/);
  return m ? m[1].trim() : undefined;
}

const STEP_HINTS: [RegExp, StepId][] = [
  [/\bscor(e|es|ing)\b|formula|weight/i, "scoring"],
  [/\bapprov(e|es|al|als)\b|\bcfo\b|sign[- ]off|comes? to me/i, "approval"],
  [/purchase order|\bpo\b/i, "po"],
  [/\b(request|get|ask for|collect)\b.*\bquotes?\b|at least\s+\w+\s+quotes/i, "quotes"],
  [/\bchoose\b|\bpick\b|lowest|vendor|supplier|deliver|on time|\blate\b/i, "vendor"],
  [/\bquotes?\b/i, "quotes"],
];

export function stepFor(text: string): StepId | undefined {
  return STEP_HINTS.find(([re]) => re.test(text))?.[1];
}

// A sentence of the source, with who said it (meetings) and where it sits.
type Sentence = { text: string; speaker?: string; next?: string };

function sentences(source: ContextSource): Sentence[] {
  const split = (s: string) => s.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
  const out: Sentence[] = [];
  for (const line of source.text.split("\n")) {
    const m = source.kind === "meeting" ? line.match(/^([^:]{1,40}):\s+(.*)$/) : null;
    const speaker = m?.[1].trim();
    const parts = split(m ? m[2] : line);
    parts.forEach((text) => out.push({ text, speaker }));
  }
  out.forEach((s, i) => (s.next = out[i + 1]?.text));
  return out;
}

const WORD_NUMBERS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type Hit = { text: string; level?: Level; step?: StepId; quote?: string };
type Rule = { id: string; test: RegExp; make: (s: Sentence, source: ContextSource, m: RegExpMatchArray) => Hit | null };

const vendorIn = (text: string) => northwind.vendors.find((v) => new RegExp(`\\b${v.name.split(" ")[0]}\\b`, "i").test(text));
const toNumber = (w: string) => (/^\d+$/.test(w) ? Number(w) : WORD_NUMBERS[w.toLowerCase()]);

const RULES: Rule[] = [
  {
    // Finance's scoring formula: "forty percent price, sixty percent delivery record"
    id: "scoring-formula",
    test: /\b(forty|40)\s*(percent|%)\s*(on\s+)?price\b.*?\b(sixty|60)\s*(percent|%)\s*(on\s+)?delivery/i,
    make: () => ({ text: "Score vendors 40% on price and 60% on delivery record (Finance's formula).", level: "must", step: "scoring" }),
  },
  {
    // The CFO wants to see new suppliers over $25,000 first.
    id: "cfo-new-supplier",
    test: /new supplier.*?(over|above|more than)\s*(\$\s?25,?000|\$?25k|twenty[- ]five thousand)/i,
    make: (s, source) => {
      const who = /\bcfo\b/i.test(`${source.from ?? ""} ${source.title}`) ? "the CFO" : s.speaker ?? "a manager";
      return { text: `New suppliers over $25,000 go to ${who} first, even when the procedure lets you approve it yourself.`, level: "must", step: "approval" };
    },
  },
  {
    // "Apex, the last two laptop orders arrived late. Eleven days and six days."
    id: "late-deliveries",
    test: /\b(arrived|delivered|came|shipped)\s+late\b/i,
    make: (s) => {
      const v = vendorIn(s.text);
      const days = s.next?.match(/(\w+)\s+days?\s+and\s+(\w+)\s+days?/i);
      const detail = days && toNumber(days[1]) && toNumber(days[2]) ? ` (${toNumber(days[1])} and ${toNumber(days[2])} days late)` : "";
      return { text: `${v?.name ?? "This vendor"} delivered recent orders late${detail}. Check delivery history before choosing them.`, level: "advice", step: "vendor" };
    },
  },
  {
    id: "deadline-on-time",
    test: /(hard deadline.*on time|on time.*hard deadline)/i,
    make: () => ({ text: "For anything with a hard deadline, pick the vendor that delivers on time, not just the cheapest.", level: "advice", step: "vendor" }),
  },
  {
    // "Tuesday 50% off, Wednesday 40% off, Thursday 30% off."
    id: "weekday-discounts",
    test: /\b(mon|tues|wednes|thurs|fri)day\s+\d+\s*%\s*off/i,
    make: (s, source) => {
      const offers = [...s.text.matchAll(/\b((?:mon|tues|wednes|thurs|fri)day)\s+(\d+)\s*%\s*off/gi)].map((m) => ({ day: m[1], pct: Number(m[2]) }));
      if (!offers.length) return null;
      const best = offers.reduce((a, b) => (b.pct > a.pct ? b : a));
      const cap = (d: string) => DAYS.find((x) => x.toLowerCase() === d.toLowerCase()) ?? d;
      const who = source.from ?? vendorIn(s.text)?.name ?? "This supplier";
      return {
        text: `${who}'s discount drops through the week (${offers.map((o) => `${cap(o.day)} ${o.pct}%`).join(", ")}), so order on ${cap(best.day)}.`,
        level: "advice",
      };
    },
  },
  {
    id: "spend-report",
    test: /spend report.*\bfridays?\b|\bfridays?\b.*spend report/i,
    make: (s) => ({ text: `Send ${s.speaker ?? "Finance"} the spend report every Friday.`, level: "advice" }),
  },
  {
    // Written rules in documents: "request at least 3 quotes", "Managers may approve…", "Choose the lowest…"
    id: "written-rule",
    test: /\b(must|shall|at least|may approve|approves|choose the|required|requires|never|always)\b/i,
    make: (s, source) => (source.kind === "meeting" ? null : { text: s.text.replace(/^§\s*\d+\s*/, ""), level: "must" }),
  },
  {
    // Rules said out loud: "always…", "never…", "comes to me first", "make sure…"
    id: "said-rule",
    test: /\b(always|never|must|have to|make sure|comes? to me|the rule is|policy)\b/i,
    make: (s, source) => {
      if (source.kind !== "meeting" || s.text.split(" ").length < 5) return null;
      return { text: s.text, level: /\b(must|have to|never|policy|the rule is)\b/i.test(s.text) ? "must" : "advice" };
    },
  },
];

// Pull facts and rules out of a meeting transcript, file or email, without any model.
export function extractKnowledge(source: ContextSource): ExtractedKnowledge[] {
  const out: ExtractedKnowledge[] = [];
  const quoted = new Set<string>();
  const sentencesOf = sentences(source);
  for (const rule of RULES) {
    for (const s of sentencesOf) {
      if (quoted.has(s.text)) continue;
      const m = s.text.match(rule.test);
      if (!m) continue;
      const hit = rule.make(s, source, m);
      if (!hit) continue;
      quoted.add(s.text);
      out.push({
        id: `${source.id}:${rule.id}:${out.length}`,
        sourceId: source.id,
        text: hit.text,
        quote: hit.quote ?? s.text,
        source: knowledgeSourceFor(source.kind),
        level: hit.level,
        step: hit.step ?? stepFor(`${s.text} ${hit.text}`),
      });
    }
  }
  return out;
}

// Keep only well-formed items whose quote really is in the text (models can paraphrase).
export function groundQuotes(items: ExtractedKnowledge[], text: string): ExtractedKnowledge[] {
  return items.map((k) => {
    if (!k.quote) return k;
    if (text.includes(k.quote)) return k;
    const at = text.toLowerCase().indexOf(k.quote.toLowerCase());
    return { ...k, quote: at >= 0 ? text.slice(at, at + k.quote.length) : undefined };
  });
}

// Split text into plain and highlighted runs, one highlight per quote found.
export type Run = { text: string; itemId?: string };
export function highlightRuns(text: string, items: Pick<ExtractedKnowledge, "id" | "quote">[]): Run[] {
  const marks: { start: number; end: number; itemId: string }[] = [];
  for (const k of items) {
    if (!k.quote) continue;
    const start = text.indexOf(k.quote);
    if (start < 0 || marks.some((m) => start < m.end && start + k.quote!.length > m.start)) continue;
    marks.push({ start, end: start + k.quote.length, itemId: k.id });
  }
  marks.sort((a, b) => a.start - b.start);
  const runs: Run[] = [];
  let at = 0;
  for (const m of marks) {
    if (m.start > at) runs.push({ text: text.slice(at, m.start) });
    runs.push({ text: text.slice(m.start, m.end), itemId: m.itemId });
    at = m.end;
  }
  if (at < text.length) runs.push({ text: text.slice(at) });
  return runs;
}

// Today as a workday of the expert's week (weekends count as Friday).
export function workdayOf(date: Date): Weekday {
  const days: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const d = date.getDay(); // 0 = Sunday
  return d >= 1 && d <= 5 ? days[d - 1] : "Fri";
}

// Knowledge taught to Ari that was said in a meeting, so teach mode can cite
// it ("Raj said this in the CFO approvals check-in"). Set by the knowledge store.
export type Citation = { step: StepId; text: string; who?: string; where: string };
let citations: Citation[] = [];
export function setCitations(next: Citation[]) {
  citations = next;
}
export function citationsFor(step: StepId): Citation[] {
  return citations.filter((c) => c.step === step);
}

export function citationsFrom(items: ExtractedKnowledge[], sources: ContextSource[]): Citation[] {
  const out: Citation[] = [];
  for (const k of items) {
    const source = sources.find((s) => s.id === k.sourceId);
    if (!source || source.kind !== "meeting" || !k.step || !STEP_IDS.includes(k.step as StepId)) continue;
    out.push({ step: k.step as StepId, text: k.text, who: speakerOf(k.quote, source), where: source.title });
  }
  return out;
}
