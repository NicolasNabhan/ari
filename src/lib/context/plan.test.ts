import { describe, expect, it } from "vitest";
import { MARIA_SESSION } from "@/lib/apprentice/mariaSession";
import { MARIA_OBSERVATIONS, MARIA_SCHEDULE, MARIA_SOURCES, MARIA_TASK_STEPS } from "./mariaWeek";
import { detectPatterns } from "./patterns";
import { buildPlan, weekdayOf } from "./plan";

const patterns = detectPatterns({ schedule: MARIA_SCHEDULE, observations: MARIA_OBSERVATIONS, sources: MARIA_SOURCES });
const plan = (today: "Mon" | "Tue" = "Tue") => buildPlan({ schedule: MARIA_SCHEDULE, patterns, lessons: MARIA_SESSION, taskSteps: MARIA_TASK_STEPS, today });

describe("buildPlan: week", () => {
  it("turns Maria's meetings into meetings you'll attend and keeps the breaks", () => {
    const { week } = plan();
    const finance = week.find((w) => w.id === "plan-mon-finance")!;
    expect(finance.role).toBe("attend");
    expect(finance.note).toBe("You'll attend with Dana (Finance)");
    const wedBreak = week.find((w) => w.id === "plan-wed-break")!;
    expect(wedBreak.role).toBe("break");
    expect(wedBreak.minutes).toBe(10);
    expect(week).toHaveLength(MARIA_SCHEDULE.length);
  });

  it("places the discount advice on Tuesday 09:30", () => {
    const supplies = plan().week.find((w) => w.id === "plan-tue-supplies")!;
    expect(supplies.day).toBe("Tue");
    expect(supplies.start).toBe("09:30");
    expect(supplies.title).toBe("Order office supplies");
    expect(supplies.advice).toBe("OfficeHub is 50% off today, only 30% by Thursday");
    expect(supplies.level).toBe("advice");
  });

  it("is sorted by day and time", () => {
    const { week } = plan();
    expect(week[0].id).toBe("plan-mon-standup");
    expect(week.at(-1)!.id).toBe("plan-fri-wrap");
  });

  it("adds a block for a trend nothing on the calendar acts on", () => {
    const p = detectPatterns({ schedule: MARIA_SCHEDULE.filter((s) => s.id !== "tue-supplies"), observations: MARIA_OBSERVATIONS });
    const week = buildPlan({ schedule: MARIA_SCHEDULE.filter((s) => s.id !== "tue-supplies"), patterns: p }).week;
    const added = week.find((w) => w.patternId?.startsWith("trend:"))!;
    expect(added.day).toBe("Tue");
    expect(added.start).toBe("09:15");
  });
});

describe("buildPlan: today", () => {
  it("plans the chosen day and reads it aloud", () => {
    const { today } = plan("Tue");
    expect(today.day).toBe("Tue");
    expect(today.items.map((i) => i.id)).toEqual(["plan-tue-standup", "plan-tue-supplies", "plan-tue-focus", "plan-tue-lunch", "plan-tue-email"]);
    expect(today.spoken).toMatch(/^Here's your Tuesday\./);
    expect(today.spoken).toMatch(/09:30, Order office supplies\. OfficeHub is 50% off today/);
  });
});

describe("buildPlan: tasks", () => {
  it("uses the learned lessons for the purchase steps", () => {
    const { tasks } = plan();
    const whole = tasks[0];
    expect(whole.id).toBe("task:purchase-request");
    expect(whole.steps).toHaveLength(5);
    const approvals = tasks.find((t) => t.title === "Route approvals")!;
    expect(approvals.from).toBe("lessons");
    const rule = approvals.steps.at(-1)!;
    expect(rule.level).toBe("must");
    expect(rule.unwritten).toBe(true);
    expect(approvals.steps[0].text).toBe("Open Approvals for each request with a vendor picked");
    expect(tasks.find((t) => /wrap-up/.test(t.title))!.from).toBe("schedule"); // "POs" in the title isn't the PO step
    const compare = tasks.find((t) => t.title === "Compare quotes and score vendors")!;
    expect(compare.steps.map((s) => s.text.split(":")[0])).toEqual(["Pick a vendor", "Score the vendors"]);
  });

  it("uses short steps from the schedule for the other tasks, with the pattern tip", () => {
    const supplies = plan().tasks.find((t) => t.title === "Order office supplies")!;
    expect(supplies.from).toBe("schedule");
    expect(supplies.steps[0].text).toBe("Open the OfficeHub order form");
    expect(supplies.tip).toMatch(/Tuesday/);
    const wrap = plan().tasks.find((t) => /spend report/.test(t.title))!;
    expect(wrap.tip).toMatch(/Friday/);
  });

  it("works without lessons or extra steps", () => {
    const bare = buildPlan({ schedule: MARIA_SCHEDULE, patterns });
    expect(bare.tasks.every((t) => t.from === "schedule")).toBe(true);
    expect(bare.tasks.find((t) => t.title === "Route approvals")!.steps.length).toBeGreaterThan(1);
  });
});

it("weekdayOf maps weekends to Monday", () => {
  expect(weekdayOf(new Date(2026, 9, 6))).toBe("Tue");
  expect(weekdayOf(new Date(2026, 9, 4))).toBe("Mon");
});
