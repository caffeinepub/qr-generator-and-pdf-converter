import { Sky } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

// ── Types ─────────────────────────────────────────────────────────────────────
type NpcState = "wander" | "flee" | "chase" | "dead";

interface NpcData {
  id: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  yaw: number;
  type: "civilian" | "police";
  state: NpcState;
  health: number;
  color: string;
  target: THREE.Vector3;
  wanderTimer: number;
}

interface NpcRenderItem {
  id: number;
  color: string;
  type: "civilian" | "police";
}

interface ProjData {
  id: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  weaponType: number;
  timer: number;
  alive: boolean;
}

interface ProjRenderItem {
  id: number;
  color: string;
  size: number;
}

interface BloodDecalData {
  id: number;
  pos: [number, number, number];
}

interface BloodParticle {
  id: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  alive: boolean;
}

interface ExplosionData {
  id: number;
  pos: THREE.Vector3;
  timer: number;
  maxTimer: number;
  radius: number;
  dmgRadius: number;
}

interface ExplosionRenderItem {
  id: number;
  color: string;
}

interface TaskData {
  id: number;
  type: string;
  description: string;
  target: number;
  progress: number;
}

interface HudState {
  health: number;
  xp: number;
  level: number;
  wantedLevel: number;
  weapon: number;
  ammo: number[];
  tasks: TaskData[];
  gameOver: boolean;
  kills: number;
  tasksDone: number;
  levelUpText: string;
  flashMsg: string;
  isHiding: boolean;
  inRocket: boolean;
  isFlying: boolean;
}

interface WeaponDef {
  name: string;
  levelReq: number;
  damage: number;
  speed: number;
  fireRate: number;
  color: string;
  size: number;
  explosive: boolean;
  dmgRadius: number;
  ammoMax: number;
  pellets: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const WEAPONS: WeaponDef[] = [
  {
    name: "Pistol",
    levelReq: 2,
    damage: 30,
    speed: 25,
    fireRate: 0.5,
    color: "#FFD700",
    size: 0.12,
    explosive: false,
    dmgRadius: 0,
    ammoMax: 30,
    pellets: 1,
  },
  {
    name: "SMG",
    levelReq: 5,
    damage: 15,
    speed: 35,
    fireRate: 0.1,
    color: "#FF8C00",
    size: 0.1,
    explosive: false,
    dmgRadius: 0,
    ammoMax: 100,
    pellets: 1,
  },
  {
    name: "Shotgun",
    levelReq: 10,
    damage: 55,
    speed: 20,
    fireRate: 1.0,
    color: "#CC4400",
    size: 0.15,
    explosive: false,
    dmgRadius: 0,
    ammoMax: 15,
    pellets: 5,
  },
  {
    name: "Rifle",
    levelReq: 15,
    damage: 40,
    speed: 40,
    fireRate: 0.35,
    color: "#00cfff",
    size: 0.11,
    explosive: false,
    dmgRadius: 0,
    ammoMax: 40,
    pellets: 1,
  },
  {
    name: "Sniper",
    levelReq: 20,
    damage: 100,
    speed: 60,
    fireRate: 2.0,
    color: "#ffffff",
    size: 0.13,
    explosive: false,
    dmgRadius: 0,
    ammoMax: 10,
    pellets: 1,
  },
  {
    name: "RPG",
    levelReq: 25,
    damage: 150,
    speed: 15,
    fireRate: 2.5,
    color: "#FF4400",
    size: 0.3,
    explosive: true,
    dmgRadius: 8,
    ammoMax: 5,
    pellets: 1,
  },
  {
    name: "Minigun",
    levelReq: 30,
    damage: 10,
    speed: 30,
    fireRate: 0.05,
    color: "#FFAA00",
    size: 0.09,
    explosive: false,
    dmgRadius: 0,
    ammoMax: 300,
    pellets: 1,
  },
  {
    name: "Grenade Launcher",
    levelReq: 35,
    damage: 120,
    speed: 12,
    fireRate: 1.5,
    color: "#00FF44",
    size: 0.28,
    explosive: true,
    dmgRadius: 10,
    ammoMax: 8,
    pellets: 1,
  },
  {
    name: "Plasma Gun",
    levelReq: 40,
    damage: 60,
    speed: 55,
    fireRate: 0.2,
    color: "#FF00FF",
    size: 0.18,
    explosive: false,
    dmgRadius: 0,
    ammoMax: 50,
    pellets: 1,
  },
  {
    name: "Nuke Launcher",
    levelReq: 50,
    damage: 9999,
    speed: 8,
    fireRate: 6.0,
    color: "#FFFF44",
    size: 0.5,
    explosive: true,
    dmgRadius: 40,
    ammoMax: 2,
    pellets: 1,
  },
];

const LEVEL_XP = [
  0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5000, 6200, 7600,
  9200, 11000, 13000, 15200, 17600, 20200, 23000, 26000, 29200, 32600, 36200,
  40000, 44000, 48200, 52600, 57200, 62000, 67000, 72200, 77600, 83200, 89000,
  95000, 101200, 107600, 114200, 121000, 128000, 135200, 142600, 150200, 158000,
  166000, 174200, 182600, 191200, 200000,
];

const CIVILIAN_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#52BE80",
  "#E8A87C",
  "#85C1E9",
];

const TASK_TEMPLATES = [
  { type: "poop", desc: "Poop near {N} people", counts: [3, 5, 10] },
  { type: "kill_civ", desc: "Eliminate {N} civilians", counts: [3, 5, 10] },
  { type: "kill_police", desc: "Take down {N} police", counts: [2, 5, 8] },
  { type: "escape", desc: "Evade police {N} times", counts: [1, 2, 3] },
  { type: "survive", desc: "Survive {N} seconds", counts: [60, 120, 180] },
];

// House: [x, z, w, d, h, color]
const HOUSE_DEFS: [number, number, number, number, number, string][] = [
  [-30, -30, 8, 6, 5, "#CC8844"],
  [20, -40, 7, 7, 6, "#8844CC"],
  [-50, 20, 9, 6, 4, "#44CC88"],
  [40, 30, 6, 8, 5, "#CC4444"],
  [-10, 50, 8, 7, 6, "#4488CC"],
  [60, -20, 7, 5, 4, "#CCAA44"],
  [-70, -10, 6, 6, 5, "#44AACC"],
  [30, 70, 9, 8, 7, "#CC6644"],
  [-40, 70, 6, 6, 4, "#88CC44"],
  [70, 50, 8, 7, 5, "#CC4488"],
  [50, -60, 7, 6, 6, "#6644CC"],
  [-60, -60, 6, 8, 4, "#44CC66"],
  [10, -70, 8, 6, 5, "#CCCC44"],
  [-80, 40, 7, 7, 6, "#44CCCC"],
  [80, -40, 6, 6, 4, "#CC4466"],
];

const ROCKET_POS: [number, number, number] = [0, 0, -60];

const NEON_BLUE = "#00cfff";
const NEON_RED = "#ff4444";
const NEON_GREEN = "#00ff88";
const NEON_YELLOW = "#FFD700";
const HUD_BG = "rgba(0,0,20,0.80)";

function btnStyle(color: string): React.CSSProperties {
  return {
    background: `linear-gradient(135deg, ${color}22, ${color}44)`,
    border: `1px solid ${color}`,
    borderRadius: "8px",
    color: color,
    fontWeight: 700,
    fontSize: "12px",
    padding: "6px 12px",
    cursor: "pointer",
    textShadow: `0 0 8px ${color}`,
    boxShadow: `0 0 10px ${color}44`,
    fontFamily: "monospace",
    letterSpacing: "0.05em",
  };
}

// ── Seeded RNG ────────────────────────────────────────────────────────────────
function makeRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

// ── Audio ─────────────────────────────────────────────────────────────────────
function getAudioCtx(
  ref: React.MutableRefObject<AudioContext | null>,
): AudioContext | null {
  try {
    if (!ref.current) {
      const AC =
        window.AudioContext ||
        (window as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      ref.current = new AC();
    }
    if (ref.current.state === "suspended") ref.current.resume().catch(() => {});
    return ref.current;
  } catch {
    return null;
  }
}

function playGunshot(ctx: AudioContext | null, weaponType: number) {
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    if (weaponType >= 5 && WEAPONS[weaponType]?.explosive) {
      // explosive boom
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3);
      g.gain.setValueAtTime(0.4, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
    } else if (weaponType === 1) {
      // smg / auto - quiet short
      osc.type = "square";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.06);
    } else {
      // pistol / rifle
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);
      g.gain.setValueAtTime(0.25, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    }
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    /**/
  }
}

function playPoopSound(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.setValueAtTime(60, ctx.currentTime + 0.05);
    osc.frequency.setValueAtTime(90, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(50, ctx.currentTime + 0.15);
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.22);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    /**/
  }
}

function playDeathSound(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    /**/
  }
}

function playLevelUp(ctx: AudioContext | null) {
  if (!ctx) return;
  const freqs = [523, 659, 784, 1047];
  freqs.forEach((freq, i) => {
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const t = ctx.currentTime + i * 0.12;
      osc.type = "triangle";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.15, t);
      g.gain.linearRampToValueAtTime(0, t + 0.1);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch {
      /**/
    }
  });
}

function updateSiren(
  ctx: AudioContext | null,
  sirenRef: React.MutableRefObject<OscillatorNode | null>,
  sirenGainRef: React.MutableRefObject<GainNode | null>,
  wantedLevel: number,
) {
  if (!ctx) return;
  if (wantedLevel > 0 && !sirenRef.current) {
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      g.gain.value = 0.04 * Math.min(wantedLevel, 5);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      sirenRef.current = osc;
      sirenGainRef.current = g;
    } catch {
      /**/
    }
  } else if (wantedLevel === 0 && sirenRef.current) {
    try {
      sirenRef.current.stop();
    } catch {
      /**/
    }
    sirenRef.current = null;
    sirenGainRef.current = null;
  }
  // oscillate frequency in a separate interval handled externally
}

// ── Task helpers ──────────────────────────────────────────────────────────────
let taskIdCounter = 0;
function generateTask(exclude: string[]): TaskData {
  const available = TASK_TEMPLATES.filter((t) => !exclude.includes(t.type));
  const pool = available.length > 0 ? available : TASK_TEMPLATES;
  const tmpl = pool[Math.floor(Math.random() * pool.length)];
  const count = tmpl.counts[Math.floor(Math.random() * tmpl.counts.length)];
  return {
    id: ++taskIdCounter,
    type: tmpl.type,
    description: tmpl.desc.replace("{N}", String(count)),
    target: count,
    progress: 0,
  };
}

function initTasks(): TaskData[] {
  const t1 = generateTask([]);
  const t2 = generateTask([t1.type]);
  const t3 = generateTask([t1.type, t2.type]);
  return [t1, t2, t3];
}

// ── Static map components ──────────────────────────────────────────────────────
function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#4a7a40" roughness={0.95} metalness={0} />
      </mesh>
    </>
  );
}

function Road() {
  return (
    <>
      <mesh
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[6, 200]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      <mesh
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[6, 200]} />
        <meshStandardMaterial color="#444" />
      </mesh>
    </>
  );
}

type TreeInfo = {
  id: number;
  x: number;
  z: number;
  trunkH: number;
  coneH: number;
  coneR: number;
};

