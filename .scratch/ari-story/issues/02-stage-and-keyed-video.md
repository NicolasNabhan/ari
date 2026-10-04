# 02: Fixed stage + green-screen video player

**What to build:** Story mode renders the website on a fixed 1440×900 stage scaled to fit. A keyed-video component plays an MP4 with the green removed in WebGL, placed on the stage. A placeholder intro clip (made with ffmpeg) plays over the website with sound and captions. Stage fit math is tested.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Story page: the website on a scaled fixed stage, no layout drift between window sizes
- [x] Keyed video: green removed cleanly, with spill suppression, transparent elsewhere
- [x] Placeholder intro clip plays over the site with a caption
- [x] Tested: stage fit (scale and offset) for several window sizes
