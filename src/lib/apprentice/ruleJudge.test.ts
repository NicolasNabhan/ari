import { describe, expect, it } from "vitest";
import { ev, run, startAsMaria } from "./harness";
import { ruleJudge } from "./ruleJudge";

describe("rule Judge", () => {
  it("predicts the procedure's 3 quotes and the cheapest vendor", () => {
    const { cards } = run(
      [
        startAsMaria,
        ev({ type: "request_opened", requestId: "req-laptops" }),
        ev({ type: "quotes_requested", requestId: "req-laptops", vendorIds: ["apex", "brightline", "coreparts"] }),
        ev({ type: "vendor_selected", requestId: "req-laptops", vendorId: "brightline", previousVendorId: null }),
      ],
      ruleJudge,
    );
    expect(cards.map((c) => [c.stepId, c.prediction])).toEqual([
      ["quotes", { optionId: "three_quotes", correct: true }],
      ["vendor", { optionId: "apex", correct: false }],
    ]);
  });
});

describe("rule Judge on the demo script", () => {
  const say = (text: string) => ({ kind: "utterance" as const, speaker: "expert" as const, text, lang: "en-US", at: 0 });
  const script = [
    startAsMaria,
    say("40 laptops for Marketing"),
    ev({ type: "request_opened", requestId: "req-laptops" }),
    ev({ type: "quotes_requested", requestId: "req-laptops", vendorIds: ["apex", "brightline", "coreparts"] }),
    ev({ type: "vendor_selected", requestId: "req-laptops", vendorId: "brightline", previousVendorId: null }),
    say("A shipped late twice last year, and Friday is a hard deadline."),
    ev({ type: "approval_routed", requestId: "req-laptops", vendorId: "brightline", amount: 38400, to: "cfo" }),
  ];

  it("stays quiet at 3 quotes, asks at Vendor B and at the CFO routing", () => {
    const { effects, cards } = run(script, ruleJudge);
    const asks = effects.filter((e) => e.kind === "ask").map((e) => (e as { text: string }).text);
    expect(asks).toEqual([
      "Hi Maria, what are you working on today?",
      "Why Brightline Systems over the cheaper Apex Tech?",
      "The procedure doesn't require that for $38,400. Why send it to the CFO?",
    ]);
    expect(cards[0].reason).toMatchObject({ source: "ari", evidence: ["follows procedure §2", "Ari predicted it"] });
  });

  it("sorts the Vendor B answer as lesson learned and deadline", () => {
    const { cards } = run(script, ruleJudge);
    expect(cards.find((c) => c.stepId === "vendor")!.reason).toMatchObject({
      source: "expert",
      types: ["Lesson learned", "Time or deadline"],
    });
  });
});