function TreeMesh({ tree }: { tree: TreeInfo }) {
  return (
    <group position={[tree.x, 0, tree.z]}>
      {/* Bark detail - base shadow ring */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.44, 0.48, 0.3, 8]} />
        <meshStandardMaterial color="#3a1e0a" roughness={1} metalness={0} />
      </mesh>
      {/* Trunk */}
      <mesh position={[0, tree.trunkH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.42, tree.trunkH, 8]} />
        <meshStandardMaterial color="#6B4226" roughness={0.95} metalness={0} />
      </mesh>
      {/* Lower canopy - darker */}
      <mesh position={[0, tree.trunkH + tree.coneH * 0.3, 0]} castShadow>
        <coneGeometry args={[tree.coneR * 1.1, tree.coneH * 0.65, 8]} />
        <meshStandardMaterial color="#1a7a1a" roughness={0.8} metalness={0} />
      </mesh>
      {/* Mid canopy */}
      <mesh position={[0, tree.trunkH + tree.coneH * 0.62, 0]} castShadow>
        <coneGeometry args={[tree.coneR * 0.85, tree.coneH * 0.65, 8]} />
        <meshStandardMaterial color="#228b22" roughness={0.8} metalness={0} />
      </mesh>
      {/* Top canopy - brightest */}
      <mesh position={[0, tree.trunkH + tree.coneH * 0.95, 0]} castShadow>
        <coneGeometry args={[tree.coneR * 0.55, tree.coneH * 0.5, 8]} />
        <meshStandardMaterial color="#2d9b2d" roughness={0.75} metalness={0} />
      </mesh>
    </group>
  );
}

function HouseMesh({
  def,
}: { def: [number, number, number, number, number, string] }) {
  const [x, z, w, d, h, color] = def;
  return (
    <group position={[x, 0, z]}>
      {/* Foundation slab */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[w + 0.4, 0.2, d + 0.4]} />
        <meshStandardMaterial color="#7a6a5a" roughness={0.95} metalness={0} />
      </mesh>
      {/* Walls */}
      <mesh position={[0, h / 2 + 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.85} metalness={0} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, h + 0.1 + 1.2, 0]} castShadow>
        <coneGeometry args={[Math.max(w, d) * 0.75, 2.5, 4]} />
        <meshStandardMaterial color="#8B0000" roughness={0.9} metalness={0} />
      </mesh>
      {/* Chimney */}
      <mesh position={[w * 0.28, h + 0.1 + 1.8, 0]} castShadow>
        <boxGeometry args={[0.55, 1.5, 0.55]} />
        <meshStandardMaterial color="#6a3a2a" roughness={0.9} metalness={0} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 1.1, d / 2 + 0.12]}>
        <boxGeometry args={[1.2, 2.2, 0.1]} />
        <meshStandardMaterial
          color="#5C3317"
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>
      {/* Door frame */}
      <mesh position={[0, 1.1, d / 2 + 0.14]}>
        <boxGeometry args={[1.45, 2.45, 0.06]} />
        <meshStandardMaterial color="#3a2010" roughness={0.8} metalness={0} />
      </mesh>
      {/* Window left */}
      <mesh position={[-1.6, h * 0.55 + 0.1, d / 2 + 0.1]}>
        <boxGeometry args={[1.1, 1.0, 0.08]} />
        <meshStandardMaterial color="#aaddff" roughness={0.1} metalness={0.2} />
      </mesh>
      {/* Window left frame */}
      <mesh position={[-1.6, h * 0.55 + 0.1, d / 2 + 0.14]}>
        <boxGeometry args={[1.3, 1.2, 0.05]} />
        <meshStandardMaterial color="#3a2010" roughness={0.8} metalness={0} />
      </mesh>
      {/* Window right */}
      <mesh position={[1.6, h * 0.55 + 0.1, d / 2 + 0.1]}>
        <boxGeometry args={[1.1, 1.0, 0.08]} />
        <meshStandardMaterial color="#aaddff" roughness={0.1} metalness={0.2} />
      </mesh>
      {/* Window right frame */}
      <mesh position={[1.6, h * 0.55 + 0.1, d / 2 + 0.14]}>
        <boxGeometry args={[1.3, 1.2, 0.05]} />
        <meshStandardMaterial color="#3a2010" roughness={0.8} metalness={0} />
      </mesh>
    </group>
  );
}

function RocketMesh() {
  return (
    <group position={ROCKET_POS}>
      {/* body */}
      <mesh position={[0, 4, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.2, 8, 12]} />
        <meshStandardMaterial color="#cccccc" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* nose */}
      <mesh position={[0, 9, 0]} castShadow>
        <coneGeometry args={[1.2, 3, 12]} />
        <meshStandardMaterial color="#ff3333" />
      </mesh>
      {/* fins */}
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((angle, _rocketFinIdx) => (
        <mesh
          key={String(angle)}
          position={[Math.sin(angle) * 1.8, 1.5, Math.cos(angle) * 1.8]}
          rotation={[0, angle, 0]}
          castShadow
        >
          <boxGeometry args={[0.2, 2.5, 1.5]} />
          <meshStandardMaterial color="#ff3333" />
        </mesh>
      ))}
      {/* flame */}
      <mesh position={[0, -0.5, 0]}>
        <coneGeometry args={[0.8, 2.5, 8]} />
        <meshStandardMaterial
          color="#ff8800"
          emissive="#ff4400"
          emissiveIntensity={2}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* label */}
      <pointLight
        position={[0, 4, 0]}
        color="#ff8800"
        intensity={3}
        distance={8}
      />
    </group>
  );
}

// ── NPC mesh ──────────────────────────────────────────────────────────────────
function NpcMesh({
  npc,
  onMount,
}: {
  npc: NpcRenderItem;
  onMount: (id: number, g: THREE.Group | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useEffect(() => {
    onMount(npc.id, groupRef.current);
    return () => onMount(npc.id, null);
  }, [npc.id, onMount]);

  const bodyColor = npc.type === "police" ? "#2255cc" : npc.color;
  const shirtColor = npc.type === "police" ? "#1a44aa" : npc.color;

  return (
    <group ref={groupRef}>
      {/* body */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.5, 0.8, 0.28]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>
      {/* head */}
      <mesh position={[0, 1.18, 0]}>
        <sphereGeometry args={[0.22, 8, 6]} />
        <meshStandardMaterial color="#f4c98a" />
      </mesh>
      {/* left arm */}
      <mesh position={[-0.33, 0.6, 0]}>
        <boxGeometry args={[0.17, 0.6, 0.17]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      {/* right arm */}
      <mesh position={[0.33, 0.6, 0]}>
        <boxGeometry args={[0.17, 0.6, 0.17]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      {/* left leg */}
      <mesh position={[-0.15, 0.0, 0]}>
        <boxGeometry args={[0.18, 0.55, 0.18]} />
        <meshStandardMaterial
          color={npc.type === "police" ? "#111133" : "#2244aa"}
        />
      </mesh>
      {/* right leg */}
      <mesh position={[0.15, 0.0, 0]}>
        <boxGeometry args={[0.18, 0.55, 0.18]} />
        <meshStandardMaterial
          color={npc.type === "police" ? "#111133" : "#2244aa"}
        />
      </mesh>
      {/* police hat */}
      {npc.type === "police" && (
        <mesh position={[0, 1.48, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.15, 8]} />
          <meshStandardMaterial color="#0a0a44" />
        </mesh>
      )}
    </group>
  );
}

// ── Projectile mesh ────────────────────────────────────────────────────────────
function ProjMesh({
  proj,
  onMount,
}: {
  proj: ProjRenderItem;
  onMount: (id: number, m: THREE.Mesh | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  useEffect(() => {
    onMount(proj.id, meshRef.current);
    return () => onMount(proj.id, null);
  }, [proj.id, onMount]);
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[proj.size, 6, 6]} />
      <meshStandardMaterial
        color={proj.color}
        emissive={proj.color}
        emissiveIntensity={1.5}
      />
    </mesh>
  );
}

// ── Blood decal ───────────────────────────────────────────────────────────────
function BloodDecal({ pos }: { pos: [number, number, number] }) {
  return (
    <mesh
      position={[pos[0], 0.02, pos[2]]}
      rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}
    >
      <circleGeometry args={[0.4 + Math.random() * 0.3, 8]} />
      <meshStandardMaterial color="#880000" />
    </mesh>
  );
}

// ── Blood particle ────────────────────────────────────────────────────────────
function BloodParticleMesh({
  bp,
  onMount,
}: {
  bp: { id: number };
  onMount: (id: number, m: THREE.Mesh | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  useEffect(() => {
    onMount(bp.id, meshRef.current);
    return () => onMount(bp.id, null);
  }, [bp.id, onMount]);
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.1, 5, 5]} />
      <meshStandardMaterial color="#cc0000" />
    </mesh>
  );
}

// ── Poop mesh ─────────────────────────────────────────────────────────────────
function PoopMesh({ pos }: { pos: [number, number, number] }) {
  return (
    <mesh position={[pos[0], 0.05, pos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.28, 0.35, 0.18, 8]} />
      <meshStandardMaterial color="#5C3317" />
    </mesh>
  );
}

// ── Explosion mesh ────────────────────────────────────────────────────────────
function ExplosionMesh({
  exp,
  onMount,
}: {
  exp: ExplosionRenderItem;
  onMount: (id: number, m: THREE.Mesh | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  useEffect(() => {
    onMount(exp.id, meshRef.current);
    return () => onMount(exp.id, null);
  }, [exp.id, onMount]);
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshStandardMaterial
        color={exp.color}
        emissive={exp.color}
        emissiveIntensity={3}
        transparent
        opacity={0.75}
      />
    </mesh>
  );
}

// ── Bird Player mesh ──────────────────────────────────────────────────────────
function PlayerMesh({
  groupRef,
}: { groupRef: React.MutableRefObject<THREE.Group | null> }) {
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const a = Math.sin(t * 12) * 0.6;
    if (leftWingRef.current) leftWingRef.current.rotation.z = a;
    if (rightWingRef.current) rightWingRef.current.rotation.z = -a;
  });
  return (
    <group ref={groupRef}>
      {/* Large rounded body */}
      <mesh position={[0, 0.55, 0]} castShadow scale={[1.0, 0.85, 0.7]}>
        <sphereGeometry args={[0.52, 12, 10]} />
        <meshStandardMaterial color="#FFB800" roughness={0.3} metalness={0} />
      </mesh>
      {/* Breast feather lighter patch */}
      <mesh position={[0, 0.5, 0.32]} castShadow>
        <sphereGeometry args={[0.32, 10, 8]} />
        <meshStandardMaterial color="#FFDA6A" roughness={0.3} metalness={0} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.98, 0.25]} castShadow>
        <sphereGeometry args={[0.28, 12, 10]} />
        <meshStandardMaterial color="#FFB800" roughness={0.3} metalness={0} />
      </mesh>
      {/* Beak */}
      <mesh position={[0, 0.95, 0.54]} rotation={[0.3, 0, 0]}>
        <coneGeometry args={[0.065, 0.22, 8]} />
        <meshStandardMaterial color="#FF4500" roughness={0.4} metalness={0} />
      </mesh>
      {/* Left eye white */}
      <mesh position={[-0.12, 1.04, 0.42]}>
        <sphereGeometry args={[0.065, 8, 8]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.1} metalness={0} />
      </mesh>
      {/* Left pupil */}
      <mesh position={[-0.12, 1.04, 0.478]}>
        <sphereGeometry args={[0.038, 7, 7]} />
        <meshStandardMaterial color="#1a0a00" roughness={0.2} metalness={0} />
      </mesh>
      {/* Left eye glint */}
      <mesh position={[-0.105, 1.05, 0.505]}>
        <sphereGeometry args={[0.016, 6, 6]} />
        <meshStandardMaterial color="white" roughness={0.1} metalness={0} />
      </mesh>
      {/* Right eye white */}
      <mesh position={[0.12, 1.04, 0.42]}>
        <sphereGeometry args={[0.065, 8, 8]} />
        <meshStandardMaterial color="#f8f8f8" roughness={0.1} metalness={0} />
      </mesh>
      {/* Right pupil */}
      <mesh position={[0.12, 1.04, 0.478]}>
        <sphereGeometry args={[0.038, 7, 7]} />
        <meshStandardMaterial color="#1a0a00" roughness={0.2} metalness={0} />
      </mesh>
      {/* Right eye glint */}
      <mesh position={[0.105, 1.05, 0.505]}>
        <sphereGeometry args={[0.016, 6, 6]} />
        <meshStandardMaterial color="white" roughness={0.1} metalness={0} />
      </mesh>
      {/* Left wing */}
      <group ref={leftWingRef} position={[-0.52, 0.55, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.07, 0.38]} />
          <meshStandardMaterial color="#FF8C00" roughness={0.3} metalness={0} />
        </mesh>
        {/* Wing secondary feathers */}
        <mesh position={[-0.1, 0, -0.14]} rotation={[0, 0.15, 0]}>
          <boxGeometry args={[0.4, 0.05, 0.2]} />
          <meshStandardMaterial color="#CC6600" roughness={0.3} metalness={0} />
        </mesh>
      </group>
      {/* Right wing */}
      <group ref={rightWingRef} position={[0.52, 0.55, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.07, 0.38]} />
          <meshStandardMaterial color="#FF8C00" roughness={0.3} metalness={0} />
        </mesh>
        {/* Wing secondary feathers */}
        <mesh position={[0.1, 0, -0.14]} rotation={[0, -0.15, 0]}>
          <boxGeometry args={[0.4, 0.05, 0.2]} />
          <meshStandardMaterial color="#CC6600" roughness={0.3} metalness={0} />
        </mesh>
      </group>
      {/* Tail feathers - 3 overlapping */}
      <mesh position={[0, 0.42, -0.48]} rotation={[0.4, 0, 0]} castShadow>
        <boxGeometry args={[0.42, 0.06, 0.28]} />
        <meshStandardMaterial color="#CC7700" roughness={0.3} metalness={0} />
      </mesh>
      <mesh
        position={[-0.12, 0.44, -0.44]}
        rotation={[0.38, 0.2, 0]}
        castShadow
      >
        <boxGeometry args={[0.25, 0.05, 0.24]} />
        <meshStandardMaterial color="#AA5500" roughness={0.3} metalness={0} />
      </mesh>
      <mesh
        position={[0.12, 0.44, -0.44]}
        rotation={[0.38, -0.2, 0]}
        castShadow
      >
        <boxGeometry args={[0.25, 0.05, 0.24]} />
        <meshStandardMaterial color="#AA5500" roughness={0.3} metalness={0} />
      </mesh>
      {/* Feet (only visible when near ground) */}
      <mesh position={[-0.15, 0.08, 0.05]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
        <meshStandardMaterial color="#FF6600" roughness={0.5} metalness={0} />
      </mesh>
      <mesh position={[0.15, 0.08, 0.05]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
        <meshStandardMaterial color="#FF6600" roughness={0.5} metalness={0} />
      </mesh>
    </group>
  );
}

// ── Night Stars (Sandbox) ────────────────────────────────────────────────────
function NightStarsSandbox() {
  const positions = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 200; i++) {
      arr.push(
        (Math.random() - 0.5) * 600,
        60 + Math.random() * 120,
        (Math.random() - 0.5) * 600,
      );
    }
    return new Float32Array(arr);
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.7} color="white" sizeAttenuation />
    </points>
  );
}

