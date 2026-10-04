import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { PET_CONFIG, type PetAction, type PetConfig } from "./petConfig";
import { resolveClips } from "./petClips";
import { arcPoint, jumpPhase, squash, stepTowards, talkPulse, turnTowards, yawTowards, type JumpTiming, type Vec3 } from "./petMath";

const TURN_SPEED = 7; // rad/s
const TALK_HZ = 7;
const SIT_PITCH = -0.4; // nose up, pivoting on the front paws

type Walk = { x: number; z: number; speed: number; resolve: () => void };
type Jump = { from: Vec3; to: Vec3; height: number; timing: JumpTiming; elapsed: number; resolve: () => void };

/**
 * Ari the pet: loads the model into a scene and drives it. Call `update(dt)`
 * every frame. Uses the model's own clips (idle, walk, run, sit) when it has
 * them and procedural motion when it doesn't; hops, talking, head tilt and
 * tail wag are always procedural, so they work on any rig.
 *
 * Hierarchy: root (position + yaw) > body (squash, bob) > sitPivot (at the
 * front paws) > facing offset > model (scaled, feet on y = 0).
 */
export class PetActor {
  readonly ready: Promise<void>;

  private root = new THREE.Group();
  private body = new THREE.Group();
  private sitPivot = new THREE.Group();
  private sitInner = new THREE.Group();
  private mixer: THREE.AnimationMixer | null = null;
  private actions: Partial<Record<PetAction, THREE.AnimationAction>> = {};
  private current: THREE.AnimationAction | null = null;
  private bones: { head?: THREE.Object3D; mouth?: THREE.Object3D; tail?: THREE.Object3D; ears: THREE.Object3D[] } = { ears: [] };
  private rest = new Map<THREE.Object3D, THREE.Quaternion>();

  private yaw = 0;
  private targetYaw = 0;
  private walk: Walk | null = null;
  private jump: Jump | null = null;
  private time = 0;
  private gaitPhase = 0;
  private talking = false;
  private tilting = false;
  private wagging = false;
  private sitting = false;
  private talkAmt = 0;
  private tiltAmt = 0;
  private wagAmt = 0;
  private sitAmt = 0;
  private disposed = false;

  constructor(
    private scene: THREE.Scene,
    private cfg: PetConfig = PET_CONFIG,
  ) {
    this.root.name = "ari-pet";
    this.root.add(this.body);
    this.body.add(this.sitPivot);
    this.sitPivot.add(this.sitInner);
    scene.add(this.root);
    this.ready = new GLTFLoader().loadAsync(cfg.modelUrl).then((gltf) => {
      if (this.disposed) return;
      const model = gltf.scene;
      const length = this.fit(model);
      const facing = new THREE.Group();
      facing.rotation.y = cfg.facingOffset;
      facing.add(model);
      this.sitInner.add(facing);
      this.sitPivot.position.z = length / 2;
      this.sitInner.position.z = -length / 2;

      for (const key of ["head", "mouth", "tail"] as const) {
        const name = cfg.bones[key];
        const b = name ? model.getObjectByName(name) : undefined;
        if (b) this.bones[key] = b;
      }
      this.bones.ears = (cfg.bones.ears ?? []).map((n) => model.getObjectByName(n)).filter((b): b is THREE.Object3D => !!b);
      for (const b of [this.bones.head, this.bones.mouth, this.bones.tail, ...this.bones.ears]) {
        if (b) this.rest.set(b, b.quaternion.clone());
      }

      this.mixer = new THREE.AnimationMixer(model);
      const clips = resolveClips(gltf.animations, cfg.clips, cfg.fps);
      for (const [action, clip] of Object.entries(clips) as [PetAction, THREE.AnimationClip][]) {
        this.actions[action] = this.mixer.clipAction(clip);
      }
      this.play("idle", 0);
    });
  }

  get object3D(): THREE.Object3D {
    return this.root;
  }

  get position(): Vec3 {
    const p = this.root.position;
    return { x: p.x, y: p.y, z: p.z };
  }

  /** Which actions the model has its own clip for (the rest are procedural). */
  get clips(): PetAction[] {
    return Object.keys(this.actions) as PetAction[];
  }

