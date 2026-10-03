import { describe, expect, it } from "vitest";
import { ev, run, startAsMaria, type FakeJudge } from "./harness";
import type { CoreInput, JudgeResult } from "./types";

type Assessment = Extract<JudgeResult, { kind: "assess" }>;
const understood = (explanation: string, evidence: string[]): Assessment => ({
  kind: "assess", explanation, evidence, confidence: 0.92, matters: true, question: "", types: ["Company policy"],
});
const puzzled = (question: string, matters = true): Assessment => ({
  kind: "assess", explanation: "", evidence: [], confidence: 0.3, matters, question, types: [],
});

// Scripted Judge for the demo: understands the 3 quotes, is puzzled by Vendor B.
const demoJudge = (overrides: Partial<Record<string, Assessment>> = {}): FakeJudge => (call) => {
  if (call.kind === "predict") return { kind: "predict", optionId: { quotes: "three_quotes", vendor: "apex", approval: "self", po: "issue", scoring: "" }[call.stepId] };
  if (call.kind === "classify") return { kind: "classify", types: ["Lesson learned", "Time or deadline"], summary: call.answer };
  return (
    overrides[call.card.stepId] ??
    {
      quotes: understood("Follows the procedure: 3 quotes for purchases over $5,000.", ["follows procedure §2", "Ari predicted it"]),
      vendor: puzzled("Why Brightline over the cheaper Apex Tech?"),
      approval: understood("Within her $50k approval limit.", ["procedure §4"]),
      po: understood("Issued after approval, per procedure.", ["procedure §5"]),
      scoring: understood("", []),
    }[call.card.stepId]!
  );
};

const say = (text: string): CoreInput => ({ kind: "utterance", speaker: "expert", text, lang: "en-US", at: Date.now() });

const throughVendorB: CoreInput[] = [
  startAsMaria,
  say("40 laptops for Marketing, due Friday"),
  ev({ type: "request_opened", requestId: "req-laptops" }),
  ev({ type: "quotes_requested", requestId: "req-laptops", vendorIds: ["apex", "brightline", "coreparts"] }),
  ev({ type: "vendor_selected", requestId: "req-laptops", vendorId: "brightline", previousVendorId: null }),
];

describe("session start", () => {
  it("greets the expert by name and asks what they're working on", () => {
    const { effects } = run([startAsMaria], demoJudge());
    expect(effects).toContainEqual({ kind: "ask", text: "Hi Maria, what are you working on today?", cardId: null });
  });

  it("takes the spoken answer as today's task and matches it to the request", () => {
    const { state, effects } = run([startAsMaria, say("40 laptops for Marketing, due Friday")], demoJudge());
    expect(state.task).toEqual({ text: "40 laptops for Marketing, due Friday", requestId: "req-laptops" });
    expect(effects).toContainEqual({ kind: "task_set", task: state.task });
    expect(state.openQuestion).toBeNull();
  });
});

describe("asking why", () => {
  it("stays quiet at 'request 3 quotes' and saves its own explanation", () => {
    const { cards, effects } = run(throughVendorB.slice(0, 4), demoJudge());
    const quotes = cards[0];
    expect(quotes.reason).toMatchObject({ source: "ari", evidence: ["follows procedure §2", "Ari predicted it"], confidence: 0.92 });
    expect(quotes.question).toBeUndefined();
    expect(effects.filter((e) => e.kind === "ask" && e.cardId)).toEqual([]);
  });

  it("asks right away at Vendor B over the cheaper Vendor A, coming forward", () => {
    const { effects, cards } = run(throughVendorB, demoJudge());
    const vendorCard = cards.find((c) => c.stepId === "vendor")!;
    expect(effects).toContainEqual({ kind: "ask", text: "Why Brightline over the cheaper Apex Tech?", cardId: vendorCard.id });
    const i = effects.findIndex((e) => e.kind === "ask" && e.cardId === vendorCard.id);
    expect(effects[i - 1]).toEqual({ kind: "avatar", state: "forward" });
    expect(vendorCard.question).toBe("Why Brightline over the cheaper Apex Tech?");
  });

  it("asks even about a usual choice when it can't explain it", () => {
    const { effects } = run(throughVendorB.slice(0, 4), demoJudge({ quotes: puzzled("Why only these three vendors?") }));
    expect(effects.some((e) => e.kind === "ask" && e.text === "Why only these three vendors?")).toBe(true);
  });

  it("does not ask when the reason wouldn't matter to the next person", () => {
    const { effects, cards } = run(throughVendorB, demoJudge({ vendor: puzzled("Why Brightline?", false) }));
    expect(effects.some((e) => e.kind === "ask" && e.cardId)).toBe(false);
    expect(cards.find((c) => c.stepId === "vendor")!.reason?.source).toBe("ari");
  });

  it("saves the spoken answer on the card as the expert's reason and steps back", () => {
    const { cards, effects, state } = run([...throughVendorB, say("A shipped late twice last year, and Friday is a hard deadline.")], demoJudge());
    expect(cards.find((c) => c.stepId === "vendor")!.reason).toEqual({
      source: "expert",
      text: "A shipped late twice last year, and Friday is a hard deadline.",
      types: ["Lesson learned", "Time or deadline"],
      evidence: [],
    });
    const avatarMoves = effects.filter((e) => e.kind === "avatar");
    expect(avatarMoves[avatarMoves.length - 1]).toEqual({ kind: "avatar", state: "bubble" });
    expect(state.openQuestion).toBeNull();
  });

  it("asks the next queued question once the current one is answered", () => {
    const { effects } = run(
      [
        ...throughVendorB,
        ev({ type: "approval_routed", requestId: "req-laptops", vendorId: "brightline", amount: 38400, to: "cfo" }),
        say("A shipped late twice."),
      ],
      demoJudge({ approval: puzzled("The procedure doesn't require that. Why send it to the CFO?") }),
    );
    const asks = effects.filter((e) => e.kind === "ask" && e.cardId).map((e) => (e as { text: string }).text);
    expect(asks).toEqual(["Why Brightline over the cheaper Apex Tech?", "The procedure doesn't require that. Why send it to the CFO?"]);
  });
});
