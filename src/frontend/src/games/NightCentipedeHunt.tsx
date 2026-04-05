import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

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
    ground: "#1e3a0a",
    skyDay: "#5a9fd4",
    skyNight: "#0d1a28",
    fogDay: "#a0c890",
    fogNight: "#0e1a10",
  },
  village: {
    ground: "#4a3a1e",
    skyDay: "#8ab0cc",
    skyNight: "#1a1008",
    fogDay: "#c0b898",
    fogNight: "#1c1208",
  },
  graveyard: {
    ground: "#282830",
    skyDay: "#7070a0",
    skyNight: "#10101e",
    fogDay: "#a0a0b8",
    fogNight: "#12121e",
  },
  city: {
    ground: "#383838",
    skyDay: "#90a8c0",
    skyNight: "#121212",
    fogDay: "#b8c4cc",
    fogNight: "#161616",
  },
  swamp: {
    ground: "#1e3016",
    skyDay: "#6a9060",
    skyNight: "#0a1a10",
    fogDay: "#90b880",
    fogNight: "#0e1c10",
  },
};

// ─── Audio ────────────────────────────────────────────────────────────────────
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
    const len = Math.floor(sr * 0.6);
    const buf = ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++)
      d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 0.25;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = 1.0;
    src.connect(g);
    g.connect(ctx.destination);
    src.start();
  } catch {}
}

function playSupercharge(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(80 + i * 90, now + i * 0.12);
      osc.frequency.exponentialRampToValueAtTime(
        500 + i * 90,
        now + i * 0.12 + 0.3,
      );
      g.gain.setValueAtTime(0.5, now + i * 0.12);
      g.gain.linearRampToValueAtTime(0, now + i * 0.12 + 0.35);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.35);
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
      g.gain.linearRampToValueAtTime(0.35, now + t + 0.04);
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
    osc.frequency.value = 45;
    g.gain.value = 0.05;
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

// ─── Star Field ─────────────────────────────────────────────────────────────────
function StarField() {
  const { positions, sizes } = useMemo(() => {
    const pos: number[] = [];
    const sz: number[] = [];
    for (let i = 0; i < 500; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 350 + Math.random() * 150;
      pos.push(
        r * Math.sin(phi) * Math.cos(theta),
        Math.abs(r * Math.cos(phi)) + 20,
        r * Math.sin(phi) * Math.sin(theta),
      );
      sz.push(0.5 + Math.random() * 1.5);
    }
    return {
      positions: new Float32Array(pos),
      sizes: new Float32Array(sz),
    };
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.9}
        color="#e8f0ff"
        sizeAttenuation
        transparent
        opacity={0.95}
      />
    </points>
  );
}

function MoonMesh() {
  return (
    <mesh position={[-80, 120, -150]}>
      <sphereGeometry args={[14, 24, 24]} />
      <meshStandardMaterial
        color="#fffce8"
        emissive="#fffce0"
        emissiveIntensity={1.4}
        roughness={0.9}
      />
      <pointLight color="#9ab0ff" intensity={2.5} distance={600} />
    </mesh>
  );
}

// ─── Ground ───────────────────────────────────────────────────────────────────
function Ground({ map }: { map: MapType }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[400, 400, 30, 30]} />
      <meshStandardMaterial
        color={MAP_COLORS[map].ground}
        roughness={0.5}
        metalness={0.25}
      />
    </mesh>
  );
}

// ─── Grass ───────────────────────────────────────────────────────────────────
const GRASS_DATA = (() => {
  const arr: { x: number; z: number; id: string }[] = [];
  let s = 77;
  const rng = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
  for (let i = 0; i < 180; i++)
    arr.push({ x: (rng() - 0.5) * 300, z: (rng() - 0.5) * 300, id: `g${i}` });
  return arr;
})();

