import { describe, expect, it } from "vitest";
import { createEventBus } from "./events";

describe("event bus", () => {
  it("timestamps events and replays history to late subscribers", () => {
    let t = 100;
    const bus = createEventBus(() => t++);
    bus.emit({ type: "screen_opened", screen: "inbox" });
    const seen: string[] = [];
    bus.subscribe((e) => seen.push(e.event.type));
    bus.emit({ type: "request_opened", requestId: "req-laptops" });
    expect(bus.history().map((e) => [e.event.type, e.at])).toEqual([
      ["screen_opened", 100],
      ["request_opened", 101],
    ]);
    expect(seen).toEqual(["request_opened"]);
  });
});
