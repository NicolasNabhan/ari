// The whole demo script, replayed through the Apprentice Core with a fake
// Judge: Maria teaches Ari, then Ari teaches a newcomer from what it learned.
import { describe, expect, it } from "vitest";
import { initialState, reduce } from "./core";
import { ev, run, startAsMaria, type FakeJudge } from "./harness";
import { levelOf } from "./reasonTypes";
import { lessonsFrom } from "./lessons";
import { ruleJudge } from "./ruleJudge";
import { isUnwritten } from "./teach";
import type { CoreEffect, CoreInput } from "./types";

const maria = (text: string): CoreInput => ({ kind: "utterance", speaker: "expert", text, lang: "en-US", at: 0 });
const sam = (text: string, lang = "en-US"): CoreInput => ({ kind: "utterance", speaker: "newcomer", text, lang, at: 0 });
const of = <K extends CoreEffect["kind"]>(effects: CoreEffect[], kind: K) => effects.filter((e) => e.kind === kind) as Extract<CoreEffect, { kind: K }>[];

// Fake Judge: the rule Judge, which reasons like someone who only knows the
// written procedure. Deterministic, no network.
const fakeJudge: FakeJudge = ruleJudge;

const expertHalf: CoreInput[] = [
  startAsMaria,
  maria("40 laptops for Marketing, due Friday."),
  ev({ type: "request_opened", requestId: "req-laptops" }),
  ev({ type: "quotes_requested", requestId: "req-laptops", vendorIds: ["apex", "brightline", "coreparts"] }),
  ev({ type: "delivery_history_opened", vendorId: "apex" }),
  ev({ type: "vendor_selected", requestId: "req-laptops", vendorId: "brightline", previousVendorId: null }),
  maria("Apex shipped late twice last year, and Friday is a hard deadline."),
  ev({ type: "score_entered", requestId: "req-laptops", vendorId: "brightline", score: 82 }),
  maria("40% price, 60% delivery record. It's Finance's formula, nobody wrote it down."),
  ev({ type: "approval_routed", requestId: "req-laptops", vendorId: "brightline", amount: 38400, to: "cfo" }),
  maria("New suppliers over $25k always go to the CFO first. It's not written down anywhere."),
  ev({ type: "po_issued", requestId: "req-laptops", vendorId: "brightline", amount: 38400 }),
  { kind: "command", name: "end_session" },
  maria("Yes"),
  maria("Yes, that's right."),
  maria("Yes."),
];

describe("the demo script", () => {
  const expert = run(expertHalf, fakeJudge);
  const asks = of(expert.effects, "ask").map((a) => a.text);
  const card = (step: string) => expert.cards.find((c) => c.stepId === step)!;

  it("1. greets Maria and takes today's task", () => {
    expect(asks[0]).toBe("Hi Maria, what are you working on today?");
    expect(expert.state.task?.requestId).toBe("req-laptops");
  });

  it("2. stays quiet at 3 quotes (predicted, follows §2) and asks at Vendor B", () => {
    expect(card("quotes").prediction?.correct).toBe(true);
    expect(card("quotes").reason).toMatchObject({ source: "ari", evidence: ["follows procedure §2", "Ari predicted it"] });
    expect(asks).toContain("Why Brightline Systems over the cheaper Apex Tech?");
    expect(card("vendor").howNotes).toContain("Opened Apex Tech's delivery history before deciding");
    expect(levelOf(card("vendor").reason!.types)).toBe("advice");
    expect(card("vendor").reason!.types).toEqual(["Lesson learned", "Time or deadline"]);
  });

  it("3. asks where the score comes from and tags it as told by a person", () => {
    expect(asks).toContain("Where does that number come from?");
    expect(card("scoring").knowledge?.[0].source).toBe("Told by a person");
  });

  it("4. asks about the CFO routing and saves an unwritten must-follow rule", () => {
    expect(asks).toContain("The procedure doesn't require that for $38,400. Why send it to the CFO?");
    expect(levelOf(card("approval").reason!.types)).toBe("must");
    expect(isUnwritten(card("approval"))).toBe(true);
  });

  it("5. at the end, offers a review and reads the least-certain guess first", () => {
    expect(asks).toContain("Want me to go through the decisions I'm least sure about?");
    expect(of(expert.effects, "end_review_item")[0].cardId).toBe("req-laptops:quotes"); // 0.9 < 0.95
    expect(expert.effects.at(-1)).toEqual({ kind: "session_ended" });
  });

  describe("6. Ari teaches a newcomer from what Maria taught it", () => {
    const lessons = lessonsFrom(expert.state)!;
    const newcomer: CoreInput = { kind: "session_start", profile: { name: "Sam", role: "Procurement Manager", company: "Northwind Supply" }, mode: "newcomer", lessons };
    const teach = run(
      [
        newcomer,
        ev({ type: "request_opened", requestId: "req-chairs" }),
        ev({ type: "quotes_requested", requestId: "req-chairs", vendorIds: ["apex", "coreparts", "sitwell"] }),
        sam("Why did Maria pick Brightline last time?"),
        { kind: "command", name: "show_me" },
        sam("¿Y por qué eligió ese proveedor?"),
        ev({ type: "vendor_selected", requestId: "req-chairs", vendorId: "sitwell", previousVendorId: null }),
      ],
      fakeJudge,
    );

    it("explains each step and answers 'why?' from Maria's own words", () => {
      const said = of(teach.effects, "teach_explain").map((e) => e.text);
      expect(said[0]).toMatch(/^Hi Sam/);
      expect(said.some((t) => t.includes('"Apex shipped late twice last year, and Friday is a hard deadline."'))).toBe(true);
    });

    it("shows how Maria did it with Ari's own cursor", () => {
      expect(of(teach.effects, "drive_cursor")[0].actions[1]).toEqual({ target: "history-apex", action: "click" });
    });

    it("switches to Spanish when asked in Spanish", () => {
      expect(teach.effects).toContainEqual({ kind: "switch_language", lang: "es-ES" });
      expect(of(teach.effects, "teach_explain").at(-1)!.text).toMatch(/^Ahora, la aprobación/);
    });

    it("stops a $30k approval from a new supplier before it goes through", () => {
      const out = reduce(teach.state, {
        kind: "workspace_intent",
        event: { type: "approval_routed", requestId: "req-chairs", vendorId: "sitwell", amount: 30000, to: "self" },
      });
      expect(of(out.effects, "warn_guardrail")[0].text).toMatch(/^Espera\. Los proveedores nuevos de más de 25\.000 dólares/);
      // …and an expert session never warns.
      expect(reduce(initialState(), { kind: "workspace_intent", event: { type: "approval_routed", requestId: "req-chairs", vendorId: "sitwell", amount: 30000, to: "self" } }).effects).toEqual([]);
    });
  });
});
