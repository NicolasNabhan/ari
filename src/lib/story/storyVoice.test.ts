import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setSoundsMuted } from "@/lib/ari/sounds";
import { getVoiceProgress, say, stopSaying, subscribeVoice, wordsSaidOf, type VoiceEvent } from "./storyVoice";

// Muted, say() runs on the estimated timeline with no audio, which lets the
// event ordering be checked deterministically with fake timers.
describe("say (silent timeline)", () => {
  let events: VoiceEvent[];
  let unsubscribe: () => void;
  beforeEach(() => {
    vi.useFakeTimers();
    setSoundsMuted(true);
    events = [];
    unsubscribe = subscribeVoice((e) => events.push(e));
  });
  afterEach(() => {
    unsubscribe();
    setSoundsMuted(false);
    vi.useRealTimers();
  });

  it("emits start, then each word once in order, then end", async () => {
    const onWord = vi.fn();
    const onStart = vi.fn();
    const onEnd = vi.fn();
    const done = say("maria", "Check the last three invoices.", { onWord, onStart, onEnd });
    expect(onStart).toHaveBeenCalledOnce();
    expect(onStart.mock.calls[0][0]).toMatchObject({ speaker: "maria", source: "estimate", words: ["Check", "the", "last", "three", "invoices."] });

    await vi.advanceTimersByTimeAsync(10_000);
    expect(await done).toEqual({ speaker: "maria", text: "Check the last three invoices.", cancelled: false });

    expect(events.map((e) => e.type)).toEqual(["start", "word", "word", "word", "word", "word", "end"]);
    expect(onWord.mock.calls.map((c) => c[0].wordIndex)).toEqual([0, 1, 2, 3, 4]);
    expect(onEnd).toHaveBeenCalledWith({ speaker: "maria", text: "Check the last three invoices.", cancelled: false });
  });

  it("reveals words over time, not all at once", async () => {
    void say("ari", "Why three invoices and not two?");
    expect(getVoiceProgress().spoken).toBe(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(getVoiceProgress().spoken).toBe(1);
    await vi.advanceTimersByTimeAsync(700);
    const mid = getVoiceProgress().spoken;
    expect(mid).toBeGreaterThan(1);
    expect(mid).toBeLessThan(6);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(getVoiceProgress()).toMatchObject({ spoken: 6, saying: false });
    expect(wordsSaidOf(getVoiceProgress(), "ari", "Why three invoices and not two?")).toBe(6);
  });

  it("a new line cuts off the previous one, which stops emitting words", async () => {
    const first = say("maria", "one two three four five six seven eight");
    await vi.advanceTimersByTimeAsync(400);
    const second = say("ari", "hi there");
    expect(await first).toMatchObject({ cancelled: true });
    const firstWordsBefore = events.filter((e) => e.type === "word" && e.speaker === "maria").length;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await second).toMatchObject({ cancelled: false });
    expect(events.filter((e) => e.type === "word" && e.speaker === "maria").length).toBe(firstWordsBefore);
    expect(firstWordsBefore).toBeLessThan(8);

    const order = events.map((e) => `${e.type}:${e.type === "word" ? e.event.wordIndex : e.speaker}`);
    // The first line's end comes before the second line starts.
    expect(order.indexOf("end:maria")).toBeLessThan(order.indexOf("start:ari"));
  });

  it("stopSaying ends the line as cancelled", async () => {
    const line = say("maria", "a b c d e f g h");
    await vi.advanceTimersByTimeAsync(200);
    stopSaying();
    expect(await line).toMatchObject({ cancelled: true });
    expect(events[events.length - 1]).toMatchObject({ type: "end", cancelled: true });
  });

  it("knows which lines have not been said yet", () => {
    expect(wordsSaidOf(getVoiceProgress(), "maria", "never said")).toBeNull();
  });
});
