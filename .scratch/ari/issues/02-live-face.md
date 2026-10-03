# 02: Ari's live face

**What to build:** Ari has a live, lip-synced human face. HeyGen LiveAvatar is connected through its official ElevenLabs integration, so whatever the agent says, the face says. The face has three presentation states: a small quiet **bubble** in the corner, **forward** (enlarged, when Ari asks something), and **tutor** (always visible). If the stream fails, the ~5-minute per-visit live-face cap is reached, or the demo key is switched off, TalkingHead (in-browser 3D) takes over smoothly and voice keeps working. Ari is its own character (friendly young professional, LiveAvatar stock avatar, stock ElevenLabs voice); it never plays Maria.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Triggered speech from ticket 01 plays through the LiveAvatar face with lip-sync
- [ ] bubble / forward / tutor states can be switched from code and look right
- [ ] Killing the stream switches to TalkingHead without a broken frame; voice continues
- [ ] After ~5 minutes of live face in one visit, it switches to TalkingHead
- [ ] A demo-key setting (env var) forces the fallback for all visitors
- [ ] LiveAvatar session tokens come from a server route
