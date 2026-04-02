import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

// ─── Types ─────────────────────────────────────────────────────────────────────
type GameState = "menu" | "playing" | "gameover";
type GameMode = "endless" | "challenge" | "nightmare";
type MapType = "forest" | "village" | "graveyard" | "city" | "swamp";
type CameraMode = "third" | "first";
type DayMode = "day" | "night";

interface Props {
  onClose: () => void;
}

const MAP_COLORS: Record<
  MapType,
  {
    ground: string;
    skyDay: string;
    skyNight: string;
    fogDay: string;
    fogNight: string;
  }
> = {
  forest: {
    ground: "#2d5016",
    skyDay: "#87ceeb",
    skyNight: "#050a02",
    fogDay: "#c8e8c8",
    fogNight: "#0a1505",
  },
  village: {
    ground: "#5a4a2a",
    skyDay: "#a0c8e0",
    skyNight: "#080605",
    fogDay: "#d8d0b8",
    fogNight: "#0f0a05",
  },
  graveyard: {
    ground: "#3a3a3f",
    skyDay: "#9090b0",
    skyNight: "#050508",
    fogDay: "#c0c0cc",
    fogNight: "#08080f",
  },
  city: {
    ground: "#444444",
    skyDay: "#b0c0d8",
    skyNight: "#060606",
    fogDay: "#d0d8e0",
    fogNight: "#0a0a0a",
  },
  swamp: {
    ground: "#2a4020",
    skyDay: "#8aad7a",
    skyNight: "#030805",
    fogDay: "#b8d0a8",
    fogNight: "#051008",
  },
};

// ─── Audio ─────────────────────────────────────────────────────────────────────
function getAC(
  ref: React.MutableRefObject<AudioContext | null>,
): AudioContext | null {
  try {
    if (!ref.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      ref.current = new AC();
    }
    if (ref.current.state === "suspended") ref.current.resume().catch(() => {});
    return ref.current;
  } catch {
    return null;
  }
}

function playJumpscare(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * 0.5);
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++)
      d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 0.3;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = 0.8;
    src.connect(g);
    g.connect(ctx.destination);
    src.start();
  } catch {}
}

function playSupercharge(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(100 + i * 80, now + i * 0.15);
      osc.frequency.exponentialRampToValueAtTime(
        400 + i * 80,
        now + i * 0.15 + 0.25,
      );
      g.gain.setValueAtTime(0.4, now + i * 0.15);
      g.gain.linearRampToValueAtTime(0, now + i * 0.15 + 0.3);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.3);
    }
  } catch {}
}

function playCreak(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

function playHeartbeat(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    for (const t of [0, 0.15]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(60, now + t);
      g.gain.setValueAtTime(0, now + t);
      g.gain.linearRampToValueAtTime(0.3, now + t + 0.04);
      g.gain.linearRampToValueAtTime(0, now + t + 0.12);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.15);
    }
  } catch {}
}

let ambientStop: (() => void) | null = null;
function startAmbient(ctx: AudioContext) {
  if (ambientStop) {
    ambientStop();
    ambientStop = null;
  }
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 55;
    g.gain.value = 0.04;
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    ambientStop = () => {
      try {
        osc.stop();
      } catch {}
    };
  } catch {}
}
function stopAmbient() {
  if (ambientStop) {
    ambientStop();
    ambientStop = null;
  }
}

// ─── House positions ──────────────────────────────────────────────────────────
function buildHousePositions(): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  const angles = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];
  for (let i = 0; i < 10; i++) {
    const angle = (angles[i] * Math.PI) / 180;
    const r = 30 + (i % 3) * 12;
    positions.push(
      new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r),
    );
  }
  return positions;
}
const HOUSE_POSITIONS = buildHousePositions();

// ─── Ground ───────────────────────────────────────────────────────────────────
function Ground({ map }: { map: MapType }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[400, 400, 20, 20]} />
      <meshLambertMaterial color={MAP_COLORS[map].ground} />
    </mesh>
  );
}

// ─── Grass tufts ──────────────────────────────────────────────────────────────
const GRASS_DATA = (() => {
  const arr: { x: number; z: number; id: string }[] = [];
  let s = 77;
  const rng = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
  for (let i = 0; i < 120; i++) {
    arr.push({
      x: (rng() - 0.5) * 300,
      z: (rng() - 0.5) * 300,
      id: `grass-${i}`,
    });
  }
  return arr;
})();

