import { describe, expect, it } from "vitest";
import { ev, run, startAsMaria } from "./harness";
import { levelOf } from "./reasonTypes";
import { ruleJudge } from "./ruleJudge";
import { isUnwritten } from "./teach";
import type { CoreInput } from "./types";

const say = (text: string): CoreInput => ({ kind: "utterance", speaker: "expert", text, lang: "en-US", at: 0 });
const asks = (effects: { kind: string }[]) => effects.filter((e) => e.kind === "ask").map((e) => (e as unknown as { text: string }).text);

const script: CoreInput[] = [
  startAsMaria,
  say("40 laptops for Marketing"),
  ev({ type: "request_opened", requestId: "req-laptops" }),
  ev({ type: "quotes_requested", requestId: "req-laptops", vendorIds: ["apex", "brightline", "coreparts"] }),
  ev({ type: "vendor_selected", requestId: "req-laptops", vendorId: "brightline", previousVendorId: null }),
  say("A shipped late twice; Friday is a hard deadline."),
  ev({ type: "approval_routed", requestId: "req-laptops", vendorId: "brightline", amount: 38400, to: "cfo" }),
  say("New suppliers over 25k always go to the CFO. It's not written down."),
  ev({ type: "score_entered", requestId: "req-laptops", vendorId: "brightline", score: 82 }),
  say("40% price, 60% delivery record. It's Finance's formula, nobody wrote it down."),
];

describe("reasons, levels and knowledge", () => {
  it("sorts the Vendor B answer as strong advice: lesson learned + deadline", () => {
    const vendor = run(script, ruleJudge).cards.find((c) => c.stepId === "vendor")!;
    expect(vendor.reason!.types).toEqual(["Lesson learned", "Time or deadline"]);
    expect(levelOf(vendor.reason!.types)).toBe("advice");
    expect(isUnwritten(vendor)).toBe(false);
  });

  it("asks about the CFO routing and saves it as an unwritten must-follow team convention", () => {
    const { effects, cards } = run(script, ruleJudge);
    expect(asks(effects)).toContain("The procedure doesn't require that for $38,400. Why send it to the CFO?");
    const approval = cards.find((c) => c.stepId === "approval")!;
    expect(approval.reason!.types).toContain("Team convention");
    expect(levelOf(approval.reason!.types)).toBe("must");
    expect(isUnwritten(approval)).toBe(true);
  });

  it("asks where a typed score comes from and tags the answer as told by a person", () => {
    const { effects, cards } = run(script, ruleJudge);
    expect(asks(effects)).toContain("Where does that number come from?");
    const scoring = cards.find((c) => c.stepId === "scoring")!;
    expect(scoring.knowledge).toEqual([
      { text: "40% price, 60% delivery record. It's Finance's formula, nobody wrote it down.", source: "Told by a person" },
    ]);
    expect(scoring.reason!.types).toContain("Company-specific method");
  });

  it("only asks about the score once, however many scores are typed", () => {
    const { effects } = run(
      [...script, ev({ type: "score_entered", requestId: "req-laptops", vendorId: "apex", score: 64 })],
      ruleJudge,
    );
    expect(asks(effects).filter((t) => t === "Where does that number come from?")).toHaveLength(1);
  });

  it("uses the strongest level among a reason's types", () => {
    expect(levelOf(["Personal preference", "Lesson learned"])).toBe("advice");
    expect(levelOf(["Lesson learned", "Company policy"])).toBe("must");
    expect(levelOf(["Habit"])).toBe("choice");
    expect(levelOf([])).toBe("unknown");
  });
});
