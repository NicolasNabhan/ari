import { describe, expect, it } from "vitest";
import { northwind, quoteFor, lateDeliveries } from "./seed";

describe("Northwind seed", () => {
  it("has the laptop request for Maria and the chair request for the newcomer", () => {
    const laptops = northwind.requests.find((r) => r.id === "req-laptops")!;
    expect(laptops.quantity).toBe(40);
    expect(laptops.budget).toBeGreaterThan(36000);
    const chairs = northwind.requests.find((r) => r.id === "req-chairs")!;
    expect(chairs.quantity).toBe(30);
  });

  it("plants Vendor A's two late deliveries", () => {
    expect(lateDeliveries("apex")).toHaveLength(2);
    expect(lateDeliveries("brightline")).toHaveLength(0);
  });

  it("makes Vendor A cheaper than Vendor B on the laptop request", () => {
    expect(quoteFor("apex", "req-laptops")!.total).toBeLessThan(quoteFor("brightline", "req-laptops")!.total);
  });

  it("has never given Brightline an order over $25k, so it counts as new for big orders", () => {
    const orders = northwind.vendors.find((v) => v.id === "brightline")!.deliveryHistory;
    expect(orders.every((o) => o.amount <= 25000)).toBe(true);
  });

  it("writes down the 3-quote and CFO thresholds but not the $25k new-supplier rule", () => {
    const text = northwind.procedure.map((r) => r.text).join(" ");
    expect(text).toMatch(/3 quotes/);
    expect(text).toMatch(/\$50,000/);
    expect(text).not.toMatch(/25,000/);
  });
});