function Grass() {
  return (
    <group>
      {GRASS_DATA.map((g) => (
        <group key={g.id} position={[g.x, 0, g.z]}>
          <mesh
            position={[0, 0.2, 0]}
            rotation={[0, Math.random() * Math.PI, 0]}
          >
            <boxGeometry args={[0.05, 0.4, 0.3]} />
            <meshLambertMaterial color="#3a7a1a" />
          </mesh>
          <mesh position={[0.15, 0.15, 0]} rotation={[0, 0.8, 0.3]}>
            <boxGeometry args={[0.05, 0.3, 0.2]} />
            <meshLambertMaterial color="#4a8a22" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Tree data ────────────────────────────────────────────────────────────────
const TREE_DATA: { x: number; z: number; h: number; id: string }[] = (() => {
  const arr: { x: number; z: number; h: number; id: string }[] = [];
  let s = 42;
  const rng = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
  for (let i = 0; i < 80; i++) {
    let x: number;
    let z: number;
    do {
      x = (rng() - 0.5) * 280;
      z = (rng() - 0.5) * 280;
    } while (x * x + z * z < 64);
    arr.push({ x, z, h: 2.5 + rng() * 4, id: `tree-${i}` });
  }
  return arr;
})();

function Trees() {
  return (
    <group>
      {TREE_DATA.map((t) => (
        <group key={t.id} position={[t.x, 0, t.z]}>
          <mesh position={[0, t.h / 2, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.4, t.h, 7]} />
            <meshLambertMaterial color="#3d2b1f" />
          </mesh>
          <mesh position={[0, t.h + t.h * 0.35, 0]} castShadow>
            <coneGeometry args={[t.h * 0.45, t.h * 0.8, 8]} />
            <meshLambertMaterial color="#1a5c1a" />
          </mesh>
          <mesh position={[0, t.h * 0.6, 0]} castShadow>
            <coneGeometry args={[t.h * 0.35, t.h * 0.6, 7]} />
            <meshLambertMaterial color="#256025" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Rocks ───────────────────────────────────────────────────────────────────
const ROCK_DATA = (() => {
  const arr: { x: number; z: number; s: number; id: string }[] = [];
  let s = 99;
  const rng = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
  for (let i = 0; i < 40; i++) {
    arr.push({
      x: (rng() - 0.5) * 260,
      z: (rng() - 0.5) * 260,
      s: 0.4 + rng() * 1.2,
      id: `rock-${i}`,
    });
  }
  return arr;
})();

function Rocks() {
  return (
    <group>
      {ROCK_DATA.map((r) => (
        <mesh key={r.id} position={[r.x, r.s * 0.3, r.z]} castShadow>
          <dodecahedronGeometry args={[r.s, 0]} />
          <meshLambertMaterial color="#777" />
        </mesh>
      ))}
    </group>
  );
}

// ─── NPC data ─────────────────────────────────────────────────────────────────
const NPC_DATA = [
  { id: "npc-a", x: 25, z: 10 },
  { id: "npc-b", x: -30, z: 20 },
  { id: "npc-c", x: 15, z: -35 },
  { id: "npc-d", x: -20, z: -15 },
  { id: "npc-e", x: 40, z: -25 },
  { id: "npc-f", x: -10, z: 40 },
];

// ─── Houses ───────────────────────────────────────────────────────────────────
function Houses({ canHide, dayMode }: { canHide: boolean; dayMode: DayMode }) {
  return (
    <group>
      {HOUSE_POSITIONS.map((pos) => (
        <group
          key={`house-${Math.round(pos.x)}-${Math.round(pos.z)}`}
          position={[pos.x, 0, pos.z]}
        >
          <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[5, 3, 5]} />
            <meshLambertMaterial
              color={dayMode === "day" ? "#8b6a4a" : "#2a1e14"}
            />
          </mesh>
          <mesh position={[0, 3.6, 0]} castShadow>
            <coneGeometry args={[3.8, 2.2, 4]} />
            <meshLambertMaterial
              color={dayMode === "day" ? "#5a3030" : "#1a1010"}
            />
          </mesh>
          <mesh position={[0, 0.75, 2.51]} castShadow>
            <boxGeometry args={[1.2, 1.5, 0.05]} />
            <meshLambertMaterial color={canHide ? "#8b5a28" : "#1a0e00"} />
          </mesh>
          <mesh position={[1.4, 1.6, 2.51]}>
            <boxGeometry args={[0.7, 0.7, 0.05]} />
            <meshLambertMaterial
              color={dayMode === "day" ? "#aaddff" : "#223344"}
            />
          </mesh>
          {dayMode === "night" && (
            <pointLight
              position={[0, 2, 0]}
              color="#ff6600"
              intensity={0.8}
              distance={12}
            />
          )}
        </group>
      ))}
    </group>
  );
}

// ─── NPC with running leg animation ──────────────────────────────────────────
function NPC({
  startX,
  startZ,
  fleeing,
}: { startX: number; startZ: number; fleeing: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const legLRef = useRef<THREE.Mesh>(null);
  const legRRef = useRef<THREE.Mesh>(null);
  const armLRef = useRef<THREE.Mesh>(null);
  const armRRef = useRef<THREE.Mesh>(null);
  const state = useRef({
    x: startX,
    z: startZ,
    angle: Math.random() * Math.PI * 2,
    timer: 0,
    walkPhase: 0,
  });

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const s = state.current;
    s.timer += delta;
    if (s.timer > (fleeing ? 0.5 : 2)) {
      s.timer = 0;
      if (!fleeing) s.angle += (Math.random() - 0.5) * Math.PI * 0.8;
    }
    const speed = fleeing ? 7 : 2;
    s.x += Math.cos(s.angle) * speed * delta;
    s.z += Math.sin(s.angle) * speed * delta;
    s.x = Math.max(-140, Math.min(140, s.x));
    s.z = Math.max(-140, Math.min(140, s.z));
    groupRef.current.position.set(s.x, 0, s.z);
    groupRef.current.rotation.y = -s.angle + Math.PI / 2;

    // Running / walking leg animation
    s.walkPhase += delta * (fleeing ? 12 : 5);
    const swing = Math.sin(s.walkPhase) * (fleeing ? 0.6 : 0.35);
    if (legLRef.current) legLRef.current.rotation.x = swing;
    if (legRRef.current) legRRef.current.rotation.x = -swing;
    if (armLRef.current) armLRef.current.rotation.x = -swing * 0.7;
    if (armRRef.current) armRRef.current.rotation.x = swing * 0.7;
    // Body bob
    if (groupRef.current)
      groupRef.current.position.y =
        Math.abs(Math.sin(s.walkPhase * 2)) * (fleeing ? 0.12 : 0.05);
  });

  const shirtColor = fleeing
    ? "#cc2200"
    : ["#885533", "#336688", "#558833", "#885566", "#334488", "#776633"][
        Math.floor(Math.abs(startX) % 6)
      ];

  return (
    <group ref={groupRef} position={[startX, 0, startZ]}>
      {/* Torso */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.42, 0.6, 0.22]} />
        <meshLambertMaterial color={shirtColor} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.58, 0]} castShadow>
        <boxGeometry args={[0.28, 0.28, 0.26]} />
        <meshLambertMaterial color="#cc9966" />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 1.75, 0]}>
        <boxGeometry args={[0.3, 0.08, 0.28]} />
        <meshLambertMaterial color="#331100" />
      </mesh>
      {/* Left leg */}
      <mesh ref={legLRef} position={[-0.11, 0.55, 0]} castShadow>
        <boxGeometry args={[0.16, 0.55, 0.18]} />
        <meshLambertMaterial color="#223366" />
      </mesh>
      {/* Right leg */}
      <mesh ref={legRRef} position={[0.11, 0.55, 0]} castShadow>
        <boxGeometry args={[0.16, 0.55, 0.18]} />
        <meshLambertMaterial color="#223366" />
      </mesh>
      {/* Left arm */}
      <mesh ref={armLRef} position={[-0.28, 1.05, 0]} castShadow>
        <boxGeometry args={[0.14, 0.48, 0.16]} />
        <meshLambertMaterial color={shirtColor} />
      </mesh>
      {/* Right arm */}
      <mesh ref={armRRef} position={[0.28, 1.05, 0]} castShadow>
        <boxGeometry args={[0.14, 0.48, 0.16]} />
        <meshLambertMaterial color={shirtColor} />
      </mesh>
      {/* Feet */}
      <mesh position={[-0.11, 0.08, 0.06]}>
        <boxGeometry args={[0.15, 0.1, 0.3]} />
        <meshLambertMaterial color="#221100" />
      </mesh>
      <mesh position={[0.11, 0.08, 0.06]}>
        <boxGeometry args={[0.15, 0.1, 0.3]} />
        <meshLambertMaterial color="#221100" />
      </mesh>
    </group>
  );
}

// ─── Monster Centipede (67 segments + crawling wave animation) ────────────────
interface CentipedeProps {
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  baseSpeed: number;
  supercharged: boolean;
  onCatch: () => void;
  isHiddenRef: React.MutableRefObject<boolean>;
  startOffset: number;
  segKey: string;
  onDistanceUpdate?: (dist: number) => void;
}

function Centipede({
  playerPosRef,
  baseSpeed,
  supercharged,
  onCatch,
  isHiddenRef,
  startOffset,
  segKey,
  onDistanceUpdate,
}: CentipedeProps) {
  const SEGMENTS = 67; // Monster centipede - 67 segments!
  const SEG_SPACING = 1.1;

  const headRef = useRef<THREE.Mesh>(null);
  const bodyRefs = useRef<(THREE.Mesh | null)[]>([]);
  const legRefs = useRef<(THREE.Group | null)[]>([]);
  const glowRef = useRef<THREE.PointLight>(null);

  const positions = useRef<THREE.Vector3[]>(
    Array.from({ length: SEGMENTS }, (_, i) => {
      const angle = startOffset;
      return new THREE.Vector3(
        Math.cos(angle) * (95 + i * SEG_SPACING),
        0.6,
        Math.sin(angle) * (95 + i * SEG_SPACING),
      );
    }),
  );

  const velocity = useRef(new THREE.Vector3());
  const catchCalled = useRef(false);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
    const head = positions.current[0];
    const player = playerPosRef.current;
    const dist = head.distanceTo(new THREE.Vector3(player.x, 0.6, player.z));
    if (onDistanceUpdate) onDistanceUpdate(dist);

    const speed =
      baseSpeed * (supercharged ? 2.2 : 1.0) * (dist < 25 ? 1.5 : 1.0);

    const dir = new THREE.Vector3(player.x - head.x, 0, player.z - head.z);
    if (dir.length() > 0.1) dir.normalize();
    velocity.current.lerp(dir.multiplyScalar(speed), 4 * delta);
    head.x += velocity.current.x * delta;
    head.z += velocity.current.z * delta;

    // Crawling wave - each segment follows the previous with a sinusoidal vertical offset
    for (let i = 1; i < SEGMENTS; i++) {
      const prev = positions.current[i - 1];
      const cur = positions.current[i];
      const segDir = new THREE.Vector3().subVectors(cur, prev);
      if (segDir.length() > SEG_SPACING) {
        segDir.normalize().multiplyScalar(SEG_SPACING);
        positions.current[i].copy(prev).add(segDir);
      }
      // Wave crawling vertical motion
      const wave = Math.sin(t * 8 - i * 0.4) * 0.18;
      positions.current[i].y = 0.5 + wave;
    }
    // Head bobs too
    head.y = 0.6 + Math.sin(t * 8) * 0.15;

    // Update meshes
    if (headRef.current) headRef.current.position.copy(positions.current[0]);
    for (let i = 0; i < bodyRefs.current.length; i++) {
      const m = bodyRefs.current[i];
      if (m) m.position.copy(positions.current[i + 1]);
      // Crawling leg wave
      const lg = legRefs.current[i];
      if (lg) {
        lg.position.copy(positions.current[i + 1]);
        const legWave = Math.sin(t * 10 - i * 0.5) * 0.35;
        lg.rotation.z = legWave;
      }
    }

    // Supercharge glow pulsing
    if (glowRef.current) {
      glowRef.current.intensity = supercharged ? 2 + Math.sin(t * 15) * 1.5 : 0;
      glowRef.current.position.copy(head);
    }

    if (!catchCalled.current && !isHiddenRef.current && dist < 2.2) {
      catchCalled.current = true;
      onCatch();
    }
  });

  // Segment keys
  const segKeys = Array.from(
    { length: SEGMENTS - 1 },
    (_, i) => `${segKey}-seg-${i}`,
  );

  return (
    <group>
      {/* Head */}
      <mesh ref={headRef} position={positions.current[0]}>
        <sphereGeometry args={[0.7, 12, 12]} />
        <meshLambertMaterial color={supercharged ? "#ff4400" : "#1a3300"} />
      </mesh>

      {/* Eyes on head rendered separately */}
      <group position={positions.current[0]}>
        <mesh position={[0.3, 0.2, 0.55]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial
            color={supercharged ? "#ff0000" : "#00ff00"}
            emissive={supercharged ? "#ff0000" : "#00ff00"}
            emissiveIntensity={3}
          />
        </mesh>
        <mesh position={[-0.3, 0.2, 0.55]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial
            color={supercharged ? "#ff0000" : "#00ff00"}
            emissive={supercharged ? "#ff0000" : "#00ff00"}
            emissiveIntensity={3}
          />
        </mesh>
        {/* Mandibles */}
        <mesh position={[0.25, -0.15, 0.65]} rotation={[0.4, 0.3, 0]}>
          <boxGeometry args={[0.08, 0.25, 0.08]} />
          <meshLambertMaterial color="#0a2200" />
        </mesh>
        <mesh position={[-0.25, -0.15, 0.65]} rotation={[0.4, -0.3, 0]}>
          <boxGeometry args={[0.08, 0.25, 0.08]} />
          <meshLambertMaterial color="#0a2200" />
        </mesh>
        {/* Antennae */}
        <mesh position={[0.18, 0.35, 0.5]} rotation={[-0.6, 0.2, 0.1]}>
          <cylinderGeometry args={[0.02, 0.04, 0.6, 4]} />
          <meshLambertMaterial color="#0d2200" />
        </mesh>
        <mesh position={[-0.18, 0.35, 0.5]} rotation={[-0.6, -0.2, -0.1]}>
          <cylinderGeometry args={[0.02, 0.04, 0.6, 4]} />
          <meshLambertMaterial color="#0d2200" />
        </mesh>
      </group>

      {/* Body segments */}
      {segKeys.map((k, i) => {
        const segSize = Math.max(0.25, 0.55 - i * 0.004); // taper toward tail
        const isArmored = i % 3 === 0;
        return (
          <group key={k}>
            {/* Body segment */}
            <mesh
              ref={(el) => {
                bodyRefs.current[i] = el;
              }}
              position={positions.current[i + 1]}
            >
              <sphereGeometry args={[segSize, 8, 8]} />
              <meshLambertMaterial
                color={
                  supercharged
                    ? i % 2 === 0
                      ? "#cc3300"
                      : "#991100"
                    : isArmored
                      ? "#2a5500"
                      : i % 2 === 0
                        ? "#1a4400"
                        : "#0d2200"
                }
              />
            </mesh>
            {/* Legs on every segment (4 legs per segment - 2 pairs) */}
            {i % 2 === 0 && (
              <group
                ref={(el) => {
                  legRefs.current[i] = el;
                }}
                position={positions.current[i + 1]}
              >
                {/* Left legs */}
                <mesh
                  position={[-segSize - 0.1, 0, 0.15]}
                  rotation={[0, 0, Math.PI / 4]}
                >
                  <cylinderGeometry args={[0.025, 0.015, segSize * 1.6, 4]} />
                  <meshLambertMaterial color="#0a1a00" />
                </mesh>
                <mesh
                  position={[-segSize - 0.1, 0, -0.15]}
                  rotation={[0, 0, Math.PI / 4]}
                >
                  <cylinderGeometry args={[0.025, 0.015, segSize * 1.6, 4]} />
                  <meshLambertMaterial color="#0a1a00" />
                </mesh>
                {/* Right legs */}
                <mesh
                  position={[segSize + 0.1, 0, 0.15]}
                  rotation={[0, 0, -Math.PI / 4]}
                >
                  <cylinderGeometry args={[0.025, 0.015, segSize * 1.6, 4]} />
                  <meshLambertMaterial color="#0a1a00" />
                </mesh>
                <mesh
                  position={[segSize + 0.1, 0, -0.15]}
                  rotation={[0, 0, -Math.PI / 4]}
                >
                  <cylinderGeometry args={[0.025, 0.015, segSize * 1.6, 4]} />
                  <meshLambertMaterial color="#0a1a00" />
                </mesh>
              </group>
            )}
          </group>
        );
      })}

      {/* Supercharge glow light */}
      <pointLight ref={glowRef} color="#ff4400" intensity={0} distance={20} />
    </group>
  );
}

// ─── Player Torch ────────────────────────────────────────────────────────────
function PlayerTorch({
  playerPosRef,
  yawRef,
  pitchRef,
  enabled,
}: {
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  yawRef: React.MutableRefObject<number>;
  pitchRef: React.MutableRefObject<number>;
  enabled: boolean;
}) {
  const lightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);

  useFrame(() => {
    if (!lightRef.current || !targetRef.current) return;
    const pos = playerPosRef.current;
    const eyeY = pos.y + 1.7;
    lightRef.current.position.set(pos.x, eyeY, pos.z);
    const tx = pos.x - Math.sin(yawRef.current) * 10;
    const tz = pos.z - Math.cos(yawRef.current) * 10;
    const ty = eyeY + Math.sin(pitchRef.current) * 10 - 0.5;
    targetRef.current.position.set(tx, ty, tz);
    lightRef.current.target = targetRef.current;
  });

  if (!enabled) return null;
  return (
    <>
      <object3D ref={targetRef} />
      <spotLight
        ref={lightRef}
        color="#fffae0"
        intensity={4}
        distance={30}
        angle={Math.PI / 5}
        penumbra={0.4}
        castShadow
        shadow-mapSize={[512, 512]}
      />
      <pointLight
        position={[0, 1.7, 0]}
        color="#ffeecc"
        intensity={0.3}
        distance={5}
      />
    </>
  );
}

// ─── Player with running animation ───────────────────────────────────────────
function PlayerMesh({
  playerPosRef,
  cameraMode,
  isRunning,
}: {
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  cameraMode: CameraMode;
  isRunning: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const legLRef = useRef<THREE.Mesh>(null);
  const legRRef = useRef<THREE.Mesh>(null);
  const armLRef = useRef<THREE.Mesh>(null);
  const armRRef = useRef<THREE.Mesh>(null);
  const walkPhaseRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const pos = playerPosRef.current;
    groupRef.current.position.set(pos.x, pos.y, pos.z);

    // Running/walking animation
    if (isRunning) {
      walkPhaseRef.current += delta * 14;
    } else {
      walkPhaseRef.current += delta * 6;
    }
    const swing = Math.sin(walkPhaseRef.current) * (isRunning ? 0.7 : 0.4);
    if (legLRef.current) legLRef.current.rotation.x = swing;
    if (legRRef.current) legRRef.current.rotation.x = -swing;
    if (armLRef.current) armLRef.current.rotation.x = -swing * 0.6;
    if (armRRef.current) armRRef.current.rotation.x = swing * 0.6;
    // Slight body bounce
    const bounce =
      Math.abs(Math.sin(walkPhaseRef.current * 2)) * (isRunning ? 0.1 : 0.04);
    groupRef.current.position.y = pos.y + bounce;
  });

  if (cameraMode === "first") return null; // Don't render player in FPV

  return (
    <group
      ref={groupRef}
      position={[playerPosRef.current.x, 0, playerPosRef.current.z]}
    >
      {/* Torso */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.45, 0.65, 0.24]} />
        <meshLambertMaterial color="#1155aa" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.62, 0]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.28]} />
        <meshLambertMaterial color="#ffcc88" />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 1.79, 0]}>
        <boxGeometry args={[0.32, 0.1, 0.3]} />
        <meshLambertMaterial color="#221100" />
      </mesh>
      {/* Backpack (visual detail) */}
      <mesh position={[0, 1.05, -0.18]}>
        <boxGeometry args={[0.3, 0.5, 0.14]} />
        <meshLambertMaterial color="#884422" />
      </mesh>
      {/* Left leg */}
      <mesh ref={legLRef} position={[-0.12, 0.5, 0]} castShadow>
        <boxGeometry args={[0.17, 0.6, 0.19]} />
        <meshLambertMaterial color="#334477" />
      </mesh>
      {/* Right leg */}
      <mesh ref={legRRef} position={[0.12, 0.5, 0]} castShadow>
        <boxGeometry args={[0.17, 0.6, 0.19]} />
        <meshLambertMaterial color="#334477" />
      </mesh>
      {/* Left arm */}
      <mesh ref={armLRef} position={[-0.3, 1.05, 0]} castShadow>
        <boxGeometry args={[0.15, 0.52, 0.17]} />
        <meshLambertMaterial color="#1155aa" />
      </mesh>
      {/* Right arm */}
      <mesh ref={armRRef} position={[0.3, 1.05, 0]} castShadow>
        <boxGeometry args={[0.15, 0.52, 0.17]} />
        <meshLambertMaterial color="#1155aa" />
      </mesh>
      {/* Feet */}
      <mesh position={[-0.12, 0.09, 0.07]}>
        <boxGeometry args={[0.16, 0.11, 0.32]} />
        <meshLambertMaterial color="#221100" />
      </mesh>
      <mesh position={[0.12, 0.09, 0.07]}>
        <boxGeometry args={[0.16, 0.11, 0.32]} />
        <meshLambertMaterial color="#221100" />
      </mesh>
    </group>
  );
}

