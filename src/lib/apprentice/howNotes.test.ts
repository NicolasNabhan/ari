import { describe, expect, it } from "vitest";
import { ev, run, startAsMaria } from "./harness";
import { ruleJudge } from "./ruleJudge";

const t = (s: number) => 100_000 + s * 1000;
const open = ev({ type: "request_opened", requestId: "req-laptops" }, t(0));
const quotes = ev({ type: "quotes_requested", requestId: "req-laptops", vendorIds: ["apex", "brightline", "coreparts"] }, t(10));

describe("how notes", () => {
  it("notes a long pause before a decision", () => {
    const { cards } = run(
      [startAsMaria, open, quotes, ev({ type: "vendor_selected", requestId: "req-laptops", vendorId: "brightline", previousVendorId: null }, t(24))],
      ruleJudge,
    );
    expect(cards.find((c) => c.stepId === "vendor")!.howNotes).toContain("Paused 14s before choosing");
  });

  it("notes what she checked before deciding", () => {
    const { cards } = run(
      [
        startAsMaria,
        open,
        quotes,
        ev({ type: "delivery_history_opened", vendorId: "apex" }, t(12)),
        ev({ type: "screen_opened", screen: "procedure" }, t(14)),
        ev({ type: "vendor_selected", requestId: "req-laptops", vendorId: "brightline", previousVendorId: null }, t(16)),
      ],
      ruleJudge,
    );
    const notes = cards.find((c) => c.stepId === "vendor")!.howNotes;
    expect(notes).toContain("Opened Apex Tech's delivery history before deciding");
    expect(notes).toContain("Checked the written procedure before deciding");
  });

  it("notes who she contacted after a decision, and about what", () => {
    const { cards } = run(
      [
        startAsMaria,
        open,
        quotes,
        ev({ type: "vendor_selected", requestId: "req-laptops", vendorId: "brightline", previousVendorId: null }, t(12)),
        ev({ type: "approval_routed", requestId: "req-laptops", vendorId: "brightline", amount: 38400, to: "cfo" }, t(20)),
        ev({ type: "message_sent", channel: "email", to: "david", text: "Please approve the Brightline laptop order" }, t(25)),
      ],
      ruleJudge,
    );
    expect(cards.find((c) => c.stepId === "approval")!.howNotes).toContain(
      'Emailed David Okafor (CFO): "Please approve the Brightline laptop order"',
    );
  });

  it("notes steps done in a different order from the procedure", () => {
    const { cards } = run(
      [startAsMaria, open, ev({ type: "vendor_selected", requestId: "req-laptops", vendorId: "brightline", previousVendorId: null }, t(5))],
      ruleJudge,
    );
    expect(cards[0].howNotes).toContain('Did this before "Get quotes" (the procedure has that first)');
  });

  it("notes a change of mind", () => {
    const { cards } = run(
      [
        startAsMaria,
        open,
        quotes,
        ev({ type: "vendor_selected", requestId: "req-laptops", vendorId: "apex", previousVendorId: null }, t(12)),
        ev({ type: "vendor_selected", requestId: "req-laptops", vendorId: "brightline", previousVendorId: "apex" }, t(13)),
      ],
      ruleJudge,
    );
    expect(cards.find((c) => c.stepId === "vendor")!.howNotes).toContain("Selected Apex Tech, then switched to Brightline Systems");
  });

  it("stays quiet about short pauses and quiet steps", () => {
    const { cards } = run([startAsMaria, open, ev({ type: "quotes_requested", requestId: "req-laptops", vendorIds: ["apex", "brightline", "coreparts"] }, t(3))], ruleJudge);
    expect(cards[0].howNotes).toEqual([]);
  });
});
