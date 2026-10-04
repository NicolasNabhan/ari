import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { run, startAsMaria } from "@/lib/apprentice/harness";
import { ruleJudge } from "@/lib/apprentice/ruleJudge";
import type { CoreInput, CoreState } from "@/lib/apprentice/types";
import { chapterAt, createDirector, episodeCoreInputs, LEARN_HREF, MARIA_CHAPTERS, MARIA_EPISODE, type Beat } from "./episode";

const say = (text: string): Beat => ({ kind: "say", who: "maria", text });

describe("the director", () => {
  it("runs beats in order, one per beat-done", () => {
    const d = createDirector([say("a"), say("b"), say("c")]);
    expect(d.view()).toMatchObject({ beat: say("a"), step: 1, total: 3, done: false });
    expect(d.next({ kind: "beat-done" }).beat).toEqual(say("b"));
    expect(d.next({ kind: "beat-done" })).toMatchObject({ beat: say("c"), step: 3 });
    expect(d.next({ kind: "beat-done" })).toMatchObject({ beat: null, done: true, step: 3 });
  });

  it("bumps seq on every new beat and ignores a stale beat-done", () => {
    const d = createDirector([say("a"), say("b")]);
    const first = d.view().seq;
    const second = d.next({ kind: "beat-done", seq: first });
    expect(second.seq).toBe(first + 1);
    expect(d.next({ kind: "beat-done", seq: first }).beat).toEqual(say("b")); // late report for "a"
  });

  it("blocks an await-question until the Core asks, then has Ari say it", () => {
    const d = createDirector([{ kind: "await-question" }, say("answer")]);
    expect(d.next({ kind: "beat-done" }).beat).toEqual({ kind: "await-question" });
    expect(d.next({ kind: "core-asked", text: "Why?" }).beat).toEqual({ kind: "say", who: "ari", text: "Why?", question: true });
    expect(d.next({ kind: "beat-done" }).beat).toEqual(say("answer"));
  });

  it("keeps an ask that arrives early for the next await-question", () => {
    const d = createDirector([say("press"), { kind: "await-question" }]);
    expect(d.next({ kind: "core-asked", text: "Why?" }).beat).toEqual(say("press")); // still pressing
    expect(d.next({ kind: "beat-done" }).beat).toEqual({ kind: "say", who: "ari", text: "Why?", question: true });
  });

  it("pauses between beats and resumes where it was", () => {
    const d = createDirector([say("a"), say("b")]);
    expect(d.next({ kind: "pause" })).toMatchObject({ beat: say("a"), paused: true }); // in flight, let it finish
    expect(d.next({ kind: "beat-done" })).toMatchObject({ beat: null, paused: true, step: 2 });
    expect(d.next({ kind: "resume" })).toMatchObject({ beat: say("b"), paused: false });
  });

  it("can start paused", () => {
    const d = createDirector([say("a")], { paused: true });
    expect(d.view()).toMatchObject({ beat: null, paused: true });
    expect(d.next({ kind: "resume" }).beat).toEqual(say("a"));
  });

  it("holds an ask while paused", () => {
    const d = createDirector([{ kind: "await-question" }]);
    d.next({ kind: "pause" });
    expect(d.next({ kind: "core-asked", text: "Why?" }).beat).toEqual({ kind: "await-question" });
    expect(d.next({ kind: "resume" }).beat).toMatchObject({ kind: "say", text: "Why?" });
  });

  it("skip jumps to the end", () => {
    const d = createDirector(MARIA_EPISODE);
    expect(d.next({ kind: "skip" })).toMatchObject({ beat: null, done: true, step: MARIA_EPISODE.length });
    expect(d.next({ kind: "beat-done" }).done).toBe(true);
  });
});

