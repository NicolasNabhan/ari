import { afterEach, describe, expect, it } from "vitest";
import { explainStep } from "@/lib/apprentice/teach";
import { MARIA_SESSION } from "@/lib/apprentice/mariaSession";
import { extractKnowledge } from "./knowledge";
import { addSource, getKnowledge, removeSource, resetKnowledge, sampleSourcesFor, setItems, taughtFor, teach } from "./knowledgeStore";

const cfoMeeting = sampleSourcesFor("zoom").find((s) => s.id === "mtg-cfo-checkin")!;

afterEach(() => resetKnowledge());

describe("knowledge store", () => {
  it("links knowledge taught to Ari to the decision step it explains, with its source", () => {
    addSource(cfoMeeting);
    const items = extractKnowledge(cfoMeeting);
    setItems(cfoMeeting.id, items, "rules");
    expect(taughtFor(getKnowledge(), "approval")).toEqual([]); // not taught yet
    teach([items[0].id]);
    const [linked] = taughtFor(getKnowledge(), "approval");
    expect(linked.item.text).toMatch(/New suppliers over \$25,000 go to the CFO first/);
    expect(linked.source).toMatchObject({ title: "CFO approvals check-in", origin: "connected" });
  });

  it("lets teach mode cite the meeting where a taught rule was said", () => {
    addSource(cfoMeeting);
    const items = extractKnowledge(cfoMeeting);
    setItems(cfoMeeting.id, items, "rules");
    expect(explainStep("approval", MARIA_SESSION, []).text).not.toMatch(/David said this/);
    teach(items.map((k) => k.id));
    expect(explainStep("approval", MARIA_SESSION, []).text).toMatch(/David said this in the CFO approvals check-in: New suppliers over \$25,000 go to the CFO first/);
  });

  it("forgets taught knowledge when its source is removed", () => {
    addSource(cfoMeeting);
    const items = extractKnowledge(cfoMeeting);
    setItems(cfoMeeting.id, items, "rules");
    teach(items.map((k) => k.id));
    removeSource(cfoMeeting.id);
    expect(getKnowledge()).toMatchObject({ sources: [], accepted: [] });
    expect(explainStep("approval", MARIA_SESSION, []).text).not.toMatch(/David said this/);
  });

  it("brings the sample meetings with a demo connection, and the files separately", () => {
    expect(sampleSourcesFor("calendar").map((s) => s.kind)).toEqual(["meeting", "meeting", "meeting"]);
    expect(sampleSourcesFor("files").map((s) => s.id)).toEqual(["file-officehub", "file-procedure"]);
  });
});
