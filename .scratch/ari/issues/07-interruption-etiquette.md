# 07: Interruption etiquette

**What to build:** Ari is polite. If the expert is busy (typing in chat or on a call), a pending question is held and asked as soon as they're free. A setting switches Ari to tap-to-hear: Ari shows an "I have a question" signal and only speaks after the expert taps it. When an answer is vague in a way that matters (e.g. "I just like them better"), Ari asks **at most one** gentle follow-up ("Is that from past experience with them, or personal taste?"), and accepts "just taste" without pushing.

**Blocked by:** 04, 06

**Status:** done

- [x] Core test: a question triggered while busy is held and emitted when busy ends
- [x] Core test: in tap-to-hear mode, signal_pending_question is emitted and ask only follows tap_to_hear
- [x] Core test: a vague answer produces exactly one follow-up; a second vague answer produces none
- [x] Tap-to-hear setting is visible in the expert UI and persists in the browser
- [x] Works live with real chat typing in the workspace

**Notes:** Call state moved from the chat screen to the workspace shell (header 'End call' button), so a call stays on across screens. Typing ends after 3s idle, on send, or when leaving the chat screen.
