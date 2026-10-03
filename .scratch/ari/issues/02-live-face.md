# 02: Ari's live face

**What to build:** Ari has a live, lip-synced human face. HeyGen LiveAvatar is connected through its official ElevenLabs integration, so whatever the agent says, the face says. The face has three presentation states: a small quiet **bubble** in the corner, **forward** (enlarged, when Ari asks something), and **tutor** (always visible). If the stream fails, the ~5-minute per-visit live-face cap is reached, or the demo key is switched off, TalkingHead (in-browser 3D) takes over smoothly and voice keeps working. Ari is its own character (friendly young professional, LiveAvatar stock avatar, stock ElevenLabs voice); it never plays Maria.

**Blocked by:** 01

**Status:** done

- [ ] Triggered speech from ticket 01 plays through the LiveAvatar face with lip-sync *(pending: needs HeyGen LiveAvatar credits; the TalkingHead face lip-syncs to Ari's speech today)*
- [x] bubble / forward / tutor states can be switched from code and look right
- [x] Killing the stream switches to TalkingHead without a broken frame; voice continues
- [x] After ~5 minutes of live face in one visit, it switches to TalkingHead
- [x] A demo-key setting (env var) forces the fallback for all visitors
- [ ] LiveAvatar session tokens come from a server route *(pending: needs HeyGen account)*

**Closed for building (2026-10-03):** Ari has a working face today: the in-browser TalkingHead fallback (brunette.glb, CC BY-NC), with bubble/forward/tutor states, speaking ring, captions, browser speech (speechSynthesis/SpeechRecognition) as the free voice, the face-choice logic, 5-minute live cap counter and demo-key env (NEXT_PUBLIC_DEMO_KEY_ON). Still to do when HeyGen credits exist: the LiveAvatar face itself and its token route. Check page: /avatar-check.
