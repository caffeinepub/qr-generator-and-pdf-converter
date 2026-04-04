import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

// ─── Types ────────────────────────────────────────────────────────────────────
type MapType = "city" | "highway" | "mountain" | "desert" | "night_city";
type WeatherType = "sunny" | "night" | "rain" | "fog";
type ChallengeType =
  | "free"
  | "time_trial"
  | "drift"
  | "speed"
  | "checkpoint"
  | "escape";
type CameraType = "third" | "first";

interface GameState {
  started: boolean;
  paused: boolean;
  map: MapType;
  weather: WeatherType;
  challenge: ChallengeType;
  camera: CameraType;
  carColor: string;
  wantedLevel: number;
  score: number;
  driftScore: number;
  speed: number;
  challengeTime: number;
  checkpointIndex: number;
  policeActive: boolean;
  gameOver: boolean;
  notification: string;
  notificationTimer: number;
}

interface NPCCar {
  mesh: THREE.Group;
  speed: number;
  angle: number;
  waypointIndex: number;
  waypoints: THREE.Vector3[];
  color: string;
  isPolice: boolean;
  lightTimer: number;
}

interface SkidMark {
  mesh: THREE.Mesh;
  life: number;
}

// ─── Audio Engine ─────────────────────────────────────────────────────────────
class GameAudio {
  ctx: AudioContext | null = null;
  engineOsc: OscillatorNode | null = null;
  engineGain: GainNode | null = null;
  screeOsc: OscillatorNode | null = null;
  screeGain: GainNode | null = null;
  policeOsc: OscillatorNode | null = null;
  policeGain: GainNode | null = null;
  ambientSource: AudioBufferSourceNode | null = null;
  policeTimer = 0;
  running = false;

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      // Engine sound
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = "sawtooth";
      this.engineOsc.frequency.value = 80;
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0.07;
      this.engineOsc.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);
      this.engineOsc.start();
      // Tire screech
      this.screeOsc = this.ctx.createOscillator();
      this.screeOsc.type = "sine";
      this.screeOsc.frequency.value = 200;
      this.screeGain = this.ctx.createGain();
      this.screeGain.gain.value = 0;
      this.screeOsc.connect(this.screeGain);
      this.screeGain.connect(this.ctx.destination);
      this.screeOsc.start();
      // Police siren
      this.policeOsc = this.ctx.createOscillator();
      this.policeOsc.type = "square";
      this.policeOsc.frequency.value = 800;
      this.policeGain = this.ctx.createGain();
      this.policeGain.gain.value = 0;
      this.policeOsc.connect(this.policeGain);
      this.policeGain.connect(this.ctx.destination);
      this.policeOsc.start();
      // Ambient noise
      this.createAmbient();
      this.running = true;
    } catch (e) {
      console.warn("Audio init failed", e);
    }
  }

  createAmbient() {
    if (!this.ctx) return;
    const bufLen = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.02;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;
    this.ambientSource = this.ctx.createBufferSource();
    this.ambientSource.buffer = buf;
    this.ambientSource.loop = true;
    this.ambientSource.connect(filter);
    filter.connect(this.ctx.destination);
    this.ambientSource.start();
  }

  update(speed: number, drifting: boolean, policeActive: boolean, dt: number) {
    if (!this.ctx || !this.running) return;
    const freq = 80 + speed * 2.2;
    if (this.engineOsc)
      this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
    if (this.screeGain)
      this.screeGain.gain.setTargetAtTime(
        drifting && speed > 20 ? 0.04 : 0,
        this.ctx.currentTime,
        0.05,
      );
    if (policeActive && this.policeGain && this.policeOsc) {
      this.policeGain.gain.setTargetAtTime(0.05, this.ctx.currentTime, 0.05);
      this.policeTimer += dt;
      if (this.policeTimer > 0.5) {
        this.policeTimer = 0;
        const curFreq = this.policeOsc.frequency.value;
        this.policeOsc.frequency.setTargetAtTime(
          curFreq === 800 ? 600 : 800,
          this.ctx.currentTime,
          0.05,
        );
      }
    } else if (this.policeGain) {
      this.policeGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
  }

  stop() {
    this.running = false;
    try {
      this.engineOsc?.stop();
      this.screeOsc?.stop();
      this.policeOsc?.stop();
      this.ambientSource?.stop();
      this.ctx?.close();
    } catch (_e) {
      /* ignore */
    }
    this.ctx = null;
    this.engineOsc = null;
    this.screeGain = null;
    this.policeOsc = null;
    this.policeGain = null;
  }
}

// ─── Map Configs ──────────────────────────────────────────────────────────────
const MAP_CONFIGS: Record<
  MapType,
  {
    name: string;
    groundColor: string;
    skyTop: string;
    skyBot: string;
    fogColor: string;
    fogDensity: number;
    ambientIntensity: number;
    sunIntensity: number;
    sunPos: [number, number, number];
  }
> = {
  city: {
    name: "City Downtown",
    groundColor: "#2a2a2a",
    skyTop: "#87ceeb",
    skyBot: "#ffffff",
    fogColor: "#d0e8ff",
    fogDensity: 0.003,
    ambientIntensity: 0.8,
    sunIntensity: 1.8,
    sunPos: [50, 80, 30],
  },
  highway: {
    name: "Highway",
    groundColor: "#3a3a3a",
    skyTop: "#6ab0de",
    skyBot: "#e8f4fd",
    fogColor: "#c8e4f8",
    fogDensity: 0.001,
    ambientIntensity: 1.0,
    sunIntensity: 2.0,
    sunPos: [100, 60, 0],
  },
  mountain: {
    name: "Mountain Road",
    groundColor: "#4a5040",
    skyTop: "#5a8ab8",
    skyBot: "#c0d8e8",
    fogColor: "#b8d0e4",
    fogDensity: 0.005,
    ambientIntensity: 0.7,
    sunIntensity: 1.5,
    sunPos: [40, 100, -20],
  },
  desert: {
    name: "Desert Area",
    groundColor: "#c8a870",
    skyTop: "#e8c040",
    skyBot: "#fff8e0",
    fogColor: "#f0e8c0",
    fogDensity: 0.002,
    ambientIntensity: 1.2,
    sunIntensity: 2.5,
    sunPos: [0, 100, 0],
  },
  night_city: {
    name: "Night City",
    groundColor: "#1a1a1a",
    skyTop: "#050510",
    skyBot: "#0a0a20",
    fogColor: "#050518",
    fogDensity: 0.006,
    ambientIntensity: 0.08,
    sunIntensity: 0.3,
    sunPos: [50, 80, 30],
  },
};

// ─── BMW M5 Car Component ─────────────────────────────────────────────────────
function BMWM5({
  carRef,
  color,
}: { carRef: React.RefObject<THREE.Group | null>; color: string }) {
  return (
    <group ref={carRef}>
      {/* Main body lower */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.1, 0.5, 4.8]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Cabin/Roof */}
      <mesh position={[0, 0.85, -0.1]} castShadow>
        <boxGeometry args={[1.85, 0.55, 2.6]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Hood */}
      <mesh position={[0, 0.52, 1.5]} castShadow>
        <boxGeometry args={[2.0, 0.18, 1.8]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.08} />
      </mesh>
      {/* Hood bulge */}
      <mesh position={[0, 0.64, 1.4]}>
        <boxGeometry args={[0.7, 0.1, 1.5]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.08} />
      </mesh>
      {/* Trunk */}
      <mesh position={[0, 0.55, -1.7]} castShadow>
        <boxGeometry args={[2.0, 0.22, 1.4]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Windshield front */}
      <mesh position={[0, 0.88, 1.05]} rotation={[-0.52, 0, 0]}>
        <planeGeometry args={[1.75, 0.9]} />
        <meshStandardMaterial
          color="#334455"
          transparent
          opacity={0.35}
          metalness={0.5}
          roughness={0.0}
        />
      </mesh>
      {/* Windshield rear */}
      <mesh position={[0, 0.88, -1.2]} rotation={[0.52, 0, 0]}>
        <planeGeometry args={[1.75, 0.8]} />
        <meshStandardMaterial
          color="#334455"
          transparent
          opacity={0.35}
          metalness={0.5}
          roughness={0.0}
        />
      </mesh>
      {/* Side windows left */}
      <mesh position={[-0.93, 0.85, -0.1]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.2, 0.5]} />
        <meshStandardMaterial color="#223344" transparent opacity={0.3} />
      </mesh>
      {/* Side windows right */}
      <mesh position={[0.93, 0.85, -0.1]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2.2, 0.5]} />
        <meshStandardMaterial color="#223344" transparent opacity={0.3} />
      </mesh>
      {/* Headlights */}
      <mesh position={[0.6, 0.42, 2.42]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial
          color="#fffcee"
          emissive="#fffcee"
          emissiveIntensity={3}
        />
      </mesh>
      <mesh position={[-0.6, 0.42, 2.42]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial
          color="#fffcee"
          emissive="#fffcee"
          emissiveIntensity={3}
        />
      </mesh>
      {/* DRL strips */}
      <mesh position={[0.62, 0.34, 2.41]}>
        <boxGeometry args={[0.3, 0.04, 0.04]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={4}
        />
      </mesh>
      <mesh position={[-0.62, 0.34, 2.41]}>
        <boxGeometry args={[0.3, 0.04, 0.04]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={4}
        />
      </mesh>
      {/* Taillights */}
      <mesh position={[0.65, 0.42, -2.42]}>
        <boxGeometry args={[0.35, 0.12, 0.04]} />
        <meshStandardMaterial
          color="#ff2200"
          emissive="#ff2200"
          emissiveIntensity={2}
        />
      </mesh>
      <mesh position={[-0.65, 0.42, -2.42]}>
        <boxGeometry args={[0.35, 0.12, 0.04]} />
        <meshStandardMaterial
          color="#ff2200"
          emissive="#ff2200"
          emissiveIntensity={2}
        />
      </mesh>
      {/* Front grille */}
      <mesh position={[0, 0.28, 2.41]}>
        <boxGeometry args={[1.2, 0.25, 0.05]} />
        <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Grille bars */}
      {[-0.4, 0, 0.4].map((x) => (
        <mesh key={String(x)} position={[x, 0.28, 2.42]}>
          <boxGeometry args={[0.04, 0.22, 0.04]} />
          <meshStandardMaterial
            color="#888888"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      ))}
      {/* Side skirts */}
      <mesh position={[1.06, 0.15, 0]}>
        <boxGeometry args={[0.08, 0.18, 4.2]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.15} />
      </mesh>
      <mesh position={[-1.06, 0.15, 0]}>
        <boxGeometry args={[0.08, 0.18, 4.2]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.15} />
      </mesh>
      {/* BMW roundel */}
      <mesh position={[0, 0.62, 2.43]}>
        <circleGeometry args={[0.12, 16]} />
        <meshStandardMaterial color="#0060a8" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Wheels */}
      <WheelGroup position={[1.05, 0.2, 1.6]} />
      <WheelGroup position={[-1.05, 0.2, 1.6]} mirrorX />
      <WheelGroup position={[1.05, 0.2, -1.6]} />
      <WheelGroup position={[-1.05, 0.2, -1.6]} mirrorX />
      {/* Exhaust pipes */}
      <mesh position={[0.5, 0.18, -2.44]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.15, 12]} />
        <meshStandardMaterial
          color="#666666"
          metalness={0.95}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[-0.5, 0.18, -2.44]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.15, 12]} />
        <meshStandardMaterial
          color="#666666"
          metalness={0.95}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}