// ─── Player Controller ────────────────────────────────────────────────────────
interface PlayerControllerProps {
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  cameraMode: CameraMode;
  keysRef: React.MutableRefObject<Set<string>>;
  mouseRef: React.MutableRefObject<{ dx: number; dy: number }>;
  yawRef: React.MutableRefObject<number>;
  pitchRef: React.MutableRefObject<number>;
  staminaRef: React.MutableRefObject<number>;
  onStaminaChange: (v: number) => void;
  nearHouseRef: React.MutableRefObject<boolean>;
  onNearHouseChange: (v: boolean) => void;
  joystickRef: React.MutableRefObject<{ x: number; y: number }>;
  jumpRef: React.MutableRefObject<boolean>;
  playerSpeedBoostRef: React.MutableRefObject<number>;
  onRunningChange: (r: boolean) => void;
}

function PlayerController({
  playerPosRef,
  cameraMode,
  keysRef,
  mouseRef,
  yawRef,
  pitchRef,
  staminaRef,
  onStaminaChange,
  nearHouseRef,
  onNearHouseChange,
  joystickRef,
  jumpRef,
  playerSpeedBoostRef,
  onRunningChange,
}: PlayerControllerProps) {
  const { camera } = useThree();
  const velYRef = useRef(0);
  const onGroundRef = useRef(true);

  useFrame((_, delta) => {
    const keys = keysRef.current;
    const running = keys.has("ShiftLeft") || keys.has("ShiftRight");
    onRunningChange(running);
    const baseSpeed = 4 + playerSpeedBoostRef.current;
    const speed = running ? baseSpeed * 1.9 : baseSpeed;

    const isMoving =
      keys.has("KeyW") ||
      keys.has("KeyS") ||
      keys.has("KeyA") ||
      keys.has("KeyD") ||
      Math.abs(joystickRef.current.x) > 0.1 ||
      Math.abs(joystickRef.current.y) > 0.1;

    if (running && isMoving) {
      staminaRef.current = Math.max(0, staminaRef.current - delta * 20);
    } else {
      staminaRef.current = Math.min(100, staminaRef.current + delta * 10);
    }
    onStaminaChange(staminaRef.current);

    const { dx, dy } = mouseRef.current;
    yawRef.current -= dx * 0.002;
    pitchRef.current = Math.max(
      -0.6,
      Math.min(0.6, pitchRef.current - dy * 0.002),
    );
    mouseRef.current.dx = 0;
    mouseRef.current.dy = 0;

    const forward = new THREE.Vector3(
      -Math.sin(yawRef.current),
      0,
      -Math.cos(yawRef.current),
    );
    const right = new THREE.Vector3(
      Math.cos(yawRef.current),
      0,
      -Math.sin(yawRef.current),
    );
    const move = new THREE.Vector3();

    if (keys.has("KeyW")) move.addScaledVector(forward, 1);
    if (keys.has("KeyS")) move.addScaledVector(forward, -1);
    if (keys.has("KeyA")) move.addScaledVector(right, -1);
    if (keys.has("KeyD")) move.addScaledVector(right, 1);

    const jx = joystickRef.current.x;
    const jy = joystickRef.current.y;
    if (Math.abs(jy) > 0.1) move.addScaledVector(forward, -jy);
    if (Math.abs(jx) > 0.1) move.addScaledVector(right, jx);

    if (move.length() > 0) move.normalize();

    const pos = playerPosRef.current;
    const effectiveSpeed = staminaRef.current > 0 ? speed : 3;
    pos.x = Math.max(
      -140,
      Math.min(140, pos.x + move.x * effectiveSpeed * delta),
    );
    pos.z = Math.max(
      -140,
      Math.min(140, pos.z + move.z * effectiveSpeed * delta),
    );

    const GRAVITY = -20;
    const JUMP_VEL = 7.5;
    if ((keys.has("Space") || jumpRef.current) && onGroundRef.current) {
      velYRef.current = JUMP_VEL;
      onGroundRef.current = false;
      jumpRef.current = false;
    } else {
      jumpRef.current = false;
    }
    velYRef.current += GRAVITY * delta;
    pos.y = Math.max(0, pos.y + velYRef.current * delta);
    if (pos.y <= 0) {
      pos.y = 0;
      velYRef.current = 0;
      onGroundRef.current = true;
    }

    let near = false;
    for (const hp of HOUSE_POSITIONS) {
      if (pos.distanceTo(hp) < 5.5) {
        near = true;
        break;
      }
    }
    if (near !== nearHouseRef.current) {
      nearHouseRef.current = near;
      onNearHouseChange(near);
    }

    if (cameraMode === "first") {
      camera.position.set(pos.x, pos.y + 1.7, pos.z);
      camera.rotation.order = "YXZ";
      camera.rotation.y = yawRef.current;
      camera.rotation.x = pitchRef.current;
    } else {
      const tpDist = 5.5;
      camera.position.set(
        pos.x + Math.sin(yawRef.current) * tpDist,
        pos.y + 3,
        pos.z + Math.cos(yawRef.current) * tpDist,
      );
      camera.lookAt(pos.x, pos.y + 1.2, pos.z);
    }
  });

  return null;
}

