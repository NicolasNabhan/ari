# 08: Teach mode: tutor walkthrough

**What to build:** A newcomer can learn Maria's job. Newcomer mode loads a **hand-written** Maria session (cards with reasons, levels and knowledge for the laptop request) so this ticket doesn't depend on the asking flow. The newcomer works the 30-chair request in the same workspace while Ari, in tutor state, gives a full spoken explanation at every step (the usual options, Maria's choice, the reason and its level, personal-style choices called optional), highlights the next button/field (driver.js), and answers "why?" asked out loud from the saved reasons — labelling any unconfirmed reason as "my best guess, not confirmed by Maria". Before the newcomer completes an action that would break a must-follow rule (including unwritten ones), Ari warns them: approving the $30k new-supplier order triggers "Wait. New suppliers over $25k go to the CFO first. That's Maria's rule."

**Blocked by:** 02, 04, 05, 11

**Status:** ready-for-agent

- [ ] Hand-written Maria session file loads in newcomer mode
- [ ] Ari explains each step out loud in tutor state, with highlights on the next element
- [ ] Spoken 'why?' at any step is answered from saved reasons; unconfirmed ones are labelled
- [ ] Core test: approving a $30k order from a new supplier emits warn_guardrail before the approval completes
- [ ] Personal-style choices are described as optional
- [ ] Teach-mode explanations include the relevant how-notes (moved from ticket 11)