function WheelGroup({
  position,
  mirrorX,
}: { position: [number, number, number]; mirrorX?: boolean }) {
  return (
    <group position={position} scale={[mirrorX ? -1 : 1, 1, 1]}>
      {/* Tire */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 0.22, 20]} />
        <meshStandardMaterial color="#111111" roughness={0.9} metalness={0.0} />
      </mesh>
      {/* Rim */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.24, 16]} />
        <meshStandardMaterial
          color="#cccccc"
          metalness={0.95}
          roughness={0.05}
        />
      </mesh>
      {/* Spoke details */}
      {[0, 1, 2, 3, 4].map((spoke) => (
        <mesh
          key={spoke}
          rotation={[0, 0, (spoke / 5) * Math.PI * 2]}
          position={[0.12, 0, 0]}
        >
          <boxGeometry args={[0.2, 0.04, 0.04]} />
          <meshStandardMaterial
            color="#aaaaaa"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Interior (First Person) ──────────────────────────────────────────────────
function CarInterior() {
  return (
    <group>
      {/* Dashboard */}
      <mesh position={[0, -0.2, 0.9]}>
        <boxGeometry args={[1.6, 0.25, 0.35]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
      </mesh>
      {/* Steering wheel */}
      <mesh position={[0.3, -0.05, 0.65]} rotation={[0.4, 0, 0]}>
        <torusGeometry args={[0.18, 0.025, 10, 24]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Steering column */}
      <mesh position={[0.3, -0.18, 0.72]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      {/* Speedometer gauge */}
      <mesh position={[0, -0.12, 0.88]}>
        <circleGeometry args={[0.1, 16]} />
        <meshStandardMaterial
          color="#111111"
          emissive="#002244"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Center console */}
      <mesh position={[0, -0.3, 0.5]}>
        <boxGeometry args={[0.3, 0.2, 0.5]} />
        <meshStandardMaterial color="#151515" roughness={0.8} />
      </mesh>
      {/* Seat backs */}
      <mesh position={[-0.4, 0.0, -0.3]}>
        <boxGeometry args={[0.5, 0.7, 0.12]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      <mesh position={[0.4, 0.0, -0.3]}>
        <boxGeometry args={[0.5, 0.7, 0.12]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ─── Simplified NPC Car ───────────────────────────────────────────────────────
function NPCCarMesh({ color, isPolice }: { color: string; isPolice: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.8, 0.5, 4.0]} />
        <meshStandardMaterial
          color={isPolice ? "#ffffff" : color}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, 0.7, -0.1]}>
        <boxGeometry args={[1.6, 0.45, 2.2]} />
        <meshStandardMaterial
          color={isPolice ? "#ffffff" : color}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      {/* Police light bar */}
      {isPolice && (
        <>
          <mesh position={[0, 1.0, 0]}>
            <boxGeometry args={[1.5, 0.12, 0.35]} />
            <meshStandardMaterial color="#222222" />
          </mesh>
          <mesh position={[-0.35, 1.07, 0]}>
            <boxGeometry args={[0.3, 0.08, 0.28]} />
            <meshStandardMaterial
              color="#0044ff"
              emissive="#0044ff"
              emissiveIntensity={3}
            />
          </mesh>
          <mesh position={[0.35, 1.07, 0]}>
            <boxGeometry args={[0.3, 0.08, 0.28]} />
            <meshStandardMaterial
              color="#ff0000"
              emissive="#ff0000"
              emissiveIntensity={3}
            />
          </mesh>
        </>
      )}
      {/* Wheels */}
      <mesh position={[0.92, 0.2, 1.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.28, 0.18, 12]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>
      <mesh position={[-0.92, 0.2, 1.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.28, 0.18, 12]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>
      <mesh position={[0.92, 0.2, -1.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.28, 0.18, 12]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>
      <mesh position={[-0.92, 0.2, -1.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.28, 0.18, 12]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>
      {/* Headlights */}
      <mesh position={[0.55, 0.38, 2.02]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial
          color="#fffcee"
          emissive="#fffcee"
          emissiveIntensity={2}
        />
      </mesh>
      <mesh position={[-0.55, 0.38, 2.02]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial
          color="#fffcee"
          emissive="#fffcee"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}

// ─── Building ─────────────────────────────────────────────────────────────────
function Building({
  position,
  size,
  color,
  floors,
  nightCity,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  floors: number;
  nightCity: boolean;
}) {
  const windows: React.ReactElement[] = [];
  for (let f = 0; f < floors; f++) {
    for (let w = -1; w <= 1; w++) {
      windows.push(
        <mesh
          key={`${f}-${w}`}
          position={[
            w * (size[0] * 0.25),
            0.5 + f * (size[1] / floors),
            size[2] / 2 + 0.01,
          ]}
        >
          <planeGeometry args={[size[0] * 0.18, (size[1] / floors) * 0.5]} />
          <meshStandardMaterial
            color={
              nightCity
                ? Math.random() > 0.4
                  ? "#ffee88"
                  : "#002244"
                : "#aaccff"
            }
            emissive={
              nightCity
                ? Math.random() > 0.4
                  ? "#ffee88"
                  : "#000000"
                : "#445566"
            }
            emissiveIntensity={nightCity ? 1.5 : 0.3}
          />
        </mesh>,
      );
    }
  }
  return (
    <group position={position}>
      <mesh position={[0, size[1] / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
      </mesh>
      {windows}
      {nightCity && (
        <mesh position={[0, size[1] + 0.1, 0]}>
          <boxGeometry args={[size[0] * 0.8, 0.15, size[2] * 0.8]} />
          <meshStandardMaterial
            color={`hsl(${Math.floor(Math.random() * 360)}, 100%, 60%)`}
            emissive={`hsl(${Math.floor(Math.random() * 360)}, 100%, 60%)`}
            emissiveIntensity={2}
          />
        </mesh>
      )}
    </group>
  );
}

// ─── Street Light ─────────────────────────────────────────────────────────────
function StreetLight({
  position,
  active,
}: { position: [number, number, number]; active: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 6, 8]} />
        <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.8, 5.8, 0]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.04, 0.04, 1.6, 8]} />
        <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[1.6, 5.85, 0]}>
        <boxGeometry args={[0.4, 0.18, 0.3]} />
        <meshStandardMaterial
          color={active ? "#ffeeaa" : "#333322"}
          emissive={active ? "#ffeeaa" : "#000000"}
          emissiveIntensity={active ? 2.5 : 0}
        />
      </mesh>
      {active && (
        <pointLight
          position={[1.6, 5.6, 0]}
          intensity={1.8}
          distance={18}
          color="#ffddaa"
          castShadow={false}
        />
      )}
    </group>
  );
}

// ─── Tree ─────────────────────────────────────────────────────────────────────
function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 2.4, 8]} />
        <meshStandardMaterial color="#4a3020" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.5, 0]} castShadow>
        <coneGeometry args={[1.1, 2.5, 8]} />
        <meshStandardMaterial color="#1a5a1a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 4.8, 0]}>
        <coneGeometry args={[0.8, 2.0, 8]} />
        <meshStandardMaterial color="#1e6e1e" roughness={0.8} />
      </mesh>
      <mesh position={[0, 5.9, 0]}>
        <coneGeometry args={[0.5, 1.4, 8]} />
        <meshStandardMaterial color="#228822" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ─── Cactus ───────────────────────────────────────────────────────────────────
function Cactus({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 3, 8]} />
        <meshStandardMaterial color="#2d5a1e" roughness={0.8} />
      </mesh>
      <mesh position={[0.6, 1.4, 0]} rotation={[0, 0, -0.6]}>
        <cylinderGeometry args={[0.12, 0.15, 1.5, 8]} />
        <meshStandardMaterial color="#2d5a1e" roughness={0.8} />
      </mesh>
      <mesh position={[0.6, 2.15, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 1.0, 8]} />
        <meshStandardMaterial color="#2d5a1e" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ─── Checkpoint Ring ─────────────────────────────────────────────────────────
function CheckpointRing({
  position,
  active,
}: { position: [number, number, number]; active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 1.5;
    }
  });
  return (
    <mesh ref={meshRef} position={position}>
      <torusGeometry args={[3, 0.3, 12, 32]} />
      <meshStandardMaterial
        color={active ? "#ffaa00" : "#555544"}
        emissive={active ? "#ffaa00" : "#000000"}
        emissiveIntensity={active ? 2 : 0}
      />
    </mesh>
  );
}

// ─── City Downtown Map ────────────────────────────────────────────────────────
function CityDowntownMap({
  nightCity,
  weather,
}: { nightCity: boolean; weather: WeatherType }) {
  const lightsOn = nightCity || weather === "night";
  const buildings = [
    {
      pos: [18, 0, 10] as [number, number, number],
      size: [8, 30, 8] as [number, number, number],
      color: "#445566",
      floors: 8,
    },
    {
      pos: [-18, 0, 10] as [number, number, number],
      size: [8, 22, 8] as [number, number, number],
      color: "#556677",
      floors: 6,
    },
    {
      pos: [18, 0, -10] as [number, number, number],
      size: [8, 18, 8] as [number, number, number],
      color: "#4a5a6a",
      floors: 5,
    },
    {
      pos: [-18, 0, -10] as [number, number, number],
      size: [8, 35, 8] as [number, number, number],
      color: "#445060",
      floors: 10,
    },
    {
      pos: [18, 0, 40] as [number, number, number],
      size: [8, 25, 8] as [number, number, number],
      color: "#5a6070",
      floors: 7,
    },
    {
      pos: [-18, 0, 40] as [number, number, number],
      size: [8, 20, 8] as [number, number, number],
      color: "#4a5868",
      floors: 6,
    },
    {
      pos: [18, 0, -40] as [number, number, number],
      size: [8, 28, 8] as [number, number, number],
      color: "#505a6a",
      floors: 8,
    },
    {
      pos: [-18, 0, -40] as [number, number, number],
      size: [8, 32, 8] as [number, number, number],
      color: "#445566",
      floors: 9,
    },
    {
      pos: [18, 0, 70] as [number, number, number],
      size: [8, 16, 8] as [number, number, number],
      color: "#556677",
      floors: 5,
    },
    {
      pos: [-18, 0, 70] as [number, number, number],
      size: [8, 24, 8] as [number, number, number],
      color: "#445566",
      floors: 7,
    },
    {
      pos: [18, 0, -70] as [number, number, number],
      size: [8, 20, 8] as [number, number, number],
      color: "#4a5a6a",
      floors: 6,
    },
    {
      pos: [-18, 0, -70] as [number, number, number],
      size: [8, 28, 8] as [number, number, number],
      color: "#505060",
      floors: 8,
    },
  ];
  return (
    <group>
      {/* Main road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial
          color="#2a2a2a"
          roughness={weather === "rain" ? 0.05 : 0.75}
          metalness={weather === "rain" ? 0.6 : 0.05}
        />
      </mesh>
      {/* Lane markings */}
      {Array.from({ length: 30 }, (_, laneIdx) => (
        <mesh
          key={`z-${-75 + laneIdx * 5}`}
          position={[0, 0.01, -75 + laneIdx * 5]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.25, 3]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      ))}
      {/* Buildings */}
      {buildings.map((b) => (
        <Building
          key={`${b.pos[0]}-${b.pos[2]}`}
          position={b.pos}
          size={b.size}
          color={b.color}
          floors={b.floors}
          nightCity={nightCity}
        />
      ))}
      {/* Street lights */}
      {[-60, -40, -20, 0, 20, 40, 60].map((z) => (
        <StreetLight key={z} position={[8, 0, z]} active={lightsOn} />
      ))}
      {[-60, -40, -20, 0, 20, 40, 60].map((z) => (
        <StreetLight key={`r${z}`} position={[-8, 0, z]} active={lightsOn} />
      ))}
      {/* Sidewalks */}
      <mesh
        position={[10, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[4, 300]} />
        <meshStandardMaterial color="#888888" roughness={0.9} />
      </mesh>
      <mesh
        position={[-10, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[4, 300]} />
        <meshStandardMaterial color="#888888" roughness={0.9} />
      </mesh>
      {/* Trees on sidewalk */}
      {[-50, -30, -10, 10, 30, 50].map((z) => (
        <Tree key={z} position={[11.5, 0, z]} />
      ))}
      {[-50, -30, -10, 10, 30, 50].map((z) => (
        <Tree key={`l${z}`} position={[-11.5, 0, z]} />
      ))}
    </group>
  );
}

// ─── Highway Map ──────────────────────────────────────────────────────────────
function HighwayMap({ weather }: { weather: WeatherType }) {
  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#6a7a50" roughness={0.95} />
      </mesh>
      {/* Road */}
      <mesh
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[22, 400]} />
        <meshStandardMaterial
          color="#383838"
          roughness={weather === "rain" ? 0.05 : 0.8}
          metalness={weather === "rain" ? 0.5 : 0.02}
        />
      </mesh>
      {/* Multiple lanes */}
      {Array.from({ length: 40 }, (_, laneIdx) => (
        <mesh
          key={`z-${-100 + laneIdx * 5}`}
          position={[0, 0.02, -100 + laneIdx * 5]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.25, 3]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      ))}
      {/* Guard rails */}
      <mesh position={[11.5, 0.3, 0]}>
        <boxGeometry args={[0.15, 0.6, 400]} />
        <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-11.5, 0.3, 0]}>
        <boxGeometry args={[0.15, 0.6, 400]} />
        <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Speed signs */}
      {[-80, -40, 0, 40, 80].map((z) => (
        <group key={z} position={[13, 0, z]}>
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 4, 8]} />
            <meshStandardMaterial color="#888888" />
          </mesh>
          <mesh position={[0, 4.2, 0]}>
            <boxGeometry args={[0.8, 0.8, 0.1]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
      {/* Landscape hills */}
      {[
        [-40, 0, -80],
        [40, 0, -80],
        [-40, 0, 80],
        [40, 0, 80],
      ].map(([x, _y, z]) => (
        <mesh key={`${x}-${z}`} position={[x, -1, z]}>
          <sphereGeometry args={[20, 12, 8]} />
          <meshStandardMaterial color="#5a6a40" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Mountain Map ─────────────────────────────────────────────────────────────
function MountainMap({ weather }: { weather: WeatherType }) {
  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#4a5040" roughness={0.95} />
      </mesh>
      {/* Road - winding */}
      <mesh
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[10, 300]} />
        <meshStandardMaterial
          color="#3a3a3a"
          roughness={weather === "rain" ? 0.05 : 0.8}
          metalness={weather === "rain" ? 0.5 : 0.02}
        />
      </mesh>
      {/* Mountain peaks */}
      {[
        [-60, 0, -60],
        [60, 0, -60],
        [-60, 0, 60],
        [60, 0, 60],
        [0, 0, -100],
        [0, 0, 100],
      ].map(([x, _y, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0, z]}>
          <coneGeometry args={[25, 45, 6]} />
          <meshStandardMaterial color="#787060" roughness={0.9} />
        </mesh>
      ))}
      {/* Pine trees */}
      {[-30, -20, -10, 10, 20, 30].map((z) => (
        <Tree key={z} position={[8, 0, z]} />
      ))}
      {[-30, -20, -10, 10, 20, 30].map((z) => (
        <Tree key={`l${z}`} position={[-8, 0, z]} />
      ))}
      {/* Guard rails */}
      <mesh position={[5.5, 0.4, 0]}>
        <boxGeometry args={[0.12, 0.8, 300]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-5.5, 0.4, 0]}>
        <boxGeometry args={[0.12, 0.8, 300]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ─── Desert Map ───────────────────────────────────────────────────────────────
function DesertMap({ weather }: { weather: WeatherType }) {
  return (
    <group>
      {/* Sandy ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#c8a870" roughness={0.95} />
      </mesh>
      {/* Road */}
      <mesh
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[14, 300]} />
        <meshStandardMaterial
          color="#3a3530"
          roughness={weather === "rain" ? 0.05 : 0.85}
          metalness={weather === "rain" ? 0.4 : 0.01}
        />
      </mesh>
      {/* Center line */}
      {Array.from({ length: 30 }, (_, laneIdx) => (
        <mesh
          key={`dz-${-75 + laneIdx * 5}`}
          position={[0, 0.02, -75 + laneIdx * 5]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.2, 3]} />
          <meshStandardMaterial color="#ffff88" roughness={0.8} />
        </mesh>
      ))}
      {/* Dunes */}
      {[
        [-60, 0, -40],
        [60, 0, -40],
        [-60, 0, 40],
        [60, 0, 40],
        [-50, 0, 0],
        [50, 0, 0],
      ].map(([x, _y, z]) => (
        <mesh key={`d-${x}-${z}`} position={[x, -2, z]}>
          <sphereGeometry args={[22, 10, 6]} />
          <meshStandardMaterial color="#c0a060" roughness={0.95} />
        </mesh>
      ))}
      {/* Cacti */}
      {[-40, -20, 20, 40].map((z) => (
        <Cactus key={z} position={[12, 0, z]} />
      ))}
      {[-40, -20, 20, 40].map((z) => (
        <Cactus key={`l${z}`} position={[-12, 0, z]} />
      ))}
    </group>
  );
}

// ─── Rain Particles ───────────────────────────────────────────────────────────
function RainEffect({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D());
  const positions = useRef<Array<{ x: number; y: number; z: number }>>([]);

  useEffect(() => {
    if (!active) return;
    positions.current = Array.from({ length: 600 }, () => ({
      x: (Math.random() - 0.5) * 80,
      y: Math.random() * 40,
      z: (Math.random() - 0.5) * 80,
    }));
  }, [active]);

  useFrame((_, delta) => {
    if (!active || !meshRef.current) return;
    positions.current.forEach((p, i) => {
      p.y -= delta * 28;
      if (p.y < 0) {
        p.y = 40;
        p.x = (Math.random() - 0.5) * 80;
        p.z = (Math.random() - 0.5) * 80;
      }
      dummy.current.position.set(p.x, p.y, p.z);
      dummy.current.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.current.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!active) return null;
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 600]}>
      <boxGeometry args={[0.02, 0.4, 0.02]} />
      <meshStandardMaterial color="#88aacc" transparent opacity={0.5} />
    </instancedMesh>
  );
}

// ─── Ghost Multiplayer Cars ───────────────────────────────────────────────────
function GhostCar({
  name: _name,
  color,
  offset,
}: { name: string; color: string; offset: number }) {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(offset);
  useFrame((_, delta) => {
    if (!ref.current) return;
    t.current += delta * 0.4;
    const radius = 25 + offset * 5;
    ref.current.position.x = Math.sin(t.current) * radius;
    ref.current.position.z = Math.cos(t.current) * radius;
    ref.current.position.y = 0;
    ref.current.rotation.y = -t.current + Math.PI / 2;
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.8, 0.5, 3.8]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.7, -0.1]}>
        <boxGeometry args={[1.6, 0.42, 2.0]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Name label plane */}
      <mesh position={[0, 1.8, 0]}>
        <planeGeometry args={[1.5, 0.4]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

// ─── Sky Sphere ───────────────────────────────────────────────────────────────
function SkySphere({
  topColor,
  botColor,
}: { topColor: string; botColor: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useEffect(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.topColor.value.set(topColor);
    mat.uniforms.botColor.value.set(botColor);
  }, [topColor, botColor]);

  const uniforms = useRef({
    topColor: { value: new THREE.Color(topColor) },
    botColor: { value: new THREE.Color(botColor) },
  });

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[450, 16, 16]} />
      <shaderMaterial
        uniforms={uniforms.current}
        vertexShader={`
          varying vec3 vPos;
          void main() {
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 topColor;
          uniform vec3 botColor;
          varying vec3 vPos;
          void main() {
            float h = normalize(vPos).y;
            gl_FragColor = vec4(mix(botColor, topColor, max(h, 0.0)), 1.0);
          }
        `}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

// ─── Game Scene (inside Canvas) ───────────────────────────────────────────────
function GameScene({
  stateRef,
  keysRef,
  touchRef,
  audioRef,
  onStateUpdate,
}: {
  stateRef: React.RefObject<GameState>;
  keysRef: React.RefObject<Set<string>>;
  touchRef: React.RefObject<{
    gas: boolean;
    brake: boolean;
    drift: boolean;
    steerX: number;
    steerY: number;
  }>;
  audioRef: React.RefObject<GameAudio>;
  onStateUpdate: (patch: Partial<GameState>) => void;
}) {
  const { scene, camera } = useThree();

  // Car physics refs
  const carRef = useRef<THREE.Group>(null);
  const carPosRef = useRef(new THREE.Vector3(0, 0.2, 0));
  const carRotRef = useRef(0);
  const carSpeedRef = useRef(0);
  const carDriftRef = useRef(0);
  const carVelRef = useRef(new THREE.Vector3());
  const speedLimitTimerRef = useRef(0);
  const wantedLevelRef = useRef(0);
  const challengeTimerRef = useRef(0);
  const driftScoreRef = useRef(0);
  const checkpointIdxRef = useRef(0);
  const escapeTimerRef = useRef(0);
  const policeSpawnedRef = useRef(false);
  const nightTimerRef = useRef(0); // for day cycle

  // NPC refs
  const npcGroupRef = useRef<THREE.Group>(null);
  const npcsRef = useRef<NPCCar[]>([]);
  const _skidMarksRef = useRef<SkidMark[]>([]);
  const _sceneRef = useRef<THREE.Group>(null);

  // Fog ref
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional ref-based game state
  // biome-ignore lint/correctness/useExhaustiveDependencies: fog update on map/weather change
  // biome-ignore lint/correctness/useExhaustiveDependencies: scene is stable Three.js ref
  useEffect(() => {
    const st = stateRef.current!;
    const cfg = MAP_CONFIGS[st.map];
    scene.fog = new THREE.FogExp2(
      cfg.fogColor,
      st.weather === "fog"
        ? 0.025
        : st.weather === "rain"
          ? 0.015
          : cfg.fogDensity,
    );
    return () => {
      scene.fog = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateRef.current?.map, stateRef.current?.weather]);

  // Initialize NPC waypoints based on map
  // biome-ignore lint/correctness/useExhaustiveDependencies: game ref-based imperative pattern
  useEffect(() => {
    if (!npcGroupRef.current) return;
    // Clear old
    while (npcGroupRef.current.children.length) {
      npcGroupRef.current.remove(npcGroupRef.current.children[0]);
    }
    npcsRef.current = [];

    const colors = [
      "#cc4400",
      "#0044cc",
      "#00aa44",
      "#aa0088",
      "#ccaa00",
      "#006688",
      "#884422",
      "#446600",
    ];
    const count = 6;
    for (let i = 0; i < count; i++) {
      const group = new THREE.Group();
      group.position.set(
        (Math.random() - 0.5) * 20,
        0,
        (Math.random() - 0.5) * 60,
      );
      npcGroupRef.current.add(group);

      const isPolice = false;
      const color = colors[i % colors.length];
      const radius = 20 + i * 8;
      const wps: THREE.Vector3[] = [];
      for (let w = 0; w < 8; w++) {
        const angle = (w / 8) * Math.PI * 2;
        wps.push(
          new THREE.Vector3(
            Math.sin(angle) * radius,
            0,
            Math.cos(angle) * radius,
          ),
        );
      }
      npcsRef.current.push({
        mesh: group,
        speed: 8 + Math.random() * 6,
        angle: Math.random() * Math.PI * 2,
        waypointIndex: 0,
        waypoints: wps,
        color,
        isPolice,
        lightTimer: 0,
      });
    }
  }, [stateRef.current?.map]);

  const spawnPolice = useCallback(() => {
    if (!npcGroupRef.current || policeSpawnedRef.current) return;
    policeSpawnedRef.current = true;
    const wantedLvl = wantedLevelRef.current;
    const count = Math.min(wantedLvl, 3);
    for (let i = 0; i < count; i++) {
      const group = new THREE.Group();
      const spawnAngle = (i / count) * Math.PI * 2;
      group.position.set(
        carPosRef.current.x + Math.sin(spawnAngle) * 30,
        0,
        carPosRef.current.z + Math.cos(spawnAngle) * 30,
      );
      npcGroupRef.current.add(group);
      const wps: THREE.Vector3[] = [];
      for (let w = 0; w < 4; w++) {
        wps.push(
          carPosRef.current
            .clone()
            .add(
              new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                0,
                (Math.random() - 0.5) * 10,
              ),
            ),
        );
      }
      npcsRef.current.push({
        mesh: group,
        speed: 16 + wantedLvl * 2,
        angle: 0,
        waypointIndex: 0,
        waypoints: wps,
        color: "#ffffff",
        isPolice: true,
        lightTimer: 0,
      });
    }
  }, []);

  const checkpoints = [
    new THREE.Vector3(0, 1, -30),
    new THREE.Vector3(15, 1, -60),
    new THREE.Vector3(-15, 1, -90),
    new THREE.Vector3(0, 1, -120),
    new THREE.Vector3(15, 1, -150),
  ];

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const gs = stateRef.current!;
    if (!gs.started || gs.paused || gs.gameOver) return;
    const keys = keysRef.current!;
    const touch = touchRef.current!;

    // ── Inputs ──
    const accel =
      keys.has("ArrowUp") || keys.has("w") || keys.has("W") || touch.gas;
    const brake =
      keys.has("ArrowDown") || keys.has("s") || keys.has("S") || touch.brake;
    const steerLeft =
      keys.has("ArrowLeft") ||
      keys.has("a") ||
      keys.has("A") ||
      touch.steerX < -0.3;
    const steerRight =
      keys.has("ArrowRight") ||
      keys.has("d") ||
      keys.has("D") ||
      touch.steerX > 0.3;
    const drifting =
      keys.has("Shift") ||
      keys.has("ShiftLeft") ||
      keys.has("ShiftRight") ||
      touch.drift;

    // ── Physics ──
    const maxSpeed = gs.challenge === "speed" ? 80 : 60;
    const accelRate = 18;
    const brakeRate = 25;
    const grip = drifting ? 0.3 : 0.92;
    const steerAmount = Math.max(0.01, 1.5 - carSpeedRef.current * 0.01);

    if (accel)
      carSpeedRef.current = Math.min(
        carSpeedRef.current + accelRate * dt,
        maxSpeed,
      );
    else if (brake)
      carSpeedRef.current = Math.max(carSpeedRef.current - brakeRate * dt, -10);
    else carSpeedRef.current *= 0.985;

    if (steerLeft)
      carRotRef.current +=
        steerAmount * dt * (carSpeedRef.current > 0 ? 1 : -1);
    if (steerRight)
      carRotRef.current -=
        steerAmount * dt * (carSpeedRef.current > 0 ? 1 : -1);

    // Drift
    if (drifting && Math.abs(carSpeedRef.current) > 10) {
      carDriftRef.current += (steerLeft ? 1 : steerRight ? -1 : 0) * dt * 3;
      carDriftRef.current *= 0.95;
    } else {
      carDriftRef.current *= 0.88;
    }

    // Movement
    const forward = new THREE.Vector3(
      -Math.sin(carRotRef.current + carDriftRef.current * 0.4),
      0,
      -Math.cos(carRotRef.current + carDriftRef.current * 0.4),
    );
    carVelRef.current.lerp(forward.multiplyScalar(carSpeedRef.current), grip);
    carPosRef.current.addScaledVector(carVelRef.current, dt);

    // Suspension bob
    const speedKmh = Math.abs(carSpeedRef.current) * 3.6;
    const bob =
      Math.sin(state.clock.elapsedTime * 8) * Math.min(speedKmh / 200, 0.04);

    if (carRef.current) {
      carRef.current.position.copy(carPosRef.current);
      carRef.current.position.y = 0 + bob;
      carRef.current.rotation.y = carRotRef.current;
      // Tilt on drift
      carRef.current.rotation.z = carDriftRef.current * 0.15;
    }

    // ── Camera ──
    if (gs.camera === "third") {
      const camOffset = new THREE.Vector3(
        Math.sin(carRotRef.current) * 10,
        3.5,
        Math.cos(carRotRef.current) * 10,
      );
      camera.position.lerp(carPosRef.current.clone().add(camOffset), 0.08);
      camera.lookAt(carPosRef.current);
    } else {
      const fwd = new THREE.Vector3(
        -Math.sin(carRotRef.current),
        0,
        -Math.cos(carRotRef.current),
      );
      const fpPos = carPosRef.current
        .clone()
        .add(new THREE.Vector3(0, 1.1, 0))
        .addScaledVector(fwd, 0.5);
      camera.position.copy(fpPos);
      camera.lookAt(fpPos.clone().addScaledVector(fwd, 10));
    }

    // ── NPC Update ──
    for (const npc of npcsRef.current) {
      if (npc.isPolice) {
        // Chase player
        const dir = carPosRef.current
          .clone()
          .sub(npc.mesh.position)
          .normalize();
        npc.mesh.position.addScaledVector(dir, npc.speed * dt);
        npc.mesh.rotation.y = Math.atan2(-dir.x, -dir.z);
        // Flash lights
        npc.lightTimer += dt;
        const flashOn = Math.floor(npc.lightTimer * 4) % 2 === 0;
        const blueLight = npc.mesh.children.find(
          (c: any) => c.material?.emissive?.getHexString() === "0044ff",
        ) as THREE.Mesh | undefined;
        const redLight = npc.mesh.children.find(
          (c: any) => c.material?.emissive?.getHexString() === "ff0000",
        ) as THREE.Mesh | undefined;
        if (blueLight)
          (blueLight.material as THREE.MeshStandardMaterial).emissiveIntensity =
            flashOn ? 4 : 0.5;
        if (redLight)
          (redLight.material as THREE.MeshStandardMaterial).emissiveIntensity =
            flashOn ? 0.5 : 4;
      } else {
        // Waypoint following
        const wp = npc.waypoints[npc.waypointIndex];
        const dir = wp.clone().sub(npc.mesh.position);
        const dist = dir.length();
        if (dist < 3) {
          npc.waypointIndex = (npc.waypointIndex + 1) % npc.waypoints.length;
        } else {
          dir.normalize();
          npc.mesh.position.addScaledVector(dir, npc.speed * dt);
          npc.mesh.rotation.y = Math.atan2(-dir.x, -dir.z);
        }
      }
    }

    // ── Wanted System ──
    if (speedKmh > 150) {
      speedLimitTimerRef.current += dt;
      if (speedLimitTimerRef.current > 3 && wantedLevelRef.current === 0) {
        wantedLevelRef.current = 1;
        onStateUpdate({
          wantedLevel: 1,
          policeActive: true,
          notification: "⚠️ POLICE ALERT!",
        });
        spawnPolice();
      }
    } else {
      speedLimitTimerRef.current = Math.max(
        0,
        speedLimitTimerRef.current - dt * 0.5,
      );
    }

    // Escape detection
    if (wantedLevelRef.current > 0 && gs.policeActive) {
      const closestPolice = npcsRef.current
        .filter((n) => n.isPolice)
        .reduce(
          (min, n) =>
            Math.min(min, carPosRef.current.distanceTo(n.mesh.position)),
          Number.POSITIVE_INFINITY,
        );
      if (closestPolice > 100) {
        escapeTimerRef.current += dt;
        if (escapeTimerRef.current > 5) {
          wantedLevelRef.current = Math.max(0, wantedLevelRef.current - 1);
          if (wantedLevelRef.current === 0) {
            policeSpawnedRef.current = false;
            onStateUpdate({
              wantedLevel: 0,
              policeActive: false,
              notification: "✅ Escaped!",
            });
          }
          escapeTimerRef.current = 0;
        }
      } else {
        escapeTimerRef.current = 0;
      }
    }

    // ── Drift scoring ──
    if (
      drifting &&
      Math.abs(carSpeedRef.current) > 10 &&
      Math.abs(carDriftRef.current) > 0.1
    ) {
      driftScoreRef.current += dt * speedKmh * 0.5;
    }

    // ── Challenge logic ──
    if (gs.challenge === "drift") {
      onStateUpdate({
        driftScore: Math.floor(driftScoreRef.current),
        speed: Math.floor(speedKmh),
      });
    } else if (gs.challenge === "speed") {
      challengeTimerRef.current += dt;
      if (speedKmh >= 200) {
        onStateUpdate({
          notification: "🏁 200 KM/H ACHIEVED! Challenge Complete!",
          challengeTime: Math.floor(challengeTimerRef.current),
        });
      }
      onStateUpdate({
        challengeTime: Math.floor(challengeTimerRef.current),
        speed: Math.floor(speedKmh),
      });
    } else if (gs.challenge === "time_trial" || gs.challenge === "checkpoint") {
      challengeTimerRef.current += dt;
      const cp = checkpoints[checkpointIdxRef.current];
      if (cp && carPosRef.current.distanceTo(cp) < 5) {
        checkpointIdxRef.current =
          (checkpointIdxRef.current + 1) % checkpoints.length;
        onStateUpdate({
          checkpointIndex: checkpointIdxRef.current,
          notification: `🏁 Checkpoint ${checkpointIdxRef.current}!`,
        });
      }
      onStateUpdate({
        challengeTime: Math.floor(challengeTimerRef.current),
        speed: Math.floor(speedKmh),
      });
    } else if (gs.challenge === "escape") {
      challengeTimerRef.current += dt;
      const remaining = 60 - Math.floor(challengeTimerRef.current);
      if (remaining <= 0) {
        onStateUpdate({ notification: "✅ Escaped! Challenge Complete!" });
      }
      onStateUpdate({ challengeTime: remaining, speed: Math.floor(speedKmh) });
    } else {
      onStateUpdate({ speed: Math.floor(speedKmh) });
    }

    // ── Day/Night cycle ──
    nightTimerRef.current += dt * 0.02;

    // ── Audio ──
    audioRef.current?.update(
      carSpeedRef.current,
      drifting,
      wantedLevelRef.current > 0,
      dt,
    );
  });

  const gs = stateRef.current!;
  const cfg = MAP_CONFIGS[gs.map];
  const isNight = gs.map === "night_city" || gs.weather === "night";

  return (
    <>
      <SkySphere topColor={cfg.skyTop} botColor={cfg.skyBot} />
      <ambientLight intensity={isNight ? 0.08 : cfg.ambientIntensity} />
      <directionalLight
        position={cfg.sunPos}
        intensity={isNight ? 0.3 : cfg.sunIntensity}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.1}
        shadow-camera-far={500}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      {isNight && (
        <>
          <pointLight
            position={[0, 20, 0]}
            intensity={0.4}
            color="#8888ff"
            distance={80}
          />
          <hemisphereLight args={["#1a1a3a", "#000000", 0.15]} />
        </>
      )}

      {/* Map */}
      {gs.map === "city" && (
        <CityDowntownMap nightCity={false} weather={gs.weather} />
      )}
      {gs.map === "night_city" && (
        <CityDowntownMap nightCity={true} weather={gs.weather} />
      )}
      {gs.map === "highway" && <HighwayMap weather={gs.weather} />}
      {gs.map === "mountain" && <MountainMap weather={gs.weather} />}
      {gs.map === "desert" && <DesertMap weather={gs.weather} />}

      {/* Player car */}
      <BMWM5 carRef={carRef} color={gs.carColor} />
      {gs.camera === "first" && <CarInterior />}

      {/* NPC container */}
      <group ref={npcGroupRef}>
        {npcsRef.current.map((npc, npcIdx) => (
          <primitive key={`vehicle-${npcIdx * 7 + 3}`} object={npc.mesh}>
            <NPCCarMesh color={npc.color} isPolice={npc.isPolice} />
          </primitive>
        ))}
      </group>

      {/* Ghost multiplayer */}
      <GhostCar name="Player2" color="#ff6600" offset={0} />
      <GhostCar name="DriftKing" color="#00aaff" offset={2} />
      <GhostCar name="RacerX" color="#aa00ff" offset={4} />

      {/* Checkpoints */}
      {(gs.challenge === "time_trial" || gs.challenge === "checkpoint") &&
        checkpoints.map((cp, cpIdx) => (
          <CheckpointRing
            key={`ring-pos-${cpIdx * 11}`}
            position={cp.toArray() as [number, number, number]}
            active={cpIdx === gs.checkpointIndex}
          />
        ))}

      {/* Rain */}
      <RainEffect active={gs.weather === "rain"} />
    </>
  );
}

