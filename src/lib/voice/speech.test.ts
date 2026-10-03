import { describe, expect, it } from "vitest";
import { sayCommand, userTranscript } from "./speech";

describe("sayCommand", () => {
  it("wraps a line so the agent speaks it verbatim", () => {
    expect(sayCommand("  Hi Maria, what are you working on today? ")).toBe(
      "[SAY] Hi Maria, what are you working on today?",
    );
  });

  it("refuses an empty line", () => {
    expect(() => sayCommand("   ")).toThrow();
  });
});

describe("userTranscript", () => {
  const msg = (role: "user" | "agent", message: string) => ({ role, message });

  it("returns what the user said", () => {
    expect(userTranscript(msg("user", "40 laptops for Marketing"))).toBe("40 laptops for Marketing");
  });

  it("ignores agent speech", () => {
    expect(userTranscript(msg("agent", "Got it."))).toBeNull();
  });

  it("ignores our own speak commands echoed back as user messages", () => {
    expect(userTranscript(msg("user", "[SAY] Hello"))).toBeNull();
  });

  it("ignores blank transcripts", () => {
    expect(userTranscript(msg("user", "  "))).toBeNull();
  });
});