// ── Day/Night Scene Lighting ─────────────────────────────────────────────────
function DayNightScene({
  isDayModeRef,
}: { isDayModeRef: React.MutableRefObject<boolean> }) {
  const [isDay, setIsDay] = useState(true);
  useFrame(() => {
    const d = isDayModeRef.current;
    if (d !== isDay) setIsDay(d);
  });

  return isDay ? (
    <>
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={2} />
      <fog attach="fog" args={["#87CEEB", 100, 220]} />
      <ambientLight intensity={0.7} />
      <hemisphereLight args={["#87CEEB", "#3a6b3a", 0.4]} />
      <directionalLight
        position={[30, 50, 30]}
        castShadow
        intensity={2.0}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      {/* Sun sphere */}
      <mesh position={[100, 80, 100]}>
        <sphereGeometry args={[6, 12, 12]} />
        <meshStandardMaterial
          color="#FFF5C0"
          emissive="#FFD700"
          emissiveIntensity={2.0}
        />
      </mesh>
    </>
  ) : (
    <>
      <color attach="background" args={["#0a0a1a"]} />
      <fog attach="fog" args={["#0a0a1a", 40, 160]} />
      <ambientLight intensity={0.25} color="#2233aa" />
      <directionalLight
        position={[-50, 60, -50]}
        intensity={0.4}
        color="#4466cc"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight
        position={[50, 20, 50]}
        intensity={0.15}
        color="#6688dd"
      />
      {/* Moon */}
      <mesh position={[-80, 120, -150]}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshStandardMaterial
          color="#fffce0"
          emissive="#fffce0"
          emissiveIntensity={0.7}
          roughness={1}
        />
        <pointLight color="#aabbff" intensity={1.5} distance={400} />
      </mesh>
      {/* Stars */}
      <NightStarsSandbox />
      {/* Street lamp lights near houses */}
      <pointLight
        position={[10, 5, 10]}
        intensity={1.5}
        color="#ffaa44"
        distance={20}
      />
      <pointLight
        position={[-20, 5, -15]}
        intensity={1.5}
        color="#ffaa44"
        distance={20}
      />
      <pointLight
        position={[30, 5, -25]}
        intensity={1.5}
        color="#ffaa44"
        distance={20}
      />
      <pointLight
        position={[-40, 5, 20]}
        intensity={1.5}
        color="#ffaa44"
        distance={20}
      />
      <pointLight
        position={[0, 5, 40]}
        intensity={1.2}
        color="#ffbb55"
        distance={18}
      />
    </>
  );
}

// ── Camera controller ─────────────────────────────────────────────────────────
function SandboxCamera({
  playerPosRef,
  camYawRef,
  isHidingRef,
  cameraModeRef,
}: {
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  camYawRef: React.MutableRefObject<number>;
  isHidingRef: React.MutableRefObject<boolean>;
  cameraModeRef: React.MutableRefObject<"fpv" | "tpv">;
}) {
  const { camera } = useThree();
  const camPosSmooth = useRef(new THREE.Vector3(0, 8, 12));

  useFrame(() => {
    const pp = playerPosRef.current;
    const yaw = camYawRef.current;
    if (cameraModeRef.current === "fpv") {
      // First-person: camera at player head
      camera.position.set(pp.x, pp.y + 1.6, pp.z);
      const lookX = pp.x - Math.sin(yaw);
      const lookZ = pp.z - Math.cos(yaw);
      camera.lookAt(lookX, pp.y + 1.6, lookZ);
    } else {
      // Third-person: behind/above player
      const dist = 12;
      const height = 7;
      const targetCamPos = new THREE.Vector3(
        pp.x + Math.sin(yaw) * dist,
        pp.y + height,
        pp.z + Math.cos(yaw) * dist,
      );
      camPosSmooth.current.lerp(targetCamPos, 0.1);
      camera.position.copy(camPosSmooth.current);
      const lookTarget = new THREE.Vector3(pp.x, pp.y + 1.2, pp.z);
      camera.lookAt(lookTarget);
      if (isHidingRef.current) {
        camera.position.y = Math.max(camera.position.y, pp.y + 3);
      }
    }
  });
  return null;
}

// ── Main sandbox scene (inside Canvas) ────────────────────────────────────────
interface SandboxSceneProps {
  keysRef: React.MutableRefObject<Set<string>>;
  mouseDeltaRef: React.MutableRefObject<{ dx: number; dy: number }>;
  mousePosRef: React.MutableRefObject<{ x: number; y: number }>;
  fireRef: React.MutableRefObject<boolean>;
  audioRef: React.MutableRefObject<AudioContext | null>;
  sirenRef: React.MutableRefObject<OscillatorNode | null>;
  sirenGainRef: React.MutableRefObject<GainNode | null>;
  onHudUpdate: (hud: Partial<HudState>) => void;
  onGameOver: () => void;
  cameraModeRef: React.MutableRefObject<"fpv" | "tpv">;
  isDayModeRef: React.MutableRefObject<boolean>;
}

