import { describe, expect, it } from "vitest";
import { SCRIPT } from "./script";
import { flatten, replayTo } from "./replay";
import { learnedFrom } from "./summary";

const end = replayTo(SCRIPT, flatten(SCRIPT).length - 1);

describe("what Ari learned from Maria", () => {
  const learned = learnedFrom(end.cards);

  it("lists every decision with the option Maria chose", () => {
    expect(learned.map((l) => l.title)).toEqual(end.cards.map((c) => c.title));
    expect(learned.find((l) => l.id.endsWith(":vendor"))?.chosen).toMatch(/Brightline/);
  });

  it("marks the CFO rule as an unwritten must-follow rule in Maria's own words", () => {
    const approval = learned.find((l) => l.id.endsWith(":approval"))!;
    expect(approval).toMatchObject({ level: "must", unwritten: true, fromMaria: true });
  });

  it("Ari tells Maria it also learned from her calendar, files and meetings before she leaves", () => {
    const review = SCRIPT.find((p) => p.id === "review")!;
    const said = review.beats.flatMap((b) => (b.kind === "say" && b.speaker === "ari" ? [b.text] : [])).join(" ");
    expect(said).toMatch(/calendar.*files.*meetings/);
  });
});
