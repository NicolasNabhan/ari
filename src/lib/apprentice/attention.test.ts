// Eye tracking feeding Ari: what Maria read before a decision lands on that
// decision's card and sharpens Ari's question.
import { describe, expect, it } from "vitest";
import type { AttentionRecord } from "@/lib/context/types";
import { initialState, reduce } from "./core";
import { ev, run, startAsMaria } from "./harness";
import { ruleJudge } from "./ruleJudge";
import type { CoreEffect, CoreInput, JudgeCall } from "./types";

const maria = (text: string): CoreInput => ({ kind: "utterance", speaker: "expert", text, lang: "en-US", at: 0 });
const look = (target: string, label: string, ms: number, screen = "vendors"): CoreInput => ({
  kind: "attention",
  record: { target, label, screen, ms, firstAt: 0 },
  at: 0,
});
const asks = (effects: CoreEffect[]) => effects.flatMap((e) => (e.kind === "ask" ? [e.text] : []));

const upToVendor: CoreInput[] = [
  startAsMaria,
  maria("40 laptops for Marketing, due Friday."),
  look("inbox-req-laptops", "Laptop request from Tom Reyes", 1800, "inbox"),
  ev({ type: "request_opened", requestId: "req-laptops" }),
  ev({ type: "quotes_requested", requestId: "req-laptops", vendorIds: ["apex", "brightline", "coreparts"] }),
  ev({ type: "delivery_history_opened", vendorId: "apex" }),
  look("history-panel-apex", "Apex Tech delivery history", 2500),
  look("vendor-brightline", "Brightline Systems quote", 1100),
  look("history-panel-apex", "Apex Tech delivery history", 1700),
  ev({ type: "vendor_selected", requestId: "req-laptops", vendorId: "brightline", previousVendorId: null }),
];

describe("attention in the Core", () => {
  const out = run(upToVendor, ruleJudge);
  const card = (step: string) => out.cards.find((c) => c.stepId === step)!;

  it("puts what Maria looked at before each decision on that decision's card", () => {
    expect(card("quotes").attention?.map((r) => r.target)).toEqual(["inbox-req-laptops"]);
    expect(card("vendor").attention?.map((r) => [r.label, r.ms])).toEqual([
      ["Apex Tech delivery history", 4200],
      ["Brightline Systems quote", 1100],
    ]);
  });

  it("passes it to the Judge and asks a sharper question", () => {
    const assess = out.effects.find(
      (e): e is Extract<CoreEffect, { kind: "judge_request" }> => e.kind === "judge_request" && e.call.kind === "assess" && e.call.card.stepId === "vendor",
    )!.call as Extract<JudgeCall, { kind: "assess" }>;
    expect(assess.context.attention?.[0]).toMatchObject({ target: "history-panel-apex", ms: 4200 });
    expect(asks(out.effects)).toContain("You spent a while on Apex's late deliveries: is that why you picked Brightline?");
    expect(asks(out.effects)).not.toContain("Why Brightline Systems over the cheaper Apex Tech?");
  });

  it("uses it as evidence when Ari explains a choice itself", () => {
    expect(card("quotes").reason?.evidence).toContain("Looked at: Laptop request from Tom Reyes (1.8 s)");
  });

  it("without tracking, cards have no attention and the question is the usual one", () => {
    const plain = run(upToVendor.filter((i) => i.kind !== "attention"), ruleJudge);
    expect(plain.cards.every((c) => c.attention === undefined)).toBe(true);
    expect(asks(plain.effects)).toContain("Why Brightline Systems over the cheaper Apex Tech?");
  });

  it("ignores attention when teaching a newcomer", () => {
    const state = { ...initialState(), mode: "newcomer" as const };
    const record: AttentionRecord = { target: "x", label: "X", screen: "inbox", ms: 500, firstAt: 0 };
    expect(reduce(state, { kind: "attention", record, at: 0 }).state.attention).toEqual([]);
  });
});