// ─── Game Scene ───────────────────────────────────────────────────────────────
interface GameSceneProps {
  mode: GameMode;
  map: MapType;
  dayMode: DayMode;
  cameraMode: CameraMode;
  torchEnabled: boolean;
  onGameOver: (time: number) => void;
  onStaminaChange: (v: number) => void;
  onTimeChange: (v: number) => void;
  onNearHouseChange: (v: boolean) => void;
  onJumpscare: () => void;
  onSupercharge: (active: boolean) => void;
  isHiddenRef: React.MutableRefObject<boolean>;
  keysRef: React.MutableRefObject<Set<string>>;
  mouseRef: React.MutableRefObject<{ dx: number; dy: number }>;
  yawRef: React.MutableRefObject<number>;
  pitchRef: React.MutableRefObject<number>;
  staminaRef: React.MutableRefObject<number>;
  audioRef: React.MutableRefObject<AudioContext | null>;
  nearHouseRef: React.MutableRefObject<boolean>;
  joystickRef: React.MutableRefObject<{ x: number; y: number }>;
  jumpRef: React.MutableRefObject<boolean>;
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  playerSpeedBoostRef: React.MutableRefObject<number>;
  onRunningChange: (r: boolean) => void;
}

function GameScene({
  mode,
  map,
  dayMode,
  cameraMode,
  torchEnabled,
  onGameOver,
  onStaminaChange,
  onTimeChange,
  onNearHouseChange,
  onJumpscare,
  onSupercharge,
  isHiddenRef,
  keysRef,
  mouseRef,
  yawRef,
  pitchRef,
  staminaRef,
  audioRef,
  nearHouseRef,
  joystickRef,
  jumpRef,
  playerPosRef,
  playerSpeedBoostRef,
  onRunningChange,
}: GameSceneProps) {
  const timeRef = useRef(0);
  const jumpscareTimerRef = useRef(60 + Math.random() * 120);
  const heartbeatTimerRef = useRef(0);
  const gameOverCalledRef = useRef(false);
  const lastMinuteRef = useRef(0);
  const superchargedRef = useRef(false);
  const [supercharged, setSupercharged] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const centipedeBaseSpeed =
    mode === "nightmare" ? 7 : mode === "challenge" ? 6 : 4.5;
  const canHide = mode !== "challenge";
  const isDay = dayMode === "day";
  const fogDensity = isDay ? 0.005 : mode === "challenge" ? 0.03 : 0.016;
  const skyColor = isDay ? MAP_COLORS[map].skyDay : MAP_COLORS[map].skyNight;
  const fogColor = isDay ? MAP_COLORS[map].fogDay : MAP_COLORS[map].fogNight;

  const { scene } = useThree();
  useEffect(() => {
    scene.fog = new THREE.FogExp2(fogColor, fogDensity);
    scene.background = new THREE.Color(skyColor);
    return () => {
      scene.fog = null;
    };
  }, [scene, skyColor, fogColor, fogDensity]);

  useFrame((_, delta) => {
    if (gameOverCalledRef.current) return;
    timeRef.current += delta;
    const t = Math.floor(timeRef.current);
    onTimeChange(t);

    // Every 1 minute: supercharge centipede + boost player speed
    const currentMinute = Math.floor(timeRef.current / 60);
    if (currentMinute > lastMinuteRef.current) {
      lastMinuteRef.current = currentMinute;
      // Supercharge centipede for 10 seconds
      superchargedRef.current = true;
      setSupercharged(true);
      onSupercharge(true);
      playSupercharge(getAC(audioRef));
      // Boost player speed permanently (stacks)
      playerSpeedBoostRef.current += 1.5;
      setTimeout(() => {
        superchargedRef.current = false;
        setSupercharged(false);
        onSupercharge(false);
      }, 10000);
    }

    jumpscareTimerRef.current -= delta;
    if (jumpscareTimerRef.current <= 0) {
      jumpscareTimerRef.current = 60 + Math.random() * 120;
      onJumpscare();
      playJumpscare(getAC(audioRef));
    }
    heartbeatTimerRef.current -= delta;
  });

  const handleCatch = useCallback(() => {
    if (!gameOverCalledRef.current) {
      gameOverCalledRef.current = true;
      onGameOver(Math.floor(timeRef.current));
    }
  }, [onGameOver]);

  const handleDistanceUpdate = useCallback(
    (dist: number) => {
      if (dist < 22 && heartbeatTimerRef.current <= 0) {
        heartbeatTimerRef.current = 1.2 - Math.max(0, (22 - dist) / 22) * 0.9;
        playHeartbeat(getAC(audioRef));
      }
    },
    [audioRef],
  );

  return (
    <>
      {/* Lighting */}
      <ambientLight
        intensity={isDay ? 1.2 : 0.12}
        color={isDay ? "#ffffff" : "#334466"}
      />
      <directionalLight
        position={[50, 80, 30]}
        intensity={isDay ? 2.5 : 0.25}
        color={isDay ? "#fffbe0" : "#aabbff"}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={250}
      />
      {!isDay && (
        <directionalLight
          position={[-40, 60, -20]}
          intensity={0.15}
          color="#8899cc"
        />
      )}

      {/* Supercharge red ambient when active */}
      {supercharged && <ambientLight intensity={0.4} color="#ff2200" />}

      <PlayerTorch
        playerPosRef={playerPosRef}
        yawRef={yawRef}
        pitchRef={pitchRef}
        enabled={torchEnabled && !isDay}
      />

      <Ground map={map} />
      <Grass />
      <Trees />
      <Rocks />
      <Houses canHide={canHide} dayMode={dayMode} />

      {NPC_DATA.map((npc) => (
        <NPC key={npc.id} startX={npc.x} startZ={npc.z} fleeing={false} />
      ))}

      {/* Monster centipede - 67 segments */}
      <Centipede
        playerPosRef={playerPosRef}
        baseSpeed={centipedeBaseSpeed}
        supercharged={supercharged}
        onCatch={handleCatch}
        isHiddenRef={isHiddenRef}
        startOffset={0}
        segKey="c1"
        onDistanceUpdate={handleDistanceUpdate}
      />
      {mode === "nightmare" && (
        <Centipede
          playerPosRef={playerPosRef}
          baseSpeed={centipedeBaseSpeed}
          supercharged={supercharged}
          onCatch={handleCatch}
          isHiddenRef={isHiddenRef}
          startOffset={Math.PI}
          segKey="c2"
        />
      )}

      {/* Player mesh with running animation */}
      <PlayerMesh
        playerPosRef={playerPosRef}
        cameraMode={cameraMode}
        isRunning={isRunning}
      />

      <PlayerController
        playerPosRef={playerPosRef}
        cameraMode={cameraMode}
        keysRef={keysRef}
        mouseRef={mouseRef}
        yawRef={yawRef}
        pitchRef={pitchRef}
        staminaRef={staminaRef}
        onStaminaChange={onStaminaChange}
        nearHouseRef={nearHouseRef}
        onNearHouseChange={onNearHouseChange}
        joystickRef={joystickRef}
        jumpRef={jumpRef}
        playerSpeedBoostRef={playerSpeedBoostRef}
        onRunningChange={(r) => {
          setIsRunning(r);
          onRunningChange(r);
        }}
      />
    </>
  );
}

