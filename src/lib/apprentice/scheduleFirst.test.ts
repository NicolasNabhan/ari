// Step 2 opens with the schedule: Ari points the new employee to the week
// first, briefs them on it, then moves on to their first purchase.
import { describe, expect, it } from "vitest";
import { ev, run } from "./harness";
import { MARIA_SESSION } from "./mariaSession";
import { ruleJudge } from "./ruleJudge";
import type { CoreEffect, CoreInput } from "./types";

const sam: CoreInput = { kind: "session_start", profile: { name: "Sam", role: "Procurement Manager", company: "Northwind Supply" }, mode: "newcomer", lessons: MARIA_SESSION };
const explained = (effects: CoreEffect[]) => effects.filter((e) => e.kind === "teach_explain") as Extract<CoreEffect, { kind: "teach_explain" }>[];

describe("step 2 starts from the schedule", () => {
  it("Ari's first words point to the schedule, and the Week menu item glows", () => {
    const [first] = explained(run([sam], ruleJudge).effects);
    expect(first.text).toMatch(/^Hi Sam/);
    expect(first.text).toMatch(/schedule/);
    expect(first.highlight).toBe("nav-week");
  });

  it("opening the Week screen gets a briefing with the weekly pattern, then on to the first purchase", () => {
    const out = run([sam, ev({ type: "screen_opened", screen: "week" })], ruleJudge);
    const brief = explained(out.effects)[1];
    expect(brief.text).toMatch(/OfficeHub/);
    expect(brief.text).toMatch(/Tuesday/);
    expect(brief.text).toMatch(/first purchase/);
    expect(brief.highlight).toBe("nav-inbox");
  });

  it("briefs only once, and the purchase lesson continues as before", () => {
    const out = run(
      [sam, ev({ type: "screen_opened", screen: "week" }), ev({ type: "screen_opened", screen: "week" }), ev({ type: "request_opened", requestId: "req-chairs" })],
      ruleJudge,
    );
    const said = explained(out.effects);
    expect(said.filter((e) => /OfficeHub/.test(e.text))).toHaveLength(1);
    expect(said.at(-1)!.stepId).toBe("quotes");
  });
});
