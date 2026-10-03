import { describe, expect, it } from "vitest";
import { initialState, reduce } from "./core";
import { ev, run } from "./harness";
import { MARIA_SESSION } from "./mariaSession";
import { ruleJudge } from "./ruleJudge";
import type { CoreEffect, CoreInput } from "./types";

const SAM = { name: "Sam", role: "Procurement Associate", company: "Northwind Supply" };
const start: CoreInput = { kind: "session_start", profile: SAM, mode: "newcomer", lessons: MARIA_SESSION };
const ask = (text: string, lang = "en-US"): CoreInput => ({ kind: "utterance", speaker: "newcomer", text, lang, at: 0 });
const explanations = (effects: CoreEffect[]) => effects.filter((e) => e.kind === "teach_explain").map((e) => e as Extract<CoreEffect, { kind: "teach_explain" }>);

const chairsToVendor = [
  start,
  ev({ type: "request_opened", requestId: "req-chairs" }),
  ev({ type: "quotes_requested", requestId: "req-chairs", vendorIds: ["apex", "coreparts", "sitwell"] }),
];

describe("teach mode", () => {
  it("greets the newcomer as a tutor, without asking them anything", () => {
    const { effects } = run([start], ruleJudge);
    expect(effects[0]).toEqual({ kind: "avatar", state: "tutor" });
    expect(explanations(effects)[0].text).toMatch(/^Hi Sam/);
    expect(effects.some((e) => e.kind === "ask" || e.kind === "judge_request")).toBe(false);
  });

  it("explains each step out loud with Maria's choice, reason and level, and highlights the next thing", () => {
    const { effects } = run(chairsToVendor, ruleJudge);
    const [, quotes, vendor] = explanations(effects);
    expect(quotes).toMatchObject({ stepId: "quotes", highlight: "go-to-vendors" });
    expect(quotes.text).toContain("at least 3 quotes");
    expect(vendor).toMatchObject({ stepId: "vendor", highlight: "history-apex" });
    expect(vendor.text).toContain("Maria chose Brightline Systems");
    expect(vendor.text).toContain('"Apex shipped late twice last year, and Friday was a hard deadline."');
    expect(vendor.text).toContain("strong advice");
  });

  it("passes on knowledge that only lived in Maria's head, and where it comes from", () => {
    const { effects } = run(chairsToVendor, ruleJudge);
    const vendor = explanations(effects)[2].text;
    expect(vendor).toContain("40% price + 60% delivery record");
    expect(vendor).toContain("isn't written down anywhere");
  });

  it("includes Maria's how-notes in the explanation", () => {
    const { effects } = run(chairsToVendor, ruleJudge);
    expect(explanations(effects)[2].text).toContain("opened Apex Tech's delivery history before deciding");
  });

  it("calls out the unwritten must-follow rule at the approval step", () => {
    const { effects } = run(
      [...chairsToVendor, ev({ type: "vendor_selected", requestId: "req-chairs", vendorId: "sitwell", previousVendorId: null })],
      ruleJudge,
    );
    const approval = explanations(effects).find((e) => e.stepId === "approval")!;
    expect(approval.text).toContain("isn't in the written procedure");
    expect(approval.text).toContain("you must follow it");
    expect(approval.highlight).toBe("nav-approvals");
  });

  it("describes personal-style choices as optional and labels unconfirmed guesses", () => {
    const { effects } = run(
      [
        ...chairsToVendor,
        ev({ type: "vendor_selected", requestId: "req-chairs", vendorId: "sitwell", previousVendorId: null }),
        ev({ type: "approval_routed", requestId: "req-chairs", vendorId: "sitwell", amount: 30000, to: "cfo" }),
      ],
      ruleJudge,
    );
    const po = explanations(effects).find((e) => e.stepId === "po")!;
    expect(po.text).toContain("do it your own way");
    expect(po.text).toContain("my best guess, not confirmed by Maria");
  });

  it("answers 'why?' out loud from Maria's saved reasons", () => {
    const { effects } = run([...chairsToVendor, ask("Why did Maria pick Brightline?")], ruleJudge);
    const answer = explanations(effects).at(-1)!;
    expect(answer.text).toContain("Apex shipped late twice last year");
  });

  it("warns before a $30k approval from a new supplier goes through, and lets a second try pass", () => {
    let state = run(chairsToVendor, ruleJudge).state;
    const intent: CoreInput = { kind: "workspace_intent", event: { type: "approval_routed", requestId: "req-chairs", vendorId: "sitwell", amount: 30000, to: "self" } };
    const first = reduce(state, intent);
    expect(first.effects).toContainEqual({ kind: "warn_guardrail", text: "Wait. New suppliers over $25k go to the CFO first. That's Maria's rule.", ruleId: "new-supplier-cfo" });
    state = first.state;
    expect(reduce(state, intent).effects.some((e) => e.kind === "warn_guardrail")).toBe(false);
  });

  it("does not warn when the rule is followed or doesn't apply", () => {
    const state = run(chairsToVendor, ruleJudge).state;
    const route = (vendorId: string, to: "self" | "cfo", amount: number): CoreInput => ({
      kind: "workspace_intent",
      event: { type: "approval_routed", requestId: "req-chairs", vendorId, amount, to },
    });
    expect(reduce(state, route("sitwell", "cfo", 30000)).effects).toEqual([]);
    expect(reduce(state, route("apex", "self", 31500)).effects).toEqual([]); // Apex had a bigger order before
    expect(reduce(initialState(), route("sitwell", "self", 30000)).effects).toEqual([]); // not teaching
  });
});
