"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import * as THREE from "three";
import { STAGE } from "@/lib/story/stage";
import { PetActor } from "./PetActor";
import { PET_CAMERAS, PET_HOMES, type PetAction, type PetMode, type PetSpot } from "./petConfig";

/** What a director can drive. Every call waits for the model to load first. */
export type PetHandle = {
  ready: () => Promise<PetActor>;
  walkTo: (x: number, z: number, speed?: number) => Promise<void>;
  hop: (height?: number) => Promise<void>;
  jumpTo: (x: number, y: number, z: number, height?: number) => Promise<void>;
  setPosition: (x: number, z: number, y?: number) => Promise<void>;
  face: (yaw: number) => Promise<void>;
  lookAt: (x: number, z: number) => Promise<void>;
  setTalking: (on: boolean) => Promise<void>;
  tiltHead: (on: boolean) => Promise<void>;
  wagTail: (on: boolean) => Promise<void>;
  sit: (on: boolean) => Promise<void>;
  play: (action: PetAction) => Promise<boolean>;
};

export type PetStageProps = {
  ref?: Ref<PetHandle>;
  /** "story": shares Maria's camera and plays the intro. "teacher": Ari alone, framed bottom-right, driven by props. */
  mode?: PetMode;
  /** Where Ari stands (defaults per mode). Changing it walks (same height) or jumps (new height) him there. */
  position?: PetSpot;
  /** Ari is speaking: procedural talking + tail wag. */
  talking?: boolean;
  /** Ari is listening: curious head tilt. */
  listening?: boolean;
  /** Ari is sitting (the model's sit clip, or a procedural sit). */
  sitting?: boolean;
  /** Story mode only: Ari trots in and sits next to Maria on mount. Turn off when a director drives him. */
  intro?: boolean;
  /** Layer classes; defaults to sitting just above MariaStage (z-[60]). */
  className?: string;
};

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Story intro: Ari trots in from off-stage right, does a small happy hop next
// to Maria and sits, facing the viewer.
async function intro(a: PetActor, home: Required<PetSpot>, alive: () => boolean) {
  a.setPosition(1.4, home.z + 0.1, home.y);
  await sleep(600);
  if (!alive()) return;
  a.wagTail(true);
  await a.walkTo(home.x, home.z, 0.55);
  if (!alive()) return;
  a.face(0);
  await sleep(250);
  await a.hop(0.06);
  a.sit(true);
  await sleep(1500);
  a.wagTail(false);
}

export function PetStage({
  ref,
  mode = "story",
  position,
  talking = false,
  listening = false,
  sitting = false,
  intro: playIntro = true,
  className = "z-[61]",
}: PetStageProps) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  // Resolves with the live actor; replaced whenever the scene is rebuilt.
  const actor = useRef(deferred<PetActor>());
  const spot = position ?? PET_HOMES[mode];
  const { x, z } = spot;
  const y = spot.y ?? 0;
  // Latest prop values, for applying to a freshly loaded actor.
  const latest = useRef({ x, y, z, talking, listening, sitting });
  useEffect(() => {
    latest.current = { x, y, z, talking, listening, sitting };
  });

  useImperativeHandle(ref, () => {
    const a = () => actor.current.promise;
    return {
      ready: a,
      walkTo: (x, z, speed) => a().then((p) => p.walkTo(x, z, speed)),
      hop: (h) => a().then((p) => p.hop(h)),
      jumpTo: (x, y, z, h) => a().then((p) => p.jumpTo(x, y, z, h)),
      setPosition: (x, z, y) => a().then((p) => p.setPosition(x, z, y)),
      face: (yaw) => a().then((p) => p.face(yaw)),
      lookAt: (x, z) => a().then((p) => p.lookAt(x, z)),
      setTalking: (on) => a().then((p) => p.setTalking(on)),
      tiltHead: (on) => a().then((p) => p.tiltHead(on)),
      wagTail: (on) => a().then((p) => p.wagTail(on)),
      sit: (on) => a().then((p) => p.sit(on)),
      play: (action) => a().then((p) => p.play(action)),
    };
  }, []);

  useEffect(() => {
    const el = host.current!;
    let alive = true;
    const ready = deferred<PetActor>();
    actor.current = ready;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(STAGE.width, STAGE.height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    el.appendChild(renderer.domElement);

    // Same lights as MariaStage.
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff6ee, 0xd9d2ff, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-1.5, 2.5, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffd9cc, 1.2);
    rim.position.set(2, 2, -2);
    scene.add(rim);

    const cam = PET_CAMERAS[mode];
    const camera = new THREE.PerspectiveCamera(cam.fov, STAGE.width / STAGE.height, 0.1, 50);
    camera.position.set(...cam.position);
    camera.lookAt(...cam.target);

    const pet = new PetActor(scene);
    const start = latest.current;
    const withIntro = mode === "story" && playIntro;
    pet.setPosition(start.x, start.z, start.y);
    pet.ready.then(
      () => {
        if (!alive) return;
        pet.setTalking(latest.current.talking);
        pet.wagTail(latest.current.talking);
        pet.tiltHead(latest.current.listening);
        if (!withIntro) pet.sit(latest.current.sitting);
        ready.resolve(pet);
        (window as unknown as { ariPet: unknown }).ariPet = { pet, camera, scene };
        setStatus("ready");
        if (withIntro) void intro(pet, { x: start.x, y: start.y, z: start.z }, () => alive);
      },
      (e) => {
        console.error("[Ari pet] model load failed", e);
        if (alive) setStatus("error");
      },
    );

    const clock = new THREE.Clock();
    let frame = 0;
    const tick = () => {
      pet.update(Math.min(clock.getDelta(), 0.05));
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      pet.dispose();
      renderer.dispose();
      el.innerHTML = "";
    };
  }, [mode, playIntro]);

  // Driven from outside (e.g. useAri().speaking / .listening).
  useEffect(() => {
    void actor.current.promise.then((p) => {
      p.setTalking(talking);
      p.wagTail(talking);
    });
  }, [talking]);
  useEffect(() => {
    void actor.current.promise.then((p) => p.tiltHead(listening));
  }, [listening]);
  const firstSit = useRef(true);
  useEffect(() => {
    // The initial value is applied on load (after the intro, in story mode).
    if (firstSit.current) {
      firstSit.current = false;
      return;
    }
    void actor.current.promise.then((p) => p.sit(sitting));
  }, [sitting]);

  // Move when the position prop changes: walk on the same level, jump to a new height.
  // (The initial position is applied on load.)
  const placed = useRef({ x, y, z });
  useEffect(() => {
    const prev = placed.current;
    if (prev.x === x && prev.y === y && prev.z === z) return;
    placed.current = { x, y, z };
    void actor.current.promise.then((p) => {
      const at = p.position;
      if (Math.hypot(at.x - x, at.y - y, at.z - z) < 0.005) return;
      const move = Math.abs(at.y - y) > 0.01 ? p.jumpTo(x, y, z) : p.walkTo(x, z);
      void move.then(() => p.face(0));
    });
  }, [x, y, z]);

  return (
    <div data-ari="pet-stage" data-mode={mode} data-status={status} aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      <div ref={host} className="absolute inset-0" />
    </div>
  );
}
