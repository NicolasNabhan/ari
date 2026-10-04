// The story plays on a fixed-size stage (the website plus the character
// videos), scaled to fit the window, so buttons and clips never drift apart.
export const STAGE = { width: 1440, height: 900 };

export function fitStage(window: { width: number; height: number }) {
  const scale = Math.min(window.width / STAGE.width, window.height / STAGE.height);
  return {
    scale,
    offsetX: Math.round((window.width - STAGE.width * scale) / 2),
    offsetY: Math.round((window.height - STAGE.height * scale) / 2),
  };
}
