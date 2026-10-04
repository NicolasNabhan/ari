import { describe, expect, it } from "vitest";
import { MARIA_OBSERVATIONS, MARIA_SCHEDULE, MARIA_SOURCES } from "./mariaWeek";
import { dayRange, detectPatterns } from "./patterns";
import type { ScheduleItem, WeeklyObservation } from "./types";

const maria = () => detectPatterns({ schedule: MARIA_SCHEDULE, observations: MARIA_OBSERVATIONS, sources: MARIA_SOURCES });

describe("detectPatterns: trend", () => {
  it("finds OfficeHub's falling discount and links the Tuesday order", () => {
    const trend = maria().find((p) => p.kind === "trend")!;
    expect(trend.summary).toBe("OfficeHub's discount drops 10 points a day after Tuesday");
    expect(trend.days).toEqual(["Tue", "Wed", "Thu"]);
    expect(trend.evidence).toEqual(expect.arrayContaining(["Tue 50%", "Wed 40%", "Thu 30%"]));
    expect(trend.bestDay).toBe("Tue");
    expect(trend.level).toBe("advice");
    expect(trend.itemIds).toEqual(["tue-supplies"]);
    expect(trend.sourceIds).toContain("file-officehub");
    expect(trend.question).toBe("OfficeHub's discount drops 10 points a day after Tuesday. Is that why you always order office supplies on Tuesday morning?");
    expect(trend.advice).toMatch(/^Order office supplies on Tuesday/);
    expect(trend.confidence).toBeGreaterThan(0.8);
  });

  it("is generic: a rising price, a different subject", () => {
    const obs: WeeklyObservation[] = [
      { day: "Mon", subject: "FreightCo", metric: "price", value: 100, unit: "USD" },
      { day: "Tue", subject: "FreightCo", metric: "price", value: 110, unit: "USD" },
      { day: "Wed", subject: "FreightCo", metric: "price", value: 120, unit: "USD" },
      { day: "Thu", subject: "FreightCo", metric: "price", value: 130, unit: "USD" },
    ];
    const [trend] = detectPatterns({ schedule: [], observations: obs });
    expect(trend.summary).toBe("FreightCo's price rises 10 USD a day after Monday");
    expect(trend.bestDay).toBe("Mon");
    expect(trend.days).toEqual(["Mon", "Tue", "Wed", "Thu"]);
  });

  it("lowers confidence when the task is done on a worse day", () => {
    const late: ScheduleItem[] = [{ id: "x", day: "Thu", start: "09:30", minutes: 30, kind: "task", title: "Order office supplies (OfficeHub)" }];
    const linkedLate = detectPatterns({ schedule: late, observations: MARIA_OBSERVATIONS })[0];
    const onTime = detectPatterns({ schedule: MARIA_SCHEDULE, observations: MARIA_OBSERVATIONS })[0];
    expect(linkedLate.confidence).toBeLessThan(onTime.confidence);
  });

  it("ignores noise: no steady run of three days", () => {
    const obs: WeeklyObservation[] = [
      { day: "Mon", subject: "X", metric: "discount", value: 10 },
      { day: "Tue", subject: "X", metric: "discount", value: 40 },
      { day: "Wed", subject: "X", metric: "discount", value: 15 },
    ];
    expect(detectPatterns({ schedule: [], observations: obs })).toEqual([]);
  });
});

describe("detectPatterns: by-weekday", () => {
  it("sees the 14:00 break is 10 min Wednesday and 15 min Thursday", () => {
    const p = maria().find((x) => x.id === "weekday:break-14-00")!;
    expect(p.kind).toBe("by-weekday");
    expect(p.evidence).toEqual(["Wed 10 min", "Thu 15 min"]);
    expect(p.level).toBe("choice");
    expect(p.question).toMatch(/fixed by something/);
  });

  it("sees lunch is longer on Friday", () => {
    const p = maria().find((x) => x.id === "weekday:break-12-30")!;
    expect(p.summary).toBe("Lunch is 45 minutes, but 60 on Friday");
    expect(p.level).toBe("advice"); // it's the team lunch
  });
});

describe("detectPatterns: recurring-slot", () => {
  it("finds the daily stand-up as a team convention", () => {
    const p = maria().find((x) => x.kind === "recurring-slot" && /stand-up/.test(x.summary))!;
    expect(p.summary).toBe("Ops stand-up every day at 09:00");
    expect(p.days).toHaveLength(5);
    expect(p.level).toBe("must");
  });

  it("finds weekly meetings and the Friday spend report backed by the Finance sync", () => {
    const all = maria();
    expect(all.find((x) => x.summary === "Finance sync every Monday at 09:30")?.level).toBe("must");
    expect(all.find((x) => /CFO approvals check-in/.test(x.summary))?.level).toBe("must");
    const report = all.find((x) => /spend report/i.test(x.summary))!;
    expect(report.sourceIds).toContain("mtg-finance-sync");
    expect(report.evidence.join(" ")).toMatch(/spend report on Fridays/);
  });

  it("doesn't repeat a block already explained by a trend, or list breaks", () => {
    const slots = maria().filter((x) => x.kind === "recurring-slot");
    expect(slots.some((x) => x.itemIds.includes("tue-supplies"))).toBe(false);
    expect(slots.some((x) => /lunch|break/i.test(x.summary))).toBe(false);
  });
});

it("orders trends first", () => {
  expect(maria()[0].kind).toBe("trend");
});

it("dayRange says it simply", () => {
  expect(dayRange(["Mon", "Tue", "Wed", "Thu", "Fri"])).toBe("every day");
  expect(dayRange(["Tue", "Wed", "Thu"])).toBe("Tue to Thu");
  expect(dayRange(["Fri"])).toBe("on Fridays");
});