// ─── Movement Buttons ─────────────────────────────────────────────────────────
function MovementButtons({
  keysRef,
  joystickRef,
  jumpRef,
  onJump,
}: {
  keysRef: React.MutableRefObject<Set<string>>;
  joystickRef: React.MutableRefObject<{ x: number; y: number }>;
  jumpRef: React.MutableRefObject<boolean>;
  onJump: () => void;
}) {
  const joystickAreaRef = useRef<HTMLDivElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);
  const baseCenter = useRef({ x: 0, y: 0 });
  const MAX_DIST = 38;

  const updateJoystick = useCallback(
    (clientX: number, clientY: number) => {
      const dx = clientX - baseCenter.current.x;
      const dy = clientY - baseCenter.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const clamped = Math.min(dist, MAX_DIST);
      const angle = Math.atan2(dy, dx);
      const nx = Math.cos(angle) * clamped;
      const ny = Math.sin(angle) * clamped;
      joystickRef.current.x = nx / MAX_DIST;
      joystickRef.current.y = ny / MAX_DIST;
      if (joystickKnobRef.current) {
        joystickKnobRef.current.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
      }
    },
    [joystickRef],
  );

  const resetJoystick = useCallback(() => {
    joystickRef.current.x = 0;
    joystickRef.current.y = 0;
    touchIdRef.current = null;
    if (joystickKnobRef.current)
      joystickKnobRef.current.style.transform = "translate(-50%, -50%)";
  }, [joystickRef]);

  useEffect(() => {
    const el = joystickAreaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    baseCenter.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    const onTouchStart = (e: TouchEvent) => {
      if (touchIdRef.current !== null) return;
      const t = e.changedTouches[0];
      touchIdRef.current = t.identifier;
      const r = el.getBoundingClientRect();
      baseCenter.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      updateJoystick(t.clientX, t.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current)
          updateJoystick(
            e.changedTouches[i].clientX,
            e.changedTouches[i].clientY,
          );
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current)
          resetJoystick();
      }
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [updateJoystick, resetJoystick]);

  const btnStyle = (color: string): React.CSSProperties => ({
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: `rgba(${color}, 0.5)`,
    border: `2px solid rgba(${color}, 0.8)`,
    color: "#fff",
    fontSize: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    userSelect: "none",
    WebkitUserSelect: "none",
    touchAction: "none",
  });

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: 0,
        right: 0,
        zIndex: 10010,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        padding: "0 24px",
        pointerEvents: "none",
      }}
    >
      <div
        ref={joystickAreaRef}
        style={{
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.35)",
          border: "2px solid rgba(255,255,255,0.25)",
          position: "relative",
          pointerEvents: "all",
          touchAction: "none",
          flexShrink: 0,
        }}
      >
        <div
          ref={joystickKnobRef}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.6)",
            border: "2px solid rgba(255,255,255,0.9)",
            pointerEvents: "none",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          pointerEvents: "all",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            jumpRef.current = true;
            onJump();
          }}
          style={btnStyle("255, 200, 50")}
        >
          ↑
        </button>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            keysRef.current.add("ShiftLeft");
          }}
          onPointerUp={() => keysRef.current.delete("ShiftLeft")}
          onPointerLeave={() => keysRef.current.delete("ShiftLeft")}
          style={btnStyle("100, 200, 100")}
        >
          🏃
        </button>
      </div>
    </div>
  );
}