// ─── Mini Map Canvas ──────────────────────────────────────────────────────────
function MiniMap({
  carX,
  carZ,
  carAngle,
}: { carX: number; carZ: number; carAngle: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, 100, 100);
    // Road
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(50, 0);
    ctx.lineTo(50, 100);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(100, 50);
    ctx.stroke();
    // Car dot
    const cx = 50 + (carX / 150) * 50;
    const cz = 50 + (carZ / 150) * 50;
    ctx.save();
    ctx.translate(cx, cz);
    ctx.rotate(-carAngle);
    ctx.fillStyle = "#ff6600";
    ctx.fillRect(-3, -5, 6, 10);
    ctx.restore();
    // Border
    ctx.strokeStyle = "rgba(255,150,0,0.6)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 100, 100);
  });
  return (
    <canvas
      ref={canvasRef}
      width={100}
      height={100}
      style={{ borderRadius: "8px", border: "1px solid rgba(255,150,0,0.4)" }}
    />
  );
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
function HUD({
  state,
  carX,
  carZ,
  carAngle,
  onCameraToggle,
  onPause,
  onMapChange,
  onWeatherChange,
}: {
  state: GameState;
  carX: number;
  carZ: number;
  carAngle: number;
  onCameraToggle: () => void;
  onPause: () => void;
  onMapChange: (m: MapType) => void;
  onWeatherChange: (w: WeatherType) => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: "'Courier New', monospace",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 12,
          pointerEvents: "auto",
        }}
      >
        <select
          value={state.map}
          onChange={(e) => onMapChange(e.target.value as MapType)}
          data-ocid="sdl.map.select"
          style={{
            background: "rgba(0,0,0,0.75)",
            color: "#ffaa00",
            border: "1px solid rgba(255,150,0,0.5)",
            borderRadius: 6,
            padding: "4px 8px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          <option value="city">🏙️ City Downtown</option>
          <option value="highway">🛣️ Highway</option>
          <option value="mountain">⛰️ Mountain</option>
          <option value="desert">🏜️ Desert</option>
          <option value="night_city">🌃 Night City</option>
        </select>
        <select
          value={state.weather}
          onChange={(e) => onWeatherChange(e.target.value as WeatherType)}
          data-ocid="sdl.weather.select"
          style={{
            background: "rgba(0,0,0,0.75)",
            color: "#88ccff",
            border: "1px solid rgba(100,200,255,0.5)",
            borderRadius: 6,
            padding: "4px 8px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          <option value="sunny">☀️ Sunny</option>
          <option value="night">🌙 Night</option>
          <option value="rain">🌧️ Rain</option>
          <option value="fog">🌫️ Fog</option>
        </select>
      </div>

      {/* Top right - wanted level + challenge timer */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 6,
          pointerEvents: "auto",
        }}
      >
        {state.wantedLevel > 0 && (
          <div style={{ display: "flex", gap: 3 }}>
            {Array.from({ length: 5 }, (_, starIdx) => (
              <span
                key={`star-level-${starIdx * 13}`}
                style={{
                  fontSize: 18,
                  color:
                    starIdx < state.wantedLevel
                      ? "#ff2222"
                      : "rgba(255,100,100,0.3)",
                  textShadow:
                    starIdx < state.wantedLevel ? "0 0 8px #ff0000" : "none",
                }}
              >
                ★
              </span>
            ))}
          </div>
        )}
        {state.challenge !== "free" && (
          <div
            style={{
              background: "rgba(0,0,0,0.7)",
              border: "1px solid rgba(255,150,0,0.5)",
              borderRadius: 6,
              padding: "4px 10px",
              color: "#ffaa00",
              fontSize: 13,
            }}
          >
            ⏱ {state.challengeTime}s
          </div>
        )}
        {state.challenge === "drift" && (
          <div
            style={{
              background: "rgba(0,0,0,0.7)",
              border: "1px solid rgba(255,200,0,0.5)",
              borderRadius: 6,
              padding: "4px 10px",
              color: "#ffdd00",
              fontSize: 13,
            }}
          >
            🌀 Drift: {state.driftScore}
          </div>
        )}
        <button
          type="button"
          onClick={onPause}
          data-ocid="sdl.pause.button"
          style={{
            background: "rgba(0,0,0,0.7)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 6,
            padding: "4px 12px",
            color: "white",
            fontSize: 12,
            cursor: "pointer",
            pointerEvents: "auto",
          }}
        >
          ⏸ PAUSE
        </button>
      </div>

      {/* Bottom left - speedometer + minimap */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        <MiniMap carX={carX} carZ={carZ} carAngle={carAngle} />
        <div
          style={{
            background: "rgba(0,0,0,0.75)",
            border: "2px solid rgba(255,150,0,0.7)",
            borderRadius: 12,
            padding: "10px 18px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: "#ff8800",
              fontSize: 36,
              fontWeight: 700,
              lineHeight: 1,
              textShadow: "0 0 12px #ff6600",
            }}
          >
            {state.speed}
          </div>
          <div
            style={{ color: "#ffaa44", fontSize: 11, letterSpacing: "0.1em" }}
          >
            KM/H
          </div>
          <div style={{ color: "#ff4444", fontSize: 11, marginTop: 2 }}>
            {state.speed > 180 ? "MAX SPEED" : state.speed > 120 ? "HIGH" : ""}
          </div>
        </div>
      </div>

      {/* Bottom right - map info + camera button */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 8,
          pointerEvents: "auto",
        }}
      >
        <button
          type="button"
          onClick={onCameraToggle}
          data-ocid="sdl.camera.toggle"
          style={{
            background: "rgba(0,0,0,0.75)",
            border: "1px solid rgba(100,200,255,0.6)",
            borderRadius: 8,
            padding: "6px 14px",
            color: "#88ddff",
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "monospace",
          }}
        >
          📷 {state.camera === "third" ? "TPV" : "FPV"}
        </button>
        <div
          style={{
            background: "rgba(0,0,0,0.7)",
            border: "1px solid rgba(255,150,0,0.4)",
            borderRadius: 8,
            padding: "6px 12px",
            color: "rgba(255,200,100,0.9)",
            fontSize: 11,
            textAlign: "right",
          }}
        >
          <div>{MAP_CONFIGS[state.map].name}</div>
          <div style={{ color: "rgba(150,200,255,0.8)" }}>
            {state.weather.toUpperCase()}
          </div>
          <div style={{ color: "rgba(200,255,150,0.8)" }}>
            {state.challenge.toUpperCase().replace("_", " ")}
          </div>
        </div>
      </div>

      {/* Notification */}
      {state.notification && (
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0,0,0,0.8)",
            border: "2px solid rgba(255,180,0,0.7)",
            borderRadius: 12,
            padding: "12px 24px",
            color: "#ffcc00",
            fontSize: 18,
            fontWeight: 700,
            textShadow: "0 0 12px #ffaa00",
            letterSpacing: "0.05em",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          {state.notification}
        </div>
      )}
    </div>
  );
}

