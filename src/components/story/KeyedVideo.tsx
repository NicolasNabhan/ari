"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// A green-screen video with the green removed live (WebGL), so the characters
// stand directly on the website. The key colour is sampled from the clip's
// top-left corner, so small differences between generated clips don't matter.

export type KeyedVideoHandle = {
  play: () => Promise<void>;
  pause: () => void;
  time: () => number;
  video: () => HTMLVideoElement | null;
};

type Props = {
  srcs: string[]; // tried in order (real clip first, then the placeholder)
  rect: { x: number; y: number; w: number; h: number }; // stage pixels
  loop?: boolean;
  muted?: boolean;
  autoPlay?: boolean;
  onEnded?: () => void;
  onTime?: (t: number) => void;
  onLoaded?: (size: { width: number; height: number; duration: number }) => void;
};

const VERT = `attribute vec2 p; varying vec2 uv;
void main(){ uv = vec2((p.x+1.0)/2.0, 1.0-(p.y+1.0)/2.0); gl_Position = vec4(p,0.0,1.0); }`;

const FRAG = `precision mediump float;
varying vec2 uv; uniform sampler2D tex; uniform vec3 key; uniform float similarity; uniform float smoothness; uniform float spill;
vec2 chroma(vec3 c){ return vec2(-0.1687*c.r-0.3313*c.g+0.5*c.b, 0.5*c.r-0.4187*c.g-0.0813*c.b); }
void main(){
  vec4 c = texture2D(tex, uv);
  float d = distance(chroma(c.rgb), chroma(key));
  float a = smoothstep(similarity, similarity + smoothness, d);
  // Remove green spill on edges and hair.
  float s = pow(clamp(1.0 - smoothstep(similarity, similarity + spill, d), 0.0, 1.0), 1.5);
  float grey = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
  vec3 rgb = mix(c.rgb, vec3(grey), s * 0.8);
  rgb.g = min(rgb.g, max(rgb.r, rgb.b) + 0.04);
  gl_FragColor = vec4(rgb * a, a);
}`;

export const KeyedVideo = forwardRef<KeyedVideoHandle, Props>(function KeyedVideo({ srcs, rect, loop, muted, autoPlay, onEnded, onTime, onLoaded }, ref) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const srcIndex = useRef(0);
  const cb = useRef({ onEnded, onTime, onLoaded });
  useEffect(() => {
    cb.current = { onEnded, onTime, onLoaded };
  });

  useImperativeHandle(ref, () => ({
    play: async () => {
      await video.current?.play().catch(() => {});
    },
    pause: () => video.current?.pause(),
    time: () => video.current?.currentTime ?? 0,
    video: () => video.current,
  }));

  useEffect(() => {
    const v = video.current!;
    const c = canvas.current!;
    const gl = c.getContext("webgl", { premultipliedAlpha: true, alpha: true })!;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform3f(gl.getUniformLocation(prog, "key"), 0, 0.694, 0.251);
    gl.uniform1f(gl.getUniformLocation(prog, "similarity"), 0.11);
    gl.uniform1f(gl.getUniformLocation(prog, "smoothness"), 0.08);
    gl.uniform1f(gl.getUniformLocation(prog, "spill"), 0.2);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    let keyed = false;
    const sampleKey = () => {
      // Average a small patch in the top-left corner: that's the clip's green.
      const probe = document.createElement("canvas");
      probe.width = 8;
      probe.height = 8;
      const ctx = probe.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(v, 4, 4, 8, 8, 0, 0, 8, 8);
      const d = ctx.getImageData(0, 0, 8, 8).data;
      let r = 0,
        g = 0,
        b = 0;
      for (let i = 0; i < d.length; i += 4) {
        r += d[i];
        g += d[i + 1];
        b += d[i + 2];
      }
      const n = d.length / 4;
      if (g / n > r / n + 30 && g / n > b / n + 30) gl.uniform3f(gl.getUniformLocation(prog, "key"), r / n / 255, g / n / 255, b / n / 255);
      keyed = true;
    };

    let frame = 0;
    const draw = () => {
      if (v.readyState >= 2) {
        if (!keyed) sampleKey();
        if (c.width !== v.videoWidth) {
          c.width = v.videoWidth;
          c.height = v.videoHeight;
          gl.viewport(0, 0, c.width, c.height);
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        cb.current.onTime?.(v.currentTime);
      }
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="absolute" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}>
      <video
        ref={video}
        src={srcs[0]}
        playsInline
        preload="auto"
        loop={loop}
        muted={muted}
        autoPlay={autoPlay}
        className="hidden"
        onError={() => {
          // Real clip missing: fall back to the next source (the placeholder).
          srcIndex.current += 1;
          if (video.current && srcIndex.current < srcs.length) video.current.src = srcs[srcIndex.current];
        }}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          cb.current.onLoaded?.({ width: v.videoWidth, height: v.videoHeight, duration: v.duration });
        }}
        onEnded={() => cb.current.onEnded?.()}
      />
      <canvas ref={canvas} className="h-full w-full" />
    </div>
  );
});