// ─── Menu Screen ──────────────────────────────────────────────────────────────
function MenuScreen({
  onStart,
  onClose,
}: {
  onStart: (
    mode: GameMode,
    map: MapType,
    cam: CameraMode,
    day: DayMode,
  ) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<GameMode>("endless");
  const [map, setMap] = useState<MapType>("forest");
  const [cam, setCam] = useState<CameraMode>("third");
  const [day, setDay] = useState<DayMode>("night");

  const modes: { v: GameMode; label: string; desc: string }[] = [
    {
      v: "endless",
      label: "Endless",
      desc: "Infinite survival, hide in houses",
    },
    {
      v: "challenge",
      label: "Challenge",
      desc: "Fog night, fast hunt, one life",
    },
    { v: "nightmare", label: "Nightmare", desc: "2 centipedes, 2× speed" },
  ];

  const maps: { v: MapType; label: string }[] = [
    { v: "forest", label: "🌲 Dark Forest" },
    { v: "village", label: "🏚 Abandoned Village" },
    { v: "graveyard", label: "⚰️ Graveyard" },
    { v: "city", label: "🏙 Deserted City" },
    { v: "swamp", label: "🌿 Swamp" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background:
          "linear-gradient(135deg, #000000 0%, #0a0510 50%, #050210 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        color: "#fff",
        padding: "20px",
        overflowY: "auto",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.3)",
          color: "#fff",
          width: 36,
          height: 36,
          borderRadius: "50%",
          fontSize: 18,
          cursor: "pointer",
          zIndex: 10001,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        data-ocid="game.close_button"
      >
        ✕
      </button>

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div
          style={{
            fontSize: 34,
            fontWeight: 900,
            letterSpacing: 2,
            textShadow: "0 0 30px #ff0000, 0 0 60px #880000",
            color: "#ff3333",
          }}
        >
          🦟 NIGHT CENTIPEDE HUNT
        </div>
        <div
          style={{ fontSize: 13, color: "#ff9999", marginTop: 6, opacity: 0.8 }}
        >
          Survive. Hide. Run. Don't look back.
        </div>
        <div style={{ fontSize: 11, color: "#aa6666", marginTop: 4 }}>
          ⚡ Every 1 minute: centipede SUPERCHARGES • Your speed increases
          permanently
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          maxWidth: 680,
          width: "100%",
        }}
      >
        <div
          style={{
            background: "rgba(255,0,0,0.05)",
            border: "1px solid rgba(255,0,0,0.2)",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#ff9999",
              marginBottom: 8,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            GAME MODE
          </div>
          {modes.map((m) => (
            <button
              type="button"
              key={m.v}
              onClick={() => setMode(m.v)}
              data-ocid={`game.${m.v}.tab`}
              style={{
                display: "block",
                width: "100%",
                marginBottom: 6,
                padding: "9px 12px",
                background:
                  mode === m.v
                    ? "rgba(255,0,0,0.25)"
                    : "rgba(255,255,255,0.04)",
                border:
                  mode === m.v
                    ? "1px solid rgba(255,80,80,0.8)"
                    : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: mode === m.v ? "#ff9999" : "#aaa",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13 }}>{m.label}</div>
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>
                {m.desc}
              </div>
            </button>
          ))}
        </div>
        <div
          style={{
            background: "rgba(255,0,0,0.05)",
            border: "1px solid rgba(255,0,0,0.2)",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#ff9999",
              marginBottom: 8,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            MAP
          </div>
          {maps.map((m) => (
            <button
              type="button"
              key={m.v}
              onClick={() => setMap(m.v)}
              data-ocid={`game.${m.v}.tab`}
              style={{
                display: "block",
                width: "100%",
                marginBottom: 6,
                padding: "9px 12px",
                background:
                  map === m.v ? "rgba(255,0,0,0.25)" : "rgba(255,255,255,0.04)",
                border:
                  map === m.v
                    ? "1px solid rgba(255,80,80,0.8)"
                    : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: map === m.v ? "#ff9999" : "#aaa",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {(["third", "first"] as CameraMode[]).map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => setCam(c)}
            data-ocid={`game.${c}_camera.toggle`}
            style={{
              padding: "9px 18px",
              background:
                cam === c ? "rgba(255,0,0,0.3)" : "rgba(255,255,255,0.06)",
              border:
                cam === c
                  ? "1px solid #ff5555"
                  : "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
              color: cam === c ? "#fff" : "#888",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {c === "third" ? "🎥 Third Person" : "👁 First Person"}
          </button>
        ))}
        {(["day", "night"] as DayMode[]).map((d) => (
          <button
            type="button"
            key={d}
            onClick={() => setDay(d)}
            data-ocid={`game.${d}_mode.toggle`}
            style={{
              padding: "9px 18px",
              background:
                day === d ? "rgba(255,180,0,0.3)" : "rgba(255,255,255,0.06)",
              border:
                day === d
                  ? "1px solid #ffcc44"
                  : "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
              color: day === d ? "#ffee88" : "#888",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {d === "day" ? "☀️ Day" : "🌙 Night"}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onStart(mode, map, cam, day)}
        data-ocid="game.start.primary_button"
        style={{
          marginTop: 22,
          padding: "14px 52px",
          background: "linear-gradient(135deg, #cc0000, #880000)",
          border: "1px solid #ff4444",
          borderRadius: 10,
          color: "#fff",
          fontSize: 18,
          fontWeight: 800,
          cursor: "pointer",
          letterSpacing: 2,
          boxShadow: "0 0 30px rgba(255,0,0,0.4)",
        }}
      >
        ▶ START GAME
      </button>
      <div
        style={{
          marginTop: 12,
          fontSize: 10,
          color: "#555",
          textAlign: "center",
        }}
      >
        WASD = Move | Mouse = Look | Space/↑ = Jump | Shift/🏃 = Run | E = Hide
        | V = Camera | T = Torch
      </div>
    </div>
  );
}

// ─── HUD ─────────────────────────────────────────────────────────────────────
function HUD({
  stamina,
  time,
  cameraMode,
  dayMode,
  torchEnabled,
  nearHouse,
  isHidden,
  jumpscareActive,
  superchargeActive,
  playerSpeedLevel,
  onToggleCamera,
  onToggleDay,
  onToggleTorch,
  onPause,
  onClose,
}: {
  stamina: number;
  time: number;
  cameraMode: CameraMode;
  dayMode: DayMode;
  torchEnabled: boolean;
  nearHouse: boolean;
  isHidden: boolean;
  jumpscareActive: boolean;
  superchargeActive: boolean;
  playerSpeedLevel: number;
  onToggleCamera: () => void;
  onToggleDay: () => void;
  onToggleTorch: () => void;
  onPause: () => void;
  onClose: () => void;
}) {
  const mins = Math.floor(time / 60)
    .toString()
    .padStart(2, "0");
  const secs = (time % 60).toString().padStart(2, "0");

  return (
    <>
      {/* Jumpscare overlay */}
      {jumpscareActive && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10002,
            background: "rgba(255,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontSize: 90,
              color: "#fff",
              fontWeight: 900,
              textShadow: "0 0 40px #ff0000",
              animation: "none",
            }}
          >
            ⚠
          </div>
        </div>
      )}

      {/* Supercharge warning overlay */}
      {superchargeActive && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10001,
            border: "4px solid rgba(255,60,0,0.8)",
            pointerEvents: "none",
            boxShadow: "inset 0 0 80px rgba(255,0,0,0.35)",
          }}
        />
      )}

      {/* Top bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10001,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)",
          pointerEvents: "none",
        }}
      >
        {/* Left: Stamina + speed level */}
        <div style={{ pointerEvents: "none" }}>
          <div
            style={{
              fontSize: 10,
              color: "#ff9999",
              marginBottom: 3,
              letterSpacing: 1,
            }}
          >
            STAMINA
          </div>
          <div
            style={{
              width: 110,
              height: 7,
              background: "rgba(255,255,255,0.15)",
              borderRadius: 4,
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 4,
                width: `${stamina}%`,
                background:
                  stamina > 50
                    ? "#44ff88"
                    : stamina > 25
                      ? "#ffaa00"
                      : "#ff3333",
                transition: "width 0.1s",
              }}
            />
          </div>
          {playerSpeedLevel > 0 && (
            <div style={{ fontSize: 9, color: "#88ffaa", marginTop: 3 }}>
              ⚡ Speed +{playerSpeedLevel} (lv
              {Math.ceil(playerSpeedLevel / 1.5)})
            </div>
          )}
        </div>

        {/* Center: Time */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#fff",
              textShadow: "0 0 10px rgba(255,100,100,0.5)",
              pointerEvents: "none",
            }}
          >
            ⏱ {mins}:{secs}
          </div>
          {superchargeActive && (
            <div
              style={{
                fontSize: 10,
                color: "#ff6600",
                fontWeight: 700,
                animation: "none",
              }}
            >
              ⚡ SUPERCHARGED!
            </div>
          )}
        </div>

        {/* Right: Buttons */}
        <div
          style={{
            display: "flex",
            gap: 6,
            pointerEvents: "all",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onToggleCamera}
            data-ocid="game.camera.toggle"
            style={{
              padding: "5px 9px",
              background: "rgba(0,0,0,0.65)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 6,
              color: "#fff",
              cursor: "pointer",
              fontSize: 11,
            }}
          >
            {cameraMode === "third" ? "👁 FPV" : "🎥 TPV"}
          </button>
          <button
            type="button"
            onClick={onToggleDay}
            data-ocid="game.day.toggle"
            style={{
              padding: "5px 9px",
              background: "rgba(0,0,0,0.65)",
              border: "1px solid rgba(255,220,0,0.4)",
              borderRadius: 6,
              color: "#ffee88",
              cursor: "pointer",
              fontSize: 11,
            }}
          >
            {dayMode === "day" ? "🌙 Night" : "☀️ Day"}
          </button>
          {dayMode === "night" && (
            <button
              type="button"
              onClick={onToggleTorch}
              data-ocid="game.torch.toggle"
              style={{
                padding: "5px 9px",
                background: torchEnabled
                  ? "rgba(255,180,0,0.3)"
                  : "rgba(0,0,0,0.65)",
                border: torchEnabled
                  ? "1px solid #ffcc44"
                  : "1px solid rgba(255,255,255,0.2)",
                borderRadius: 6,
                color: torchEnabled ? "#ffee88" : "#888",
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              🔦 Torch
            </button>
          )}
          <button
            type="button"
            onClick={onPause}
            data-ocid="game.pause.button"
            style={{
              padding: "5px 9px",
              background: "rgba(0,0,0,0.65)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 6,
              color: "#fff",
              cursor: "pointer",
              fontSize: 11,
            }}
          >
            ⏸ Menu
          </button>
          <button
            type="button"
            onClick={onClose}
            data-ocid="game.close_button"
            style={{
              padding: "5px 9px",
              background: "rgba(180,0,0,0.5)",
              border: "1px solid rgba(255,80,80,0.5)",
              borderRadius: 6,
              color: "#fff",
              cursor: "pointer",
              fontSize: 11,
            }}
          >
            ✕ Exit
          </button>
        </div>
      </div>

      {nearHouse && !isHidden && (
        <div
          style={{
            position: "fixed",
            bottom: 140,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10001,
            background: "rgba(0,0,0,0.75)",
            border: "1px solid rgba(255,200,0,0.6)",
            padding: "8px 18px",
            borderRadius: 8,
            color: "#ffcc00",
            fontSize: 14,
            fontWeight: 700,
            pointerEvents: "none",
          }}
        >
          Press E to hide
        </div>
      )}
      {isHidden && (
        <div
          style={{
            position: "fixed",
            bottom: 140,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10001,
            background: "rgba(0,100,0,0.8)",
            border: "1px solid rgba(0,255,0,0.6)",
            padding: "8px 18px",
            borderRadius: 8,
            color: "#00ff88",
            fontSize: 14,
            fontWeight: 700,
            pointerEvents: "none",
          }}
        >
          🏠 HIDDEN — Press E to exit
        </div>
      )}

      {/* Crosshair */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 16,
          height: 16,
          pointerEvents: "none",
          zIndex: 10001,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 7,
            left: 0,
            width: 16,
            height: 2,
            background: "rgba(255,255,255,0.7)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 7,
            width: 2,
            height: 16,
            background: "rgba(255,255,255,0.7)",
          }}
        />
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 130,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 10,
          color: "rgba(255,255,255,0.3)",
          pointerEvents: "none",
          zIndex: 10001,
          whiteSpace: "nowrap",
        }}
      >
        Click to lock mouse | WASD/joystick = move | Space/↑ = jump | Shift/🏃 =
        run | E = hide | V = cam | T = torch
      </div>
    </>
  );
}

// ─── Game Over Screen ─────────────────────────────────────────────────────────
function GameOverScreen({
  time,
  onRestart,
  onMenu,
  onClose,
}: {
  time: number;
  onRestart: () => void;
  onMenu: () => void;
  onClose: () => void;
}) {
  const mins = Math.floor(time / 60)
    .toString()
    .padStart(2, "0");
  const secs = (time % 60).toString().padStart(2, "0");
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        color: "#fff",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.3)",
          color: "#fff",
          width: 36,
          height: 36,
          borderRadius: "50%",
          fontSize: 18,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        data-ocid="gameover.close_button"
      >
        ✕
      </button>
      <div style={{ fontSize: 60, marginBottom: 10 }}>💀</div>
      <div
        style={{
          fontSize: 34,
          fontWeight: 900,
          color: "#ff3333",
          textShadow: "0 0 20px #ff0000",
          marginBottom: 8,
        }}
      >
        CAUGHT!
      </div>
      <div style={{ fontSize: 16, color: "#aaa", marginBottom: 28 }}>
        You survived for{" "}
        <span style={{ color: "#fff", fontWeight: 700 }}>
          {mins}:{secs}
        </span>
      </div>
      <div style={{ display: "flex", gap: 14 }}>
        <button
          type="button"
          onClick={onRestart}
          data-ocid="gameover.restart.primary_button"
          style={{
            padding: "11px 28px",
            background: "linear-gradient(135deg, #cc0000, #880000)",
            border: "1px solid #ff4444",
            borderRadius: 8,
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: 1,
          }}
        >
          🔄 Restart
        </button>
        <button
          type="button"
          onClick={onMenu}
          style={{
            padding: "11px 28px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8,
            color: "#ccc",
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          📋 Menu
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function NightCentipedeHunt({ onClose }: Props) {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [gameMode, setGameMode] = useState<GameMode>("endless");
  const [mapType, setMapType] = useState<MapType>("forest");
  const [cameraMode, setCameraMode] = useState<CameraMode>("third");
  const [dayMode, setDayMode] = useState<DayMode>("night");
  const [torchEnabled, setTorchEnabled] = useState(true);
  const [stamina, setStamina] = useState(100);
  const [time, setTime] = useState(0);
  const [survivedTime, setSurvivedTime] = useState(0);
  const [nearHouse, setNearHouse] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [jumpscareActive, setJumpscareActive] = useState(false);
  const [superchargeActive, setSuperchargeActive] = useState(false);
  const [playerSpeedBoost, setPlayerSpeedBoost] = useState(0);

  const playerPosRef = useRef(new THREE.Vector3(0, 0, 5));
  const isHiddenRef = useRef(false);
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({ dx: 0, dy: 0 });
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const staminaRef = useRef(100);
  const audioRef = useRef<AudioContext | null>(null);
  const nearHouseRef = useRef(false);
  const joystickRef = useRef({ x: 0, y: 0 });
  const jumpRef = useRef(false);
  const playerSpeedBoostRef = useRef(0);
  const gameKeyRef = useRef(0);

  // Sync speed boost display
  useEffect(() => {
    const interval = setInterval(() => {
      setPlayerSpeedBoost(playerSpeedBoostRef.current);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleStart = useCallback(
    (mode: GameMode, map: MapType, cam: CameraMode, day: DayMode) => {
      setGameMode(mode);
      setMapType(map);
      setCameraMode(cam);
      setDayMode(day);
      setTorchEnabled(true);
      setStamina(100);
      setTime(0);
      setIsHidden(false);
      setSuperchargeActive(false);
      playerPosRef.current.set(0, 0, 5);
      isHiddenRef.current = false;
      staminaRef.current = 100;
      playerSpeedBoostRef.current = 0;
      gameKeyRef.current += 1;
      setGameState("playing");
      const ac = getAC(audioRef);
      if (ac) startAmbient(ac);
    },
    [],
  );

  const handleGameOver = useCallback((t: number) => {
    setSurvivedTime(t);
    setGameState("gameover");
    stopAmbient();
  }, []);

  const handleRestart = useCallback(() => {
    handleStart(gameMode, mapType, cameraMode, dayMode);
  }, [handleStart, gameMode, mapType, cameraMode, dayMode]);

  // Keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if (e.code === "KeyV")
        setCameraMode((c) => (c === "third" ? "first" : "third"));
      if (e.code === "KeyT") setTorchEnabled((v) => !v);
      if (e.code === "Escape") setGameState("menu");
      if (e.code === "KeyE") {
        if (nearHouseRef.current && gameMode !== "challenge") {
          const newHidden = !isHiddenRef.current;
          isHiddenRef.current = newHidden;
          setIsHidden(newHidden);
          playCreak(getAC(audioRef));
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [gameMode]);

  // Mouse pointer lock + drag-to-look
  useEffect(() => {
    if (gameState !== "playing") return;
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        mouseRef.current.dx += e.movementX;
        mouseRef.current.dy += e.movementY;
      } else {
        // Drag-to-look (no pointer lock needed)
        if (e.buttons === 1) {
          mouseRef.current.dx += e.movementX;
          mouseRef.current.dy += e.movementY;
        }
      }
    };
    const onClick = () => {
      const canvas = document.querySelector("canvas");
      if (canvas && !document.pointerLockElement) canvas.requestPointerLock();
    };
    const onPointerLockChange = () => {};
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("click", onClick);
    document.addEventListener("pointerlockchange", onPointerLockChange);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onClick);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      if (document.pointerLockElement) document.exitPointerLock();
    };
  }, [gameState]);

  // Touch look (second finger drag)
  useEffect(() => {
    if (gameState !== "playing") return;
    let lastTouch = { x: 0, y: 0, id: -1 };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        const t = e.touches[e.touches.length - 1];
        lastTouch = { x: t.clientX, y: t.clientY, id: t.identifier };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        for (let i = 0; i < e.touches.length; i++) {
          if (
            e.touches[i].identifier === lastTouch.id ||
            e.touches.length >= 2
          ) {
            const t = e.touches[e.touches.length > 1 ? 1 : 0];
            mouseRef.current.dx += (t.clientX - lastTouch.x) * 1.5;
            mouseRef.current.dy += (t.clientY - lastTouch.y) * 1.5;
            lastTouch.x = t.clientX;
            lastTouch.y = t.clientY;
            break;
          }
        }
      }
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [gameState]);

  const handleJumpscare = useCallback(() => {
    setJumpscareActive(true);
    setTimeout(() => setJumpscareActive(false), 700);
  }, []);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9998, background: "#000" }}
    >
      {gameState === "menu" && (
        <MenuScreen onStart={handleStart} onClose={onClose} />
      )}

      {gameState !== "menu" && (
        <Canvas
          key={gameKeyRef.current}
          shadows
          camera={{ fov: 75, near: 0.1, far: 500 }}
          style={{ position: "fixed", inset: 0 }}
          gl={{ antialias: true, alpha: false }}
        >
          <Suspense fallback={null}>
            <GameScene
              key={gameKeyRef.current}
              mode={gameMode}
              map={mapType}
              dayMode={dayMode}
              cameraMode={cameraMode}
              torchEnabled={torchEnabled}
              onGameOver={handleGameOver}
              onStaminaChange={setStamina}
              onTimeChange={setTime}
              onNearHouseChange={setNearHouse}
              onJumpscare={handleJumpscare}
              onSupercharge={setSuperchargeActive}
              isHiddenRef={isHiddenRef}
              keysRef={keysRef}
              mouseRef={mouseRef}
              yawRef={yawRef}
              pitchRef={pitchRef}
              staminaRef={staminaRef}
              audioRef={audioRef}
              nearHouseRef={nearHouseRef}
              joystickRef={joystickRef}
              jumpRef={jumpRef}
              playerPosRef={playerPosRef}
              playerSpeedBoostRef={playerSpeedBoostRef}
              onRunningChange={() => {}}
            />
          </Suspense>
        </Canvas>
      )}

      {gameState === "playing" && (
        <>
          <HUD
            stamina={stamina}
            time={time}
            cameraMode={cameraMode}
            dayMode={dayMode}
            torchEnabled={torchEnabled}
            nearHouse={nearHouse}
            isHidden={isHidden}
            jumpscareActive={jumpscareActive}
            superchargeActive={superchargeActive}
            playerSpeedLevel={playerSpeedBoost}
            onToggleCamera={() =>
              setCameraMode((c) => (c === "third" ? "first" : "third"))
            }
            onToggleDay={() =>
              setDayMode((d) => (d === "day" ? "night" : "day"))
            }
            onToggleTorch={() => setTorchEnabled((v) => !v)}
            onPause={() => setGameState("menu")}
            onClose={onClose}
          />
          <MovementButtons
            keysRef={keysRef}
            joystickRef={joystickRef}
            jumpRef={jumpRef}
            onJump={() => {
              jumpRef.current = true;
            }}
          />
        </>
      )}

      {gameState === "gameover" && (
        <GameOverScreen
          time={survivedTime}
          onRestart={handleRestart}
          onMenu={() => setGameState("menu")}
          onClose={onClose}
        />
      )}
    </div>
  );
}
