import { describe, expect, it } from "vitest";
import { ev, run, startAsMaria, type FakeJudge } from "./harness";
import { ruleJudge } from "./ruleJudge";
import type { CoreInput } from "./types";

const say = (text: string): CoreInput => ({ kind: "utterance", speaker: "expert", text, lang: "en-US", at: 0 });
const busy = (on: boolean, reason: "typing" | "call" = "typing") => ev({ type: "busy_changed", busy: on, reason });
const asks = (effects: { kind: string }[]) => effects.filter((e) => e.kind === "ask").map((e) => (e as unknown as { text: string }).text);

const toVendorB = [
  startAsMaria,
  say("40 laptops for Marketing"),
  ev({ type: "request_opened", requestId: "req-laptops" }),
  ev({ type: "quotes_requested", requestId: "req-laptops", vendorIds: ["apex", "brightline", "coreparts"] }),
];
const pickB = ev({ type: "vendor_selected", requestId: "req-laptops", vendorId: "brightline", previousVendorId: null });
const WHY_B = "Why Brightline Systems over the cheaper Apex Tech?";

describe("interruption etiquette", () => {
  it("holds a question while the expert is busy and asks as soon as they're free", () => {
    const whileBusy = run([...toVendorB, busy(true), pickB], ruleJudge);
    expect(asks(whileBusy.effects)).not.toContain(WHY_B);
    const afterwards = run([...toVendorB, busy(true), pickB, busy(false)], ruleJudge);
    expect(asks(afterwards.effects)).toContain(WHY_B);
  });

  it("waits until every reason for being busy has ended", () => {
    const { effects } = run([...toVendorB, busy(true, "call"), busy(true, "typing"), pickB, busy(false, "typing")], ruleJudge);
    expect(asks(effects)).not.toContain(WHY_B);
  });

  it("in tap-to-hear mode, signals first and only speaks after the tap", () => {
    const signalled = run([...toVendorB, { kind: "set_tap_to_hear", on: true }, pickB], ruleJudge);
    expect(signalled.effects).toContainEqual({ kind: "signal_pending_question" });
    expect(asks(signalled.effects)).not.toContain(WHY_B);
    const tapped = run([...toVendorB, { kind: "set_tap_to_hear", on: true }, pickB, { kind: "tap_to_hear" }], ruleJudge);
    expect(asks(tapped.effects)).toContain(WHY_B);
  });

  it("asks exactly one gentle follow-up on a vague answer, then accepts the next one", () => {
    const vagueJudge: FakeJudge = (call) =>
      call.kind === "classify"
        ? { kind: "classify", types: ["Personal preference"], summary: call.answer, followUp: "Is that from past experience with them, or personal taste?" }
        : ruleJudge(call);
    const { effects, cards } = run([...toVendorB, pickB, say("I just like them better."), say("Just taste, really.")], vagueJudge);
    expect(asks(effects).filter((t) => t.startsWith("Is that from past experience"))).toHaveLength(1);
    const reason = cards.find((c) => c.stepId === "vendor")!.reason!;
    expect(reason.text).toBe("I just like them better. Just taste, really.");
    expect(reason.types).toEqual(["Personal preference"]);
  });

  it("the rule Judge follows up on 'I just like them better'", () => {
    const { effects } = run([...toVendorB, pickB, say("I just like them better.")], ruleJudge);
    expect(asks(effects)).toContain("Is that from past experience with them, or personal taste?");
  });
});
