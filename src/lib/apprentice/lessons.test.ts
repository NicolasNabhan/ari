import { describe, expect, it } from "vitest";
import { reduce } from "./core";
import { ev, run, startAsMaria } from "./harness";
import { deriveGuardrails, lessonsFrom } from "./lessons";
import { ruleJudge } from "./ruleJudge";
import type { CoreInput } from "./types";

const say = (text: string): CoreInput => ({ kind: "utterance", speaker: "expert", text, lang: "en-US", at: 0 });

const judgeRun: CoreInput[] = [
  startAsMaria,
  say("40 laptops for Marketing, due Friday"),
  ev({ type: "request_opened", requestId: "req-laptops" }),
  ev({ type: "quotes_requested", requestId: "req-laptops", vendorIds: ["apex", "brightline", "coreparts"] }),
  ev({ type: "vendor_selected", requestId: "req-laptops", vendorId: "brightline", previousVendorId: null }),
  say("Apex shipped late twice last year, and Friday is a hard deadline."),
  ev({ type: "approval_routed", requestId: "req-laptops", vendorId: "brightline", amount: 38400, to: "cfo" }),
  say("New suppliers over $25k always go to the CFO first. It's not written down."),
  ev({ type: "po_issued", requestId: "req-laptops", vendorId: "brightline", amount: 38400 }),
];

describe("lessons from a session", () => {
  it("turns an unwritten CFO answer into a checkable guardrail", () => {
    const { cards } = run(judgeRun, ruleJudge);
    expect(deriveGuardrails(cards, "Maria")).toEqual([
      {
        id: "req-laptops:approval",
        text: "New suppliers over $25k always go to the CFO first. It's not written down.",
        warning: "Wait. New suppliers over $25k go to the CFO first. That's Maria's rule.",
        warningEs: "Espera. Los proveedores nuevos de más de 25.000 dólares van primero al director financiero. Es la regla de Maria.",
        step: "approval",
        requiredOption: "cfo",
        minAmount: 25000,
        onlyNewSuppliers: true,
        unwritten: true,
      },
    ]);
  });

  it("reads amounts written as 25k, $25,000 or 25000", () => {
    for (const text of ["over 25k", "over $25,000", "anything above 25000", "after 2 late deliveries, over $25k", "since 2024, anything above $25,000"]) {
      const card = { ...run(judgeRun, ruleJudge).cards.find((c) => c.stepId === "approval")! };
      card.reason = { ...card.reason!, text: `New suppliers ${text} go to the CFO` };
      expect(deriveGuardrails([card], "Maria")[0]?.minAmount).toBe(25000);
    }
  });

  it("packs the session into lessons a newcomer can be taught from, end to end", () => {
    const { state } = run(judgeRun, ruleJudge);
    const lessons = lessonsFrom(state)!;
    expect(lessons.expert).toBe("Maria");
    expect(lessons.requestSubject).toBe("40 laptops for the new Marketing hires");
    expect(lessons.cards.map((c) => c.stepId)).toEqual(["quotes", "vendor", "approval", "po"]);

    // Teach a newcomer from what this judge just taught Ari.
    let teach = run(
      [
        { kind: "session_start", profile: { name: "Sam", role: "Procurement Manager", company: "Northwind Supply" }, mode: "newcomer", lessons },
        ev({ type: "request_opened", requestId: "req-chairs" }),
      ],
      ruleJudge,
    ).state;
    const out = reduce(teach, {
      kind: "workspace_intent",
      event: { type: "approval_routed", requestId: "req-chairs", vendorId: "sitwell", amount: 30000, to: "self" },
    });
    teach = out.state;
    expect(out.effects).toContainEqual(expect.objectContaining({ kind: "warn_guardrail" }));
  });

  it("has nothing to teach before any decision was made", () => {
    expect(lessonsFrom(run([startAsMaria], ruleJudge).state)).toBeNull();
  });
});

describe("Maria's recorded session", () => {
  it("is a complete lesson set with her unwritten CFO rule", async () => {
    const { MARIA_RECORDED } = await import("./mariaSession");
    expect(MARIA_RECORDED.cards.map((c) => c.stepId)).toEqual(["quotes", "vendor", "scoring", "approval", "po"]);
    expect(MARIA_RECORDED.guardrails).toEqual(deriveGuardrails(MARIA_RECORDED.cards, "Maria"));
  });
});