// ─── Mobile Touch Controls ─────────────────────────────────────────────────────
function MobileControls({
  touchRef,
}: {
  touchRef: React.RefObject<{
    gas: boolean;
    brake: boolean;
    drift: boolean;
    steerX: number;
    steerY: number;
  }>;
}) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickBaseRef = useRef<{ x: number; y: number } | null>(null);

  const btnStyle = (color: string, active = false): React.CSSProperties => ({
    width: 68,
    height: 68,
    borderRadius: "50%",
    background: active ? color : "rgba(0,0,0,0.6)",
    border: `2px solid ${color}`,
    color: "white",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
    WebkitUserSelect: "none",
    touchAction: "none",
    boxShadow: `0 0 12px ${color}44`,
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        padding: "0 20px 100px",
      }}
    >
      {/* Joystick left */}
      <div
        ref={joystickRef}
        style={{
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.5)",
          border: "2px solid rgba(255,255,255,0.3)",
          position: "relative",
          pointerEvents: "auto",
          touchAction: "none",
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          joystickBaseRef.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchMove={(e) => {
          if (!joystickBaseRef.current) return;
          const t = e.touches[0];
          const dx = (t.clientX - joystickBaseRef.current.x) / 55;
          const dy = (t.clientY - joystickBaseRef.current.y) / 55;
          touchRef.current!.steerX = Math.max(-1, Math.min(1, dx));
          touchRef.current!.steerY = Math.max(-1, Math.min(1, dy));
          if (Math.abs(dy) > 0.3) {
            touchRef.current!.gas = dy < -0.3;
            touchRef.current!.brake = dy > 0.3;
          }
        }}
        onTouchEnd={() => {
          joystickBaseRef.current = null;
          touchRef.current!.steerX = 0;
          touchRef.current!.steerY = 0;
          touchRef.current!.gas = false;
          touchRef.current!.brake = false;
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.3)",
            border: "2px solid rgba(255,255,255,0.6)",
          }}
        />
      </div>

      {/* Right buttons */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          pointerEvents: "auto",
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            data-ocid="sdl.drift.button"
            style={btnStyle("#ffcc00")}
            onTouchStart={() => {
              touchRef.current!.drift = true;
            }}
            onTouchEnd={() => {
              touchRef.current!.drift = false;
            }}
          >
            DRIFT
          </button>
          <button
            type="button"
            data-ocid="sdl.brake.button"
            style={btnStyle("#ff4444")}
            onTouchStart={() => {
              touchRef.current!.brake = true;
            }}
            onTouchEnd={() => {
              touchRef.current!.brake = false;
            }}
          >
            BRAKE
          </button>
        </div>
        <button
          type="button"
          data-ocid="sdl.gas.button"
          style={{
            ...btnStyle("#44ff88"),
            width: 148,
            borderRadius: 12,
            height: 58,
          }}
          onTouchStart={() => {
            touchRef.current!.gas = true;
          }}
          onTouchEnd={() => {
            touchRef.current!.gas = false;
          }}
        >
          ⚡ GAS
        </button>
      </div>
    </div>
  );
}

