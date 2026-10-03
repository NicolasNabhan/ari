# 10: Reasons, levels and knowledge

**What to build:** Every reason is fully sorted. Reason types live in a data list (outside rules, organization rules, practical constraints, experience and judgment, personal, unknown), each with a default level. A reason can have several types; its level is the highest among them. Cards show a big coloured level badge (🔴 MUST FOLLOW / 🟡 STRONG ADVICE / 🟢 YOUR CHOICE) with the types in small text beneath, and an **Unwritten** ribbon when the reason isn't covered by the written procedure. Ari also captures the knowledge behind the work: it infers what a step needs when it can, and asks "Where does that number come from?" when it can't and it matters; each knowledge item is tagged with where it lives (public, company document, company system, told by a person, already a given). Teach mode shows and speaks these.

**Blocked by:** 06

**Status:** done

- [x] Reason types and default levels come from a data list; adding a type needs no code change
- [x] Core test: 'A shipped late twice; Friday is a hard deadline' → 🟡 lesson learned + deadline
- [x] Core test: sending the $38k order to the CFO triggers an ask; answer → 🔴 team convention + Unwritten
- [x] Core test: typing a vendor score triggers 'where does that number come from?'; answer tagged told by a person
- [x] Badge + small types + Unwritten ribbon + knowledge tags render on cards in both modes

**Notes:** Added reason type 'Company-specific method' (must). Budget / Time or deadline / Resources default to strong advice (they belong to one request). Scoring is a step card; Ari asks once per request where the number comes from. Knowledge items (text + source) come from the classify Judge call; teach mode passes them on at the vendor step.
