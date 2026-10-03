# 04: Rest of the workspace

**What to build:** The workspace is complete. The expert can type vendor scores into a scoring sheet, approve an order themselves or route it to their manager or the CFO, message Finance / the requester / the CFO in team chat or email, and open the written procedure page. Typing in chat and an active call emit busy-started / busy-ended events (so Ari can later hold its questions). The newcomer's chair request is also workable end to end. All actions emit typed events.

**Blocked by:** 03

**Status:** done

- [x] Scoring sheet accepts typed scores per vendor and emits an event with the value
- [x] Approve / route-to-manager / route-to-CFO work and emit events with order amount and supplier
- [x] Chat and email send messages to named people and emit events (recipient, topic)
- [x] Typing in chat or a marked-active call emits busy start/end events
- [x] Procedure page shows the readable procedure and emits a 'procedure opened' event
- [x] Both seed requests can be completed end to end in the UI
