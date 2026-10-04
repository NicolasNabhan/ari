// Maria's walkthrough, replayed through the Apprentice Core with the rule
// Judge: what Ari learns at each part, and the four buttons.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { levelOf } from "@/lib/apprentice/reasonTypes";
import { isUnwritten } from "@/lib/apprentice/teach";
import { SCRIPT } from "./script";
import { flatten, navigate, replayTo } from "./replay";

const beats = flatten(SCRIPT);
const last = beats.length - 1;
const startOf = (id: string) => beats.findIndex((b) => SCRIPT[b.part].id === id);
const endOf = (id: string) => beats.findLastIndex((b) => SCRIPT[b.part].id === id);
const card = (pos: number, step: string) => replayTo(SCRIPT, pos).cards.find((c) => c.stepId === step);

describe("the walkthrough script", () => {
  it("opens with Ari asking what Maria is working on, then the eye-tracking exchange", () => {
    expect(replayTo(SCRIPT, 0).bubble).toEqual({ speaker: "ari", text: "Hi Maria, what are you working on today?" });
    expect(replayTo(SCRIPT, 1).bubble).toEqual({ speaker: "maria", text: "40 laptops for Marketing, due Friday." });
    expect(replayTo(SCRIPT, 1).core.task?.requestId).toBe("req-laptops");
    expect(replayTo(SCRIPT, 2).bubble?.text).toMatch(/eye tracking/);
    expect(replayTo(SCRIPT, 3).bubble?.speaker).toBe("maria");
  });

  it("choosing a vendor: Ari stays quiet at 3 quotes, then asks a sharper question because Maria read Apex's history", () => {
    const end = endOf("vendor");
    expect(card(end, "quotes")?.reason?.source).toBe("ari");
    const ask = beats.findIndex((b, i) => i > startOf("vendor") && b.beat.kind === "ari-asks");
    const asked = replayTo(SCRIPT, ask).bubble;
    expect(asked?.speaker).toBe("ari");
    expect(asked?.text).toMatch(/Apex/);
    const vendor = card(end, "vendor")!;
    expect(vendor.attention?.some((r) => r.target === "history-panel-apex")).toBe(true);
    expect(vendor.reason?.source).toBe("expert");
    expect(levelOf(vendor.reason!.types)).toBe("advice");
  });

  it("scoring: Ari asks where the number comes from and learns Finance's unwritten formula", () => {
    const ask = beats.findIndex((b, i) => i > startOf("scoring") && b.beat.kind === "ari-asks");
    expect(replayTo(SCRIPT, ask).bubble?.text).toBe("Where does that number come from?");
    expect(card(endOf("scoring"), "scoring")?.knowledge?.[0].source).toBe("Told by a person");
  });

  it("approval: Ari learns the unwritten CFO rule as must-follow", () => {
    const approval = card(endOf("approval"), "approval")!;
    expect(levelOf(approval.reason!.types)).toBe("must");
    expect(isUnwritten(approval)).toBe(true);
  });

  it("review: Ari offers to check its least-certain guess, reads it, and the session ends", () => {
    const view = replayTo(SCRIPT, last);
    const asks = beats.filter((b, i) => i > startOf("review") && b.beat.kind === "ari-asks").map((b) => replayTo(SCRIPT, b.index).bubble?.text);
    expect(asks[0]).toBe("Want me to go through the decisions I'm least sure about?");
    expect(asks[1]).toBeTruthy();
    expect(view.core.ended).toBe(true);
    expect(view.beat.kind).toBe("handover");
  });

  it("Maria's clicks change the workspace like real clicks", () => {
    const ws = replayTo(SCRIPT, last).workspace;
    expect(ws.quoted["req-laptops"]).toEqual(["apex", "brightline", "coreparts"]);
    expect(ws.selected["req-laptops"]).toBe("brightline");
    expect(ws.scores["req-laptops"]).toEqual({ brightline: 82 });
    expect(ws.routes["req-laptops"]).toBe("cfo");
    expect(ws.issued["req-laptops"]).toBe(true);
  });

  it("every click and read target exists in the workspace", () => {
    const dir = join(__dirname, "../../components/workspace");
    const source = readdirSync(dir)
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => readFileSync(join(dir, f), "utf8"))
      .join("\n");
    const patterns = [...source.matchAll(/data-ari=(?:"([^"]+)"|\{`([^`]+)`\})/g)].map(([, plain, tpl]) =>
      plain ? new RegExp(`^${plain}$`) : new RegExp(`^${tpl.replace(/\$\{[^}]+\}/g, ".+")}$`),
    );
    const targets = beats.flatMap(({ beat }) =>
      beat.kind === "act" ? [...beat.clicks.map((c) => c.target), ...(beat.reads ?? []).map((r) => r.target)] : beat.kind === "end" ? [beat.target] : [],
    );
    for (const t of targets) expect(patterns.some((p) => p.test(t)), t).toBe(true);
  });
});

describe("the four buttons", () => {
  it("Next and Back move one beat, and stop at the ends", () => {
    expect(navigate(SCRIPT, 0, "next")).toBe(1);
    expect(navigate(SCRIPT, 5, "back")).toBe(4);
    expect(navigate(SCRIPT, 0, "back")).toBe(0);
    expect(navigate(SCRIPT, last, "next")).toBe(last);
  });

  it("Next step jumps to the start of the next part; at the last part, to the end", () => {
    expect(navigate(SCRIPT, 0, "nextStep")).toBe(startOf("vendor"));
    expect(navigate(SCRIPT, startOf("vendor") + 2, "nextStep")).toBe(startOf("scoring"));
    expect(navigate(SCRIPT, startOf("review"), "nextStep")).toBe(last);
  });

  it("Back a step goes to the start of this part, or of the previous part when already there", () => {
    expect(navigate(SCRIPT, startOf("scoring") + 2, "backStep")).toBe(startOf("scoring"));
    expect(navigate(SCRIPT, startOf("scoring"), "backStep")).toBe(startOf("vendor"));
    expect(navigate(SCRIPT, 0, "backStep")).toBe(0);
  });

  it("going back then forward gives exactly the same state", () => {
    const pos = endOf("scoring");
    const direct = replayTo(SCRIPT, pos);
    const again = replayTo(SCRIPT, navigate(SCRIPT, navigate(SCRIPT, pos, "back"), "next"));
    expect(again.cards).toEqual(direct.cards);
    expect(again.workspace).toEqual(direct.workspace);
    expect(again.bubble).toEqual(direct.bubble);
  });
});