describe("the Maria episode", () => {
  const awaited = MARIA_EPISODE.filter((b) => b.kind === "await-question").map((b) => b.expect);
  const answers = MARIA_EPISODE.filter((b) => b.kind === "answer");

  it("has a question for every answer", () => {
    expect(awaited).toHaveLength(answers.length);
    expect(awaited.every(Boolean)).toBe(true);
  });

  it("asks exactly the scripted questions when replayed through the Core", () => {
    const out = run([startAsMaria, ...episodeCoreInputs(MARIA_EPISODE)], ruleJudge);
    const asks = out.effects.filter((e) => e.kind === "ask").map((e) => e.text);
    expect(asks).toEqual(awaited);
    for (const step of ["vendor", "scoring", "approval"]) expect(out.cards.find((c) => c.stepId === step)?.reason?.source).toBe("expert");
  });

  it("plays through end to end with the Core driving the questions", () => {
    let core: CoreState = run([startAsMaria], ruleJudge).state;
    const feed = (input: CoreInput) => {
      const out = run([input], ruleJudge, core);
      core = out.state;
      return out.effects.flatMap((e) => (e.kind === "ask" ? [e.text] : []));
    };
    const d = createDirector(MARIA_EPISODE);
    d.next({ kind: "core-asked", text: "Hi Maria, what are you working on today?" }); // asked at session start
    const spoken: string[] = [];
    const popups: string[] = [];
    let view = d.view();
    for (let guard = 0; !view.done && guard < 500; guard++) {
      const beat = view.beat!;
      let asked: string[] = [];
      if ((beat.kind === "press" || beat.kind === "type") && beat.emits) asked = feed({ kind: "workspace_event", event: beat.emits, at: 0 });
      if (beat.kind === "answer") asked = feed({ kind: "utterance", speaker: "expert", text: beat.text, lang: "en-US", at: 0 });
      if (beat.kind === "say" && beat.question) spoken.push(beat.text);
      if (beat.kind === "popup") {
        const card = core.cards[`req-laptops:${beat.step}`];
        expect(card?.reason?.text, beat.step).toBeTruthy();
        popups.push(beat.step);
      }
      for (const text of asked) d.next({ kind: "core-asked", text });
      view = d.next({ kind: "beat-done", seq: view.seq });
    }
    expect(view.done).toBe(true);
    expect(spoken).toEqual(awaited);
    expect(popups).toEqual(["vendor", "scoring", "approval"]);
  });

  it("opens with Ari trotting in to sit beside Maria before she introduces it", () => {
    const trot = MARIA_EPISODE.findIndex((b) => b.kind === "petTrotIn");
    const intro = MARIA_EPISODE.findIndex((b) => b.kind === "say" && b.who === "maria" && b.text.includes("one of my last days"));
    expect(trot).toBeGreaterThanOrEqual(0);
    expect(trot).toBeLessThan(intro);
  });

  it("ends on a button that goes on to learning", () => {
    expect(MARIA_EPISODE.at(-1)).toEqual({ kind: "cta", label: "Start learning with Ari", href: "/learn?from=story" });
    expect(LEARN_HREF).toBe("/learn?from=story");
  });

  it("presses the CFO route with the telescoping pointer", () => {
    expect(MARIA_EPISODE).toContainEqual(expect.objectContaining({ kind: "press", target: "route-cfo", high: true }));
  });

  it("only targets data-ari elements that exist in the workspace", () => {
    const dir = join(process.cwd(), "src/components/workspace");
    const source = readdirSync(dir).map((f) => readFileSync(join(dir, f), "utf8")).join("\n");
    const literal = new Set([...source.matchAll(/data-ari="([^"]+)"/g)].map((m) => m[1]));
    const prefixes = [...source.matchAll(/data-ari=\{`([^$`]+)\$\{/g)].map((m) => m[1]);
    const targets = MARIA_EPISODE.flatMap((b) => ("target" in b && typeof b.target === "string" ? [b.target] : []));
    for (const t of targets) expect(literal.has(t) || prefixes.some((p) => t.startsWith(p)), t).toBe(true);
  });

  it("splits into chapters for the progress indicator", () => {
    expect(MARIA_CHAPTERS[0]).toEqual({ title: "Meet Maria", start: 0 });
    expect(chapterAt(MARIA_CHAPTERS, 0).number).toBe(1);
    expect(chapterAt(MARIA_CHAPTERS, MARIA_EPISODE.length - 1).chapter.title).toBe("Goodbye");
    const vendor = MARIA_EPISODE.findIndex((b) => b.kind === "press" && b.target === "select-brightline");
    expect(chapterAt(MARIA_CHAPTERS, vendor).chapter.title).toBe("Pick the vendor");
  });
});