// ─── Pause Menu ───────────────────────────────────────────────────────────────
function PauseMenu({
  onResume,
  onExit,
  onMapChange,
  onWeatherChange,
  map,
  weather,
}: {
  onResume: () => void;
  onExit: () => void;
  onMapChange: (m: MapType) => void;
  onWeatherChange: (w: WeatherType) => void;
  map: MapType;
  weather: WeatherType;
}) {
  const btn = (style?: React.CSSProperties): React.CSSProperties => ({
    padding: "10px 24px",
    borderRadius: 8,
    border: "1px solid rgba(255,150,0,0.5)",
    background: "rgba(20,10,0,0.9)",
    color: "#ffaa00",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "monospace",
    letterSpacing: "0.06em",
    width: "100%",
    ...style,
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20,
      }}
    >
      <div
        style={{
          background: "rgba(10,5,0,0.95)",
          border: "2px solid rgba(255,150,0,0.6)",
          borderRadius: 16,
          padding: "32px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          minWidth: 280,
        }}
      >
        <h2
          style={{
            color: "#ff8800",
            fontFamily: "monospace",
            margin: 0,
            textAlign: "center",
            letterSpacing: "0.1em",
          }}
        >
          ⏸ PAUSED
        </h2>
        <button
          type="button"
          style={btn()}
          onClick={onResume}
          data-ocid="sdl.resume.button"
        >
          ▶ RESUME
        </button>
        <select
          value={map}
          onChange={(e) => onMapChange(e.target.value as MapType)}
          style={{ ...btn(), textAlign: "center" }}
          data-ocid="sdl.pause.map.select"
        >
          <option value="city">🏙️ City Downtown</option>
          <option value="highway">🛣️ Highway</option>
          <option value="mountain">⛰️ Mountain</option>
          <option value="desert">🏜️ Desert</option>
          <option value="night_city">🌃 Night City</option>
        </select>
        <select
          value={weather}
          onChange={(e) => onWeatherChange(e.target.value as WeatherType)}
          style={{ ...btn(), textAlign: "center" }}
          data-ocid="sdl.pause.weather.select"
        >
          <option value="sunny">☀️ Sunny</option>
          <option value="night">🌙 Night</option>
          <option value="rain">🌧️ Rain</option>
          <option value="fog">🌫️ Fog</option>
        </select>
        <button
          type="button"
          style={btn({
            background: "rgba(50,0,0,0.9)",
            borderColor: "rgba(255,50,50,0.6)",
            color: "#ff5555",
          })}
          onClick={onExit}
          data-ocid="sdl.exit.button"
        >
          ✕ EXIT GAME
        </button>
      </div>
    </div>
  );
}