function SandboxScene({
  keysRef,
  mouseDeltaRef,
  fireRef,
  audioRef,
  sirenRef,
  sirenGainRef,
  onHudUpdate,
  onGameOver,
  cameraModeRef,
  isDayModeRef,
}: SandboxSceneProps) {
  // ── Static map data ──────────────────────────────────────────────────────
  const treeData = useMemo<TreeInfo[]>(() => {
    const rng = makeRng(42);
    const trees: TreeInfo[] = [];
    while (trees.length < 38) {
      const x = (rng() - 0.5) * 180;
      const z = (rng() - 0.5) * 180;
      const dist = Math.sqrt(x * x + z * z);
      if (dist < 18) continue;
      // avoid houses
      let nearHouse = false;
      for (const [hx, hz] of HOUSE_DEFS) {
        if (Math.abs(x - hx) < 10 && Math.abs(z - hz) < 10) {
          nearHouse = true;
          break;
        }
      }
      if (nearHouse) continue;
      // avoid rocket
      if (Math.abs(x - ROCKET_POS[0]) < 8 && Math.abs(z - ROCKET_POS[2]) < 8)
        continue;
      trees.push({
        id: trees.length,
        x,
        z,
        trunkH: 1.2 + rng() * 1.5,
        coneH: 2.5 + rng() * 2,
        coneR: 1.2 + rng() * 0.8,
      });
    }
    return trees;
  }, []);

  // ── Game state refs ──────────────────────────────────────────────────────
  const playerPosRef = useRef(new THREE.Vector3(0, 0.8, 0));
  const playerVelRef = useRef(new THREE.Vector3());
  const playerGroupRef = useRef<THREE.Group | null>(null);
  const camYawRef = useRef(Math.PI); // camera behind player (facing -Z)
  const isHidingRef = useRef(false);
  const inRocketRef = useRef(false);

  const flyRef = useRef(false);

  const healthRef = useRef(100);
  const xpRef = useRef(0);
  const levelRef = useRef(1);
  const wantedLevelRef = useRef(0);
  const weaponRef = useRef(0); // 0=poop, 1-10=guns
  const ammoRef = useRef<number[]>(WEAPONS.map((w) => w.ammoMax));

  const npcsRef = useRef<NpcData[]>([]);
  const projs = useRef<ProjData[]>([]);
  const bloodParticles = useRef<BloodParticle[]>([]);
  const explosions = useRef<ExplosionData[]>([]);
  const poopPositions = useRef<[number, number, number][]>([]);

  const fireTimerRef = useRef(0);
  const hudTimerRef = useRef(0);
  const policeSpawnTimerRef = useRef(0);
  const hidingTimerRef = useRef(0);
  const wantedCooldownRef = useRef(0);
  const survivTimerRef = useRef(0);
  const escapeCountRef = useRef(0);
  const prevWantedRef = useRef(0);
  const idCounterRef = useRef(1000);
  const levelUpTextTimerRef = useRef(0);
  const flashMsgTimerRef = useRef(0);
  const flashMsgRef = useRef("");
  const levelUpTextRef = useRef("");
  const killsRef = useRef(0);
  const tasksDoneRef = useRef(0);
  const gameOverRef = useRef(false);

  const tasksRef = useRef<TaskData[]>(initTasks());

  // ── Render lists (React state for mesh mount/unmount) ────────────────────
  const [npcRenderList, setNpcRenderList] = useState<NpcRenderItem[]>([]);
  const [projRenderList, setProjRenderList] = useState<ProjRenderItem[]>([]);
  const [bloodDecalList, setBloodDecalList] = useState<BloodDecalData[]>([]);
  const [bloodParticleList, setBloodParticleList] = useState<{ id: number }[]>(
    [],
  );
  const [poopRenderList, setPoopRenderList] = useState<
    [number, number, number][]
  >([]);
  const [explosionRenderList, setExplosionRenderList] = useState<
    ExplosionRenderItem[]
  >([]);

  // ── Mesh ref maps ────────────────────────────────────────────────────────
  const npcGroupMap = useRef<Map<number, THREE.Group>>(new Map());
  const projMeshMap = useRef<Map<number, THREE.Mesh>>(new Map());
  const bloodParticleMeshMap = useRef<Map<number, THREE.Mesh>>(new Map());
  const explosionMeshMap = useRef<Map<number, THREE.Mesh>>(new Map());

  const registerNpc = useCallback((id: number, g: THREE.Group | null) => {
    if (g) npcGroupMap.current.set(id, g);
    else npcGroupMap.current.delete(id);
  }, []);

  const registerProj = useCallback((id: number, m: THREE.Mesh | null) => {
    if (m) projMeshMap.current.set(id, m);
    else projMeshMap.current.delete(id);
  }, []);

  const registerBloodParticle = useCallback(
    (id: number, m: THREE.Mesh | null) => {
      if (m) bloodParticleMeshMap.current.set(id, m);
      else bloodParticleMeshMap.current.delete(id);
    },
    [],
  );

  const registerExplosion = useCallback((id: number, m: THREE.Mesh | null) => {
    if (m) explosionMeshMap.current.set(id, m);
    else explosionMeshMap.current.delete(id);
  }, []);

  // ── Spawn civilians on mount ──────────────────────────────────────────────
  useEffect(() => {
    const rng = makeRng(99);
    const civs: NpcData[] = [];
    for (let i = 0; i < 25; i++) {
      let x: number;
      let z: number;
      do {
        x = (rng() - 0.5) * 150;
        z = (rng() - 0.5) * 150;
      } while (Math.sqrt(x * x + z * z) < 12);
      civs.push({
        id: i,
        pos: new THREE.Vector3(x, 0.8, z),
        vel: new THREE.Vector3(),
        yaw: rng() * Math.PI * 2,
        type: "civilian",
        state: "wander",
        health: 100,
        color: CIVILIAN_COLORS[i % CIVILIAN_COLORS.length],
        target: new THREE.Vector3(
          x + (rng() - 0.5) * 20,
          0.8,
          z + (rng() - 0.5) * 20,
        ),
        wanderTimer: rng() * 3,
      });
    }
    npcsRef.current = civs;
    setNpcRenderList(
      civs.map((c) => ({ id: c.id, color: c.color, type: c.type })),
    );
  }, []);

  // ── Helper: spawn police ──────────────────────────────────────────────────
  const spawnPolice = useCallback((count: number) => {
    const currentPolice = npcsRef.current.filter(
      (n) => n.type === "police" && n.state !== "dead",
    ).length;
    const maxPolice = Math.min(10, count);
    const toSpawn = maxPolice - currentPolice;
    if (toSpawn <= 0) return;
    const newPolice: NpcData[] = [];
    for (let i = 0; i < toSpawn; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 85 + Math.random() * 10;
      const id = idCounterRef.current++;
      newPolice.push({
        id,
        pos: new THREE.Vector3(Math.cos(angle) * r, 0.8, Math.sin(angle) * r),
        vel: new THREE.Vector3(),
        yaw: 0,
        type: "police",
        state: "chase",
        health: 100,
        color: "#2255cc",
        target: playerPosRef.current.clone(),
        wanderTimer: 0,
      });
    }
    npcsRef.current = [...npcsRef.current, ...newPolice];
    setNpcRenderList((prev) => [
      ...prev,
      ...newPolice.map((p) => ({ id: p.id, color: p.color, type: p.type })),
    ]);
  }, []);

  // ── Helper: kill NPC ──────────────────────────────────────────────────────
  const killNpc = useCallback((npc: NpcData, audioCtx: AudioContext | null) => {
    npc.state = "dead";
    npc.vel.set(0, 0, 0);
    const g = npcGroupMap.current.get(npc.id);
    if (g) {
      g.rotation.z = Math.PI / 2;
      g.position.y = 0;
    }

    playDeathSound(audioCtx);
    killsRef.current++;

    const xpGain = npc.type === "police" ? 20 : 10;
    xpRef.current += xpGain;

    // wanted level
    if (npc.type === "civilian") {
      wantedLevelRef.current = Math.min(5, wantedLevelRef.current + 2);
    } else {
      wantedLevelRef.current = Math.min(5, wantedLevelRef.current + 1);
    }

    // blood particles
    const newBPs: BloodParticle[] = [];
    for (let i = 0; i < 7; i++) {
      const bpId = idCounterRef.current++;
      const bp: BloodParticle = {
        id: bpId,
        pos: npc.pos.clone().add(new THREE.Vector3(0, 0.8, 0)),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          2 + Math.random() * 4,
          (Math.random() - 0.5) * 6,
        ),
        alive: true,
      };
      newBPs.push(bp);
    }
    bloodParticles.current = [...bloodParticles.current, ...newBPs];
    setBloodParticleList((prev) => [
      ...prev,
      ...newBPs.map((b) => ({ id: b.id })),
    ]);

    // blood decal
    const newDecal: BloodDecalData = {
      id: idCounterRef.current++,
      pos: [npc.pos.x, 0, npc.pos.z],
    };
    setBloodDecalList((prev) => {
      const next = [...prev, newDecal];
      return next.length > 50 ? next.slice(next.length - 50) : next;
    });

    // task progress
    const taskType = npc.type === "civilian" ? "kill_civ" : "kill_police";
    tasksRef.current = tasksRef.current.map((t) =>
      t.type === taskType ? { ...t, progress: t.progress + 1 } : t,
    );
  }, []);

  // ── Main game loop ────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    if (gameOverRef.current) return;
    const dt = Math.min(delta, 0.05);
    const keys = keysRef.current;
    const audioCtx = getAudioCtx(audioRef);

    // Camera yaw from mouse
    const dx = mouseDeltaRef.current.dx;
    if (Math.abs(dx) > 0.5) {
      camYawRef.current += dx * 0.005;
    }
    mouseDeltaRef.current.dx = 0;
    mouseDeltaRef.current.dy = 0;

    survivTimerRef.current += dt;

    // ── Player movement ────────────────────────────────────────────────────
    if (!isHidingRef.current) {
      const speed = 8;
      const yaw = camYawRef.current;
      // forward = away from camera = -sin(yaw), 0, -cos(yaw)
      const fwdX = -Math.sin(yaw);
      const fwdZ = -Math.cos(yaw);
      const rightX = Math.cos(yaw);
      const rightZ = -Math.sin(yaw);

      let mx = 0;
      let mz = 0;
      if (keys.has("KeyW") || keys.has("ArrowUp")) {
        mx += fwdX;
        mz += fwdZ;
      }
      if (keys.has("KeyS") || keys.has("ArrowDown")) {
        mx -= fwdX;
        mz -= fwdZ;
      }
      if (keys.has("KeyA") || keys.has("ArrowLeft")) {
        mx -= rightX;
        mz -= rightZ;
      }
      if (keys.has("KeyD") || keys.has("ArrowRight")) {
        mx += rightX;
        mz += rightZ;
      }

      const len = Math.sqrt(mx * mx + mz * mz);
      if (len > 0) {
        mx /= len;
        mz /= len;
        playerPosRef.current.x += mx * speed * dt;
        playerPosRef.current.z += mz * speed * dt;
        // face movement direction
        if (playerGroupRef.current) {
          playerGroupRef.current.rotation.y = Math.atan2(mx, mz);
        }
      }

      // Fly mode
      if (flyRef.current) {
        if (keys.has("Space")) playerPosRef.current.y += 6 * dt;
        if (keys.has("ShiftLeft") || keys.has("ShiftRight"))
          playerPosRef.current.y -= 6 * dt;
      } else {
        // gravity
        playerVelRef.current.y -= 20 * dt;
        playerPosRef.current.y += playerVelRef.current.y * dt;
        if (playerPosRef.current.y <= 0.8) {
          playerPosRef.current.y = 0.8;
          playerVelRef.current.y = 0;
        }
      }

      // Clamp to map
      playerPosRef.current.x = Math.max(
        -98,
        Math.min(98, playerPosRef.current.x),
      );
      playerPosRef.current.z = Math.max(
        -98,
        Math.min(98, playerPosRef.current.z),
      );
      playerPosRef.current.y = Math.max(
        0.8,
        Math.min(80, playerPosRef.current.y),
      );
    }

    // Update player mesh
    if (playerGroupRef.current) {
      playerGroupRef.current.position.copy(playerPosRef.current);
    }

    // ── Rocket vehicle ─────────────────────────────────────────────────────
    // (simplified: entering rocket just enables fast flying)

    // ── Firing ────────────────────────────────────────────────────────────
    fireTimerRef.current -= dt;
    if (fireRef.current && fireTimerRef.current <= 0) {
      fireRef.current = false;
      const w = weaponRef.current;

      if (w === 0) {
        // Poop
        playPoopSound(audioCtx);
        const pp = playerPosRef.current;
        const newPoop: [number, number, number] = [pp.x, 0, pp.z];
        poopPositions.current = [...poopPositions.current, newPoop];
        if (poopPositions.current.length > 30)
          poopPositions.current = poopPositions.current.slice(-30);
        setPoopRenderList([...poopPositions.current]);
        wantedLevelRef.current = Math.min(5, wantedLevelRef.current + 1);
        // scare nearby civs
        for (const npc of npcsRef.current) {
          if (npc.state === "dead" || npc.type === "police") continue;
          const d = npc.pos.distanceTo(pp);
          if (d < 8) {
            npc.state = "flee";
            npc.target.set(
              npc.pos.x + (Math.random() - 0.5) * 30,
              0.8,
              npc.pos.z + (Math.random() - 0.5) * 30,
            );
            tasksRef.current = tasksRef.current.map((t) =>
              t.type === "poop" ? { ...t, progress: t.progress + 1 } : t,
            );
          }
        }
        fireTimerRef.current = 0.3;
      } else {
        // Gun
        const wDef = WEAPONS[w - 1];
        if (!wDef) {
          fireRef.current = false;
        } else if (
          levelRef.current >= wDef.levelReq &&
          ammoRef.current[w - 1] > 0
        ) {
          const pellets = wDef.pellets;
          const yaw = camYawRef.current;
          const fwdX = -Math.sin(yaw);
          const fwdZ = -Math.cos(yaw);

          for (let p = 0; p < pellets; p++) {
            const spread = pellets > 1 ? (Math.random() - 0.5) * 0.4 : 0;
            const vx = (fwdX + spread) * wDef.speed;
            const vz =
              (fwdZ + (pellets > 1 ? (Math.random() - 0.5) * 0.4 : 0)) *
              wDef.speed;
            const id = idCounterRef.current++;
            projs.current.push({
              id,
              pos: playerPosRef.current
                .clone()
                .add(new THREE.Vector3(0, 0.9, 0)),
              vel: new THREE.Vector3(vx, 0, vz),
              weaponType: w,
              timer: 0,
              alive: true,
            });
            setProjRenderList((prev) => [
              ...prev,
              { id, color: wDef.color, size: wDef.size },
            ]);
          }

          ammoRef.current[w - 1]--;
          playGunshot(audioCtx, w - 1);
          fireTimerRef.current = wDef.fireRate;
        }
      }
    }

    // ── Update projectiles ─────────────────────────────────────────────────
    let projsChanged = false;
    for (const proj of projs.current) {
      if (!proj.alive) continue;
      proj.pos.add(proj.vel.clone().multiplyScalar(dt));
      proj.timer += dt;
      const m = projMeshMap.current.get(proj.id);
      if (m) m.position.copy(proj.pos);

      // Out of bounds or timeout
      if (
        proj.timer > 3 ||
        Math.abs(proj.pos.x) > 100 ||
        Math.abs(proj.pos.z) > 100
      ) {
        proj.alive = false;
        projsChanged = true;
        continue;
      }

      // Hit ground
      if (proj.pos.y < 0.1) {
        const wDef = WEAPONS[proj.weaponType - 1];
        if (wDef?.explosive) {
          triggerExplosion(proj.pos, wDef.dmgRadius, audioCtx);
        }
        proj.alive = false;
        projsChanged = true;
        continue;
      }

      // Hit NPCs
      for (const npc of npcsRef.current) {
        if (npc.state === "dead") continue;
        const dist = proj.pos.distanceTo(npc.pos);
        const wDef = WEAPONS[proj.weaponType - 1];
        if (!wDef) continue;
        if (dist < 1.2) {
          if (wDef.explosive) {
            triggerExplosion(proj.pos, wDef.dmgRadius, audioCtx);
          } else {
            npc.health -= wDef.damage;
            if (npc.health <= 0) killNpc(npc, audioCtx);
            else {
              npc.state = npc.type === "civilian" ? "flee" : "chase";
            }
          }
          proj.alive = false;
          projsChanged = true;
          break;
        }
      }
    }

    if (projsChanged) {
      projs.current = projs.current.filter((p) => p.alive);
      if (projs.current.length > 30) projs.current = projs.current.slice(-30);
      setProjRenderList((prev) => {
        const alive = new Set(projs.current.map((p) => p.id));
        return prev.filter((p) => alive.has(p.id));
      });
    }

    // ── Blood particles ────────────────────────────────────────────────────
    let bpChanged = false;
    for (const bp of bloodParticles.current) {
      if (!bp.alive) continue;
      bp.vel.y -= 15 * dt;
      bp.pos.add(bp.vel.clone().multiplyScalar(dt));
      const m = bloodParticleMeshMap.current.get(bp.id);
      if (m) m.position.copy(bp.pos);
      if (bp.pos.y <= 0.1) {
        bp.pos.y = 0.1;
        bp.vel.set(0, 0, 0);
        bp.alive = false;
        bpChanged = true;
      }
    }
    if (bpChanged) {
      bloodParticles.current = bloodParticles.current.filter(
        (b) => !b.alive || b.pos.y > 0.05,
      );
      bloodParticles.current = bloodParticles.current.slice(-80);
    }

    // ── Explosions ─────────────────────────────────────────────────────────
    let expChanged = false;
    for (const exp of explosions.current) {
      exp.timer += dt;
      const m = explosionMeshMap.current.get(exp.id);
      const t = exp.timer / exp.maxTimer;
      if (m) {
        const s = exp.dmgRadius * t * 1.2;
        m.scale.setScalar(s);
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.opacity = 1 - t;
        m.visible = true;
      }
      if (exp.timer >= exp.maxTimer) {
        expChanged = true;
        if (m) m.visible = false;
      }
    }
    if (expChanged) {
      const alive = explosions.current.filter((e) => e.timer < e.maxTimer);
      explosions.current = alive;
      setExplosionRenderList((prev) => {
        const ids = new Set(alive.map((e) => e.id));
        return prev.filter((e) => ids.has(e.id));
      });
    }

    // ── NPC AI ─────────────────────────────────────────────────────────────
    for (const npc of npcsRef.current) {
      if (npc.state === "dead") continue;
      const g = npcGroupMap.current.get(npc.id);
      let speed = 2.5;

      if (npc.type === "police") {
        // Chase player
        const dir = playerPosRef.current.clone().sub(npc.pos);
        const dist = dir.length();
        speed = 6;
        if (dist > 1.5) {
          dir.normalize();
          npc.pos.add(dir.clone().multiplyScalar(speed * dt));
          npc.yaw = Math.atan2(dir.x, dir.z);
        } else {
          // Touching player - deal damage
          healthRef.current = Math.max(0, healthRef.current - 15 * dt);
          if (healthRef.current <= 0) {
            gameOverRef.current = true;
            onGameOver();
          }
        }
      } else {
        // Civilian wander / flee
        if (npc.state === "flee") speed = 5;
        if (npc.wanderTimer > 0) {
          npc.wanderTimer -= dt;
        } else {
          const dir = npc.target.clone().sub(npc.pos);
          const dist = dir.length();
          if (dist < 2) {
            // Reached target, pick new one
            npc.state = "wander";
            npc.target.set(
              npc.pos.x + (Math.random() - 0.5) * 40,
              0.8,
              npc.pos.z + (Math.random() - 0.5) * 40,
            );
            npc.target.x = Math.max(-90, Math.min(90, npc.target.x));
            npc.target.z = Math.max(-90, Math.min(90, npc.target.z));
            npc.wanderTimer = Math.random() * 2;
          } else {
            dir.normalize();
            npc.pos.add(dir.clone().multiplyScalar(speed * dt));
            npc.yaw = Math.atan2(dir.x, dir.z);
          }
        }
      }

      npc.pos.y = 0.8;
      npc.pos.x = Math.max(-98, Math.min(98, npc.pos.x));
      npc.pos.z = Math.max(-98, Math.min(98, npc.pos.z));

      if (g) {
        g.position.copy(npc.pos);
        g.rotation.y = npc.yaw;
      }
    }

    // ── Police spawning ────────────────────────────────────────────────────
    policeSpawnTimerRef.current -= dt;
    if (wantedLevelRef.current > 0 && policeSpawnTimerRef.current <= 0) {
      const maxPolice =
        wantedLevelRef.current <= 2 ? 2 : wantedLevelRef.current <= 4 ? 4 : 6;
      spawnPolice(maxPolice);
      policeSpawnTimerRef.current = 5;
    }

    // ── Hiding mechanic ────────────────────────────────────────────────────
    if (isHidingRef.current) {
      hidingTimerRef.current += dt;
      if (hidingTimerRef.current >= 10 && wantedLevelRef.current > 0) {
        wantedLevelRef.current--;
        hidingTimerRef.current = 0;
      }
      // Kill siren if wanted drops
      if (wantedLevelRef.current === 0) {
        updateSiren(audioCtx, sirenRef, sirenGainRef, 0);
      }
    }

    // wanted cooldown (going down over time even without hiding)
    wantedCooldownRef.current += dt;
    if (
      wantedCooldownRef.current >= 30 &&
      wantedLevelRef.current > 0 &&
      !isHidingRef.current
    ) {
      wantedLevelRef.current--;
      wantedCooldownRef.current = 0;
    }

    // ── Escape tracking ────────────────────────────────────────────────────
    if (prevWantedRef.current > 0 && wantedLevelRef.current === 0) {
      escapeCountRef.current++;
      tasksRef.current = tasksRef.current.map((t) =>
        t.type === "escape" ? { ...t, progress: t.progress + 1 } : t,
      );
    }
    prevWantedRef.current = wantedLevelRef.current;

    // ── Siren update (every frame, oscillate frequency) ────────────────────
    if (sirenRef.current) {
      const t = survivTimerRef.current;
      sirenRef.current.frequency.value = 400 + Math.sin(t * 3) * 150;
    }
    if (wantedLevelRef.current > 0 && !sirenRef.current) {
      updateSiren(audioCtx, sirenRef, sirenGainRef, wantedLevelRef.current);
    }
    if (wantedLevelRef.current === 0 && sirenRef.current) {
      updateSiren(audioCtx, sirenRef, sirenGainRef, 0);
    }

    // ── XP / Level up ──────────────────────────────────────────────────────
    const curLvl = levelRef.current;
    if (curLvl < 50) {
      const nextXp = LEVEL_XP[curLvl] ?? 999999;
      if (xpRef.current >= nextXp) {
        levelRef.current++;
        playLevelUp(audioCtx);
        levelUpTextRef.current = `LEVEL UP! ${levelRef.current}`;
        levelUpTextTimerRef.current = 3;
      }
    }
    if (levelUpTextTimerRef.current > 0) levelUpTextTimerRef.current -= dt;
    if (flashMsgTimerRef.current > 0) flashMsgTimerRef.current -= dt;

    // ── Survive task ───────────────────────────────────────────────────────
    tasksRef.current = tasksRef.current.map((t) => {
      if (t.type === "survive") {
        return { ...t, progress: Math.floor(survivTimerRef.current) };
      }
      return t;
    });

    // ── Reach level task ───────────────────────────────────────────────────
    tasksRef.current = tasksRef.current.map((t) => {
      if (t.type === "reach_level") {
        return { ...t, progress: levelRef.current };
      }
      return t;
    });

    // ── Task completion check ──────────────────────────────────────────────
    let tasksChanged = false;
    const completedTypes: string[] = [];
    tasksRef.current = tasksRef.current.map((t) => {
      if (t.progress >= t.target) {
        xpRef.current += 50;
        tasksDoneRef.current++;
        completedTypes.push(t.type);
        flashMsgRef.current = "TASK COMPLETE! +50 XP";
        flashMsgTimerRef.current = 2.5;
        tasksChanged = true;
        return generateTask(
          tasksRef.current.filter((x) => x.id !== t.id).map((x) => x.type),
        );
      }
      return t;
    });
    if (tasksChanged) {
      /* tasks updated in ref */
    }

    // ── HUD throttled update ───────────────────────────────────────────────
    hudTimerRef.current -= dt;
    if (hudTimerRef.current <= 0) {
      hudTimerRef.current = 0.1;
      onHudUpdate({
        health: healthRef.current,
        xp: xpRef.current,
        level: levelRef.current,
        wantedLevel: wantedLevelRef.current,
        weapon: weaponRef.current,
        ammo: [...ammoRef.current],
        tasks: [...tasksRef.current],
        kills: killsRef.current,
        tasksDone: tasksDoneRef.current,
        levelUpText:
          levelUpTextTimerRef.current > 0 ? levelUpTextRef.current : "",
        flashMsg: flashMsgTimerRef.current > 0 ? flashMsgRef.current : "",
        isHiding: isHidingRef.current,
        inRocket: inRocketRef.current,
        isFlying: flyRef.current,
      });
    }
  });

  // ── Explosion helper (called from useFrame) ───────────────────────────────
  function triggerExplosion(
    pos: THREE.Vector3,
    dmgRadius: number,
    audioCtx: AudioContext | null,
  ) {
    playGunshot(audioCtx, 5); // boom sound
    const id = idCounterRef.current++;
    const newExp: ExplosionData = {
      id,
      pos: pos.clone(),
      timer: 0,
      maxTimer: 0.6,
      radius: dmgRadius * 0.8,
      dmgRadius,
    };
    explosions.current.push(newExp);
    setExplosionRenderList((prev) => [...prev, { id, color: "#FF6600" }]);
    // Damage NPCs in radius
    for (const npc of npcsRef.current) {
      if (npc.state === "dead") continue;
      if (npc.pos.distanceTo(pos) < dmgRadius) {
        npc.health -= 150;
        if (npc.health <= 0) killNpc(npc, audioCtx);
      }
    }
    // Damage player
    if (playerPosRef.current.distanceTo(pos) < dmgRadius * 0.5) {
      healthRef.current = Math.max(0, healthRef.current - 30);
    }
  }

  // ── Key events for weapon selection & actions ─────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameOverRef.current) return;
      // Weapon select
      if (e.code === "Digit0") {
        weaponRef.current = 0;
      } // poop
      else if (e.code === "Digit1") {
        if (levelRef.current >= WEAPONS[0].levelReq) weaponRef.current = 1;
      } else if (e.code === "Digit2") {
        if (levelRef.current >= WEAPONS[1].levelReq) weaponRef.current = 2;
      } else if (e.code === "Digit3") {
        if (levelRef.current >= WEAPONS[2].levelReq) weaponRef.current = 3;
      } else if (e.code === "Digit4") {
        if (levelRef.current >= WEAPONS[3].levelReq) weaponRef.current = 4;
      } else if (e.code === "Digit5") {
        if (levelRef.current >= WEAPONS[4].levelReq) weaponRef.current = 5;
      } else if (e.code === "Digit6") {
        if (levelRef.current >= WEAPONS[5].levelReq) weaponRef.current = 6;
      } else if (e.code === "Digit7") {
        if (levelRef.current >= WEAPONS[6].levelReq) weaponRef.current = 7;
      } else if (e.code === "Digit8") {
        if (levelRef.current >= WEAPONS[7].levelReq) weaponRef.current = 8;
      } else if (e.code === "Digit9") {
        if (levelRef.current >= WEAPONS[8].levelReq) weaponRef.current = 9;
      } else if (e.code === "KeyG") {
        if (levelRef.current >= WEAPONS[9].levelReq) weaponRef.current = 10;
      }
      // Fly toggle
      else if (e.code === "KeyF") {
        flyRef.current = !flyRef.current;
      }
      // Camera mode toggle
      else if (e.code === "KeyC") {
        cameraModeRef.current = cameraModeRef.current === "tpv" ? "fpv" : "tpv";
      }
      // Hide toggle
      else if (e.code === "KeyE") {
        const pp = playerPosRef.current;
        let nearHouse = false;
        for (const [hx, hz] of HOUSE_DEFS) {
          if (Math.abs(pp.x - hx) < 6 && Math.abs(pp.z - hz) < 6) {
            nearHouse = true;
            break;
          }
        }
        if (nearHouse || isHidingRef.current) {
          isHidingRef.current = !isHidingRef.current;
          if (isHidingRef.current) hidingTimerRef.current = 0;
          // hide player mesh
          if (playerGroupRef.current)
            playerGroupRef.current.visible = !isHidingRef.current;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraModeRef]);

  return (
    <>
      {/* Day/Night Lighting */}
      <DayNightScene isDayModeRef={isDayModeRef} />

      {/* ── Air structures ───────────────────────────────────────────────── */}
      {/* Floating platform 1 */}
      <mesh position={[20, 18, -30]} castShadow receiveShadow>
        <boxGeometry args={[10, 1, 10]} />
        <meshStandardMaterial color="#888899" roughness={0.8} />
      </mesh>
      {/* Floating platform 2 */}
      <mesh position={[-35, 22, 15]} castShadow receiveShadow>
        <boxGeometry args={[12, 1, 8]} />
        <meshStandardMaterial color="#777788" roughness={0.8} />
      </mesh>
      {/* Floating platform 3 */}
      <mesh position={[50, 26, 30]} castShadow receiveShadow>
        <boxGeometry args={[8, 1, 8]} />
        <meshStandardMaterial color="#999aaa" roughness={0.7} />
      </mesh>
      {/* Floating platform 4 */}
      <mesh position={[-20, 15, -50]} castShadow receiveShadow>
        <boxGeometry args={[10, 1, 14]} />
        <meshStandardMaterial color="#aaa8b8" roughness={0.75} />
      </mesh>
      {/* Sky tower 1 */}
      <mesh position={[20, 25, -30]} castShadow>
        <boxGeometry args={[2, 15, 2]} />
        <meshStandardMaterial color="#556677" roughness={0.6} metalness={0.4} />
      </mesh>
      {/* Sky tower 2 */}
      <mesh position={[-35, 28, 15]} castShadow>
        <boxGeometry args={[2, 12, 2]} />
        <meshStandardMaterial color="#445566" roughness={0.6} metalness={0.4} />
      </mesh>
      {/* Floating island base */}
      <mesh position={[50, 25.5, 30]} castShadow receiveShadow>
        <sphereGeometry args={[4, 8, 6]} />
        <meshStandardMaterial color="#5a7a3a" roughness={0.9} />
      </mesh>
      {/* Tree on floating island - trunk */}
      <mesh position={[50, 29.5, 30]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 2, 6]} />
        <meshStandardMaterial color="#6b4226" roughness={1} />
      </mesh>
      {/* Tree on floating island - leaves */}
      <mesh position={[50, 31.5, 30]} castShadow>
        <sphereGeometry args={[1.5, 7, 6]} />
        <meshStandardMaterial color="#2d7a3a" roughness={0.8} />
      </mesh>

      <Ground />
      <Road />

      {treeData.map((t) => (
        <TreeMesh key={t.id} tree={t} />
      ))}
      {HOUSE_DEFS.map((def) => (
        <HouseMesh key={def[0] * 1000 + def[1]} def={def} />
      ))}
      <RocketMesh />

      <PlayerMesh groupRef={playerGroupRef} />

      {npcRenderList.map((npc) => (
        <NpcMesh key={npc.id} npc={npc} onMount={registerNpc} />
      ))}

      {projRenderList.map((proj) => (
        <ProjMesh key={proj.id} proj={proj} onMount={registerProj} />
      ))}

      {bloodDecalList.map((d) => (
        <BloodDecal key={d.id} pos={d.pos} />
      ))}

      {bloodParticleList.map((bp) => (
        <BloodParticleMesh
          key={bp.id}
          bp={bp}
          onMount={registerBloodParticle}
        />
      ))}

      {poopRenderList.map((pos) => (
        <PoopMesh key={`${pos[0].toFixed(1)}_${pos[2].toFixed(1)}`} pos={pos} />
      ))}

      {explosionRenderList.map((exp) => (
        <ExplosionMesh key={exp.id} exp={exp} onMount={registerExplosion} />
      ))}

      <SandboxCamera
        playerPosRef={playerPosRef}
        camYawRef={camYawRef}
        isHidingRef={isHidingRef}
        cameraModeRef={cameraModeRef}
      />
    </>
  );
}

