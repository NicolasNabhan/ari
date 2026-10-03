import { describe, expect, it } from "vitest";
import { ev, run, startAsMaria, type FakeJudge } from "./harness";
import { ruleJudge } from "./ruleJudge";
import type { CoreEffect, CoreInput, StepId } from "./types";

const say = (text: string): CoreInput => ({ kind: "utterance", speaker: "expert", text, lang: "en-US", at: 0 });
const end: CoreInput = { kind: "command", name: "end_session" };

// Ari understands everything (stays quiet), with different certainty per step.
const CONFIDENCE: Record<StepId, number> = { scoring: 0.7, vendor: 0.75, approval: 0.8, quotes: 0.92, po: 0.95 };
const quietJudge: FakeJudge = (call) =>
  call.kind === "assess"
    ? { kind: "assess", explanation: `guess about ${call.card.stepId}`, evidence: [], confidence: CONFIDENCE[call.card.stepId], matters: true, question: "", types: ["Quality"] }
    : ruleJudge(call);

const session: CoreInput[] = [
  startAsMaria,
  say("40 laptops for Marketing"),
  ev({ type: "request_opened", requestId: "req-laptops" }),
  ev({ type: "quotes_requested", requestId: "req-laptops", vendorIds: ["apex", "brightline", "coreparts"] }),
  ev({ type: "vendor_selected", requestId: "req-laptops", vendorId: "apex", previousVendorId: null }),
  ev({ type: "score_entered", requestId: "req-laptops", vendorId: "apex", score: 70 }),
  ev({ type: "approval_routed", requestId: "req-laptops", vendorId: "apex", amount: 36800, to: "self" }),
  ev({ type: "po_issued", requestId: "req-laptops", vendorId: "apex", amount: 36800 }),
];

const reviewItems = (effects: CoreEffect[]) =>
  effects.filter((e) => e.kind === "end_review_item").map((e) => (e as Extract<CoreEffect, { kind: "end_review_item" }>).cardId);
const asks = (effects: CoreEffect[]) => effects.filter((e) => e.kind === "ask").map((e) => (e as Extract<CoreEffect, { kind: "ask" }>).text);

describe("end-of-session review", () => {
  it("offers to go through the decisions Ari is least sure about", () => {
    const { effects } = run([...session, end], quietJudge);
    expect(asks(effects)).toContain("Want me to go through the decisions I'm least sure about?");
  });

  it("reads the three least-certain quiet decisions one at a time, then asks to continue", () => {
    const { effects } = run([...session, end, say("Yes"), say("Yes, right"), say("Correct"), say("Yep")], quietJudge);
    expect(reviewItems(effects)).toEqual(["req-laptops:scoring", "req-laptops:vendor", "req-laptops:approval"]);
    expect(asks(effects).at(-1)).toBe("That's the three I was least sure about. Want me to continue?");
  });

  it("on 'no', shows the rest as a list, least certain first", () => {
    const { effects } = run([...session, end, say("Yes"), say("Yes"), say("Yes"), say("Yes"), say("No, that's enough")], quietJudge);
    expect(effects).toContainEqual({ kind: "show_review_list", cardIds: ["req-laptops:quotes", "req-laptops:po"] });
  });

  it("declining the offer goes straight to the full list", () => {
    const { effects } = run([...session, end, say("No thanks")], quietJudge);
    expect(effects).toContainEqual({
      kind: "show_review_list",
      cardIds: ["req-laptops:scoring", "req-laptops:vendor", "req-laptops:approval", "req-laptops:quotes", "req-laptops:po"],
    });
  });

  it("a spoken confirmation marks the guess confirmed; a correction replaces it with the expert's words", () => {
    const { cards } = run([...session, end, say("Yes"), say("Yes, that's right"), say("No, I just trust Apex for laptops.")], quietJudge);
    const byStep = Object.fromEntries(cards.map((c) => [c.stepId, c]));
    expect(byStep.scoring.reason).toMatchObject({ source: "ari", confirmed: true });
    expect(byStep.vendor.reason).toMatchObject({ source: "expert", text: "I just trust Apex for laptops." });
    expect(byStep.quotes.reason!.confirmed).toBeFalsy(); // never reviewed
  });

  it("confirms and corrects from the list, and the skip button ends the session", () => {
    const { cards, effects } = run(
      [
        ...session,
        end,
        say("No"),
        { kind: "review_confirm", cardId: "req-laptops:po" },
        { kind: "review_correct", cardId: "req-laptops:quotes", text: "Always 3 quotes, even under $5k." },
        { kind: "command", name: "review_skip" },
      ],
      quietJudge,
    );
    expect(cards.find((c) => c.stepId === "po")!.reason!.confirmed).toBe(true);
    expect(cards.find((c) => c.stepId === "quotes")!.reason).toMatchObject({ source: "expert", text: "Always 3 quotes, even under $5k." });
    expect(effects.at(-1)).toEqual({ kind: "session_ended" });
  });

  it("ends right away when there are no quiet guesses to check", () => {
    const { effects } = run([startAsMaria, say("laptops"), end], ruleJudge);
    expect(effects.at(-1)).toEqual({ kind: "session_ended" });
  });
});
