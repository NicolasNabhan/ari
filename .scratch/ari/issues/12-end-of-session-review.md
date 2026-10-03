# 12: End-of-session review

**What to build:** When the expert ends the session, Ari asks "Want me to go through the decisions I'm least sure about?". If yes, it reads the three least-certain quiet decisions one at a time; Maria confirms or corrects each by voice (corrections update the card and mark it confirmed). Then Ari asks whether to continue. If no, or when done, the remaining quiet decisions show as a list, least certain first, skippable with Continue / End session. Anything never confirmed stays labelled as Ari's best guess in teach mode.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] Core test: end_session → offer; on yes, end_review_item for the 3 lowest-confidence quiet decisions in order
- [ ] Core test: after three, a 'continue?' prompt; on no, show_review_list least-certain first
- [ ] Voice confirm / correct updates the card and its confirmed flag
- [ ] Continue / End session button skips the list
- [ ] Unreviewed quiet decisions keep confirmed = false