// ── HUD ───────────────────────────────────────────────────────────────────────
function SandboxHUD({
  hud,
  onExit,
  cameraMode,
  isDayMode,
  onToggleCam,
  onToggleDay,
}: {
  hud: HudState;
  onExit: () => void;
  cameraMode: "fpv" | "tpv";
  isDayMode: boolean;
  onToggleCam: () => void;
  onToggleDay: () => void;
}) {
  const [showControls, setShowControls] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Load existing rating on mount
  const [prevRating, setPrevRating] = useState<{
    rating: number;
    comment: string;
  } | null>(null);
  useState(() => {
    try {
      const saved = localStorage.getItem("sandboxRating");
      if (saved) {
        const parsed = JSON.parse(saved);
        setPrevRating(parsed);
        setRatingStars(parsed.rating);
        setRatingComment(parsed.comment || "");
      }
    } catch {
      /**/
    }
  });

  const submitRating = () => {
    if (ratingStars === 0) return;
    const entry = {
      rating: ratingStars,
      comment: ratingComment,
      date: new Date().toISOString(),
    };
    try {
      localStorage.setItem("sandboxRating", JSON.stringify(entry));
      // Append to ratings array for avg
      let arr: number[] = [];
      try {
        arr = JSON.parse(localStorage.getItem("sandboxRatings") || "[]");
      } catch {
        arr = [];
      }
      arr.push(ratingStars);
      localStorage.setItem("sandboxRatings", JSON.stringify(arr));
    } catch {
      /**/
    }
    setPrevRating(entry);
    setRatingSubmitted(true);
    setTimeout(() => setRatingSubmitted(false), 2000);
    setShowRating(false);
  };

  const getAvgRating = () => {
    try {
      const arr: number[] = JSON.parse(
        localStorage.getItem("sandboxRatings") || "[]",
      );
      if (arr.length === 0) return null;
      return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
    } catch {
      return null;
    }
  };
  const currentWeaponName =
    hud.weapon === 0 ? "💩 POOP" : (WEAPONS[hud.weapon - 1]?.name ?? "");
  const currentAmmo =
    hud.weapon === 0 ? "∞" : String(hud.ammo[hud.weapon - 1] ?? 0);
  const xpNext = LEVEL_XP[hud.level] ?? 999999;
  const xpPrev = LEVEL_XP[hud.level - 1] ?? 0;
  const xpPct = Math.min(
    100,
    Math.round(((hud.xp - xpPrev) / (xpNext - xpPrev)) * 100),
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: "monospace",
      }}
    >
      {/* ── TOP LEFT: health ─────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          background: HUD_BG,
          backdropFilter: "blur(8px)",
          borderRadius: 10,
          padding: "8px 14px",
          border: `1px solid ${NEON_RED}44`,
          minWidth: 140,
        }}
      >
        <div style={{ color: "#aaa", fontSize: 10, letterSpacing: "0.1em" }}>
          HEALTH
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 3,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 10,
              background: "#333",
              borderRadius: 5,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${hud.health}%`,
                background:
                  hud.health > 50
                    ? NEON_GREEN
                    : hud.health > 25
                      ? NEON_YELLOW
                      : NEON_RED,
                transition: "width 0.1s",
                borderRadius: 5,
              }}
            />
          </div>
          <div
            style={{
              color: NEON_RED,
              fontSize: 13,
              fontWeight: 700,
              textShadow: `0 0 8px ${NEON_RED}`,
              minWidth: 28,
              textAlign: "right",
            }}
          >
            {Math.ceil(hud.health)}
          </div>
        </div>
        {hud.isHiding && (
          <div
            style={{
              color: NEON_GREEN,
              fontSize: 10,
              marginTop: 4,
              textShadow: `0 0 8px ${NEON_GREEN}`,
            }}
          >
            🏠 HIDING — WANTED DROPPING
          </div>
        )}
        <div
          style={{
            color: hud.isFlying ? "#00ff88" : "#888",
            fontSize: 10,
            marginTop: 4,
            fontWeight: 700,
            textShadow: hud.isFlying ? "0 0 8px #00ff88" : "none",
          }}
        >
          {hud.isFlying ? "🐦 FLY MODE [F]" : "👟 WALK MODE [F]"}
        </div>
      </div>

      {/* ── TOP CENTER: wanted stars ──────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          background: HUD_BG,
          backdropFilter: "blur(8px)",
          borderRadius: 10,
          padding: "6px 16px",
          border: `1px solid ${NEON_YELLOW}44`,
          textAlign: "center",
        }}
      >
        <div style={{ color: "#aaa", fontSize: 9, letterSpacing: "0.1em" }}>
          WANTED
        </div>
        <div style={{ fontSize: 18, letterSpacing: 3, marginTop: 2 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              style={{
                color: i < hud.wantedLevel ? NEON_YELLOW : "#333",
                textShadow:
                  i < hud.wantedLevel ? `0 0 8px ${NEON_YELLOW}` : "none",
              }}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      {/* ── TOP RIGHT: level + xp + exit ─────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: HUD_BG,
          backdropFilter: "blur(8px)",
          borderRadius: 10,
          padding: "8px 14px",
          border: `1px solid ${NEON_BLUE}44`,
          minWidth: 160,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              color: NEON_BLUE,
              fontSize: 14,
              fontWeight: 700,
              textShadow: `0 0 8px ${NEON_BLUE}`,
            }}
          >
            LVL {hud.level}
          </div>
          <button
            type="button"
            data-ocid="sandbox.close_button"
            style={{
              ...btnStyle("#ff5555"),
              pointerEvents: "all",
              fontSize: 11,
            }}
            onClick={onExit}
          >
            ✕ EXIT
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              flex: 1,
              height: 6,
              background: "#333",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${xpPct}%`,
                background: NEON_BLUE,
                borderRadius: 3,
                transition: "width 0.1s",
              }}
            />
          </div>
          <div style={{ color: "#88aacc", fontSize: 10 }}>{hud.xp} XP</div>
        </div>
      </div>

      {/* ── BOTTOM LEFT: tasks ────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 70,
          left: 12,
          background: HUD_BG,
          backdropFilter: "blur(8px)",
          borderRadius: 10,
          padding: "10px 14px",
          border: `1px solid ${NEON_GREEN}33`,
          maxWidth: 220,
        }}
      >
        <div
          style={{
            color: NEON_GREEN,
            fontSize: 10,
            letterSpacing: "0.1em",
            marginBottom: 6,
            textShadow: `0 0 8px ${NEON_GREEN}`,
          }}
        >
          📋 TASKS
        </div>
        {hud.tasks.map((task, i) => (
          <div
            key={task.id}
            data-ocid={`sandbox.item.${i + 1}`}
            style={{ marginBottom: 6 }}
          >
            <div style={{ color: "#ccc", fontSize: 10 }}>
              {task.description}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginTop: 2,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 4,
                  background: "#333",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(100, (task.progress / task.target) * 100)}%`,
                    background: NEON_GREEN,
                    borderRadius: 2,
                  }}
                />
              </div>
              <div style={{ color: NEON_GREEN, fontSize: 9 }}>
                {task.progress}/{task.target}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── BOTTOM CENTER: weapon + ammo ──────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          background: HUD_BG,
          backdropFilter: "blur(8px)",
          borderRadius: 10,
          padding: "8px 20px",
          border: `1px solid ${NEON_YELLOW}44`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: NEON_YELLOW,
            fontSize: 14,
            fontWeight: 700,
            textShadow: `0 0 10px ${NEON_YELLOW}`,
          }}
        >
          {currentWeaponName}
        </div>
        <div style={{ color: "#aaa", fontSize: 11, marginTop: 2 }}>
          AMMO: {currentAmmo}
        </div>
      </div>

      {/* ── TOP RIGHT: HUD buttons ───────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          pointerEvents: "all",
          maxHeight: "calc(100vh - 100px)",
          overflowY: "auto",
        }}
      >
        <button
          type="button"
          data-ocid="sandbox.toggle"
          style={btnStyle(NEON_BLUE)}
          onClick={onToggleCam}
        >
          👁 {cameraMode.toUpperCase()}
        </button>
        <button
          type="button"
          data-ocid="sandbox.toggle"
          style={btnStyle(isDayMode ? NEON_YELLOW : "#8888ff")}
          onClick={onToggleDay}
        >
          {isDayMode ? "☀ DAY" : "🌙 NIGHT"}
        </button>
        <button
          type="button"
          data-ocid="sandbox.open_modal_button"
          style={btnStyle("#aaddff")}
          onClick={() => setShowControls(true)}
        >
          ⌨ CONTROLS
        </button>
        <button
          type="button"
          data-ocid="sandbox.open_modal_button"
          style={btnStyle("#ffaaff")}
          onClick={() => setShowSettings(true)}
        >
          ⚙ SETTINGS
        </button>
      </div>

      {/* ── BOTTOM RIGHT: Rate button ─────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          pointerEvents: "all",
        }}
      >
        <button
          type="button"
          data-ocid="sandbox.open_modal_button"
          style={btnStyle(NEON_YELLOW)}
          onClick={() => setShowRating(true)}
        >
          Rate ⭐
        </button>
      </div>

      {/* ── CONTROLS overlay ─────────────────────────────────────────────── */}
      {showControls && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,20,0.7)",
            backdropFilter: "blur(6px)",
            pointerEvents: "all",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: HUD_BG,
              border: `1px solid ${NEON_BLUE}66`,
              borderRadius: 14,
              padding: "24px 32px",
              minWidth: 320,
              fontFamily: "monospace",
              boxShadow: `0 0 30px ${NEON_BLUE}44`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  color: NEON_BLUE,
                  fontSize: 16,
                  fontWeight: 700,
                  textShadow: `0 0 10px ${NEON_BLUE}`,
                  letterSpacing: "0.1em",
                }}
              >
                ⌨ CONTROLS
              </div>
              <button
                type="button"
                data-ocid="sandbox.close_button"
                style={{ ...btnStyle(NEON_RED), padding: "3px 8px" }}
                onClick={() => setShowControls(false)}
              >
                ✕
              </button>
            </div>
            {[
              ["W / ↑", "Move Forward"],
              ["S / ↓", "Move Backward"],
              ["A / ←", "Move Left"],
              ["D / →", "Move Right"],
              ["F", "Toggle Fly Mode"],
              ["SPACE", "Fly Up (when flying)"],
              ["SHIFT", "Fly Down (when flying)"],
              ["LEFT CLICK", "Use Weapon / Poop"],
              ["0", "Poop Mode"],
              ["1-9", "Select Gun 1-9"],
              ["G", "Select Gun 10"],
              ["E", "Enter/Exit Hiding Spot"],
              ["R", "Enter/Exit Rocket"],
              ["C", "Toggle Camera Mode (FPV/TPV)"],
              ["Mouse Drag", "Rotate Camera"],
            ].map(([key, desc]) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 20,
                  marginBottom: 6,
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    color: NEON_YELLOW,
                    minWidth: 110,
                    textShadow: `0 0 6px ${NEON_YELLOW}66`,
                  }}
                >
                  {key}
                </span>
                <span style={{ color: "#aaccdd" }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SETTINGS overlay ─────────────────────────────────────────────── */}
      {showSettings && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,20,0.7)",
            backdropFilter: "blur(6px)",
            pointerEvents: "all",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: HUD_BG,
              border: `1px solid ${NEON_BLUE}66`,
              borderRadius: 14,
              padding: "24px 32px",
              minWidth: 280,
              fontFamily: "monospace",
              boxShadow: `0 0 30px ${NEON_BLUE}44`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  color: "#ffaaff",
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textShadow: "0 0 10px #ffaaff",
                }}
              >
                ⚙ SETTINGS
              </div>
              <button
                type="button"
                data-ocid="sandbox.close_button"
                style={{ ...btnStyle(NEON_RED), padding: "3px 8px" }}
                onClick={() => setShowSettings(false)}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                color: "#aaa",
                fontSize: 11,
                marginBottom: 10,
                letterSpacing: "0.1em",
              }}
            >
              LIGHTING
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                data-ocid="sandbox.toggle"
                style={{
                  ...btnStyle(isDayMode ? NEON_YELLOW : "#555555"),
                  padding: "10px 20px",
                  fontSize: 14,
                }}
                onClick={() => {
                  onToggleDay();
                }}
              >
                ☀ DAY
              </button>
              <button
                type="button"
                data-ocid="sandbox.toggle"
                style={{
                  ...btnStyle(!isDayMode ? "#8888ff" : "#555555"),
                  padding: "10px 20px",
                  fontSize: 14,
                }}
                onClick={() => {
                  onToggleDay();
                }}
              >
                🌙 NIGHT
              </button>
            </div>
            <div
              style={{
                color: "#aaa",
                fontSize: 11,
                marginTop: 18,
                marginBottom: 10,
                letterSpacing: "0.1em",
              }}
            >
              CAMERA
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                data-ocid="sandbox.toggle"
                style={{
                  ...btnStyle(cameraMode === "tpv" ? NEON_BLUE : "#555555"),
                  padding: "10px 20px",
                  fontSize: 14,
                }}
                onClick={() => {
                  if (cameraMode !== "tpv") onToggleCam();
                }}
              >
                👁 TPV
              </button>
              <button
                type="button"
                data-ocid="sandbox.toggle"
                style={{
                  ...btnStyle(cameraMode === "fpv" ? NEON_BLUE : "#555555"),
                  padding: "10px 20px",
                  fontSize: 14,
                }}
                onClick={() => {
                  if (cameraMode !== "fpv") onToggleCam();
                }}
              >
                🎯 FPV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RATING overlay ───────────────────────────────────────────────── */}
      {showRating && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,20,0.7)",
            backdropFilter: "blur(6px)",
            pointerEvents: "all",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: HUD_BG,
              border: `1px solid ${NEON_YELLOW}66`,
              borderRadius: 14,
              padding: "24px 32px",
              minWidth: 300,
              fontFamily: "monospace",
              boxShadow: `0 0 30px ${NEON_YELLOW}44`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  color: NEON_YELLOW,
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textShadow: `0 0 10px ${NEON_YELLOW}`,
                }}
              >
                Rate Sandbox Mode
              </div>
              <button
                type="button"
                data-ocid="sandbox.close_button"
                style={{ ...btnStyle(NEON_RED), padding: "3px 8px" }}
                onClick={() => setShowRating(false)}
              >
                ✕
              </button>
            </div>
            {prevRating && (
              <div style={{ color: "#88aacc", fontSize: 11, marginBottom: 10 }}>
                Your previous rating: {"⭐".repeat(prevRating.rating)}{" "}
                {prevRating.comment && `— "${prevRating.comment}"`}
              </div>
            )}
            {(() => {
              const avg = getAvgRating();
              return avg ? (
                <div style={{ color: "#aaa", fontSize: 11, marginBottom: 12 }}>
                  Average rating: {avg} ⭐
                </div>
              ) : null;
            })()}
            <div
              style={{
                display: "flex",
                gap: 6,
                marginBottom: 16,
                justifyContent: "center",
              }}
            >
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  data-ocid={`sandbox.toggle.${s}`}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 28,
                    cursor: "pointer",
                    opacity: s <= ratingStars ? 1 : 0.3,
                    filter:
                      s <= ratingStars
                        ? `drop-shadow(0 0 8px ${NEON_YELLOW})`
                        : "none",
                    transition: "all 0.15s",
                  }}
                  onClick={() => setRatingStars(s)}
                >
                  ⭐
                </button>
              ))}
            </div>
            <textarea
              data-ocid="sandbox.textarea"
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value.slice(0, 100))}
              placeholder="Optional comment (max 100 chars)..."
              style={{
                width: "100%",
                background: "rgba(0,20,40,0.8)",
                border: `1px solid ${NEON_BLUE}44`,
                borderRadius: 8,
                color: "#cceeff",
                fontFamily: "monospace",
                fontSize: 12,
                padding: "8px 10px",
                resize: "none",
                height: 60,
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              data-ocid="sandbox.submit_button"
              style={{
                ...btnStyle(NEON_GREEN),
                width: "100%",
                padding: "10px",
                fontSize: 13,
              }}
              onClick={submitRating}
              disabled={ratingStars === 0}
            >
              {ratingSubmitted ? "✓ SUBMITTED!" : "✓ SUBMIT RATING"}
            </button>
          </div>
        </div>
      )}

      {/* ── WEAPON UNLOCK LIST ─────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 12,
          background: "rgba(0,0,20,0.6)",
          backdropFilter: "blur(6px)",
          borderRadius: 8,
          padding: "6px 10px",
          border: "1px solid rgba(100,200,255,0.1)",
          maxWidth: 175,
        }}
      >
        <div
          style={{
            color: "#667",
            fontSize: 9,
            letterSpacing: "0.1em",
            marginBottom: 3,
          }}
        >
          WEAPONS
        </div>
        {WEAPONS.map((w, i) => {
          const unlocked = hud.level >= w.levelReq;
          const selected = hud.weapon === i + 1;
          return (
            <div
              key={w.name}
              style={{
                color: selected ? NEON_YELLOW : unlocked ? "#88aacc" : "#444",
                fontSize: 9,
                lineHeight: 1.5,
                textShadow: selected ? `0 0 6px ${NEON_YELLOW}` : "none",
                fontWeight: selected ? 700 : 400,
              }}
            >
              {selected ? "▶ " : "  "}
              {i + 1 === 10 ? "G" : i + 1}: {w.name}{" "}
              {!unlocked && `(Lv${w.levelReq})`}
            </div>
          );
        })}
      </div>

      {/* ── LEVEL UP flash ────────────────────────────────────────────────── */}
      {hud.levelUpText && (
        <div
          style={{
            position: "absolute",
            top: "35%",
            left: "50%",
            transform: "translateX(-50%)",
            color: NEON_YELLOW,
            fontSize: "clamp(24px,5vw,40px)",
            fontWeight: 900,
            textShadow: `0 0 20px ${NEON_YELLOW}, 0 0 40px ${NEON_YELLOW}`,
            letterSpacing: "0.1em",
            pointerEvents: "none",
            textAlign: "center",
            animation: "none",
          }}
        >
          {hud.levelUpText}
        </div>
      )}

      {/* ── Flash message ─────────────────────────────────────────────────── */}
      {hud.flashMsg && (
        <div
          style={{
            position: "absolute",
            top: "45%",
            left: "50%",
            transform: "translateX(-50%)",
            color: NEON_GREEN,
            fontSize: "clamp(16px,3vw,24px)",
            fontWeight: 700,
            textShadow: `0 0 14px ${NEON_GREEN}`,
            letterSpacing: "0.08em",
            pointerEvents: "none",
            textAlign: "center",
            background: HUD_BG,
            borderRadius: 8,
            padding: "8px 18px",
            border: `1px solid ${NEON_GREEN}55`,
          }}
        >
          {hud.flashMsg}
        </div>
      )}
    </div>
  );
}

