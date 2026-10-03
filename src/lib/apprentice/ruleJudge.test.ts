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