// ─── Start Screen ─────────────────────────────────────────────────────────────
function StartScreen({
  onStart,
  selectedMap,
  selectedWeather,
  selectedChallenge,
  selectedColor,
  onMapChange,
  onWeatherChange,
  onChallengeChange,
  onColorChange,
}: {
  onStart: () => void;
  selectedMap: MapType;
  selectedWeather: WeatherType;
  selectedChallenge: ChallengeType;
  selectedColor: string;
  onMapChange: (m: MapType) => void;
  onWeatherChange: (w: WeatherType) => void;
  onChallengeChange: (c: ChallengeType) => void;
  onColorChange: (c: string) => void;
}) {
  const carColors = ["#1a1a2e", "#c0392b", "#f39c12", "#2ecc71", "#8e44ad"];
  const colorNames = [
    "Midnight Navy",
    "Racing Red",
    "Amber Gold",
    "Emerald",
    "Royal Purple",
  ];

  const selStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 14px",
    borderRadius: 8,
    border: `1px solid ${active ? "rgba(255,150,0,0.9)" : "rgba(255,150,0,0.3)"}`,
    background: active ? "rgba(255,100,0,0.3)" : "rgba(0,0,0,0.6)",
    color: active ? "#ffcc00" : "rgba(255,200,100,0.7)",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "monospace",
    transition: "all 0.2s",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(160deg, #050500 0%, #100800 40%, #0a0400 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 30,
        overflow: "auto",
        padding: 20,
      }}
    >
      {/* Thumbnail */}
      <img
        src="/assets/generated/street-drift-legends-thumb.dim_400x225.jpg"
        alt="Street Drift Legends"
        style={{
          width: "min(400px, 90vw)",
          borderRadius: 16,
          boxShadow:
            "0 0 40px rgba(255,100,0,0.6), 0 0 80px rgba(255,60,0,0.3)",
          marginBottom: 20,
          objectFit: "cover",
        }}
      />
      {/* Title */}
      <h1
        style={{
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: "clamp(28px, 6vw, 52px)",
          margin: "0 0 6px",
          background: "linear-gradient(90deg, #ff6600, #ffcc00, #ff8800)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          textAlign: "center",
          letterSpacing: "0.06em",
          textShadow: "none",
          filter: "drop-shadow(0 0 16px rgba(255,120,0,0.8))",
        }}
      >
        STREET DRIFT LEGENDS
      </h1>
      <p
        style={{
          color: "rgba(255,180,80,0.7)",
          fontSize: 14,
          fontFamily: "monospace",
          marginBottom: 24,
          letterSpacing: "0.1em",
        }}
      >
        3D OPEN WORLD DRIVING SIMULATOR
      </p>

      {/* Options grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          maxWidth: 520,
          width: "100%",
          marginBottom: 20,
        }}
      >
        {/* Map */}
        <div>
          <div
            style={{
              color: "rgba(255,180,80,0.8)",
              fontSize: 11,
              marginBottom: 6,
              fontFamily: "monospace",
              letterSpacing: "0.08em",
            }}
          >
            📍 MAP
          </div>
          <select
            value={selectedMap}
            onChange={(e) => onMapChange(e.target.value as MapType)}
            data-ocid="sdl.start.map.select"
            style={{
              width: "100%",
              background: "rgba(0,0,0,0.7)",
              color: "#ffcc88",
              border: "1px solid rgba(255,150,0,0.5)",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <option value="city">🏙️ City Downtown</option>
            <option value="highway">🛣️ Highway</option>
            <option value="mountain">⛰️ Mountain Road</option>
            <option value="desert">🏜️ Desert Area</option>
            <option value="night_city">🌃 Night City</option>
          </select>
        </div>
        {/* Weather */}
        <div>
          <div
            style={{
              color: "rgba(255,180,80,0.8)",
              fontSize: 11,
              marginBottom: 6,
              fontFamily: "monospace",
              letterSpacing: "0.08em",
            }}
          >
            🌤 WEATHER
          </div>
          <select
            value={selectedWeather}
            onChange={(e) => onWeatherChange(e.target.value as WeatherType)}
            data-ocid="sdl.start.weather.select"
            style={{
              width: "100%",
              background: "rgba(0,0,0,0.7)",
              color: "#88ccff",
              border: "1px solid rgba(100,200,255,0.5)",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <option value="sunny">☀️ Sunny</option>
            <option value="night">🌙 Night</option>
            <option value="rain">🌧️ Rain</option>
            <option value="fog">🌫️ Fog</option>
          </select>
        </div>
      </div>

      {/* Challenge */}
      <div style={{ marginBottom: 20, width: "100%", maxWidth: 520 }}>
        <div
          style={{
            color: "rgba(255,180,80,0.8)",
            fontSize: 11,
            marginBottom: 8,
            fontFamily: "monospace",
            letterSpacing: "0.08em",
          }}
        >
          🏆 CHALLENGE
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(
            [
              "free",
              "time_trial",
              "drift",
              "speed",
              "checkpoint",
              "escape",
            ] as ChallengeType[]
          ).map((c) => (
            <button
              key={c}
              type="button"
              style={selStyle(selectedChallenge === c)}
              onClick={() => onChallengeChange(c)}
              data-ocid={`sdl.challenge.${c}.button`}
            >
              {c === "free"
                ? "🚗 Free Drive"
                : c === "time_trial"
                  ? "⏱ Time Trial"
                  : c === "drift"
                    ? "🌀 Drift"
                    : c === "speed"
                      ? "⚡ Speed"
                      : c === "checkpoint"
                        ? "🏁 Race"
                        : "🚔 Escape"}
            </button>
          ))}
        </div>
      </div>

      {/* Car color */}
      <div style={{ marginBottom: 28, width: "100%", maxWidth: 520 }}>
        <div
          style={{
            color: "rgba(255,180,80,0.8)",
            fontSize: 11,
            marginBottom: 8,
            fontFamily: "monospace",
            letterSpacing: "0.08em",
          }}
        >
          🎨 CAR COLOR
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {carColors.map((c, colorIdx) => (
            <button
              key={c}
              type="button"
              onClick={() => onColorChange(c)}
              data-ocid={`sdl.carcolor.${colorIdx + 1}.button`}
              title={colorNames[colorIdx]}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: c,
                border:
                  selectedColor === c
                    ? "3px solid #ffaa00"
                    : "2px solid rgba(255,255,255,0.3)",
                cursor: "pointer",
                boxShadow: selectedColor === c ? `0 0 12px ${c}` : "none",
                transition: "all 0.2s",
              }}
            />
          ))}
        </div>
      </div>

      {/* Play buttons */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          onClick={onStart}
          data-ocid="sdl.play.primary_button"
          style={{
            padding: "14px 36px",
            background: "linear-gradient(135deg, #cc5500, #ff8800, #cc5500)",
            border: "2px solid rgba(255,180,0,0.8)",
            borderRadius: 12,
            color: "white",
            fontWeight: 700,
            fontSize: 18,
            cursor: "pointer",
            fontFamily: "'Impact', monospace",
            letterSpacing: "0.1em",
            boxShadow:
              "0 0 24px rgba(255,100,0,0.7), 0 4px 20px rgba(200,60,0,0.5)",
            transition: "all 0.2s",
          }}
        >
          🚗 PLAY NOW
        </button>
      </div>

      {/* Controls hint */}
      <div
        style={{
          marginTop: 24,
          color: "rgba(255,180,80,0.5)",
          fontSize: 11,
          fontFamily: "monospace",
          textAlign: "center",
          lineHeight: 1.8,
        }}
      >
        WASD / ARROWS: Drive &nbsp;|&nbsp; SHIFT: Drift &nbsp;|&nbsp; C: Camera
        &nbsp;|&nbsp; ESC: Pause
      </div>
    </div>
  );
}