  /** Scale (to cfg.height, or cfg.scale), feet on y = 0, centred, then cfg.offset. Returns the nose-to-tail length. */
  private fit(model: THREE.Object3D) {
    model.updateMatrixWorld(true);
    const box = new THREE.Box3();
    const part = new THREE.Box3();
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.frustumCulled = false; // skinned bounds don't follow the animation
      mesh.geometry.computeBoundingBox();
      box.union(part.copy(mesh.geometry.boundingBox!).applyMatrix4(mesh.matrixWorld));
    });
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    const s = this.cfg.scale ?? (size.y > 0 ? this.cfg.height / size.y : 1);
    const { offset, facingOffset } = this.cfg;
    model.scale.setScalar(s);
    model.position.set(-centre.x * s + offset.x, -box.min.y * s + offset.y, -centre.z * s + offset.z);
    return (Math.abs(Math.cos(facingOffset)) * size.z + Math.abs(Math.sin(facingOffset)) * size.x) * s;
  }

  /** Cross-fade to the model's clip for an action. Returns false (and changes nothing) if it has none. */
  play(action: PetAction, fade = 0.2): boolean {
    const next = this.actions[action];
    if (!next) return false;
    if (next === this.current) return true;
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(fade).play();
    this.current?.fadeOut(fade);
    this.current = next;
    return true;
  }

  /** The clip to fall back to when not moving. */
  private settle(fade = 0.25) {
    if (!(this.sitting && this.play("sit", fade))) this.play("idle", fade);
  }

  setPosition(x: number, z: number, y = this.root.position.y) {
    this.stopMotion();
    this.root.position.set(x, y, z);
  }

  /** Turn smoothly to a yaw (0 faces the camera, +PI/2 faces screen-right). */
  face(yaw: number) {
    this.targetYaw = yaw;
  }

  /** Turn smoothly to face a point on the floor. */
  lookAt(x: number, z: number) {
    this.face(yawTowards({ x: this.root.position.x, z: this.root.position.z }, { x, z }));
  }

  /**
   * Walk (or, above 1.5x walking speed, trot) to a point at the current
   * height, then idle. Stands up first if sitting. Resolves on arrival or
   * when interrupted.
   */
  walkTo(x: number, z: number, speed = this.cfg.walkClipSpeed): Promise<void> {
    this.stopMotion();
    this.sitting = false;
    return new Promise((resolve) => {
      this.walk = { x, z, speed, resolve };
      const trot = speed > this.cfg.walkClipSpeed * 1.5 && this.play("run");
      if (trot) return;
      if (this.play("walk")) this.current?.setEffectiveTimeScale(speed / this.cfg.walkClipSpeed);
      else this.play("idle"); // procedural trot on top
    });
  }

  /** Sit down (the model's sit clip, or a procedural lean back) or stand up. */
  sit(on: boolean) {
    this.sitting = on;
    if (!this.walk) this.settle();
  }

  /** Jump on the spot. */
  hop(height = 0.12): Promise<void> {
    return this.startJump(this.position, height, { crouch: 0.1, air: 0.42, land: 0.16 });
  }

  /** Jump along an arc to a point (on the floor or up onto something) and stay there. */
  jumpTo(x: number, y: number, z: number, height = 0.12): Promise<void> {
    const from = this.position;
    const to = { x, y, z };
    const dist = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z);
    const air = Math.min(0.8, 0.38 + dist * 0.35);
    if (Math.hypot(to.x - from.x, to.z - from.z) > 0.02) this.lookAt(x, z);
    return this.startJump(to, height + Math.max(0, to.y - from.y) * 0.4, { crouch: 0.12, air, land: 0.18 });
  }

  private startJump(to: Vec3, height: number, timing: JumpTiming): Promise<void> {
    this.stopMotion();
    this.sitting = false;
    this.settle();
    const from = this.position;
    return new Promise((resolve) => {
      this.jump = { from, to, height, timing, elapsed: 0, resolve };
    });
  }

  /** Procedural talking: quick snout/head bobs and a slight squash, with an occasional head sway. */
  setTalking(on: boolean) {
    this.talking = on;
  }

  /** Curious head tilt. */
  tiltHead(on: boolean) {
    this.tilting = on;
  }

  /** Wag the tail (no-op if the model has no tail bone). */
  wagTail(on: boolean) {
    this.wagging = on;
  }

  /** Finish whatever locomotion is running: walks stop where they are, jumps land at their target. */
  private stopMotion() {
    if (this.walk) {
      this.walk.resolve();
      this.walk = null;
      this.settle();
    }
    if (this.jump) {
      const { to, resolve } = this.jump;
      this.root.position.set(to.x, to.y, to.z);
      this.jump = null;
      resolve();
    }
  }

  update(dt: number) {
    this.time += dt;
    const t = this.time;
    const pos = this.root.position;
    const h = this.cfg.height;
    let scaleY = 1;
    let gait = 0; // 0..1: how much procedural trotting to add

    if (this.jump) {
      const j = this.jump;
      j.elapsed += dt;
      const phase = jumpPhase(j.elapsed, j.timing);
      const p = arcPoint(j.from, j.to, j.height, phase.airT);
      pos.set(p.x, p.y, p.z);
      scaleY = phase.scaleY;
      if (phase.done) {
        this.jump = null;
        j.resolve();
      }
    } else if (this.walk) {
      const w = this.walk;
      this.targetYaw = yawTowards({ x: pos.x, z: pos.z }, w);
      // Turn before moving off when the target is behind.
      const facing = Math.max(0, Math.cos(this.targetYaw - this.yaw));
      const next = stepTowards({ x: pos.x, z: pos.z }, w, w.speed * facing * dt);
      pos.x = next.x;
      pos.z = next.z;
      if (!this.actions.walk) {
        gait = facing;
        this.gaitPhase += dt * (w.speed / (0.45 * h));
      }
      if (next.arrived) {
        this.walk = null;
        this.settle();
        w.resolve();
      }
    }

    this.yaw = turnTowards(this.yaw, this.targetYaw, TURN_SPEED * dt);
    this.root.rotation.y = this.yaw;

    const ease = (cur: number, on: boolean, rate: number) => cur + ((on ? 1 : 0) - cur) * Math.min(1, dt * rate);
    this.talkAmt = ease(this.talkAmt, this.talking, 12);
    this.tiltAmt = ease(this.tiltAmt, this.tilting, 5);
    this.wagAmt = ease(this.wagAmt, this.wagging, 6);
    this.sitAmt = ease(this.sitAmt, this.sitting && !this.actions.sit, 6);

    // Clips first (from the rest pose), then the procedural layer on top.
    for (const [b, q] of this.rest) b.quaternion.copy(q);
    this.mixer?.update(dt);

    const beat = talkPulse(t, TALK_HZ) * this.talkAmt;
    const roll = this.tiltAmt * 0.22 + this.talkAmt * 0.07 * Math.sin(2 * Math.PI * 1.1 * t);
    const nod = beat * 0.07;
    if (this.bones.head) addRotation(this.bones.head, nod, 0, roll);
    if (this.bones.mouth) addRotation(this.bones.mouth, beat * 0.25, 0, 0);
    this.bones.ears.forEach((ear, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      addRotation(ear, 0, 0, side * (this.talkAmt * 0.12 * Math.sin(2 * Math.PI * 3.5 * t) + this.tiltAmt * 0.15));
    });
    if (this.bones.tail) addRotation(this.bones.tail, 0, this.wagAmt * 0.6 * Math.sin(2 * Math.PI * 5 * t), 0);

    // Whole-body layer: squash, talking bob, procedural trot / breathing / sit.
    const step = Math.sin(this.gaitPhase * Math.PI);
    const breathe = this.actions.idle ? 0 : 0.012 * Math.sin(t * 2.4);
    scaleY *= (1 - 0.05 * beat) * (1 + breathe);
    const s = squash(scaleY);
    this.body.scale.set(s.x, s.y, s.z);
    this.body.position.y = h * (0.035 * beat + gait * 0.06 * Math.abs(step));
    this.body.rotation.set(this.bones.head ? 0 : nod, 0, (this.bones.head ? 0 : roll) + gait * 0.06 * step);
    this.sitPivot.rotation.x = SIT_PITCH * this.sitAmt;
  }

  dispose() {
    this.disposed = true;
    this.stopMotion();
    this.mixer?.stopAllAction();
    this.scene.remove(this.root);
    this.root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      for (const m of ([] as THREE.Material[]).concat(mesh.material)) m.dispose();
    });
  }
}

// Rotate a bone in its parent's frame (x = nod, y = turn, z = roll), on top of its current pose.
const _e = new THREE.Euler();
const _q = new THREE.Quaternion();
function addRotation(b: THREE.Object3D, x: number, y: number, z: number) {
  b.quaternion.premultiply(_q.setFromEuler(_e.set(x, y, z)));
}
