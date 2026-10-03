import { describe, expect, it } from "vitest";
import { ev, run } from "./harness";
import { MARIA_SESSION } from "./mariaSession";
import { compileProcedure } from "./procedure";
import { ruleJudge } from "./ruleJudge";
import type { CoreEffect, CoreInput } from "./types";

const SAM = { name: "Sam", role: "Procurement Manager", company: "Northwind Supply" };
const start: CoreInput = { kind: "session_start", profile: SAM, mode: "newcomer", lessons: MARIA_SESSION };
const showMe: CoreInput = { kind: "command", name: "show_me" };
const speak = (text: string, lang = "en-US"): CoreInput => ({ kind: "utterance", speaker: "newcomer", text, lang, at: 0 });
const of = <K extends CoreEffect["kind"]>(effects: CoreEffect[], kind: K) => effects.filter((e) => e.kind === kind) as Extract<CoreEffect, { kind: K }>[];

const atVendorStep = [
  start,
  ev({ type: "request_opened", requestId: "req-chairs" }),
  ev({ type: "quotes_requested", requestId: "req-chairs", vendorIds: ["apex", "coreparts", "sitwell"] }),
];

describe("show me", () => {
  it("drives the cursor through the current step the way Maria did it, narrating as it goes", () => {
    const { effects } = run([...atVendorStep, showMe], ruleJudge);
    expect(of(effects, "drive_cursor").at(-1)!.actions).toEqual([
      { target: "nav-vendors", action: "click" },
      { target: "history-apex", action: "click" },
      { target: "select-apex", action: "point" },
      { target: "select-coreparts", action: "point" },
      { target: "select-sitwell", action: "point" },
    ]);
    expect(of(effects, "teach_explain").at(-1)!.text).toMatch(/^Watch/);
  });

  it("requests the quotes itself at the quotes step", () => {
    const { effects } = run([start, ev({ type: "request_opened", requestId: "req-chairs" }), showMe], ruleJudge);
    expect(of(effects, "drive_cursor")[0].actions).toEqual([
      { target: "go-to-vendors", action: "click" },
      { target: "tick-apex", action: "click" },
      { target: "tick-coreparts", action: "click" },
      { target: "tick-sitwell", action: "click" },
      { target: "request-quotes", action: "click" },
    ]);
  });

  it("does nothing before there's a step to show", () => {
    const { effects } = run([start, showMe], ruleJudge);
    expect(of(effects, "drive_cursor")).toEqual([]);
  });
});

describe("Spanish", () => {
  it("switches to Spanish when the newcomer asks in Spanish, and answers in Spanish", () => {
    const { effects } = run([...atVendorStep, speak("¿Por qué Maria eligió Brightline?")], ruleJudge);
    expect(effects).toContainEqual({ kind: "switch_language", lang: "es-ES" });
    const answer = of(effects, "teach_explain").at(-1)!;
    expect(answer.lang).toBe("es-ES");
    expect(answer.text).toContain("Maria eligió Brightline Systems");
  });

  it("keeps teaching the next steps in Spanish, including the guardrail warning", () => {
    const { effects } = run(
      [
        ...atVendorStep,
        speak("¿Por qué Maria eligió Brightline?"),
        ev({ type: "vendor_selected", requestId: "req-chairs", vendorId: "sitwell", previousVendorId: null }),
        { kind: "workspace_intent", event: { type: "approval_routed", requestId: "req-chairs", vendorId: "sitwell", amount: 30000, to: "self" } },
      ],
      ruleJudge,
    );
    const approval = of(effects, "teach_explain").find((e) => e.stepId === "approval")!;
    expect(approval.text).toMatch(/^Ahora, la aprobación/);
    expect(of(effects, "warn_guardrail")[0].text).toMatch(/^Espera/);
  });

  it("stays in English for English questions", () => {
    const { effects } = run([...atVendorStep, speak("Why did Maria pick Brightline?")], ruleJudge);
    expect(of(effects, "switch_language")).toEqual([]);
  });
});

describe("compiled procedure", () => {
  it("turns Maria's session into step-by-step instructions for the tutor agent", () => {
    const procedure = compileProcedure(MARIA_SESSION);
    expect(procedure.name).toBe("Purchase request, the way Maria does it");
    expect(procedure.steps.map((s) => s.title)).toEqual(["Get quotes", "Pick a vendor", "Score the vendors", "Approval", "Issue the purchase order"]);
    const approval = procedure.steps.find((s) => s.title === "Approval")!;
    expect(approval.instructions).toContain("MUST FOLLOW (unwritten): New suppliers over $25k always go to the CFO first. It's not written down anywhere.");
    const scoring = procedure.steps.find((s) => s.title === "Score the vendors")!;
    expect(scoring.instructions).toContain("Knowledge: Vendor score = 40% price + 60% delivery record (Finance's formula). Source: told by a person.");
    expect(procedure.text).toContain("1. Get quotes");
  });
});