// ── Game Over screen ──────────────────────────────────────────────────────────
function GameOverScreen({
  hud,
  onRestart,
  onExit,
}: { hud: HudState; onRestart: () => void; onExit: () => void }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,20,0.85)",
        backdropFilter: "blur(8px)",
        gap: 20,
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          color: NEON_RED,
          fontSize: "clamp(32px,7vw,60px)",
          fontWeight: 900,
          textShadow: `0 0 24px ${NEON_RED}, 0 0 48px ${NEON_RED}`,
          letterSpacing: "0.1em",
        }}
      >
        BUSTED!
      </div>
      <div
        style={{ display: "flex", gap: 40, color: "#ccc", textAlign: "center" }}
      >
        <div>
          <div style={{ fontSize: 11, color: "#888", letterSpacing: "0.1em" }}>
            KILLS
          </div>
          <div
            style={{
              color: NEON_RED,
              fontSize: 36,
              fontWeight: 700,
              textShadow: `0 0 14px ${NEON_RED}`,
            }}
          >
            {hud.kills}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#888", letterSpacing: "0.1em" }}>
            LEVEL
          </div>
          <div
            style={{
              color: NEON_BLUE,
              fontSize: 36,
              fontWeight: 700,
              textShadow: `0 0 14px ${NEON_BLUE}`,
            }}
          >
            {hud.level}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#888", letterSpacing: "0.1em" }}>
            TASKS
          </div>
          <div
            style={{
              color: NEON_GREEN,
              fontSize: 36,
              fontWeight: 700,
              textShadow: `0 0 14px ${NEON_GREEN}`,
            }}
          >
            {hud.tasksDone}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <button
          type="button"
          data-ocid="sandbox.primary_button"
          style={{
            ...btnStyle(NEON_GREEN),
            fontSize: 15,
            padding: "12px 28px",
            pointerEvents: "all",
          }}
          onClick={onRestart}
        >
          ↺ RESTART
        </button>
        <button
          type="button"
          data-ocid="sandbox.secondary_button"
          style={{
            ...btnStyle(NEON_BLUE),
            fontSize: 15,
            padding: "12px 28px",
            pointerEvents: "all",
          }}
          onClick={onExit}
        >
          🏠 EXIT
        </button>
      </div>
    </div>
  );
}

