import { describe, expect, it } from "vitest";
import { ev, run, startAsMaria, type FakeJudge } from "./harness";
import { ruleJudge } from "./ruleJudge";

// The fake Judge predicts what the written procedure suggests: 3 quotes, the
// cheapest vendor, approve yourself under $50k.
const procedureMinded: FakeJudge = (call) => {
  if (call.kind !== "predict") return ruleJudge(call);
  const pick = { quotes: "three_quotes", vendor: "apex", approval: "self", scoring: "score", po: "issue" }[call.stepId];
  return { kind: "predict", optionId: pick };
};

const laptopsUpToVendorB = [
  startAsMaria,
  ev({ type: "request_opened", requestId: "req-laptops" }),
  ev({ type: "quotes_requested", requestId: "req-laptops", vendorIds: ["apex", "brightline", "coreparts"] }),
  ev({ type: "delivery_history_opened", vendorId: "apex" }),
  ev({ type: "vendor_selected", requestId: "req-laptops", vendorId: "brightline", previousVendorId: null }),
];

describe("Ari watches", () => {
  it("turns requesting 3 quotes and picking Vendor B into two cards with prediction marks", () => {
    const { cards } = run(laptopsUpToVendorB, procedureMinded);

    expect(cards.map((c) => c.stepId)).toEqual(["quotes", "vendor"]);

    const [quotes, vendor] = cards;
    expect(quotes.chosen).toBe("three_quotes");
    expect(quotes.procedureRef).toBe("§2");
    expect(quotes.options.find((o) => o.id === "three_quotes")!.status).toBe("procedure");
    expect(quotes.options.find((o) => o.id === "fewer_quotes")!.status).toBe("against");
    expect(quotes.prediction).toEqual({ optionId: "three_quotes", correct: true });

    expect(vendor.chosen).toBe("brightline");
    expect(vendor.options.map((o) => o.id)).toEqual(["apex", "brightline", "coreparts"]);
    expect(vendor.prediction).toEqual({ optionId: "apex", correct: false });
  });

  it("keeps one card per step and remembers a change of mind", () => {
    const { cards } = run(
      [
        ...laptopsUpToVendorB.slice(0, 3),
        ev({ type: "vendor_selected", requestId: "req-laptops", vendorId: "apex", previousVendorId: null }),
        ev({ type: "vendor_selected", requestId: "req-laptops", vendorId: "brightline", previousVendorId: "apex" }),
      ],
      procedureMinded,
    );
    const vendorCards = cards.filter((c) => c.stepId === "vendor");
    expect(vendorCards).toHaveLength(1);
    expect(vendorCards[0].chosen).toBe("brightline");
    expect(vendorCards[0].previousChoices).toEqual(["apex"]);
    // The prediction is judged against the first choice, not the final one.
    expect(vendorCards[0].prediction?.correct).toBe(true);
  });

  it("marks routing a $38k order to the CFO as beyond the procedure", () => {
    const { cards } = run(
      [
        ...laptopsUpToVendorB,
        ev({ type: "approval_routed", requestId: "req-laptops", vendorId: "brightline", amount: 38400, to: "cfo" }),
      ],
      procedureMinded,
    );
    const approval = cards.find((c) => c.stepId === "approval")!;
    expect(approval.chosen).toBe("cfo");
    expect(approval.procedureRef).toBe("§4");
    expect(approval.options.find((o) => o.id === "self")!.status).toBe("procedure");
    expect(approval.options.find((o) => o.id === "cfo")!.status).toBe("allowed");
    expect(approval.prediction).toEqual({ optionId: "self", correct: false });
  });

  it("does not make cards for browsing, messages or being busy", () => {
    const { cards } = run(
      [
        startAsMaria,
        ev({ type: "screen_opened", screen: "procedure" }),
        ev({ type: "delivery_history_opened", vendorId: "apex" }),
        ev({ type: "busy_changed", busy: true, reason: "typing" }),
        ev({ type: "message_sent", channel: "chat", to: "priya", text: "hi" }),
      ],
      procedureMinded,
    );
    expect(cards).toEqual([]);
  });

  it("leaves the prediction mark off when the Judge never answered", () => {
    const { cards } = run(laptopsUpToVendorB.slice(0, 3), () => null);
    expect(cards[0].prediction).toBeUndefined();
  });
});
