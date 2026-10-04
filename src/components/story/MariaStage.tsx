"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { STAGE } from "@/lib/story/stage";

// A transparent 3D layer over the website where Maria lives.
// Her skeleton is the standard Mixamo one ("mixamorig:*" bones).

type Bones = Record<string, THREE.Bone>;

const bone = (bones: Bones, name: string) => bones[`mixamorig${name}`] ?? bones[`mixamorig:${name}`];

// Turn a bone so the segment from it to its child points along a world
// direction. Works whatever the rig's local axes are.
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _pq = new THREE.Quaternion();
function aimBone(b: THREE.Bone, child: THREE.Object3D, worldDir: THREE.Vector3) {
  b.updateWorldMatrix(true, true);
  b.getWorldPosition(_a);
  child.getWorldPosition(_b);
  const current = _b.sub(_a).normalize();
  _q.setFromUnitVectors(current, worldDir.clone().normalize());
  // Apply the world-space rotation on top of the bone's current world rotation.
  b.getWorldQuaternion(_pq);
  const worldTarget = _q.multiply(_pq);
  const parentWorld = new THREE.Quaternion();
  b.parent?.getWorldQuaternion(parentWorld);
  b.quaternion.copy(parentWorld.invert().multiply(worldTarget));
  b.updateWorldMatrix(false, true);
}

// From the T-pose to a relaxed standing pose.
function relax(bones: Bones) {
  for (const side of ["Left", "Right"] as const) {
    const sign = side === "Left" ? 1 : -1;
    const arm = bone(bones, `${side}Arm`);
    const fore = bone(bones, `${side}ForeArm`);
    const hand = bone(bones, `${side}Hand`);
    if (arm && fore) aimBone(arm, fore, new THREE.Vector3(0.18 * sign, -1, 0.04));
    if (fore && hand) aimBone(fore, hand, new THREE.Vector3(0.05 * sign, -1, 0.22));
  }
}

export function MariaStage() {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(STAGE.width, STAGE.height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff6ee, 0xd9d2ff, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-1.5, 2.5, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffd9cc, 1.2);
    rim.position.set(2, 2, -2);
    scene.add(rim);

    // Camera looks at the "floor" in front of the website; 1 unit ≈ Maria's height.
    const camera = new THREE.PerspectiveCamera(22, STAGE.width / STAGE.height, 0.1, 50);
    camera.position.set(0, 0.6, 3.1);
    camera.lookAt(0, 0.55, 0);

    let maria: THREE.Object3D | null = null;
    const bones: Bones = {};
    new GLTFLoader().load(
      "/avatars/maria.glb",
      (gltf) => {
        maria = gltf.scene;
        maria.traverse((o) => {
          if ((o as THREE.Bone).isBone) {
            const b = o as THREE.Bone;
            b.userData.rest = b.rotation.clone();
            bones[b.name.replace(":", "")] = b;
            bones[b.name] = b;
          }
          if ((o as THREE.Mesh).isMesh) o.frustumCulled = false;
        });
        relax(bones);
        maria.position.set(-0.62, -0.06, 0);
        scene.add(maria);
        (window as unknown as { ariMaria: unknown }).ariMaria = { maria, bones, camera, scene };
        setStatus("ready");
      },
      undefined,
      () => setStatus("error"),
    );

    const clock = new THREE.Clock();
    let frame = 0;
    const tick = () => {
      const t = clock.getElapsedTime();
      if (maria) {
        // Gentle idle: breathing and a small sway, so she never looks frozen.
        const spine = bone(bones, "Spine1");
        const head = bone(bones, "Head");
        if (spine) spine.rotation.x = spine.userData.rest.x + Math.sin(t * 1.6) * 0.015;
        if (head) {
          head.rotation.y = head.userData.rest.y + Math.sin(t * 0.5) * 0.08;
          head.rotation.x = head.userData.rest.x + Math.sin(t * 0.7) * 0.03;
        }
        maria.rotation.y = Math.sin(t * 0.3) * 0.05;
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(frame);
      renderer.dispose();
      el.innerHTML = "";
    };
  }, []);

  return (
    <div data-ari="maria-stage" data-status={status} className="pointer-events-none absolute inset-0 z-[60]">
      <div ref={host} className="absolute inset-0" />
    </div>
  );
}
