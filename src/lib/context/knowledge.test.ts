import { describe, expect, it } from "vitest";
import { MARIA_SOURCES } from "./mariaWeek";
import { citationsFrom, citeSource, extractKnowledge, groundQuotes, highlightRuns, speakerOf, stepFor, workdayOf } from "./knowledge";
import { transcriptFromWords } from "./transcript";

const source = (id: string) => MARIA_SOURCES.find((s) => s.id === id)!;
const all = MARIA_SOURCES.flatMap(extractKnowledge);

describe("rule-based knowledge extraction (offline fallback)", () => {
  it("finds Finance's 40/60 scoring formula, said by Dana in the Finance sync", () => {
    const items = extractKnowledge(source("mtg-finance-sync"));
    const formula = items.find((k) => /40%.*price.*60%.*delivery/.test(k.text));
    expect(formula).toMatchObject({ step: "scoring", level: "must", source: "Told by a person", sourceId: "mtg-finance-sync" });
    expect(source("mtg-finance-sync").text).toContain(formula!.quote!);
    expect(speakerOf(formula!.quote, source("mtg-finance-sync"))).toBe("Dana");
  });

  it("finds the CFO rule for new suppliers over $25k, linked to the approval step", () => {
    const items = extractKnowledge(source("mtg-cfo-checkin"));
    const cfo = items.find((k) => /New suppliers over \$25,000 go to the CFO first/.test(k.text));
    expect(cfo).toMatchObject({ step: "approval", level: "must", source: "Told by a person" });
    expect(speakerOf(cfo!.quote, source("mtg-cfo-checkin"))).toBe("Raj");
  });

  it("finds Apex's late deliveries in the vendor review call", () => {
    const late = extractKnowledge(source("mtg-vendor-review")).find((k) => /late/.test(k.text));
    expect(late?.text).toMatch(/Apex Tech delivered recent orders late \(11 and 6 days late\)/);
    expect(late).toMatchObject({ step: "vendor", level: "advice" });
  });

  it("finds OfficeHub's weekday discounts in the email", () => {
    const [discount] = extractKnowledge(source("file-officehub"));
    expect(discount.text).toMatch(/OfficeHub.*Tuesday 50%, Wednesday 40%, Thursday 30%.*order on Tuesday/);
    expect(discount.source).toBe("Company system");
  });

  it("reads the written rules in the procedure as must-follow, with their steps", () => {
    const items = extractKnowledge(source("file-procedure"));
    expect(items.map((k) => k.step)).toEqual(["quotes", "vendor", "approval"]);
    expect(items.every((k) => k.level === "must" && k.source === "Company document")).toBe(true);
    expect(items[0].text).toMatch(/^For any purchase over \$5,000/);
  });

  it("doesn't invent knowledge from small talk", () => {
    expect(extractKnowledge({ ...source("mtg-cfo-checkin"), text: "Raj: Morning!\nMaria: Hi Raj, how was the weekend?" })).toEqual([]);
  });

  it("gives every item a unique id and an exact quote", () => {
    expect(new Set(all.map((k) => k.id)).size).toBe(all.length);
    for (const k of all) expect(MARIA_SOURCES.find((s) => s.id === k.sourceId)!.text).toContain(k.quote!);
  });
});

describe("citing and highlighting", () => {
  it("cites where a meeting rule was said, for teach mode", () => {
    const cfo = all.filter((k) => k.sourceId === "mtg-cfo-checkin");
    expect(citationsFrom(cfo, MARIA_SOURCES)[0]).toMatchObject({ step: "approval", who: "Raj", where: "CFO approvals check-in" });
    expect(citeSource(source("mtg-cfo-checkin"))).toBe("CFO approvals check-in, Wed 15:00");
    // Files aren't cited as something someone said.
    expect(citationsFrom(all.filter((k) => k.sourceId === "file-procedure"), MARIA_SOURCES)).toEqual([]);
  });

  it("splits a text into runs with the quotes highlighted", () => {
    const runs = highlightRuns("a b c d", [{ id: "x", quote: "b c" }, { id: "y", quote: "c d" }, { id: "z", quote: "nope" }]);
    expect(runs).toEqual([{ text: "a " }, { text: "b c", itemId: "x" }, { text: " d" }]);
  });

  it("repairs a quote's case and drops one that isn't in the text", () => {
    const fixed = groundQuotes(
      [
        { id: "1", sourceId: "s", text: "t", source: "Told by a person", quote: "ANY NEW SUPPLIER" },
        { id: "2", sourceId: "s", text: "t", source: "Told by a person", quote: "made up" },
      ],
      "Raj: Any new supplier comes to me.",
    );
    expect(fixed.map((k) => k.quote)).toEqual(["Any new supplier", undefined]);
  });

  it("guesses the decision step from words", () => {
    expect(stepFor("send it to the CFO for sign-off")).toBe("approval");
    expect(stepFor("weighted score")).toBe("scoring");
    expect(stepFor("lunch on Friday")).toBeUndefined();
  });

  it("maps weekends to Friday of the expert's week", () => {
    expect(workdayOf(new Date(2026, 9, 4))).toBe("Fri"); // a Sunday
    expect(workdayOf(new Date(2026, 9, 6))).toBe("Tue");
  });
});

describe("speech-to-text transcript", () => {
  it("labels each speaker turn from diarized words", () => {
    const w = (text: string, speaker_id: string, type = "word") => ({ text, speaker_id, type });
    const { text, speakers } = transcriptFromWords([
      w("Any", "speaker_0"), w(" ", "speaker_0", "spacing"), w("new", "speaker_0"), w(" ", "speaker_0", "spacing"), w("supplier.", "speaker_0"),
      w(" ", "speaker_1", "spacing"), w("(laughs)", "speaker_1", "audio_event"), w("Understood.", "speaker_1"),
      w(" ", "speaker_0", "spacing"), w("Thanks.", "speaker_0"),
    ]);
    expect(text).toBe("Speaker 1: Any new supplier.\nSpeaker 2: Understood.\nSpeaker 1: Thanks.");
    expect(speakers).toBe(2);
  });

  it("falls back to the plain text when there are no words", () => {
    expect(transcriptFromWords([], "hello there").text).toBe("Speaker 1: hello there");
  });
});
