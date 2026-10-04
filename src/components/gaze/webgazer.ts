// WebGazer.js (Brown HCI, GPLv3: https://github.com/brownhci/WebGazer) loaded
// at runtime from a CDN, client only. Its npm build pulls TensorFlow.js into
// the bundle, so the prebuilt script is simpler and keeps our build lean.
// It needs the network anyway: the face-mesh model comes from tfhub.dev.

const SRC = "https://cdn.jsdelivr.net/npm/webgazer@3.5.3/dist/webgazer.js";

export type GazePrediction = { x: number; y: number } | null;

export type WebGazer = {
  setGazeListener(fn: (data: GazePrediction, elapsedMs: number) => void): WebGazer;
  clearGazeListener(): WebGazer;
  begin(onFail?: () => void): Promise<WebGazer>;
  end(): WebGazer;
  pause(): WebGazer;
  resume(): Promise<WebGazer>;
  stopVideo(): WebGazer;
  isReady(): boolean;
  showVideoPreview(on: boolean): WebGazer;
  showPredictionPoints(on: boolean): WebGazer;
  showFaceOverlay(on: boolean): WebGazer;
  showFaceFeedbackBox(on: boolean): WebGazer;
  applyKalmanFilter(on: boolean): WebGazer;
  saveDataAcrossSessions(on: boolean): WebGazer;
  setVideoViewerSize(w: number, h: number): void;
  clearData(): Promise<void>;
  recordScreenPosition(x: number, y: number, type?: "click" | "move"): WebGazer;
};

declare global {
  interface Window {
    webgazer?: WebGazer;
  }
}

let loading: Promise<WebGazer> | null = null;

export function loadWebGazer(): Promise<WebGazer> {
  if (typeof window === "undefined") return Promise.reject(new Error("WebGazer runs in the browser only"));
  if (window.webgazer) return Promise.resolve(window.webgazer);
  loading ??= new Promise<WebGazer>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SRC;
    script.async = true;
    script.onload = () => (window.webgazer ? resolve(window.webgazer) : reject(new Error("WebGazer didn't load")));
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("Couldn't download WebGazer"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

// Ask for the camera ourselves first, so a "no" falls back cleanly instead of
// WebGazer's own alert. The stream is released; WebGazer opens its own.
export async function cameraAllowed(): Promise<boolean> {
  try {
    if (!navigator.mediaDevices?.getUserMedia) return false;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}
