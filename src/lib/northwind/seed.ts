// All demo content for Northwind Supply lives here. The planted facts the demo
// depends on: Apex (Vendor A) shipped late twice, Brightline (Vendor B) has
// never had an order over $25k, the written procedure says nothing about new
// suppliers, and the vendor score formula is never written down.

export type Person = { id: string; name: string; role: string };

export type ProcedureRule = {
  id: string; // e.g. "§2"
  title: string;
  text: string;
};

export type DeliveryRecord = {
  order: string;
  amount: number;
  promised: string; // ISO date
  delivered: string;
};

export type Quote = { requestId: string; unitPrice: number; total: number; leadTimeDays: number };

export type Vendor = {
  id: string;
  name: string;
  label: string; // how people refer to it in conversation
  blurb: string;
  quotes: Quote[];
  deliveryHistory: DeliveryRecord[];
};

export type PurchaseRequest = {
  id: string;
  from: string; // person id
  subject: string;
  body: string;
  item: string;
  quantity: number;
  budget: number;
  due: string;
  receivedAt: string;
  audience: "expert" | "newcomer";
};

export const northwind = {
  company: { name: "Northwind Supply" },
  people: [
    { id: "tom", name: "Tom Reyes", role: "Marketing Lead" },
    { id: "priya", name: "Priya Shah", role: "Finance Analyst" },
    { id: "david", name: "David Okafor", role: "CFO" },
    { id: "lena", name: "Lena Brooks", role: "Operations Manager" },
    { id: "grace", name: "Grace Lin", role: "Director of Operations (Maria's manager)" },
  ] satisfies Person[],
  procedure: [
    { id: "§1", title: "Every purchase starts with a request", text: "All purchases start from a purchase request in the request queue. Do not buy anything without one." },
    { id: "§2", title: "Quotes", text: "For any purchase over $5,000, request at least 3 quotes from approved vendors before choosing." },
    { id: "§3", title: "Choosing a vendor", text: "Choose the vendor that gives the best overall value for the request. Record the reason for your choice." },
    { id: "§4", title: "Approval", text: "The Procurement Manager approves purchases up to $50,000. Purchases over $50,000 must be approved by the CFO." },
    { id: "§5", title: "Purchase order", text: "Issue the purchase order only after approval." },
    { id: "§6", title: "Keep the requester informed", text: "Tell the requester when the order is placed and when to expect delivery." },
  ] satisfies ProcedureRule[],
  vendors: [
    {
      id: "apex",
      name: "Apex Tech",
      label: "Vendor A",
      blurb: "Large reseller, usually the lowest price.",
      quotes: [
        { requestId: "req-laptops", unitPrice: 920, total: 36800, leadTimeDays: 5 },
        { requestId: "req-chairs", unitPrice: 1050, total: 31500, leadTimeDays: 10 },
      ],
      deliveryHistory: [
        { order: "PO-2291", amount: 18200, promised: "2025-11-04", delivered: "2025-11-12" },
        { order: "PO-2340", amount: 9400, promised: "2026-01-15", delivered: "2026-01-15" },
        { order: "PO-2417", amount: 27750, promised: "2026-03-02", delivered: "2026-03-09" },
        { order: "PO-2502", amount: 6100, promised: "2026-05-20", delivered: "2026-05-19" },
        { order: "PO-2588", amount: 12900, promised: "2026-07-08", delivered: "2026-07-08" },
      ],
    },
    {
      id: "brightline",
      name: "Brightline Systems",
      label: "Vendor B",
      blurb: "Smaller supplier, a bit pricier, always on time.",
      quotes: [{ requestId: "req-laptops", unitPrice: 960, total: 38400, leadTimeDays: 3 }],
      deliveryHistory: [
        { order: "PO-2310", amount: 4800, promised: "2025-12-01", delivered: "2025-11-30" },
        { order: "PO-2455", amount: 11200, promised: "2026-04-10", delivered: "2026-04-10" },
        { order: "PO-2560", amount: 7300, promised: "2026-06-18", delivered: "2026-06-16" },
      ],
    },
    {
      id: "coreparts",
      name: "CoreParts",
      label: "Vendor C",
      blurb: "Mid-size distributor.",
      quotes: [
        { requestId: "req-laptops", unitPrice: 998, total: 39920, leadTimeDays: 7 },
        { requestId: "req-chairs", unitPrice: 1080, total: 32400, leadTimeDays: 8 },
      ],
      deliveryHistory: [
        { order: "PO-2366", amount: 15600, promised: "2026-02-03", delivered: "2026-02-04" },
        { order: "PO-2521", amount: 8800, promised: "2026-06-01", delivered: "2026-06-01" },
      ],
    },
    {
      id: "sitwell",
      name: "Sitwell Office",
      label: "Vendor D",
      blurb: "New office-furniture supplier. No orders with us yet.",
      quotes: [{ requestId: "req-chairs", unitPrice: 1000, total: 30000, leadTimeDays: 6 }],
      deliveryHistory: [],
    },
  ] satisfies Vendor[],
  requests: [
    {
      id: "req-laptops",
      from: "tom",
      subject: "40 laptops for the new Marketing hires",
      body: "Hi Maria, we need 40 laptops for the new Marketing team, delivered by Friday. Budget is about $38k. Friday is a hard deadline: they start Monday.",
      item: "Laptop (14\", 16GB)",
      quantity: 40,
      budget: 38000,
      due: "Friday",
      receivedAt: "Mon 09:12",
      audience: "expert",
    },
    {
      id: "req-chairs",
      from: "lena",
      subject: "30 office chairs for the new floor",
      body: "Hi, we need 30 ergonomic office chairs for the new floor. Budget around $30k, no rush beyond end of month.",
      item: "Ergonomic office chair",
      quantity: 30,
      budget: 30000,
      due: "End of month",
      receivedAt: "Tue 10:40",
      audience: "newcomer",
    },
  ] satisfies PurchaseRequest[],
};

export function vendor(id: string): Vendor | undefined {
  return northwind.vendors.find((v) => v.id === id);
}

export function quoteFor(vendorId: string, requestId: string): Quote | undefined {
  return vendor(vendorId)?.quotes.find((q) => q.requestId === requestId);
}

export function vendorsQuoting(requestId: string): Vendor[] {
  return northwind.vendors.filter((v) => v.quotes.some((q) => q.requestId === requestId));
}

export function lateDeliveries(vendorId: string): DeliveryRecord[] {
  return (vendor(vendorId)?.deliveryHistory ?? []).filter((d) => d.delivered > d.promised);
}

export function person(id: string): Person | undefined {
  return northwind.people.find((p) => p.id === id);
}

export function largestOrder(vendorId: string): number {
  return Math.max(0, ...(vendor(vendorId)?.deliveryHistory ?? []).map((d) => d.amount));
}