// ─── Main Game Component ──────────────────────────────────────────────────────
export default function StreetDriftLegends({
  onClose,
}: { onClose: () => void }) {
  const audioRef = useRef<GameAudio>(new GameAudio());
  const keysRef = useRef<Set<string>>(new Set());
  const touchRef = useRef({
    gas: false,
    brake: false,
    drift: false,
    steerX: 0,
    steerY: 0,
  });
  const carPosForHUD = useRef({ x: 0, z: 0, angle: 0 });

  const [gameState, setGameState] = useState<GameState>({
    started: false,
    paused: false,
    map: "city",
    weather: "sunny",
    challenge: "free",
    camera: "third",
    carColor: "#1a1a2e",
    wantedLevel: 0,
    score: 0,
    driftScore: 0,
    speed: 0,
    challengeTime: 0,
    checkpointIndex: 0,
    policeActive: false,
    gameOver: false,
    notification: "",
    notificationTimer: 0,
  });

  const stateRef = useRef<GameState>(gameState);
  stateRef.current = gameState;

  // Notification auto-clear
  useEffect(() => {
    if (!gameState.notification) return;
    const t = setTimeout(
      () => setGameState((s) => ({ ...s, notification: "" })),
      3000,
    );
    return () => clearTimeout(t);
  }, [gameState.notification]);

  // Keyboard handling
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === "c" || e.key === "C") {
        setGameState((s) => ({
          ...s,
          camera: s.camera === "third" ? "first" : "third",
        }));
      }
      if (e.key === "Escape") {
        setGameState((s) => ({ ...s, paused: !s.paused }));
      }
      if (["ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault();
    };
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  // Audio cleanup
  useEffect(() => {
    return () => {
      audioRef.current.stop();
    };
  }, []);

  const onStateUpdate = useCallback((patch: Partial<GameState>) => {
    setGameState((s) => ({ ...s, ...patch }));
  }, []);

  const handleStart = useCallback(() => {
    audioRef.current.init();
    setGameState((s) => ({ ...s, started: true }));
  }, []);

  const handlePause = useCallback(() => {
    setGameState((s) => ({ ...s, paused: !s.paused }));
  }, []);

  const handleResume = useCallback(() => {
    setGameState((s) => ({ ...s, paused: false }));
  }, []);

  const handleCameraToggle = useCallback(() => {
    setGameState((s) => ({
      ...s,
      camera: s.camera === "third" ? "first" : "third",
    }));
  }, []);

  // Motion blur at high speed
  const motionBlur =
    gameState.speed > 180
      ? `blur(${Math.min((gameState.speed - 180) / 40, 1)}px)`
      : "none";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000",
      }}
    >
      <div style={{ width: "100%", height: "100%", position: "relative" }}>
        <Canvas
          shadows
          gl={{ antialias: true, powerPreference: "high-performance" }}
          camera={{ fov: 70, near: 0.1, far: 1000, position: [0, 5, 10] }}
          style={{ width: "100%", height: "100%", filter: motionBlur }}
          onCreated={({ gl }) => {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.2;
          }}
        >
          {gameState.started && (
            <GameScene
              stateRef={stateRef}
              keysRef={keysRef}
              touchRef={touchRef}
              audioRef={audioRef}
              onStateUpdate={onStateUpdate}
            />
          )}
        </Canvas>

        {/* Start screen */}
        {!gameState.started && (
          <StartScreen
            onStart={handleStart}
            selectedMap={gameState.map}
            selectedWeather={gameState.weather}
            selectedChallenge={gameState.challenge}
            selectedColor={gameState.carColor}
            onMapChange={(m) => setGameState((s) => ({ ...s, map: m }))}
            onWeatherChange={(w) => setGameState((s) => ({ ...s, weather: w }))}
            onChallengeChange={(c) =>
              setGameState((s) => ({ ...s, challenge: c }))
            }
            onColorChange={(c) => setGameState((s) => ({ ...s, carColor: c }))}
          />
        )}

        {/* HUD */}
        {gameState.started && !gameState.paused && (
          <HUD
            state={gameState}
            carX={carPosForHUD.current.x}
            carZ={carPosForHUD.current.z}
            carAngle={carPosForHUD.current.angle}
            onCameraToggle={handleCameraToggle}
            onPause={handlePause}
            onMapChange={(m) => setGameState((s) => ({ ...s, map: m }))}
            onWeatherChange={(w) => setGameState((s) => ({ ...s, weather: w }))}
          />
        )}

        {/* Pause menu */}
        {gameState.started && gameState.paused && (
          <PauseMenu
            onResume={handleResume}
            onExit={onClose}
            map={gameState.map}
            weather={gameState.weather}
            onMapChange={(m) => setGameState((s) => ({ ...s, map: m }))}
            onWeatherChange={(w) => setGameState((s) => ({ ...s, weather: w }))}
          />
        )}

        {/* Mobile controls */}
        {gameState.started && !gameState.paused && (
          <MobileControls touchRef={touchRef} />
        )}

        {/* Always visible close button */}
        <button
          type="button"
          onClick={onClose}
          data-ocid="sdl.close.button"
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 40,
            background: "rgba(0,0,0,0.75)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 8,
            padding: "6px 14px",
            color: "rgba(255,255,255,0.85)",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "monospace",
            pointerEvents: "auto",
          }}
        >
          ✕ EXIT
        </button>
      </div>
    </div>
  );
}