// ── Default export: SandboxMode ───────────────────────────────────────────────
export default function SandboxMode({ onExit }: { onExit: () => void }) {
  const [hudState, setHudState] = useState<HudState>({
    health: 100,
    xp: 0,
    level: 1,
    wantedLevel: 0,
    weapon: 0,
    ammo: WEAPONS.map((w) => w.ammoMax),
    tasks: initTasks(),
    gameOver: false,
    kills: 0,
    tasksDone: 0,
    levelUpText: "",
    flashMsg: "",
    isHiding: false,
    inRocket: false,
    isFlying: false,
  });
  const [gameOver, setGameOver] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [cameraMode, setCameraMode] = useState<"fpv" | "tpv">("tpv");
  const [isDayMode, setIsDayMode] = useState(true);
  const cameraModeRef = useRef<"fpv" | "tpv">("tpv");
  const isDayModeRef = useRef(true);

  const handleToggleCam = () => {
    const next = cameraModeRef.current === "tpv" ? "fpv" : "tpv";
    cameraModeRef.current = next;
    setCameraMode(next);
  };

  const handleToggleDay = () => {
    const next = !isDayModeRef.current;
    isDayModeRef.current = next;
    setIsDayMode(next);
  };

  const keysRef = useRef<Set<string>>(new Set());
  const mouseDeltaRef = useRef({ dx: 0, dy: 0 });
  const mousePosRef = useRef({ x: 0, y: 0 });
  const fireRef = useRef(false);
  const audioRef = useRef<AudioContext | null>(null);
  const sirenRef = useRef<OscillatorNode | null>(null);
  const sirenGainRef = useRef<GainNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMouseRef = useRef({ x: 0, y: 0, down: false });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      // Prevent page scroll
      if (["Space", "ArrowUp", "ArrowDown"].includes(e.code))
        e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (sirenRef.current) {
        try {
          sirenRef.current.stop();
        } catch {
          /**/
        }
        sirenRef.current = null;
      }
      audioRef.current?.close().catch(() => {});
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    if (lastMouseRef.current.down) {
      mouseDeltaRef.current.dx += dx * 1.5;
      mouseDeltaRef.current.dy += dy;
    }
    lastMouseRef.current.x = e.clientX;
    lastMouseRef.current.y = e.clientY;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      mousePosRef.current = {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
      };
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    lastMouseRef.current.down = true;
    lastMouseRef.current.x = e.clientX;
    lastMouseRef.current.y = e.clientY;
    if (e.button === 0 && !(e.target as HTMLElement).closest("button")) {
      fireRef.current = true;
    }
  };

  const handleMouseUp = () => {
    lastMouseRef.current.down = false;
  };

  const handleHudUpdate = useCallback((partial: Partial<HudState>) => {
    setHudState((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleGameOver = useCallback(() => {
    setGameOver(true);
    if (sirenRef.current) {
      try {
        sirenRef.current.stop();
      } catch {
        /**/
      }
      sirenRef.current = null;
    }
  }, []);

  const handleRestart = () => {
    setGameOver(false);
    setResetKey((k) => k + 1);
    setHudState({
      health: 100,
      xp: 0,
      level: 1,
      wantedLevel: 0,
      weapon: 0,
      ammo: WEAPONS.map((w) => w.ammoMax),
      tasks: initTasks(),
      gameOver: false,
      kills: 0,
      tasksDone: 0,
      levelUpText: "",
      flashMsg: "",
      isHiding: false,
      inRocket: false,
      isFlying: false,
    });
  };

  return (
    <div
      ref={containerRef}
      role="presentation"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#0a1628",
        overflow: "hidden",
        cursor: "crosshair",
      }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Canvas
        key={resetKey}
        shadows
        dpr={[1, 2]}
        gl={{
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          antialias: true,
        }}
        camera={{ fov: 65, position: [0, 8, 14], near: 0.1, far: 220 }}
        style={{ position: "absolute", inset: 0 }}
      >
        <SandboxScene
          keysRef={keysRef}
          mouseDeltaRef={mouseDeltaRef}
          mousePosRef={mousePosRef}
          fireRef={fireRef}
          audioRef={audioRef}
          sirenRef={sirenRef}
          sirenGainRef={sirenGainRef}
          onHudUpdate={handleHudUpdate}
          onGameOver={handleGameOver}
          cameraModeRef={cameraModeRef}
          isDayModeRef={isDayModeRef}
        />
      </Canvas>

      {!gameOver && (
        <SandboxHUD
          hud={hudState}
          onExit={onExit}
          cameraMode={cameraMode}
          isDayMode={isDayMode}
          onToggleCam={handleToggleCam}
          onToggleDay={handleToggleDay}
        />
      )}

      {gameOver && (
        <GameOverScreen
          hud={hudState}
          onRestart={handleRestart}
          onExit={onExit}
        />
      )}
    </div>
  );
}
