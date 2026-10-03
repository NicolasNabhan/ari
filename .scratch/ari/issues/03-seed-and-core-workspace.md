# 03: Northwind seed + core workspace

**What to build:** The fake Northwind Supply workspace exists with its first half of screens, driven by one seed file. The seed holds: the written procurement procedure (structured rules with section ids plus readable text, e.g. 3 quotes over $5k, CFO approval over $50k), the general-practice layer, three vendors with quotes and delivery histories (Vendor A has two late deliveries; Vendor B is pricier and new to large orders), the 40-laptop / ~$38k request due Friday, and the 30-chair / $30k new-supplier request for the newcomer. An expert can fill a passwordless profile (name, role, company — saved in the browser), open the inbox, open the request from the queue, view vendors and quotes and delivery history, request quotes, and select or switch a vendor. Every action emits a typed workspace event with a timestamp on a single event bus; a debug panel shows the live event log. The workspace knows nothing about Ari.

**Blocked by:** 01

**Status:** done

- [x] Profile screen saves name / role / company in the browser and is remembered on reload
- [x] Inbox shows the laptop request; opening it lands in the request queue
- [x] Vendors screen shows quotes and an openable delivery history per vendor
- [x] Requesting quotes, selecting a vendor and switching vendor all work
- [x] Each action emits a named, typed event with a timestamp, visible in the debug event log
- [x] All Northwind content comes from the seed file, with the planted facts present (A's late deliveries, procedure thresholds)
