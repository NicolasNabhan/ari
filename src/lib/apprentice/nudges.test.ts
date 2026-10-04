// Step 2: between the bigger explanations, Ari tells the new employee exactly
// what to click next, and the button glows.
import { describe, expect, it } from "vitest";
import { ev, run } from "./harness";
import { MARIA_SESSION } from "./mariaSession";
import { ruleJudge } from "./ruleJudge";
import type { CoreEffect, CoreInput } from "./types";

const sam: CoreInput = { kind: "session_start", profile: { name: "Sam", role: "Procurement Manager", company: "Northwind Supply" }, mode: "newcomer", lessons: MARIA_SESSION };
const said = (inputs: CoreInput[]) => (run([sam, ...inputs], ruleJudge).effects.filter((e) => e.kind === "teach_explain") as Extract<CoreEffect, { kind: "teach_explain" }>[]);
const last = (inputs: CoreInput[]) => said(inputs).at(-1)!;

const week = ev({ type: "screen_opened", screen: "week" });
const inbox = ev({ type: "screen_opened", screen: "inbox" });
const open = ev({ type: "request_opened", requestId: "req-chairs" });
const vendors = ev({ type: "screen_opened", screen: "vendors" });
const quotes = ev({ type: "quotes_requested", requestId: "req-chairs", vendorIds: ["apex", "coreparts", "sitwell"] });
const history = ev({ type: "delivery_history_opened", vendorId: "apex" });
const select = ev({ type: "vendor_selected", requestId: "req-chairs", vendorId: "sitwell", previousVendorId: null });
const approvals = ev({ type: "screen_opened", screen: "approvals" });
const route = ev({ type: "approval_routed", requestId: "req-chairs", vendorId: "sitwell", amount: 30000, to: "cfo" });
const po = ev({ type: "po_issued", requestId: "req-chairs", vendorId: "sitwell", amount: 30000 });

describe("Ari shows the new employee what to click", () => {
  it("in the inbox: open the chairs request", () => {
    expect(last([week, inbox])).toMatchObject({ highlight: "inbox-req-chairs" });
    expect(last([week, inbox]).text).toMatch(/chairs/);
  });

  it("on the vendors screen: tick the vendors, then request quotes", () => {
    const tip = last([week, inbox, open, vendors]);
    expect(tip.text).toMatch(/Request quotes/);
    expect(tip.highlight).toMatch(/^tick-/);
  });

  it("after checking a delivery history: select a vendor", () => {
    expect(last([week, inbox, open, vendors, quotes, history]).text).toMatch(/Select vendor/);
  });

  it("on the approvals screen: points to the way Maria routes it", () => {
    expect(last([week, inbox, open, vendors, quotes, history, select, approvals])).toMatchObject({ highlight: "route-cfo" });
  });

  it("after the purchase order: the first purchase is done", () => {
    expect(last([week, inbox, open, vendors, quotes, history, select, approvals, route, po]).text).toMatch(/first purchase/);
  });

  it("each tip is given once", () => {
    const tips = said([week, inbox, vendors, inbox, open, vendors, vendors]).filter((e) => e.highlight === "inbox-req-chairs" || /Request quotes/.test(e.text));
    expect(tips).toHaveLength(2);
  });
});