function Grass() {
  return (
    <group>
      {GRASS_DATA.map((g) => (
        <group key={g.id} position={[g.x, 0, g.z]}>
          <mesh
            position={[0, 0.22, 0]}
            rotation={[0, Math.random() * Math.PI, 0]}
          >
            <boxGeometry args={[0.06, 0.44, 0.32]} />
            <meshLambertMaterial color="#2a6010" />
          </mesh>
          <mesh position={[0.18, 0.18, 0]} rotation={[0.2, 0.9, 0.4]}>
            <boxGeometry args={[0.05, 0.32, 0.22]} />
            <meshLambertMaterial color="#387018" />
          </mesh>
          <mesh position={[-0.12, 0.16, 0.1]} rotation={[-0.1, -0.5, 0.3]}>
            <boxGeometry args={[0.04, 0.28, 0.18]} />
            <meshLambertMaterial color="#2e6814" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Trees ────────────────────────────────────────────────────────────────────
const TREE_DATA = (() => {
  const arr: { x: number; z: number; h: number; id: string }[] = [];
  let s = 42;
  const rng = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
  for (let i = 0; i < 90; i++) {
    let x: number;
    let z: number;
    do {
      x = (rng() - 0.5) * 280;
      z = (rng() - 0.5) * 280;
    } while (x * x + z * z < 64);
    arr.push({ x, z, h: 2.8 + rng() * 4.5, id: `t${i}` });
  }
  return arr;
})();

function Trees() {
  return (
    <group>
      {TREE_DATA.map((t) => (
        <group key={t.id} position={[t.x, 0, t.z]}>
          {/* Bark base */}
          <mesh position={[0, t.h / 2, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.45, t.h, 8]} />
            <meshStandardMaterial
              color="#2e1a0e"
              roughness={0.95}
              metalness={0.0}
            />
          </mesh>
          {/* Bark texture overlay */}
          <mesh position={[0, t.h * 0.3, 0]}>
            <cylinderGeometry args={[0.3, 0.42, t.h * 0.6, 6]} />
            <meshStandardMaterial
              color="#3d2410"
              roughness={1.0}
              metalness={0.0}
            />
          </mesh>
          {/* Lower crown */}
          <mesh position={[0, t.h * 0.65, 0]} castShadow>
            <coneGeometry args={[t.h * 0.52, t.h * 0.7, 10]} />
            <meshStandardMaterial
              color="#124a12"
              roughness={0.8}
              metalness={0.0}
            />
          </mesh>
          {/* Mid crown */}
          <mesh position={[0, t.h * 0.9, 0]} castShadow>
            <coneGeometry args={[t.h * 0.38, t.h * 0.55, 9]} />
            <meshStandardMaterial
              color="#1a5c1a"
              roughness={0.8}
              metalness={0.0}
            />
          </mesh>
          {/* Top crown */}
          <mesh position={[0, t.h * 1.12, 0]} castShadow>
            <coneGeometry args={[t.h * 0.22, t.h * 0.38, 8]} />
            <meshStandardMaterial
              color="#236623"
              roughness={0.8}
              metalness={0.0}
            />
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
  for (let i = 0; i < 50; i++)
    arr.push({
      x: (rng() - 0.5) * 260,
      z: (rng() - 0.5) * 260,
      s: 0.4 + rng() * 1.4,
      id: `r${i}`,
    });
  return arr;
})();

function Rocks() {
  return (
    <group>
      {ROCK_DATA.map((r) => (
        <group key={r.id} position={[r.x, r.s * 0.3, r.z]}>
          <mesh castShadow receiveShadow>
            <dodecahedronGeometry args={[r.s, 0]} />
            <meshStandardMaterial
              color="#6a6a6a"
              roughness={0.88}
              metalness={0.12}
            />
          </mesh>
          {/* Moss accent */}
          <mesh position={[0, r.s * 0.6, 0]}>
            <sphereGeometry args={[r.s * 0.55, 6, 4]} />
            <meshStandardMaterial
              color="#3a5a2a"
              roughness={0.98}
              metalness={0.0}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Houses ───────────────────────────────────────────────────────────────────
function Houses({ canHide, dayMode }: { canHide: boolean; dayMode: DayMode }) {
  const isDay = dayMode === "day";
  return (
    <group>
      {HOUSE_POSITIONS.map((pos) => (
        <group
          key={`h-${Math.round(pos.x)}-${Math.round(pos.z)}`}
          position={[pos.x, 0, pos.z]}
        >
          {/* Foundation */}
          <mesh position={[0, 0.15, 0]} receiveShadow>
            <boxGeometry args={[5.4, 0.3, 5.4]} />
            <meshStandardMaterial
              color={isDay ? "#6a5a4a" : "#1e1610"}
              roughness={0.9}
              metalness={0}
            />
          </mesh>
          {/* Walls */}
          <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
            <boxGeometry args={[5, 3, 5]} />
            <meshStandardMaterial
              color={isDay ? "#8a6a4a" : "#2a1e14"}
              roughness={0.85}
              metalness={0}
            />
          </mesh>
          {/* Roof */}
          <mesh
            position={[0, 3.7, 0]}
            castShadow
            rotation={[0, Math.PI / 4, 0]}
          >
            <coneGeometry args={[3.9, 2.4, 4]} />
            <meshStandardMaterial
              color={isDay ? "#5a2a2a" : "#1a0c0c"}
              roughness={0.9}
              metalness={0}
            />
          </mesh>
          {/* Door */}
          <mesh position={[0, 0.85, 2.52]} castShadow>
            <boxGeometry args={[1.2, 1.7, 0.08]} />
            <meshStandardMaterial
              color={canHide ? "#7a4a1e" : "#1a0e00"}
              roughness={0.7}
              metalness={0.1}
            />
          </mesh>
          {/* Door frame */}
          <mesh position={[0, 0.85, 2.54]}>
            <boxGeometry args={[1.4, 1.9, 0.05]} />
            <meshStandardMaterial
              color={isDay ? "#5a3a18" : "#100800"}
              roughness={0.8}
              metalness={0}
            />
          </mesh>
          {/* Window L */}
          <mesh position={[-1.5, 1.8, 2.52]}>
            <boxGeometry args={[0.75, 0.75, 0.06]} />
            <meshStandardMaterial
              color={isDay ? "#88ccee" : "#112233"}
              roughness={0.1}
              metalness={0.3}
            />
          </mesh>
          {/* Window R */}
          <mesh position={[1.5, 1.8, 2.52]}>
            <boxGeometry args={[0.75, 0.75, 0.06]} />
            <meshStandardMaterial
              color={isDay ? "#88ccee" : "#112233"}
              roughness={0.1}
              metalness={0.3}
            />
          </mesh>
          {/* Interior glow at night */}
          {!isDay && (
            <pointLight
              position={[0, 2, 0]}
              color="#ff7722"
              intensity={1.2}
              distance={14}
            />
          )}
          {/* Porch step */}
          <mesh position={[0, 0.08, 3.0]}>
            <boxGeometry args={[2, 0.16, 0.6]} />
            <meshStandardMaterial
              color={isDay ? "#7a6a5a" : "#251c12"}
              roughness={0.95}
              metalness={0}
            />
          </mesh>
        </group>
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

// ─── NPC with detailed face + body ───────────────────────────────────────────
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
    s.walkPhase += delta * (fleeing ? 14 : 5);
    const swing = Math.sin(s.walkPhase) * (fleeing ? 0.65 : 0.38);
    if (legLRef.current) legLRef.current.rotation.x = swing;
    if (legRRef.current) legRRef.current.rotation.x = -swing;
    if (armLRef.current) armLRef.current.rotation.x = -swing * 0.7;
    if (armRRef.current) armRRef.current.rotation.x = swing * 0.7;
    groupRef.current.position.y =
      Math.abs(Math.sin(s.walkPhase * 2)) * (fleeing ? 0.13 : 0.05);
  });

  const shirtColor = fleeing
    ? "#cc2200"
    : ["#7a4a28", "#2a5580", "#447733", "#774466", "#223377", "#665522"][
        Math.floor(Math.abs(startX) % 6)
      ];
  const skinColor = ["#d4956a", "#c47840", "#e8b090", "#b06030", "#dda070"][
    Math.floor(Math.abs(startZ) % 5)
  ];
  const hairColor = ["#1a0800", "#331100", "#0d0500", "#4a2800", "#220d00"][
    Math.floor(Math.abs(startX + startZ) % 5)
  ];

  return (
    <group ref={groupRef} position={[startX, 0, startZ]}>
      {/* === LEGS === */}
      <mesh ref={legLRef} position={[-0.115, 0.52, 0]} castShadow>
        <boxGeometry args={[0.17, 0.58, 0.19]} />
        <meshStandardMaterial color="#1e2e55" roughness={0.8} metalness={0} />
      </mesh>
      <mesh ref={legRRef} position={[0.115, 0.52, 0]} castShadow>
        <boxGeometry args={[0.17, 0.58, 0.19]} />
        <meshStandardMaterial color="#1e2e55" roughness={0.8} metalness={0} />
      </mesh>
      {/* Knee caps */}
      <mesh position={[-0.115, 0.38, 0.1]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color="#1a2848" roughness={0.7} metalness={0} />
      </mesh>
      <mesh position={[0.115, 0.38, 0.1]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color="#1a2848" roughness={0.7} metalness={0} />
      </mesh>
      {/* Shoes */}
      <mesh position={[-0.115, 0.08, 0.06]}>
        <boxGeometry args={[0.17, 0.11, 0.32]} />
        <meshStandardMaterial color="#1a0e00" roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[-0.115, 0.1, 0.17]}>
        <boxGeometry args={[0.15, 0.09, 0.1]} />
        <meshStandardMaterial
          color="#0d0800"
          roughness={0.6}
          metalness={0.15}
        />
      </mesh>
      <mesh position={[0.115, 0.08, 0.06]}>
        <boxGeometry args={[0.17, 0.11, 0.32]} />
        <meshStandardMaterial color="#1a0e00" roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0.115, 0.1, 0.17]}>
        <boxGeometry args={[0.15, 0.09, 0.1]} />
        <meshStandardMaterial
          color="#0d0800"
          roughness={0.6}
          metalness={0.15}
        />
      </mesh>
      {/* === TORSO === */}
      <mesh position={[0, 1.08, 0]} castShadow>
        <boxGeometry args={[0.46, 0.64, 0.25]} />
        <meshStandardMaterial
          color={shirtColor}
          roughness={0.85}
          metalness={0}
        />
      </mesh>
      {/* Belt */}
      <mesh position={[0, 0.78, 0]}>
        <boxGeometry args={[0.48, 0.06, 0.27]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Belt buckle */}
      <mesh position={[0, 0.78, 0.14]}>
        <boxGeometry args={[0.1, 0.07, 0.04]} />
        <meshStandardMaterial color="#888822" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* === ARMS === */}
      <mesh ref={armLRef} position={[-0.3, 1.08, 0]} castShadow>
        <boxGeometry args={[0.15, 0.52, 0.18]} />
        <meshStandardMaterial
          color={shirtColor}
          roughness={0.85}
          metalness={0}
        />
      </mesh>
      <mesh ref={armRRef} position={[0.3, 1.08, 0]} castShadow>
        <boxGeometry args={[0.15, 0.52, 0.18]} />
        <meshStandardMaterial
          color={shirtColor}
          roughness={0.85}
          metalness={0}
        />
      </mesh>
      {/* Hands */}
      <mesh position={[-0.3, 0.78, 0]}>
        <sphereGeometry args={[0.068, 7, 7]} />
        <meshStandardMaterial
          color={skinColor}
          roughness={0.75}
          metalness={0}
        />
      </mesh>
      <mesh position={[0.3, 0.78, 0]}>
        <sphereGeometry args={[0.068, 7, 7]} />
        <meshStandardMaterial
          color={skinColor}
          roughness={0.75}
          metalness={0}
        />
      </mesh>
      {/* === NECK === */}
      <mesh position={[0, 1.48, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.14, 7]} />
        <meshStandardMaterial color={skinColor} roughness={0.8} metalness={0} />
      </mesh>
      {/* === HEAD === */}
      <mesh position={[0, 1.68, 0]} castShadow>
        <boxGeometry args={[0.3, 0.32, 0.28]} />
        <meshStandardMaterial
          color={skinColor}
          roughness={0.78}
          metalness={0}
        />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 1.84, 0]}>
        <boxGeometry args={[0.32, 0.1, 0.3]} />
        <meshStandardMaterial color={hairColor} roughness={0.9} metalness={0} />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.17, 1.68, 0]}>
        <boxGeometry args={[0.04, 0.07, 0.07]} />
        <meshStandardMaterial color={skinColor} roughness={0.8} metalness={0} />
      </mesh>
      <mesh position={[0.17, 1.68, 0]}>
        <boxGeometry args={[0.04, 0.07, 0.07]} />
        <meshStandardMaterial color={skinColor} roughness={0.8} metalness={0} />
      </mesh>
      {/* Left eye white */}
      <mesh position={[-0.08, 1.71, 0.14]}>
        <sphereGeometry args={[0.044, 8, 8]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.1} metalness={0} />
      </mesh>
      {/* Left pupil */}
      <mesh position={[-0.08, 1.71, 0.178]}>
        <sphereGeometry args={[0.025, 7, 7]} />
        <meshStandardMaterial color="#1a0a00" roughness={0.2} metalness={0} />
      </mesh>
      {/* Right eye white */}
      <mesh position={[0.08, 1.71, 0.14]}>
        <sphereGeometry args={[0.044, 8, 8]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.1} metalness={0} />
      </mesh>
      {/* Right pupil */}
      <mesh position={[0.08, 1.71, 0.178]}>
        <sphereGeometry args={[0.025, 7, 7]} />
        <meshStandardMaterial color="#1a0a00" roughness={0.2} metalness={0} />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 1.64, 0.152]}>
        <boxGeometry args={[0.04, 0.06, 0.04]} />
        <meshStandardMaterial color={skinColor} roughness={0.8} metalness={0} />
      </mesh>
      {/* Mouth */}
      <mesh position={[0, fleeing ? 1.56 : 1.575, 0.148]}>
        <boxGeometry
          args={[fleeing ? 0.12 : 0.09, fleeing ? 0.035 : 0.022, 0.025]}
        />
        <meshStandardMaterial
          color={fleeing ? "#cc2200" : "#882200"}
          roughness={0.6}
          metalness={0}
        />
      </mesh>
      {/* Eyebrows */}
      <mesh
        position={[-0.08, 1.755, 0.145]}
        rotation={[0, 0, fleeing ? 0.4 : 0.1]}
      >
        <boxGeometry args={[0.07, 0.018, 0.015]} />
        <meshStandardMaterial color={hairColor} roughness={0.9} metalness={0} />
      </mesh>
      <mesh
        position={[0.08, 1.755, 0.145]}
        rotation={[0, 0, fleeing ? -0.4 : -0.1]}
      >
        <boxGeometry args={[0.07, 0.018, 0.015]} />
        <meshStandardMaterial color={hairColor} roughness={0.9} metalness={0} />
      </mesh>
    </group>
  );
}

// ─── Monster Centipede ────────────────────────────────────────────────────────
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
  const SEGMENTS = 67;
  const SEG_SPACING = 1.1;

  const headGroupRef = useRef<THREE.Group>(null);
  const bodyRefs = useRef<(THREE.Mesh | null)[]>([]);
  const legRefs = useRef<(THREE.Group | null)[]>([]);
  const glowRef = useRef<THREE.PointLight>(null);
  const distRef = useRef(100);

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
    distRef.current = dist;
    if (onDistanceUpdate) onDistanceUpdate(dist);

    const speed =
      baseSpeed * (supercharged ? 2.2 : 1.0) * (dist < 25 ? 1.5 : 1.0);
    const dir = new THREE.Vector3(player.x - head.x, 0, player.z - head.z);
    if (dir.length() > 0.1) dir.normalize();
    velocity.current.lerp(dir.multiplyScalar(speed), 4 * delta);
    head.x += velocity.current.x * delta;
    head.z += velocity.current.z * delta;

    for (let i = 1; i < SEGMENTS; i++) {
      const prev = positions.current[i - 1];
      const cur = positions.current[i];
      const segDir = new THREE.Vector3().subVectors(cur, prev);
      if (segDir.length() > SEG_SPACING) {
        segDir.normalize().multiplyScalar(SEG_SPACING);
        positions.current[i].copy(prev).add(segDir);
      }
      const wave = Math.sin(t * 9 - i * 0.42) * 0.2;
      positions.current[i].y = 0.5 + wave;
    }
    head.y = 0.65 + Math.sin(t * 9) * 0.18;

    // Move entire head group
    if (headGroupRef.current) {
      headGroupRef.current.position.copy(positions.current[0]);
      headGroupRef.current.rotation.y = Math.sin(t * 3.5) * 0.28;
      headGroupRef.current.rotation.x = dist < 12 ? -0.4 : -0.05;
    }

    for (let i = 0; i < bodyRefs.current.length; i++) {
      const m = bodyRefs.current[i];
      if (m) m.position.copy(positions.current[i + 1]);
      const lg = legRefs.current[i];
      if (lg) {
        lg.position.copy(positions.current[i + 1]);
        lg.rotation.z = Math.sin(t * 12 - i * 0.5) * 0.4;
      }
    }

    if (glowRef.current) {
      glowRef.current.intensity = supercharged ? 3 + Math.sin(t * 18) * 2 : 0;
      glowRef.current.position.copy(head);
    }

    if (!catchCalled.current && !isHiddenRef.current && dist < 2.2) {
      catchCalled.current = true;
      onCatch();
    }
  });

  const segKeys = Array.from(
    { length: SEGMENTS - 1 },
    (_, i) => `${segKey}-s${i}`,
  );
  const eyeColor = supercharged ? "#ff2200" : "#00ff44";
  const eyeEmissive = supercharged ? "#ff0000" : "#00ee22";

  return (
    <group>
      {/* ── Entire head as one tracked group ── */}
      <group ref={headGroupRef} position={positions.current[0]}>
        {/* Main skull */}
        <mesh castShadow>
          <sphereGeometry args={[0.88, 16, 16]} />
          <meshStandardMaterial
            color={supercharged ? "#2a0800" : "#0d1500"}
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>
        {/* Cheek bulges */}
        <mesh position={[0.68, -0.1, 0.1]}>
          <sphereGeometry args={[0.38, 10, 10]} />
          <meshStandardMaterial
            color={supercharged ? "#220600" : "#0a1200"}
            roughness={0.35}
            metalness={0.15}
          />
        </mesh>
        <mesh position={[-0.68, -0.1, 0.1]}>
          <sphereGeometry args={[0.38, 10, 10]} />
          <meshStandardMaterial
            color={supercharged ? "#220600" : "#0a1200"}
            roughness={0.35}
            metalness={0.15}
          />
        </mesh>
        {/* Brow ridge 1 */}
        <mesh position={[0, 0.62, 0.55]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.7, 0.12, 0.16]} />
          <meshStandardMaterial
            color={supercharged ? "#1a0400" : "#060e00"}
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
        {/* Brow ridge 2 */}
        <mesh position={[0.3, 0.55, 0.6]} rotation={[0.4, 0.2, 0]}>
          <boxGeometry args={[0.22, 0.1, 0.14]} />
          <meshStandardMaterial
            color={supercharged ? "#1a0400" : "#060e00"}
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
        <mesh position={[-0.3, 0.55, 0.6]} rotation={[0.4, -0.2, 0]}>
          <boxGeometry args={[0.22, 0.1, 0.14]} />
          <meshStandardMaterial
            color={supercharged ? "#1a0400" : "#060e00"}
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
        {/* Chin plate */}
        <mesh position={[0, -0.72, 0.38]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.52, 0.22, 0.28]} />
          <meshStandardMaterial
            color={supercharged ? "#1a0400" : "#070f00"}
            roughness={0.4}
            metalness={0.15}
          />
        </mesh>
        {/* == 6 EYES == */}
        {/* Large primary eyes */}
        <mesh position={[0.3, 0.28, 0.76]}>
          <sphereGeometry args={[0.2, 12, 12]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.05}
            metalness={0}
          />
        </mesh>
        <mesh position={[0.3, 0.28, 0.93]}>
          <sphereGeometry args={[0.13, 10, 10]} />
          <meshStandardMaterial
            color={eyeColor}
            emissive={eyeEmissive}
            emissiveIntensity={6}
            roughness={0.1}
            metalness={0}
          />
        </mesh>
        <mesh position={[-0.3, 0.28, 0.76]}>
          <sphereGeometry args={[0.2, 12, 12]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.05}
            metalness={0}
          />
        </mesh>
        <mesh position={[-0.3, 0.28, 0.93]}>
          <sphereGeometry args={[0.13, 10, 10]} />
          <meshStandardMaterial
            color={eyeColor}
            emissive={eyeEmissive}
            emissiveIntensity={6}
            roughness={0.1}
            metalness={0}
          />
        </mesh>
        {/* Medium secondary eyes */}
        <mesh position={[0.5, 0.1, 0.65]}>
          <sphereGeometry args={[0.14, 10, 10]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.05}
            metalness={0}
          />
        </mesh>
        <mesh position={[0.5, 0.1, 0.76]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial
            color={eyeColor}
            emissive={eyeEmissive}
            emissiveIntensity={5}
            roughness={0.1}
            metalness={0}
          />
        </mesh>
        <mesh position={[-0.5, 0.1, 0.65]}>
          <sphereGeometry args={[0.14, 10, 10]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.05}
            metalness={0}
          />
        </mesh>
        <mesh position={[-0.5, 0.1, 0.76]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial
            color={eyeColor}
            emissive={eyeEmissive}
            emissiveIntensity={5}
            roughness={0.1}
            metalness={0}
          />
        </mesh>
        {/* Small beady top eyes */}
        <mesh position={[0.18, 0.6, 0.5]}>
          <sphereGeometry args={[0.085, 8, 8]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.05}
            metalness={0}
          />
        </mesh>
        <mesh position={[0.18, 0.6, 0.57]}>
          <sphereGeometry args={[0.055, 6, 6]} />
          <meshStandardMaterial
            color={eyeColor}
            emissive={eyeEmissive}
            emissiveIntensity={4}
            roughness={0.1}
            metalness={0}
          />
        </mesh>
        <mesh position={[-0.18, 0.6, 0.5]}>
          <sphereGeometry args={[0.085, 8, 8]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.05}
            metalness={0}
          />
        </mesh>
        <mesh position={[-0.18, 0.6, 0.57]}>
          <sphereGeometry args={[0.055, 6, 6]} />
          <meshStandardMaterial
            color={eyeColor}
            emissive={eyeEmissive}
            emissiveIntensity={4}
            roughness={0.1}
            metalness={0}
          />
        </mesh>
        {/* == 4 FANGS == */}
        {/* Upper fangs */}
        <mesh position={[0.22, -0.22, 0.78]} rotation={[0.95, 0.38, 0]}>
          <cylinderGeometry args={[0.04, 0.1, 0.48, 5]} />
          <meshStandardMaterial
            color="#040c00"
            roughness={0.25}
            metalness={0.3}
          />
        </mesh>
        <mesh position={[-0.22, -0.22, 0.78]} rotation={[0.95, -0.38, 0]}>
          <cylinderGeometry args={[0.04, 0.1, 0.48, 5]} />
          <meshStandardMaterial
            color="#040c00"
            roughness={0.25}
            metalness={0.3}
          />
        </mesh>
        {/* Lower fangs */}
        <mesh position={[0.14, -0.5, 0.82]} rotation={[-0.55, 0.28, 0]}>
          <cylinderGeometry args={[0.03, 0.08, 0.38, 5]} />
          <meshStandardMaterial
            color="#040c00"
            roughness={0.25}
            metalness={0.3}
          />
        </mesh>
        <mesh position={[-0.14, -0.5, 0.82]} rotation={[-0.55, -0.28, 0]}>
          <cylinderGeometry args={[0.03, 0.08, 0.38, 5]} />
          <meshStandardMaterial
            color="#040c00"
            roughness={0.25}
            metalness={0.3}
          />
        </mesh>
        {/* Venom drops when supercharged */}
        {supercharged && (
          <>
            <mesh position={[0, -0.94, 0.72]}>
              <sphereGeometry args={[0.055, 6, 6]} />
              <meshStandardMaterial
                color="#44ff00"
                emissive="#22cc00"
                emissiveIntensity={4}
                roughness={0.1}
                metalness={0}
              />
            </mesh>
            <mesh position={[0.18, -0.88, 0.7]}>
              <sphereGeometry args={[0.045, 6, 6]} />
              <meshStandardMaterial
                color="#55ff00"
                emissive="#22cc00"
                emissiveIntensity={4}
                roughness={0.1}
                metalness={0}
              />
            </mesh>
            <mesh position={[-0.16, -0.86, 0.68]}>
              <sphereGeometry args={[0.04, 6, 6]} />
              <meshStandardMaterial
                color="#44ff00"
                emissive="#22cc00"
                emissiveIntensity={4}
                roughness={0.1}
                metalness={0}
              />
            </mesh>
          </>
        )}
        {/* == SEGMENTED ANTENNAE == */}
        {/* Left antenna - 3 segments */}
        <mesh position={[-0.22, 0.72, 0.52]} rotation={[-0.7, -0.25, -0.15]}>
          <cylinderGeometry args={[0.016, 0.03, 0.4, 5]} />
          <meshLambertMaterial color="#0d2200" />
        </mesh>
        <mesh position={[-0.35, 0.98, 0.68]} rotation={[-0.5, -0.4, -0.2]}>
          <cylinderGeometry args={[0.012, 0.018, 0.36, 5]} />
          <meshLambertMaterial color="#091800" />
        </mesh>
        <mesh position={[-0.44, 1.18, 0.82]} rotation={[-0.4, -0.5, -0.15]}>
          <cylinderGeometry args={[0.008, 0.013, 0.3, 4]} />
          <meshLambertMaterial color="#060e00" />
        </mesh>
        {/* Right antenna - 3 segments */}
        <mesh position={[0.22, 0.72, 0.52]} rotation={[-0.7, 0.25, 0.15]}>
          <cylinderGeometry args={[0.016, 0.03, 0.4, 5]} />
          <meshLambertMaterial color="#0d2200" />
        </mesh>
        <mesh position={[0.35, 0.98, 0.68]} rotation={[-0.5, 0.4, 0.2]}>
          <cylinderGeometry args={[0.012, 0.018, 0.36, 5]} />
          <meshLambertMaterial color="#091800" />
        </mesh>
        <mesh position={[0.44, 1.18, 0.82]} rotation={[-0.4, 0.5, 0.15]}>
          <cylinderGeometry args={[0.008, 0.013, 0.3, 4]} />
          <meshLambertMaterial color="#060e00" />
        </mesh>
        {/* Eye glow point light */}
        <pointLight
          color={supercharged ? "#ff2200" : "#00ff44"}
          intensity={supercharged ? 2.5 : 1.5}
          distance={12}
        />
      </group>

      {/* ── Body segments ── */}
      {segKeys.map((k, i) => {
        const segSize = Math.max(0.24, 0.56 - i * 0.0045);
        const isArmored = i % 3 === 0;
        return (
          <group key={k}>
            <mesh
              ref={(el) => {
                bodyRefs.current[i] = el;
              }}
              position={positions.current[i + 1]}
              castShadow
            >
              <sphereGeometry args={[segSize, 9, 9]} />
              <meshStandardMaterial
                color={
                  supercharged
                    ? i % 2 === 0
                      ? "#cc2200"
                      : "#881100"
                    : isArmored
                      ? "#346600"
                      : i % 2 === 0
                        ? "#1e4a00"
                        : "#0e2800"
                }
                roughness={0.28}
                metalness={0.22}
                emissive={supercharged ? "#991100" : "#000000"}
                emissiveIntensity={supercharged ? 0.6 : 0}
              />
            </mesh>
            {/* Spines on armored segments */}
            {isArmored && (
              <>
                <mesh
                  position={[
                    positions.current[i + 1].x + segSize * 0.55,
                    positions.current[i + 1].y + segSize + 0.12,
                    positions.current[i + 1].z,
                  ]}
                >
                  <boxGeometry args={[0.06, 0.2, 0.06]} />
                  <meshStandardMaterial
                    color={supercharged ? "#aa1100" : "#1a3300"}
                    roughness={0.4}
                    metalness={0.2}
                  />
                </mesh>
                <mesh
                  position={[
                    positions.current[i + 1].x - segSize * 0.55,
                    positions.current[i + 1].y + segSize + 0.12,
                    positions.current[i + 1].z,
                  ]}
                >
                  <boxGeometry args={[0.06, 0.2, 0.06]} />
                  <meshStandardMaterial
                    color={supercharged ? "#aa1100" : "#1a3300"}
                    roughness={0.4}
                    metalness={0.2}
                  />
                </mesh>
              </>
            )}
            {/* Legs every 2nd segment */}
            {i % 2 === 0 && (
              <group
                ref={(el) => {
                  legRefs.current[i] = el;
                }}
                position={positions.current[i + 1]}
              >
                <mesh
                  position={[-segSize - 0.12, 0, 0.16]}
                  rotation={[0, 0, Math.PI / 4]}
                >
                  <cylinderGeometry args={[0.022, 0.014, segSize * 1.7, 4]} />
                  <meshStandardMaterial
                    color="#0c1e00"
                    roughness={0.5}
                    metalness={0.1}
                  />
                </mesh>
                <mesh
                  position={[-segSize - 0.12, 0, -0.16]}
                  rotation={[0, 0, Math.PI / 4]}
                >
                  <cylinderGeometry args={[0.022, 0.014, segSize * 1.7, 4]} />
                  <meshStandardMaterial
                    color="#0c1e00"
                    roughness={0.5}
                    metalness={0.1}
                  />
                </mesh>
                <mesh
                  position={[segSize + 0.12, 0, 0.16]}
                  rotation={[0, 0, -Math.PI / 4]}
                >
                  <cylinderGeometry args={[0.022, 0.014, segSize * 1.7, 4]} />
                  <meshStandardMaterial
                    color="#0c1e00"
                    roughness={0.5}
                    metalness={0.1}
                  />
                </mesh>
                <mesh
                  position={[segSize + 0.12, 0, -0.16]}
                  rotation={[0, 0, -Math.PI / 4]}
                >
                  <cylinderGeometry args={[0.022, 0.014, segSize * 1.7, 4]} />
                  <meshStandardMaterial
                    color="#0c1e00"
                    roughness={0.5}
                    metalness={0.1}
                  />
                </mesh>
              </group>
            )}
          </group>
        );
      })}
      <pointLight ref={glowRef} color="#ff3300" intensity={0} distance={22} />
    </group>
  );
}

// ─── Player Torch ─────────────────────────────────────────────────────────────
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
    targetRef.current.position.set(
      pos.x - Math.sin(yawRef.current) * 10,
      eyeY + Math.sin(pitchRef.current) * 10 - 0.5,
      pos.z - Math.cos(yawRef.current) * 10,
    );
    lightRef.current.target = targetRef.current;
  });
  if (!enabled) return null;
  return (
    <>
      <object3D ref={targetRef} />
      <spotLight
        ref={lightRef}
        color="#fff8e0"
        intensity={9}
        distance={55}
        angle={Math.PI / 5}
        penumbra={0.35}
        castShadow
        shadow-mapSize={[512, 512]}
      />
      <pointLight
        position={[0, 1.7, 0]}
        color="#ffeecc"
        intensity={0.4}
        distance={6}
      />
    </>
  );
}

// ─── Player Mesh ──────────────────────────────────────────────────────────────
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
    walkPhaseRef.current += delta * (isRunning ? 16 : 7);
    const swing = Math.sin(walkPhaseRef.current) * (isRunning ? 0.72 : 0.42);
    if (legLRef.current) legLRef.current.rotation.x = swing;
    if (legRRef.current) legRRef.current.rotation.x = -swing;
    if (armLRef.current) armLRef.current.rotation.x = -swing * 0.62;
    if (armRRef.current) armRRef.current.rotation.x = swing * 0.62;
    const bounce =
      Math.abs(Math.sin(walkPhaseRef.current * 2)) * (isRunning ? 0.1 : 0.04);
    groupRef.current.position.set(pos.x, pos.y + bounce, pos.z);
  });

  if (cameraMode === "first") return null;

  return (
    <group
      ref={groupRef}
      position={[playerPosRef.current.x, 0, playerPosRef.current.z]}
    >
      {/* Legs */}
      <mesh ref={legLRef} position={[-0.12, 0.52, 0]} castShadow>
        <boxGeometry args={[0.18, 0.62, 0.2]} />
        <meshStandardMaterial color="#2a3a60" roughness={0.8} metalness={0} />
      </mesh>
      <mesh ref={legRRef} position={[0.12, 0.52, 0]} castShadow>
        <boxGeometry args={[0.18, 0.62, 0.2]} />
        <meshStandardMaterial color="#2a3a60" roughness={0.8} metalness={0} />
      </mesh>
      {/* Shoes */}
      <mesh position={[-0.12, 0.08, 0.07]}>
        <boxGeometry args={[0.17, 0.12, 0.34]} />
        <meshStandardMaterial
          color="#111100"
          roughness={0.65}
          metalness={0.15}
        />
      </mesh>
      <mesh position={[-0.12, 0.1, 0.19]}>
        <boxGeometry args={[0.15, 0.1, 0.1]} />
        <meshStandardMaterial
          color="#080800"
          roughness={0.55}
          metalness={0.2}
        />
      </mesh>
      <mesh position={[0.12, 0.08, 0.07]}>
        <boxGeometry args={[0.17, 0.12, 0.34]} />
        <meshStandardMaterial
          color="#111100"
          roughness={0.65}
          metalness={0.15}
        />
      </mesh>
      <mesh position={[0.12, 0.1, 0.19]}>
        <boxGeometry args={[0.15, 0.1, 0.1]} />
        <meshStandardMaterial
          color="#080800"
          roughness={0.55}
          metalness={0.2}
        />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 1.08, 0]} castShadow>
        <boxGeometry args={[0.46, 0.66, 0.26]} />
        <meshStandardMaterial color="#1a4488" roughness={0.82} metalness={0} />
      </mesh>
      {/* Chest detail */}
      <mesh position={[0, 1.15, 0.135]}>
        <boxGeometry args={[0.28, 0.3, 0.04]} />
        <meshStandardMaterial color="#1650aa" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Belt */}
      <mesh position={[0, 0.78, 0]}>
        <boxGeometry args={[0.48, 0.07, 0.28]} />
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.6}
          metalness={0.25}
        />
      </mesh>
      {/* Backpack */}
      <mesh position={[0, 1.08, -0.2]}>
        <boxGeometry args={[0.32, 0.52, 0.16]} />
        <meshStandardMaterial color="#7a3a18" roughness={0.88} metalness={0} />
      </mesh>
      {/* Arms */}
      <mesh ref={armLRef} position={[-0.32, 1.08, 0]} castShadow>
        <boxGeometry args={[0.16, 0.54, 0.19]} />
        <meshStandardMaterial color="#1a4488" roughness={0.82} metalness={0} />
      </mesh>
      <mesh ref={armRRef} position={[0.32, 1.08, 0]} castShadow>
        <boxGeometry args={[0.16, 0.54, 0.19]} />
        <meshStandardMaterial color="#1a4488" roughness={0.82} metalness={0} />
      </mesh>
      {/* Hands */}
      <mesh position={[-0.32, 0.78, 0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#e0a070" roughness={0.75} metalness={0} />
      </mesh>
      <mesh position={[0.32, 0.78, 0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#e0a070" roughness={0.75} metalness={0} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.075, 0.095, 0.15, 7]} />
        <meshStandardMaterial color="#e0a070" roughness={0.78} metalness={0} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <boxGeometry args={[0.32, 0.34, 0.3]} />
        <meshStandardMaterial color="#e0a070" roughness={0.76} metalness={0} />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 1.88, 0]}>
        <boxGeometry args={[0.34, 0.11, 0.32]} />
        <meshStandardMaterial color="#1a0800" roughness={0.92} metalness={0} />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.18, 1.7, 0]}>
        <boxGeometry args={[0.045, 0.075, 0.075]} />
        <meshStandardMaterial color="#d09060" roughness={0.8} metalness={0} />
      </mesh>
      <mesh position={[0.18, 1.7, 0]}>
        <boxGeometry args={[0.045, 0.075, 0.075]} />
        <meshStandardMaterial color="#d09060" roughness={0.8} metalness={0} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.09, 1.73, 0.152]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.1} metalness={0} />
      </mesh>
      <mesh position={[-0.09, 1.73, 0.19]}>
        <sphereGeometry args={[0.028, 7, 7]} />
        <meshStandardMaterial color="#1a0800" roughness={0.2} metalness={0} />
      </mesh>
      <mesh position={[0.09, 1.73, 0.152]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.1} metalness={0} />
      </mesh>
      <mesh position={[0.09, 1.73, 0.19]}>
        <sphereGeometry args={[0.028, 7, 7]} />
        <meshStandardMaterial color="#1a0800" roughness={0.2} metalness={0} />
      </mesh>
      {/* Eyebrows */}
      <mesh position={[-0.09, 1.78, 0.155]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[0.075, 0.02, 0.015]} />
        <meshStandardMaterial color="#1a0800" roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0.09, 1.78, 0.155]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[0.075, 0.02, 0.015]} />
        <meshStandardMaterial color="#1a0800" roughness={0.9} metalness={0} />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 1.65, 0.158]}>
        <boxGeometry args={[0.045, 0.065, 0.04]} />
        <meshStandardMaterial color="#d09060" roughness={0.8} metalness={0} />
      </mesh>
      {/* Mouth */}
      <mesh position={[0, 1.585, 0.155]}>
        <boxGeometry args={[0.1, 0.025, 0.025]} />
        <meshStandardMaterial color="#882200" roughness={0.6} metalness={0} />
      </mesh>
      {/* Collar */}
      <mesh position={[-0.2, 1.42, 0.1]} rotation={[0, 0.4, 0.3]}>
        <boxGeometry args={[0.14, 0.06, 0.06]} />
        <meshStandardMaterial color="#1a4488" roughness={0.82} metalness={0} />
      </mesh>
      <mesh position={[0.2, 1.42, 0.1]} rotation={[0, -0.4, -0.3]}>
        <boxGeometry args={[0.14, 0.06, 0.06]} />
        <meshStandardMaterial color="#1a4488" roughness={0.82} metalness={0} />
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
  sensitivityRef: React.MutableRefObject<number>;
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
  sensitivityRef,
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
    if (running && isMoving)
      staminaRef.current = Math.max(0, staminaRef.current - delta * 20);
    else staminaRef.current = Math.min(100, staminaRef.current + delta * 10);
    onStaminaChange(staminaRef.current);

    const { dx, dy } = mouseRef.current;
    const sens = sensitivityRef.current * 0.002;
    yawRef.current -= dx * sens;
    pitchRef.current = Math.max(
      -0.6,
      Math.min(0.6, pitchRef.current - dy * sens),
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
    } else jumpRef.current = false;
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
  sensitivityRef: React.MutableRefObject<number>;
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
  sensitivityRef,
}: GameSceneProps) {
  const timeRef = useRef(0);
  const jumpscareTimerRef = useRef(55 + Math.random() * 110);
  const heartbeatTimerRef = useRef(0);
  const gameOverCalledRef = useRef(false);
  const lastMinuteRef = useRef(0);
  const [supercharged, setSupercharged] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const centipedeBaseSpeed =
    mode === "nightmare" ? 7 : mode === "challenge" ? 6 : 4.5;
  const canHide = mode !== "challenge";
  const isDay = dayMode === "day";
  const fogDensity = isDay ? 0.004 : mode === "challenge" ? 0.028 : 0.015;
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
    onTimeChange(Math.floor(timeRef.current));
    const currentMinute = Math.floor(timeRef.current / 60);
    if (currentMinute > lastMinuteRef.current) {
      lastMinuteRef.current = currentMinute;
      setSupercharged(true);
      onSupercharge(true);
      playSupercharge(getAC(audioRef));
      playerSpeedBoostRef.current += 1.5;
      setTimeout(() => {
        setSupercharged(false);
        onSupercharge(false);
      }, 10000);
    }
    jumpscareTimerRef.current -= delta;
    if (jumpscareTimerRef.current <= 0) {
      jumpscareTimerRef.current = 55 + Math.random() * 110;
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
      <ambientLight
        intensity={isDay ? 1.6 : 0.9}
        color={isDay ? "#fff8f0" : "#2a3a5a"}
      />
      <directionalLight
        position={[60, 90, 40]}
        intensity={isDay ? 3.2 : 1.8}
        color={isDay ? "#fffbe0" : "#8899cc"}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-far={400}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-bias={-0.0005}
      />
      {!isDay && (
        <directionalLight
          position={[-50, 70, -30]}
          intensity={0.9}
          color="#6677bb"
        />
      )}
      {!isDay && (
        <pointLight
          position={[0, 30, 0]}
          intensity={0.6}
          color="#003300"
          distance={120}
        />
      )}
      {!isDay && <StarField />}
      {!isDay && <MoonMesh />}
      {supercharged && <ambientLight intensity={0.7} color="#ff1a00" />}
      {supercharged && (
        <pointLight
          position={[0, 10, 0]}
          intensity={1.5}
          color="#ff4400"
          distance={80}
        />
      )}
      {/* Fill light */}
      <directionalLight
        position={[-60, 30, 60]}
        intensity={isDay ? 0.45 : 0.4}
        color={isDay ? "#ddeeff" : "#223355"}
      />
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
        sensitivityRef={sensitivityRef}
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
  const MAX_DIST = 40;

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
      if (joystickKnobRef.current)
        joystickKnobRef.current.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
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
      for (let i = 0; i < e.changedTouches.length; i++)
        if (e.changedTouches[i].identifier === touchIdRef.current)
          updateJoystick(
            e.changedTouches[i].clientX,
            e.changedTouches[i].clientY,
          );
    };
    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++)
        if (e.changedTouches[i].identifier === touchIdRef.current)
          resetJoystick();
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
    width: 54,
    height: 54,
    borderRadius: "50%",
    background: `rgba(${color}, 0.55)`,
    border: `2px solid rgba(${color}, 0.85)`,
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
          width: 116,
          height: 116,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.4)",
          border: "2px solid rgba(255,255,255,0.28)",
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
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.65)",
            border: "2px solid rgba(255,255,255,0.95)",
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

  const sel: React.CSSProperties = {
    background: "rgba(180,0,0,0.4)",
    border: "1px solid #ff4444",
    borderRadius: 8,
    padding: "9px 14px",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  };
  const unsel: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 8,
    padding: "9px 14px",
    color: "#aaa",
    cursor: "pointer",
    fontSize: 13,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background:
          "linear-gradient(135deg, #000 0%, #080310 50%, #030110 100%)",
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
            fontSize: 36,
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
            border: "1px solid rgba(255,60,60,0.2)",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#ff8888",
              letterSpacing: 1,
              marginBottom: 10,
            }}
          >
            GAME MODE
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {modes.map((m) => (
              <button
                type="button"
                key={m.v}
                onClick={() => setMode(m.v)}
                style={mode === m.v ? sel : unsel}
              >
                <div>{m.label}</div>
                <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 400 }}>
                  {m.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div
          style={{
            background: "rgba(255,0,0,0.05)",
            border: "1px solid rgba(255,60,60,0.2)",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#ff8888",
              letterSpacing: 1,
              marginBottom: 10,
            }}
          >
            MAP
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {maps.map((m) => (
              <button
                type="button"
                key={m.v}
                onClick={() => setMap(m.v)}
                style={map === m.v ? sel : unsel}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div
          style={{
            background: "rgba(255,0,0,0.05)",
            border: "1px solid rgba(255,60,60,0.2)",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#ff8888",
              letterSpacing: 1,
              marginBottom: 10,
            }}
          >
            CAMERA
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["third", "first"] as CameraMode[]).map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCam(c)}
                style={cam === c ? sel : unsel}
              >
                {c === "third" ? "🎥 3rd Person" : "👁 1st Person"}
              </button>
            ))}
          </div>
        </div>
        <div
          style={{
            background: "rgba(255,0,0,0.05)",
            border: "1px solid rgba(255,60,60,0.2)",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#ff8888",
              letterSpacing: 1,
              marginBottom: 10,
            }}
          >
            TIME
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["night", "day"] as DayMode[]).map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => setDay(d)}
                style={day === d ? sel : unsel}
              >
                {d === "night" ? "🌙 Night" : "☀️ Day"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onStart(mode, map, cam, day)}
        data-ocid="game.start.primary_button"
        style={{
          marginTop: 22,
          padding: "14px 48px",
          background: "linear-gradient(135deg, #cc0000, #880000)",
          border: "1px solid #ff4444",
          borderRadius: 10,
          color: "#fff",
          fontSize: 17,
          fontWeight: 900,
          cursor: "pointer",
          letterSpacing: 2,
          boxShadow: "0 0 20px rgba(255,0,0,0.4)",
        }}
      >
        ▶ START GAME
      </button>
      <div
        style={{
          marginTop: 16,
          fontSize: 11,
          color: "#666",
          textAlign: "center",
        }}
      >
        WASD / Joystick = Move · Shift = Run · Space = Jump · E = Hide · V =
        Camera · T = Torch
      </div>
    </div>
  );
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
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
  sensitivityRef,
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
  sensitivityRef: React.MutableRefObject<number>;
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
  const [showSettings, setShowSettings] = useState(false);
  const [sensitivity, setSensitivity] = useState(sensitivityRef.current);

  const btnSt: React.CSSProperties = {
    padding: "5px 10px",
    background: "rgba(0,0,0,0.7)",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: 6,
    color: "#fff",
    cursor: "pointer",
    fontSize: 11,
  };

  return (
    <>
      <style>{`
        @keyframes jumpscareZoom {
          0% { transform: scale(0.12) rotate(-8deg); opacity: 0; }
          35% { transform: scale(1.3) rotate(3deg); opacity: 1; }
          65% { transform: scale(1.0) rotate(0deg); opacity: 1; }
          100% { transform: scale(2.2) rotate(-6deg); opacity: 0; }
        }
        @keyframes eyePulse {
          0%,100% { box-shadow: 0 0 10px #00ff44, 0 0 22px #00ff44; }
          50% { box-shadow: 0 0 30px #00ff44, 0 0 60px #00ff44; }
        }
        @keyframes scareText {
          0% { transform: translateX(-50%) scale(0.5); opacity:0; }
          40% { transform: translateX(-50%) scale(1.15); opacity:1; }
          100% { transform: translateX(-50%) scale(1.0); opacity:1; }
        }
        @keyframes superPulse {
          0%,100% { border-color: rgba(255,60,0,0.7); box-shadow: inset 0 0 60px rgba(255,0,0,0.25); }
          50% { border-color: rgba(255,150,0,0.9); box-shadow: inset 0 0 100px rgba(255,80,0,0.45); }
        }
      `}</style>

      {/* Jumpscare full overlay */}
      {jumpscareActive && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10003,
            background: "rgba(160,0,0,0.82)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {/* Centipede face */}
          <div
            style={{
              width: 270,
              height: 230,
              borderRadius: "50%",
              background: "radial-gradient(circle, #0c1e00 0%, #000 70%)",
              position: "relative",
              boxShadow: "0 0 90px #00ff44, 0 0 180px rgba(0,255,0,0.25)",
              animation: "jumpscareZoom 0.75s ease-out forwards",
            }}
          >
            {/* 6 eyes - static rendering */}
            {[
              { x: 95, y: 68, sz: 24, c: "#00ff55" },
              { x: 155, y: 68, sz: 24, c: "#00ff55" },
              { x: 72, y: 96, sz: 17, c: "#00dd33" },
              { x: 178, y: 96, sz: 17, c: "#00dd33" },
              { x: 108, y: 46, sz: 13, c: "#00bb22" },
              { x: 152, y: 46, sz: 13, c: "#00bb22" },
            ].map((eye) => (
              <div
                key={`${eye.x}-${eye.y}`}
                style={{
                  position: "absolute",
                  left: eye.x,
                  top: eye.y,
                  width: eye.sz,
                  height: eye.sz,
                  borderRadius: "50%",
                  background: eye.c,
                  animation: "eyePulse 0.25s infinite",
                }}
              />
            ))}
            {/* Fangs - static rendering */}
            {[
              { x: -28, y: 148, rot: -18, h: 50 },
              { x: 28, y: 148, rot: 18, h: 50 },
              { x: -14, y: 158, rot: -12, h: 38 },
              { x: 14, y: 158, rot: 12, h: 38 },
            ].map((fang) => (
              <div
                key={`${fang.x}-${fang.y}`}
                style={{
                  position: "absolute",
                  left: `calc(50% + ${fang.x}px)`,
                  top: fang.y,
                  width: 9,
                  height: fang.h,
                  background: "linear-gradient(to bottom, #aaffaa, #004400)",
                  borderRadius: "0 0 60% 60%",
                  transform: `rotate(${fang.rot}deg)`,
                }}
              />
            ))}
          </div>
          <div
            style={{
              color: "#ff1a00",
              fontSize: 30,
              fontWeight: 900,
              marginTop: 18,
              textShadow: "0 0 25px #ff0000, 0 0 50px #880000",
              letterSpacing: 4,
              animation: "scareText 0.4s ease-out forwards",
              position: "relative",
              left: "50%",
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
            }}
          >
            IT FOUND YOU!
          </div>
        </div>
      )}

      {/* Supercharge border */}
      {superchargeActive && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10001,
            border: "5px solid rgba(255,60,0,0.8)",
            pointerEvents: "none",
            animation: "superPulse 0.5s infinite",
          }}
        />
      )}

      {/* Top HUD bar */}
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
            "linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)",
          pointerEvents: "none",
        }}
      >
        {/* Left */}
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
              width: 115,
              height: 8,
              background: "rgba(255,255,255,0.15)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 4,
                width: `${stamina}%`,
                background:
                  stamina > 50
                    ? "#33ee77"
                    : stamina > 25
                      ? "#ffaa00"
                      : "#ff2222",
                transition: "width 0.1s",
                boxShadow: stamina > 50 ? "0 0 6px #33ee77" : "0 0 6px #ff2222",
              }}
            />
          </div>
          {playerSpeedLevel > 0 && (
            <div style={{ fontSize: 9, color: "#88ffaa", marginTop: 3 }}>
              ⚡ Speed +{playerSpeedLevel.toFixed(1)}
            </div>
          )}
        </div>
        {/* Center */}
        <div style={{ textAlign: "center", pointerEvents: "none" }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#fff",
              textShadow: "0 0 12px rgba(255,100,100,0.6)",
            }}
          >
            ⏱ {mins}:{secs}
          </div>
          {superchargeActive && (
            <div style={{ fontSize: 10, color: "#ff6600", fontWeight: 700 }}>
              ⚡ SUPERCHARGED!
            </div>
          )}
        </div>
        {/* Right buttons */}
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
            style={btnSt}
          >
            {cameraMode === "third" ? "👁 FPV" : "🎥 TPV"}
          </button>
          <button
            type="button"
            onClick={onToggleDay}
            data-ocid="game.day.toggle"
            style={{
              ...btnSt,
              borderColor: "rgba(255,220,0,0.4)",
              color: "#ffee88",
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
                ...btnSt,
                background: torchEnabled
                  ? "rgba(255,180,0,0.3)"
                  : "rgba(0,0,0,0.7)",
                borderColor: torchEnabled ? "#ffcc44" : "rgba(255,255,255,0.2)",
                color: torchEnabled ? "#ffee88" : "#888",
              }}
            >
              🔦 Torch
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            style={{
              ...btnSt,
              borderColor: showSettings ? "#88aaff" : "rgba(255,255,255,0.3)",
              color: showSettings ? "#aaccff" : "#fff",
            }}
          >
            ⚙
          </button>
          <button
            type="button"
            onClick={onPause}
            data-ocid="game.pause.button"
            style={btnSt}
          >
            ⏸ Menu
          </button>
          <button
            type="button"
            onClick={onClose}
            data-ocid="game.close_button"
            style={{
              ...btnSt,
              background: "rgba(160,0,0,0.55)",
              borderColor: "rgba(255,80,80,0.5)",
            }}
          >
            ✕ Exit
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div
          style={{
            position: "fixed",
            top: 56,
            right: 14,
            zIndex: 10002,
            background: "rgba(0,0,0,0.88)",
            border: "1px solid rgba(100,150,255,0.4)",
            borderRadius: 10,
            padding: "14px 18px",
            minWidth: 200,
            pointerEvents: "all",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#aaccff",
              marginBottom: 10,
              fontWeight: 700,
            }}
          >
            ⚙ SETTINGS
          </div>
          <div style={{ fontSize: 11, color: "#ccc", marginBottom: 6 }}>
            Mouse Sensitivity:{" "}
            <span style={{ color: "#fff", fontWeight: 700 }}>
              {sensitivity.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min={0.3}
            max={3.0}
            step={0.1}
            value={sensitivity}
            onChange={(e) => {
              const v = Number.parseFloat(e.target.value);
              setSensitivity(v);
              sensitivityRef.current = v;
            }}
            style={{ width: "100%", accentColor: "#4488ff" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 9,
              color: "#666",
              marginTop: 2,
            }}
          >
            <span>Slow</span>
            <span>Fast</span>
          </div>
        </div>
      )}

      {/* Near house hint */}
      {nearHouse && !isHidden && (
        <div
          style={{
            position: "fixed",
            bottom: 145,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10001,
            background: "rgba(0,0,0,0.8)",
            border: "1px solid rgba(255,200,0,0.6)",
            padding: "8px 20px",
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
            bottom: 145,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10001,
            background: "rgba(0,80,0,0.85)",
            border: "1px solid rgba(0,255,0,0.6)",
            padding: "8px 20px",
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
      {/* Controls hint */}
      <div
        style={{
          position: "fixed",
          bottom: 145,
          right: 14,
          zIndex: 10001,
          fontSize: 9,
          color: "rgba(255,255,255,0.35)",
          textAlign: "right",
          lineHeight: 1.6,
          pointerEvents: "none",
        }}
      >
        WASD/Joystick · Shift=Run · Space=Jump
        <br />
        E=Hide · V=Cam · T=Torch
      </div>
    </>
  );
}

// ─── Game Over ────────────────────────────────────────────────────────────────
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
        background: "rgba(0,0,0,0.93)",
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
      <div style={{ fontSize: 64, marginBottom: 10 }}>💀</div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 900,
          color: "#ff3333",
          textShadow: "0 0 25px #ff0000",
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
            padding: "12px 30px",
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
            padding: "12px 30px",
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
  const sensitivityRef = useRef(1.0);
  const gameKeyRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(
      () => setPlayerSpeedBoost(playerSpeedBoostRef.current),
      500,
    );
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
  const handleRestart = useCallback(
    () => handleStart(gameMode, mapType, cameraMode, dayMode),
    [handleStart, gameMode, mapType, cameraMode, dayMode],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if (e.code === "KeyV")
        setCameraMode((c) => (c === "third" ? "first" : "third"));
      if (e.code === "KeyT") setTorchEnabled((v) => !v);
      if (e.code === "Escape") setGameState("menu");
      if (
        e.code === "KeyE" &&
        nearHouseRef.current &&
        gameMode !== "challenge"
      ) {
        const nh = !isHiddenRef.current;
        isHiddenRef.current = nh;
        setIsHidden(nh);
        playCreak(getAC(audioRef));
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

  useEffect(() => {
    if (gameState !== "playing") return;
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        mouseRef.current.dx += e.movementX;
        mouseRef.current.dy += e.movementY;
      } else if (e.buttons === 1) {
        mouseRef.current.dx += e.movementX;
        mouseRef.current.dy += e.movementY;
      }
    };
    const onClick = () => {
      const canvas = document.querySelector("canvas");
      if (canvas && !document.pointerLockElement) canvas.requestPointerLock();
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onClick);
      if (document.pointerLockElement) document.exitPointerLock();
    };
  }, [gameState]);

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
        const t = e.touches[e.touches.length > 1 ? 1 : 0];
        mouseRef.current.dx += (t.clientX - lastTouch.x) * 1.6;
        mouseRef.current.dy += (t.clientY - lastTouch.y) * 1.6;
        lastTouch.x = t.clientX;
        lastTouch.y = t.clientY;
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
    setTimeout(() => setJumpscareActive(false), 800);
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
          dpr={[1, 2]}
          camera={{ fov: 75, near: 0.1, far: 500 }}
          style={{ position: "fixed", inset: 0 }}
          gl={{
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
          }}
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
              sensitivityRef={sensitivityRef}
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
            sensitivityRef={sensitivityRef}
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
