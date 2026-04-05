import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
type ControlMode = "keyboard" | "joystick" | "wheel";

interface GameState {
  started: boolean;
  paused: boolean;
  map: MapType;
  weather: WeatherType;
  challenge: ChallengeType;
  camera: CameraType;
  carColor: string;
  controlMode: ControlMode;
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
        <meshStandardMaterial
          color={color}
          metalness={0.92}
          roughness={0.07}
          envMapIntensity={1.5}
        />
      </mesh>
      {/* Cabin/Roof */}
      <mesh position={[0, 0.85, -0.1]} castShadow>
        <boxGeometry args={[1.85, 0.55, 2.6]} />
        <meshStandardMaterial
          color={color}
          metalness={0.92}
          roughness={0.07}
          envMapIntensity={1.5}
        />
      </mesh>
      {/* Hood */}
      <mesh position={[0, 0.52, 1.5]} castShadow>
        <boxGeometry args={[2.0, 0.18, 1.8]} />
        <meshStandardMaterial
          color={color}
          metalness={0.93}
          roughness={0.06}
          envMapIntensity={1.5}
        />
      </mesh>
      {/* Hood bulge */}
      <mesh position={[0, 0.64, 1.4]}>
        <boxGeometry args={[0.7, 0.1, 1.5]} />
        <meshStandardMaterial
          color={color}
          metalness={0.93}
          roughness={0.06}
          envMapIntensity={1.5}
        />
      </mesh>
      {/* Trunk */}
      <mesh position={[0, 0.55, -1.7]} castShadow>
        <boxGeometry args={[2.0, 0.22, 1.4]} />
        <meshStandardMaterial
          color={color}
          metalness={0.92}
          roughness={0.07}
          envMapIntensity={1.5}
        />
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
      {/* Side mirrors */}
      <mesh position={[1.12, 0.72, 0.8]}>
        <boxGeometry args={[0.12, 0.1, 0.28]} />
        <meshStandardMaterial color="#111111" roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[-1.12, 0.72, 0.8]}>
        <boxGeometry args={[0.12, 0.1, 0.28]} />
        <meshStandardMaterial color="#111111" roughness={0.5} metalness={0.6} />
      </mesh>
      {/* Door handles */}
      <mesh position={[1.07, 0.5, 0.3]}>
        <boxGeometry args={[0.04, 0.06, 0.2]} />
        <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[1.07, 0.5, -0.3]}>
        <boxGeometry args={[0.04, 0.06, 0.2]} />
        <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[-1.07, 0.5, 0.3]}>
        <boxGeometry args={[0.04, 0.06, 0.2]} />
        <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[-1.07, 0.5, -0.3]}>
        <boxGeometry args={[0.04, 0.06, 0.2]} />
        <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Front splitter lip */}
      <mesh position={[0, 0.1, 2.47]}>
        <boxGeometry args={[1.8, 0.08, 0.18]} />
        <meshStandardMaterial color="#111111" roughness={0.6} metalness={0.4} />
      </mesh>
      {/* Rear diffuser */}
      <mesh position={[0, 0.12, -2.45]}>
        <boxGeometry args={[1.6, 0.1, 0.2]} />
        <meshStandardMaterial color="#111111" roughness={0.6} metalness={0.4} />
      </mesh>
      {/* Diffuser fins */}
      {[-0.5, -0.2, 0.2, 0.5].map((x) => (
        <mesh key={`fin-${x}`} position={[x, 0.14, -2.46]}>
          <boxGeometry args={[0.04, 0.12, 0.18]} />
          <meshStandardMaterial
            color="#222222"
            roughness={0.5}
            metalness={0.5}
          />
        </mesh>
      ))}
      {/* Roof antenna */}
      <mesh position={[-0.6, 1.12, -0.3]}>
        <cylinderGeometry args={[0.015, 0.02, 0.25, 6]} />
        <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Wheels */}
      <WheelGroup position={[1.05, 0.2, 1.6]} />
      <WheelGroup position={[-1.05, 0.2, 1.6]} mirrorX />
      <WheelGroup position={[1.05, 0.2, -1.6]} />
      <WheelGroup position={[-1.05, 0.2, -1.6]} mirrorX />
      {/* Exhaust pipes - quad setup */}
      {([0.55, 0.3, -0.3, -0.55] as const).map((ex) => (
        <mesh
          key={`ex-${ex}`}
          position={[ex, 0.19, -2.44]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.055, 0.065, 0.18, 14]} />
          <meshStandardMaterial
            color="#555555"
            metalness={0.97}
            roughness={0.08}
          />
        </mesh>
      ))}
      {/* Exhaust heat shimmer ring */}
      {([0.55, 0.3, -0.3, -0.55] as const).map((ex) => (
        <mesh
          key={`ex-inner-${ex}`}
          position={[ex, 0.19, -2.43]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.038, 0.038, 0.04, 10]} />
          <meshStandardMaterial
            color="#220000"
            emissive="#ff4400"
            emissiveIntensity={0.4}
            roughness={0.3}
          />
        </mesh>
      ))}
      {/* Rear wing / spoiler */}
      <mesh position={[0, 1.05, -2.1]}>
        <boxGeometry args={[1.9, 0.07, 0.32]} />
        <meshStandardMaterial color="#111111" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Wing end plates */}
      <mesh position={[0.97, 1.05, -2.1]}>
        <boxGeometry args={[0.07, 0.22, 0.34]} />
        <meshStandardMaterial color="#111111" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[-0.97, 1.05, -2.1]}>
        <boxGeometry args={[0.07, 0.22, 0.34]} />
        <meshStandardMaterial color="#111111" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Wing mounts */}
      <mesh position={[0.55, 0.88, -2.18]}>
        <boxGeometry args={[0.06, 0.28, 0.06]} />
        <meshStandardMaterial color="#333333" roughness={0.5} metalness={0.7} />
      </mesh>
      <mesh position={[-0.55, 0.88, -2.18]}>
        <boxGeometry args={[0.06, 0.28, 0.06]} />
        <meshStandardMaterial color="#333333" roughness={0.5} metalness={0.7} />
      </mesh>
      {/* Hood scoop */}
      <mesh position={[0, 0.68, 1.4]}>
        <boxGeometry args={[0.55, 0.12, 0.7]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.72, 1.05]}>
        <boxGeometry args={[0.44, 0.06, 0.1]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Front grille mesh detail */}
      {([-0.55, -0.18, 0.18, 0.55] as const).map((gx) => (
        <mesh key={`grille-${gx}`} position={[gx, 0.35, 2.46]}>
          <boxGeometry args={[0.25, 0.18, 0.04]} />
          <meshStandardMaterial
            color="#0a0a0a"
            roughness={0.6}
            metalness={0.7}
          />
        </mesh>
      ))}
      {/* Front badge */}
      <mesh position={[0, 0.38, 2.47]}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
        <meshStandardMaterial
          color="#aaaaaa"
          metalness={0.95}
          roughness={0.05}
          emissive="#ffffff"
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* Side skirts (wider sporty profile) */}
      <mesh position={[1.06, 0.14, 0]}>
        <boxGeometry args={[0.1, 0.12, 4.4]} />
        <meshStandardMaterial color="#111111" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[-1.06, 0.14, 0]}>
        <boxGeometry args={[0.1, 0.12, 4.4]} />
        <meshStandardMaterial color="#111111" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Brake lights glow strip */}
      <mesh position={[0, 0.55, -2.43]}>
        <boxGeometry args={[1.6, 0.08, 0.04]} />
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={1.5}
          roughness={0.3}
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
      {/* Tire sidewall outer */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.32, 0.32, 0.24, 24]} />
        <meshStandardMaterial
          color="#0d0d0d"
          roughness={0.98}
          metalness={0.0}
        />
      </mesh>
      {/* Tire tread ring */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.32, 0.045, 6, 28]} />
        <meshStandardMaterial color="#0a0a0a" roughness={1.0} />
      </mesh>
      {/* Brake disc */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.19, 0.19, 0.05, 20]} />
        <meshStandardMaterial
          color="#777777"
          metalness={0.9}
          roughness={0.35}
        />
      </mesh>
      {/* Brake caliper */}
      <mesh position={[0.14, 0.14, 0]}>
        <boxGeometry args={[0.06, 0.1, 0.1]} />
        <meshStandardMaterial color="#cc2200" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Rim face */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0.12, 0, 0]}>
        <cylinderGeometry args={[0.23, 0.23, 0.015, 20]} />
        <meshStandardMaterial
          color="#c8c8d8"
          metalness={0.95}
          roughness={0.08}
        />
      </mesh>
      {/* Y-Spokes: 5 double-arm spokes */}
      {[0, 1, 2, 3, 4].map((s) => {
        const angle = (s / 5) * Math.PI * 2;
        return (
          <group key={s} rotation={[0, 0, angle]} position={[0.13, 0, 0]}>
            {/* Outer spoke arm */}
            <mesh position={[0, 0.14, 0]}>
              <boxGeometry args={[0.03, 0.22, 0.04]} />
              <meshStandardMaterial
                color="#bbbbcc"
                metalness={0.95}
                roughness={0.05}
              />
            </mesh>
            {/* Inner spoke fork left */}
            <mesh position={[0.02, 0.035, 0]} rotation={[0, 0, 0.35]}>
              <boxGeometry args={[0.025, 0.1, 0.035]} />
              <meshStandardMaterial
                color="#aaaabc"
                metalness={0.95}
                roughness={0.05}
              />
            </mesh>
            {/* Inner spoke fork right */}
            <mesh position={[-0.02, 0.035, 0]} rotation={[0, 0, -0.35]}>
              <boxGeometry args={[0.025, 0.1, 0.035]} />
              <meshStandardMaterial
                color="#aaaabc"
                metalness={0.95}
                roughness={0.05}
              />
            </mesh>
          </group>
        );
      })}
      {/* Center cap */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0.14, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.02, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.7} />
      </mesh>
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

// ─── Collision Detection ─────────────────────────────────────────────────────
interface ColBox {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
}
const ACTIVE_COL_BOXES: ColBox[] = [];

function makeBox(cx: number, cz: number, sx: number, sz: number): ColBox {
  return {
    x1: cx - sx / 2 - 0.6,
    z1: cz - sz / 2 - 0.6,
    x2: cx + sx / 2 + 0.6,
    z2: cz + sz / 2 + 0.6,
  };
}

// ─── Fire Hydrant ─────────────────────────────────────────────────────────────
function FireHydrant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.5, 8]} />
        <meshStandardMaterial color="#cc2200" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.12, 0.08, 0.15, 8]} />
        <meshStandardMaterial color="#cc2200" roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  );
}

// ─── Bench ───────────────────────────────────────────────────────────────────
function Bench({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[1.4, 0.06, 0.4]} />
        <meshStandardMaterial color="#7a5a30" roughness={0.8} />
      </mesh>
      <mesh position={[-0.55, 0.22, 0]}>
        <boxGeometry args={[0.06, 0.4, 0.35]} />
        <meshStandardMaterial color="#5a4020" roughness={0.9} />
      </mesh>
      <mesh position={[0.55, 0.22, 0]}>
        <boxGeometry args={[0.06, 0.4, 0.35]} />
        <meshStandardMaterial color="#5a4020" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ─── City Downtown Map ────────────────────────────────────────────────────────
function CityDowntownMap({
  nightCity,
  weather,
}: { nightCity: boolean; weather: WeatherType }) {
  const lightsOn = nightCity || weather === "night";

  // Building grid definition: [x, z, width, height, depth, color, floors]
  type BDef = {
    pos: [number, number, number];
    size: [number, number, number];
    color: string;
    floors: number;
  };
  const buildings: BDef[] = [
    // Block A: z = -280 to -180
    { pos: [28, 0, -260], size: [12, 32, 14], color: "#445566", floors: 9 },
    { pos: [-28, 0, -260], size: [12, 28, 14], color: "#556677", floors: 8 },
    { pos: [45, 0, -240], size: [10, 20, 10], color: "#4a5a6a", floors: 6 },
    { pos: [-45, 0, -240], size: [10, 24, 10], color: "#505060", floors: 7 },
    { pos: [28, 0, -220], size: [14, 38, 12], color: "#3a4a5a", floors: 11 },
    { pos: [-28, 0, -220], size: [14, 18, 12], color: "#6a5560", floors: 5 },
    { pos: [62, 0, -250], size: [10, 16, 10], color: "#556070", floors: 5 },
    { pos: [-62, 0, -250], size: [10, 22, 10], color: "#446060", floors: 6 },
    // Block B: z = -180 to -80
    { pos: [28, 0, -160], size: [12, 44, 14], color: "#445066", floors: 12 },
    { pos: [-28, 0, -160], size: [12, 30, 14], color: "#5a4a60", floors: 9 },
    { pos: [45, 0, -140], size: [10, 18, 10], color: "#4a6060", floors: 5 },
    { pos: [-45, 0, -140], size: [10, 28, 10], color: "#506060", floors: 8 },
    { pos: [28, 0, -110], size: [14, 22, 12], color: "#405060", floors: 6 },
    { pos: [-28, 0, -110], size: [14, 34, 12], color: "#5a5060", floors: 10 },
    { pos: [62, 0, -150], size: [10, 26, 10], color: "#556070", floors: 7 },
    { pos: [-62, 0, -130], size: [10, 14, 10], color: "#446055", floors: 4 },
    { pos: [78, 0, -160], size: [8, 20, 8], color: "#506055", floors: 6 },
    { pos: [-78, 0, -120], size: [8, 30, 8], color: "#445560", floors: 9 },
    // Block C: z = -80 to 20
    { pos: [28, 0, -50], size: [12, 36, 14], color: "#445566", floors: 10 },
    { pos: [-28, 0, -50], size: [12, 50, 14], color: "#334455", floors: 14 },
    { pos: [45, 0, -30], size: [10, 22, 10], color: "#4a5a70", floors: 6 },
    { pos: [-45, 0, -30], size: [10, 28, 10], color: "#405565", floors: 8 },
    { pos: [28, 0, 0], size: [14, 16, 12], color: "#556070", floors: 5 },
    { pos: [-28, 0, 0], size: [14, 28, 12], color: "#3a5060", floors: 8 },
    { pos: [62, 0, -60], size: [10, 32, 10], color: "#446070", floors: 9 },
    { pos: [-62, 0, -40], size: [10, 18, 10], color: "#556060", floors: 5 },
    { pos: [78, 0, -20], size: [8, 24, 8], color: "#405870", floors: 7 },
    { pos: [-78, 0, 10], size: [8, 16, 8], color: "#4a6065", floors: 5 },
    // Block D: z = 20 to 120
    { pos: [28, 0, 40], size: [12, 30, 14], color: "#445566", floors: 9 },
    { pos: [-28, 0, 40], size: [12, 24, 14], color: "#556677", floors: 7 },
    { pos: [45, 0, 60], size: [10, 20, 10], color: "#4a5a6a", floors: 6 },
    { pos: [-45, 0, 60], size: [10, 18, 10], color: "#405060", floors: 5 },
    { pos: [28, 0, 90], size: [14, 42, 12], color: "#3a4a5a", floors: 12 },
    { pos: [-28, 0, 90], size: [14, 26, 12], color: "#5a5060", floors: 7 },
    { pos: [62, 0, 50], size: [10, 22, 10], color: "#506060", floors: 6 },
    { pos: [-62, 0, 70], size: [10, 30, 10], color: "#446070", floors: 8 },
    { pos: [78, 0, 80], size: [8, 18, 8], color: "#555060", floors: 5 },
    { pos: [-78, 0, 50], size: [8, 26, 8], color: "#405565", floors: 7 },
    // Block E: z = 120 to 220
    { pos: [28, 0, 140], size: [12, 28, 14], color: "#445566", floors: 8 },
    { pos: [-28, 0, 140], size: [12, 36, 14], color: "#3a4a5a", floors: 10 },
    { pos: [45, 0, 160], size: [10, 24, 10], color: "#4a5a6a", floors: 7 },
    { pos: [-45, 0, 160], size: [10, 16, 10], color: "#506070", floors: 5 },
    { pos: [28, 0, 190], size: [14, 20, 12], color: "#4a5060", floors: 6 },
    { pos: [-28, 0, 190], size: [14, 32, 12], color: "#555565", floors: 9 },
    { pos: [62, 0, 150], size: [10, 28, 10], color: "#405565", floors: 8 },
    { pos: [-62, 0, 170], size: [10, 20, 10], color: "#446070", floors: 6 },
    { pos: [78, 0, 200], size: [8, 34, 8], color: "#3a5060", floors: 10 },
    { pos: [-78, 0, 180], size: [8, 16, 8], color: "#556070", floors: 5 },
    // Block F: z = 220 to 320
    { pos: [28, 0, 240], size: [12, 24, 14], color: "#445566", floors: 7 },
    { pos: [-28, 0, 240], size: [12, 40, 14], color: "#4a5a6a", floors: 11 },
    { pos: [45, 0, 260], size: [10, 22, 10], color: "#3a4a5a", floors: 6 },
    { pos: [-45, 0, 260], size: [10, 18, 10], color: "#505060", floors: 5 },
    { pos: [28, 0, 290], size: [14, 30, 12], color: "#445066", floors: 9 },
    { pos: [-28, 0, 290], size: [14, 22, 12], color: "#556070", floors: 6 },
    { pos: [62, 0, 250], size: [10, 26, 10], color: "#4a6060", floors: 7 },
    { pos: [-62, 0, 270], size: [10, 32, 10], color: "#405560", floors: 9 },
    // Block G: z = 320 to 420
    { pos: [28, 0, 340], size: [12, 20, 14], color: "#556677", floors: 6 },
    { pos: [-28, 0, 340], size: [12, 34, 14], color: "#445566", floors: 10 },
    { pos: [45, 0, 360], size: [10, 16, 10], color: "#4a5a70", floors: 5 },
    { pos: [-45, 0, 360], size: [10, 28, 10], color: "#3a5060", floors: 8 },
    { pos: [28, 0, 390], size: [14, 26, 12], color: "#505060", floors: 7 },
    { pos: [-28, 0, 390], size: [14, 18, 12], color: "#446060", floors: 5 },
    { pos: [62, 0, 350], size: [10, 30, 10], color: "#556070", floors: 8 },
    { pos: [-62, 0, 370], size: [10, 22, 10], color: "#405565", floors: 6 },
    // Block H: z = 420 to 520
    { pos: [28, 0, 440], size: [12, 38, 14], color: "#4a5a6a", floors: 11 },
    { pos: [-28, 0, 440], size: [12, 24, 14], color: "#445566", floors: 7 },
    { pos: [45, 0, 460], size: [10, 20, 10], color: "#506070", floors: 6 },
    { pos: [-45, 0, 460], size: [10, 30, 10], color: "#3a4a5a", floors: 9 },
    { pos: [28, 0, 490], size: [14, 16, 12], color: "#556060", floors: 5 },
    { pos: [-28, 0, 490], size: [14, 28, 12], color: "#445060", floors: 8 },
    { pos: [62, 0, 450], size: [10, 22, 10], color: "#405565", floors: 6 },
    { pos: [-62, 0, 470], size: [10, 18, 10], color: "#446070", floors: 5 },
    { pos: [78, 0, 480], size: [8, 26, 8], color: "#3a5060", floors: 7 },
    { pos: [-78, 0, 440], size: [8, 32, 8], color: "#556070", floors: 9 },
  ];

  // Rebuild collision boxes each render (safe - runs once per map load)
  ACTIVE_COL_BOXES.length = 0;
  for (const b of buildings) {
    ACTIVE_COL_BOXES.push(makeBox(b.pos[0], b.pos[2], b.size[0], b.size[2]));
  }
  // Map boundary walls
  ACTIVE_COL_BOXES.push(makeBox(0, -350, 1200, 10)); // south wall
  ACTIVE_COL_BOXES.push(makeBox(0, 560, 1200, 10)); // north wall
  ACTIVE_COL_BOXES.push(makeBox(-210, 100, 10, 900)); // west wall
  ACTIVE_COL_BOXES.push(makeBox(210, 100, 10, 900)); // east wall

  const crossStreetZ = [-200, -100, 0, 100, 200, 300, 400, 500];

  return (
    <group>
      {/* Large ground plane */}
      <mesh
        position={[0, -0.02, 100]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[1200, 1200]} />
        <meshStandardMaterial
          color={nightCity ? "#1a1a1a" : "#2e2e2e"}
          roughness={0.95}
        />
      </mesh>
      {/* Sidewalk strips */}
      <mesh
        position={[13.5, 0.01, 100]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[7, 950]} />
        <meshStandardMaterial color="#888888" roughness={0.9} />
      </mesh>
      <mesh
        position={[-13.5, 0.01, 100]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[7, 950]} />
        <meshStandardMaterial color="#888888" roughness={0.9} />
      </mesh>
      {/* Main road - 900 units long */}
      <mesh
        position={[0, 0.015, 100]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[22, 950]} />
        <meshStandardMaterial
          color={nightCity ? "#1c1c1c" : "#2a2a2a"}
          roughness={weather === "rain" ? 0.05 : 0.78}
          metalness={weather === "rain" ? 0.55 : 0.05}
        />
      </mesh>
      {/* Cross streets */}
      {crossStreetZ.map((z) => (
        <mesh
          key={z}
          position={[0, 0.016, z]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[420, 20]} />
          <meshStandardMaterial
            color={nightCity ? "#222222" : "#2d2d2d"}
            roughness={0.82}
          />
        </mesh>
      ))}
      {/* Sidewalks on cross streets */}
      {crossStreetZ.flatMap((z) => [
        <mesh
          key={`csw-t-${z}`}
          position={[0, 0.018, z + 12]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[420, 4]} />
          <meshStandardMaterial color="#888888" roughness={0.9} />
        </mesh>,
        <mesh
          key={`csw-b-${z}`}
          position={[0, 0.018, z - 12]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[420, 4]} />
          <meshStandardMaterial color="#888888" roughness={0.9} />
        </mesh>,
      ])}
      {/* Center lane dashes - main road */}
      {Array.from({ length: 75 }, (_, i) => (
        <mesh
          key={`ld-${-330 + i * 12}`}
          position={[0, 0.03, -330 + i * 12]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.25, 4]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      ))}
      {/* Crosswalk stripes at intersections */}
      {crossStreetZ.flatMap((z) =>
        Array.from({ length: 6 }, (_, i) => (
          <mesh
            key={`cw-${z}-${(-2.5 + i) * 1.5}`}
            position={[(-2.5 + i) * 1.5, 0.025, z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[0.8, 18]} />
            <meshStandardMaterial
              color="#eeeeee"
              roughness={0.7}
              opacity={0.7}
              transparent
            />
          </mesh>
        )),
      )}
      {/* Buildings */}
      {buildings.map((b) => (
        <Building
          key={`bldg-${b.pos[0]}-${b.pos[2]}`}
          position={b.pos}
          size={b.size}
          color={b.color}
          floors={b.floors}
          nightCity={nightCity}
        />
      ))}
      {/* Street lights - main road */}
      {Array.from({ length: 24 }, (_, i) => [
        <StreetLight
          key={`slr-${-300 + i * 38}`}
          position={[12, 0, -300 + i * 38]}
          active={lightsOn}
        />,
        <StreetLight
          key={`sll-${-300 + i * 38}`}
          position={[-12, 0, -300 + i * 38]}
          active={lightsOn}
        />,
      ]).flat()}
      {/* Street lights - cross streets */}
      {crossStreetZ.flatMap((z) =>
        [-140, -80, -30, 30, 80, 140].map((x) => (
          <StreetLight
            key={`cs-sl-${z}-${x}`}
            position={[x, 0, z + 1]}
            active={lightsOn}
          />
        )),
      )}
      {/* Trees along main road */}
      {Array.from({ length: 20 }, (_, i) => [
        <Tree
          key={`tr-main-${-280 + i * 43}`}
          position={[15.5, 0, -280 + i * 43]}
        />,
        <Tree
          key={`tl-main-${-280 + i * 43}`}
          position={[-15.5, 0, -280 + i * 43]}
        />,
      ]).flat()}
      {/* Sidewalk details */}
      {Array.from({ length: 12 }, (_, i) => [
        <FireHydrant
          key={`fhr-${-240 + i * 62}`}
          position={[12.2, 0, -240 + i * 62]}
        />,
        <Bench
          key={`br-${-200 + i * 70}`}
          position={[14.8, 0, -200 + i * 70]}
        />,
        <Bench
          key={`bl-${-220 + i * 65}`}
          position={[-14.8, 0, -220 + i * 65]}
        />,
      ]).flat()}
      {/* Night City neon sign boards */}
      {nightCity &&
        buildings.slice(0, 20).map((b, ni) => (
          <mesh
            key={`neon-${b.pos[0]}-${b.pos[2]}`}
            position={[
              b.pos[0],
              b.size[1] * 0.4,
              b.pos[2] + b.size[2] / 2 + 0.1,
            ]}
          >
            <boxGeometry args={[b.size[0] * 0.5, 1.2, 0.1]} />
            <meshStandardMaterial
              color={`hsl(${(ni * 37) % 360}, 100%, 60%)`}
              emissive={`hsl(${(ni * 37) % 360}, 100%, 60%)`}
              emissiveIntensity={3}
            />
          </mesh>
        ))}
    </group>
  );
}

// ─── Highway Map ──────────────────────────────────────────────────────────────
function HighwayMap({ weather }: { weather: WeatherType }) {
  // Clear collision boxes for highway
  ACTIVE_COL_BOXES.length = 0;
  // Highway boundary walls
  ACTIVE_COL_BOXES.push(makeBox(0, -650, 1200, 12));
  ACTIVE_COL_BOXES.push(makeBox(0, 650, 1200, 12));
  ACTIVE_COL_BOXES.push(makeBox(-45, 0, 10, 1300));
  ACTIVE_COL_BOXES.push(makeBox(45, 0, 10, 1300));

  return (
    <group>
      {/* Large ground */}
      <mesh
        position={[0, -0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[1200, 1300]} />
        <meshStandardMaterial color="#6a7a50" roughness={0.95} />
      </mesh>
      {/* Main highway road - 1200 units */}
      <mesh
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[36, 1300]} />
        <meshStandardMaterial
          color="#383838"
          roughness={weather === "rain" ? 0.05 : 0.78}
          metalness={weather === "rain" ? 0.5 : 0.02}
        />
      </mesh>
      {/* Lane dividers */}
      {Array.from({ length: 108 }, (_, i) => (
        <mesh
          key={`hwy-ld-${-540 + i * 10}`}
          position={[0, 0.02, -540 + i * 10]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.25, 5]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      ))}
      {/* Side lane dashes left */}
      {Array.from({ length: 108 }, (_, i) => (
        <mesh
          key={`hwy-ls-${-540 + i * 10}`}
          position={[-9, 0.02, -540 + i * 10]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.2, 4]} />
          <meshStandardMaterial
            color="#ffff00"
            roughness={0.8}
            opacity={0.8}
            transparent
          />
        </mesh>
      ))}
      {/* Side lane dashes right */}
      {Array.from({ length: 108 }, (_, i) => (
        <mesh
          key={`hwy-rs-${-540 + i * 10}`}
          position={[9, 0.02, -540 + i * 10]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.2, 4]} />
          <meshStandardMaterial
            color="#ffff00"
            roughness={0.8}
            opacity={0.8}
            transparent
          />
        </mesh>
      ))}
      {/* Shoulder strips */}
      <mesh
        position={[20, 0.015, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[8, 1300]} />
        <meshStandardMaterial color="#8a8060" roughness={0.95} />
      </mesh>
      <mesh
        position={[-20, 0.015, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[8, 1300]} />
        <meshStandardMaterial color="#8a8060" roughness={0.95} />
      </mesh>
      {/* Guard rails both sides */}
      <mesh position={[18.5, 0.3, 0]}>
        <boxGeometry args={[0.15, 0.6, 1300]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-18.5, 0.3, 0]}>
        <boxGeometry args={[0.15, 0.6, 1300]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Center divider */}
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.5, 0.45, 1300]} />
        <meshStandardMaterial color="#cc4400" roughness={0.7} />
      </mesh>
      {/* Speed signs every 100 units */}
      {Array.from({ length: 13 }, (_, i) => (
        <group
          key={`sign-${-600 + i * 100}`}
          position={[20, 0, -600 + i * 100]}
        >
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 4, 8]} />
            <meshStandardMaterial color="#999999" />
          </mesh>
          <mesh position={[0, 4.2, 0]}>
            <boxGeometry args={[1.2, 0.9, 0.1]} />
            <meshStandardMaterial color="#1a5e1a" />
          </mesh>
        </group>
      ))}
      {/* Landscape hills */}
      {Array.from({ length: 8 }, (_, i) => [
        <mesh key={`hr-${-500 + i * 130}`} position={[50, -3, -500 + i * 130]}>
          <sphereGeometry args={[28, 10, 6]} />
          <meshStandardMaterial color="#5a6a40" roughness={0.95} />
        </mesh>,
        <mesh key={`hl-${-500 + i * 130}`} position={[-50, -3, -500 + i * 130]}>
          <sphereGeometry args={[28, 10, 6]} />
          <meshStandardMaterial color="#5a6a40" roughness={0.95} />
        </mesh>,
      ]).flat()}
      {/* Trees lining the highway */}
      {Array.from({ length: 25 }, (_, i) => [
        <Tree
          key={`tr-hwy-${-580 + i * 46}`}
          position={[30, 0, -580 + i * 46]}
        />,
        <Tree
          key={`tl-hwy-${-580 + i * 46}`}
          position={[-30, 0, -580 + i * 46]}
        />,
      ]).flat()}
    </group>
  );
}

// ─── Mountain Map ─────────────────────────────────────────────────────────────
function MountainMap({ weather }: { weather: WeatherType }) {
  ACTIVE_COL_BOXES.length = 0;
  ACTIVE_COL_BOXES.push(makeBox(0, -550, 1200, 10));
  ACTIVE_COL_BOXES.push(makeBox(0, 550, 1200, 10));
  ACTIVE_COL_BOXES.push(makeBox(-160, 0, 10, 1100));
  ACTIVE_COL_BOXES.push(makeBox(160, 0, 10, 1100));
  return (
    <group>
      {/* Large ground */}
      <mesh
        position={[0, -0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[1200, 1200]} />
        <meshStandardMaterial color="#4a5040" roughness={0.95} />
      </mesh>
      {/* Main winding road segments */}
      <mesh
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[14, 600]} />
        <meshStandardMaterial
          color="#3a3a3a"
          roughness={weather === "rain" ? 0.05 : 0.8}
          metalness={weather === "rain" ? 0.5 : 0.02}
        />
      </mesh>
      <mesh
        position={[30, 0.01, 250]}
        rotation={[-Math.PI / 2, Math.PI / 6, 0]}
        receiveShadow
      >
        <planeGeometry args={[14, 300]} />
        <meshStandardMaterial
          color="#3a3a3a"
          roughness={weather === "rain" ? 0.05 : 0.8}
          metalness={weather === "rain" ? 0.5 : 0.02}
        />
      </mesh>
      <mesh
        position={[-30, 0.01, -250]}
        rotation={[-Math.PI / 2, -Math.PI / 6, 0]}
        receiveShadow
      >
        <planeGeometry args={[14, 300]} />
        <meshStandardMaterial
          color="#3a3a3a"
          roughness={weather === "rain" ? 0.05 : 0.8}
          metalness={weather === "rain" ? 0.5 : 0.02}
        />
      </mesh>
      {/* Lane markings */}
      {Array.from({ length: 50 }, (_, i) => (
        <mesh
          key={`mtn-ml-${-280 + i * 12}`}
          position={[0, 0.02, -280 + i * 12]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.2, 4]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.8}
            opacity={0.7}
            transparent
          />
        </mesh>
      ))}
      {/* Mountain peaks */}
      {[
        [-80, 0, -100],
        [80, 0, -100],
        [-80, 0, 100],
        [80, 0, 100],
        [0, 0, -180],
        [0, 0, 180],
        [-120, 0, -50],
        [120, 0, -50],
        [-120, 0, 50],
        [120, 0, 50],
        [-60, 0, -250],
        [60, 0, -250],
        [-60, 0, 250],
        [60, 0, 250],
      ].map(([x, _y, z], pi) => (
        <mesh key={`peak-${x}-${z}`} position={[x, 0, z]}>
          <coneGeometry args={[30 + (pi % 3) * 8, 55 + (pi % 4) * 12, 7]} />
          <meshStandardMaterial
            color={pi % 2 === 0 ? "#787060" : "#6a6050"}
            roughness={0.92}
          />
        </mesh>
      ))}
      {/* Snow caps */}
      {[
        [-80, 45, -100],
        [80, 45, -100],
        [0, 55, -180],
        [0, 55, 180],
      ].map(([x, y, z]) => (
        <mesh key={`snow-${x}-${z}`} position={[x, y, z]}>
          <coneGeometry args={[8, 14, 7]} />
          <meshStandardMaterial color="#eeeeff" roughness={0.5} />
        </mesh>
      ))}
      {/* Guard rails */}
      <mesh position={[7.2, 0.4, 0]}>
        <boxGeometry args={[0.12, 0.8, 620]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-7.2, 0.4, 0]}>
        <boxGeometry args={[0.12, 0.8, 620]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Pine trees */}
      {Array.from({ length: 25 }, (_, i) => [
        <Tree
          key={`tr-mtn-${-280 + i * 22}`}
          position={[10 + (i % 3) * 4, 0, -280 + i * 22]}
        />,
        <Tree
          key={`tl-mtn-${-280 + i * 22}`}
          position={[-10 - (i % 3) * 4, 0, -280 + i * 22]}
        />,
      ]).flat()}
      {/* Rocks */}
      {[
        [-20, 0, -80],
        [20, 0, -80],
        [-25, 0, 0],
        [25, 0, 60],
        [-18, 0, 120],
        [22, 0, 200],
        [-30, 0, -200],
        [28, 0, -150],
      ].map(([x, _y, z], ri) => (
        <mesh key={`rock-${x}-${z}`} position={[x, 0.4, z]}>
          <dodecahedronGeometry args={[1.8 + ri * 0.2, 0]} />
          <meshStandardMaterial
            color="#7a7060"
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Desert Map ───────────────────────────────────────────────────────────────
function DesertMap({ weather }: { weather: WeatherType }) {
  ACTIVE_COL_BOXES.length = 0;
  ACTIVE_COL_BOXES.push(makeBox(0, -600, 1200, 10));
  ACTIVE_COL_BOXES.push(makeBox(0, 600, 1200, 10));
  ACTIVE_COL_BOXES.push(makeBox(-250, 0, 10, 1200));
  ACTIVE_COL_BOXES.push(makeBox(250, 0, 10, 1200));
  return (
    <group>
      {/* Sandy ground */}
      <mesh
        position={[0, -0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[1200, 1200]} />
        <meshStandardMaterial color="#c8a870" roughness={0.95} />
      </mesh>
      {/* Road - long straight */}
      <mesh
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[16, 1200]} />
        <meshStandardMaterial
          color="#3a3530"
          roughness={weather === "rain" ? 0.05 : 0.85}
          metalness={weather === "rain" ? 0.4 : 0.01}
        />
      </mesh>
      {/* Cross road at z=0 */}
      <mesh
        position={[0, 0.012, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[500, 16]} />
        <meshStandardMaterial color="#3a3530" roughness={0.85} />
      </mesh>
      {/* Center line dashes */}
      {Array.from({ length: 100 }, (_, i) => (
        <mesh
          key={`dl-${-580 + i * 12}`}
          position={[0, 0.02, -580 + i * 12]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.2, 4]} />
          <meshStandardMaterial color="#ffff88" roughness={0.8} />
        </mesh>
      ))}
      {/* Sand dunes */}
      {Array.from({ length: 16 }, (_, i) => [
        <mesh
          key={`dr-${-400 + i * 55}`}
          position={[30 + (i % 4) * 18, -4, -400 + i * 55]}
        >
          <sphereGeometry args={[18 + (i % 5) * 4, 8, 5]} />
          <meshStandardMaterial color="#c0a060" roughness={0.95} />
        </mesh>,
        <mesh
          key={`dl2-${-380 + i * 55}`}
          position={[-30 - (i % 4) * 18, -4, -380 + i * 55]}
        >
          <sphereGeometry args={[16 + (i % 4) * 5, 8, 5]} />
          <meshStandardMaterial color="#b89850" roughness={0.95} />
        </mesh>,
      ]).flat()}
      {/* Cacti */}
      {Array.from({ length: 12 }, (_, i) => [
        <Cactus
          key={`cr-${-300 + i * 55}`}
          position={[20 + (i % 3) * 8, 0, -300 + i * 55]}
        />,
        <Cactus
          key={`cl-${-280 + i * 55}`}
          position={[-20 - (i % 3) * 8, 0, -280 + i * 55]}
        />,
      ]).flat()}
      {/* Desert rocks */}
      {[
        [-60, 0, -200],
        [60, 0, -100],
        [-80, 0, 0],
        [70, 0, 150],
        [-50, 0, 300],
        [90, 0, -350],
        [-100, 0, 400],
        [65, 0, 500],
      ].map(([x, _y, z], ri) => (
        <mesh key={`drock-${x}-${z}`} position={[x, 0.6, z]}>
          <dodecahedronGeometry args={[2.5 + ri * 0.3, 0]} />
          <meshStandardMaterial color="#a09070" roughness={0.9} />
        </mesh>
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
// ─── Sun Mesh ─────────────────────────────────────────────────────────────────
function SunMesh() {
  return (
    <mesh position={[200, 180, -300]}>
      <sphereGeometry args={[18, 16, 16]} />
      <meshStandardMaterial
        color="#FFF5C0"
        emissive="#FFD700"
        emissiveIntensity={2.5}
      />
    </mesh>
  );
}

// ─── Night Sky Elements ───────────────────────────────────────────────────────
function NightSkyElements() {
  const positions = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 300; i++) {
      arr.push(
        (Math.random() - 0.5) * 2000,
        100 + Math.random() * 200,
        (Math.random() - 0.5) * 2000,
      );
    }
    return new Float32Array(arr);
  }, []);
  return (
    <>
      {/* Moon */}
      <mesh position={[-300, 200, -500]}>
        <sphereGeometry args={[20, 16, 16]} />
        <meshStandardMaterial
          color="#e8e8ff"
          emissive="#c8c8ff"
          emissiveIntensity={0.8}
        />
      </mesh>
      {/* Stars */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={1.2} color="white" sizeAttenuation />
      </points>
    </>
  );
}

// ─── Animated Clouds ─────────────────────────────────────────────────────────
interface CloudGroupProps {
  initX: number;
  y: number;
  z: number;
  speed: number;
}

function AnimatedCloudGroup({ initX, y, z, speed }: CloudGroupProps) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.x -= speed * delta;
    if (groupRef.current.position.x < -600) {
      groupRef.current.position.x = 600;
    }
  });
  return (
    <group ref={groupRef} position={[initX, y, z]}>
      <mesh>
        <sphereGeometry args={[18, 7, 5]} />
        <meshStandardMaterial
          color="white"
          transparent
          opacity={0.82}
          roughness={1}
        />
      </mesh>
      <mesh position={[20, 4, 0]}>
        <sphereGeometry args={[14, 7, 5]} />
        <meshStandardMaterial
          color="white"
          transparent
          opacity={0.78}
          roughness={1}
        />
      </mesh>
      <mesh position={[-18, 3, 0]}>
        <sphereGeometry args={[15, 7, 5]} />
        <meshStandardMaterial
          color="white"
          transparent
          opacity={0.8}
          roughness={1}
        />
      </mesh>
      <mesh position={[5, 12, 0]}>
        <sphereGeometry args={[11, 7, 5]} />
        <meshStandardMaterial
          color="#f8f8f8"
          transparent
          opacity={0.75}
          roughness={1}
        />
      </mesh>
      <mesh position={[-8, 10, 4]}>
        <sphereGeometry args={[9, 7, 5]} />
        <meshStandardMaterial
          color="#f0f0f0"
          transparent
          opacity={0.72}
          roughness={1}
        />
      </mesh>
    </group>
  );
}

const CLOUD_DATA: CloudGroupProps[] = [
  { initX: -200, y: 90, z: -180, speed: 3.5 },
  { initX: 50, y: 110, z: -220, speed: 2.8 },
  { initX: 300, y: 85, z: -160, speed: 4.0 },
  { initX: -400, y: 100, z: -250, speed: 3.0 },
  { initX: 150, y: 95, z: -200, speed: 3.8 },
  { initX: -100, y: 105, z: -190, speed: 2.5 },
  { initX: 400, y: 88, z: -170, speed: 4.2 },
  { initX: -300, y: 115, z: -230, speed: 3.2 },
];

function SceneClouds() {
  return (
    <>
      {CLOUD_DATA.map((c) => (
        <AnimatedCloudGroup key={`cloud-${c.initX}-${c.z}`} {...c} />
      ))}
    </>
  );
}

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
    const prevPos = carPosRef.current.clone();
    carVelRef.current.lerp(forward.multiplyScalar(carSpeedRef.current), grip);
    carPosRef.current.addScaledVector(carVelRef.current, dt);

    // ── Collision Detection ──
    {
      const CAR_HALF_W = 1.2;
      const CAR_HALF_L = 2.6;
      let hit = false;
      for (const box of ACTIVE_COL_BOXES) {
        if (
          carPosRef.current.x + CAR_HALF_W > box.x1 &&
          carPosRef.current.x - CAR_HALF_W < box.x2 &&
          carPosRef.current.z + CAR_HALF_L > box.z1 &&
          carPosRef.current.z - CAR_HALF_L < box.z2
        ) {
          carPosRef.current.copy(prevPos);
          carSpeedRef.current *= -0.25;
          carVelRef.current.multiplyScalar(-0.25);
          hit = true;
          break;
        }
      }
      if (!hit) {
        // Hard map boundary
        if (Math.abs(carPosRef.current.x) > 200) {
          carPosRef.current.copy(prevPos);
          carSpeedRef.current *= -0.3;
        }
        if (carPosRef.current.z < -345 || carPosRef.current.z > 555) {
          carPosRef.current.copy(prevPos);
          carSpeedRef.current *= -0.3;
        }
      }
    }

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
      {/* Sun (day/non-night modes) */}
      {!isNight && gs.weather !== "fog" && <SunMesh />}
      {/* Night sky: moon + stars */}
      {isNight && <NightSkyElements />}
      {/* Animated clouds (day/sunny weather) */}
      {!isNight && gs.weather !== "rain" && gs.weather !== "fog" && (
        <SceneClouds />
      )}
      {/* Cinematic ambient */}
      <ambientLight intensity={isNight ? 0.06 : cfg.ambientIntensity * 0.9} />
      {/* Key sun light with high-res shadows */}
      <directionalLight
        position={cfg.sunPos}
        intensity={isNight ? 0.2 : cfg.sunIntensity}
        color={
          isNight ? "#8888cc" : gs.weather === "rain" ? "#aaccdd" : "#fff8e8"
        }
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={600}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-bias={-0.0005}
      />
      {/* Fill light (opposite side, softer) */}
      {!isNight && (
        <directionalLight
          position={[
            -cfg.sunPos[0] * 0.5,
            cfg.sunPos[1] * 0.3,
            -cfg.sunPos[2] * 0.5,
          ]}
          intensity={cfg.sunIntensity * 0.18}
          color="#d0e8ff"
        />
      )}
      {/* Ground bounce */}
      <hemisphereLight
        args={[
          isNight ? "#0a0a2a" : gs.map === "desert" ? "#f0d8a0" : "#c8e8ff",
          isNight ? "#000000" : "#404830",
          isNight ? 0.08 : 0.35,
        ]}
      />
      {isNight && (
        <>
          <pointLight
            position={[0, 25, 0]}
            intensity={0.5}
            color="#7799ff"
            distance={120}
          />
          <pointLight
            position={[0, 8, -20]}
            intensity={0.3}
            color="#4455aa"
            distance={60}
          />
        </>
      )}
      {gs.weather === "fog" && <ambientLight intensity={0.6} color="#c8d8e8" />}

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
  onControlModeChange,
}: {
  state: GameState;
  carX: number;
  carZ: number;
  carAngle: number;
  onCameraToggle: () => void;
  onPause: () => void;
  onMapChange: (m: MapType) => void;
  onWeatherChange: (w: WeatherType) => void;
  onControlModeChange: (m: ControlMode) => void;
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
        {/* Control mode quick-switch */}
        <button
          type="button"
          onClick={() => {
            const modes: ControlMode[] = ["wheel", "joystick", "keyboard"];
            const next =
              modes[(modes.indexOf(state.controlMode) + 1) % modes.length];
            onControlModeChange(next);
          }}
          data-ocid="sdl.controlmode.toggle"
          style={{
            background: "rgba(0,0,0,0.75)",
            border: "1px solid rgba(255,200,80,0.5)",
            borderRadius: 8,
            padding: "6px 14px",
            color: "#ffdd88",
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "monospace",
          }}
        >
          {state.controlMode === "wheel"
            ? "🚗 WHEEL"
            : state.controlMode === "joystick"
              ? "🕹️ STICK"
              : "⌨️ KEYS"}
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

// ─── Mobile Touch Controls (Multi-Mode) ──────────────────────────────────────
// Joystick mode
function JoystickControls({
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
  const joystickBaseRef = React.useRef<{ x: number; y: number } | null>(null);
  const thumbRef = React.useRef<HTMLDivElement>(null);

  const btnStyle = (color: string): React.CSSProperties => ({
    width: 68,
    height: 68,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.6)",
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
    boxShadow: `0 0 14px ${color}55`,
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
        padding: "0 20px 110px",
      }}
    >
      {/* Left joystick */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,150,0,0.08) 0%, rgba(0,0,0,0.55) 100%)",
          border: "2px solid rgba(255,150,0,0.4)",
          position: "relative",
          pointerEvents: "auto",
          touchAction: "none",
          boxShadow: "0 0 20px rgba(255,100,0,0.2)",
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
          if (thumbRef.current) {
            thumbRef.current.style.transform = `translate(calc(-50% + ${Math.max(-38, Math.min(38, dx * 38))}px), calc(-50% + ${Math.max(-38, Math.min(38, dy * 38))}px))`;
          }
        }}
        onTouchEnd={() => {
          joystickBaseRef.current = null;
          touchRef.current!.steerX = 0;
          touchRef.current!.steerY = 0;
          touchRef.current!.gas = false;
          touchRef.current!.brake = false;
          if (thumbRef.current)
            thumbRef.current.style.transform = "translate(-50%, -50%)";
        }}
      >
        <div
          ref={thumbRef}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 48,
            height: 48,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,160,60,0.8), rgba(200,80,0,0.6))",
            border: "2px solid rgba(255,200,100,0.8)",
            boxShadow: "0 0 12px rgba(255,120,0,0.6)",
            transition: "none",
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

// Steering Wheel mode
function SteeringWheelControls({
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
  const wheelRotRef = React.useRef(0);
  const [wheelAngle, setWheelAngle] = React.useState(0);
  const wheelCenterRef = React.useRef<{ x: number; y: number } | null>(null);
  const touchIdRef = React.useRef<number | null>(null);

  const handleWheelTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.type === "touchstart") {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      wheelCenterRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      touchIdRef.current = e.touches[0].identifier;
    }
    const touch = Array.from(e.touches).find(
      (t) => t.identifier === touchIdRef.current,
    );
    if (!touch || !wheelCenterRef.current) return;
    const dx = touch.clientX - wheelCenterRef.current.x;
    const dy = touch.clientY - wheelCenterRef.current.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    let delta = angle - wheelRotRef.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    wheelRotRef.current = angle;
    const steer = Math.max(-1, Math.min(1, dx / 60));
    touchRef.current!.steerX = steer;
    setWheelAngle((prev) => {
      const next = Math.max(-160, Math.min(160, prev + delta * 0.7));
      return next;
    });
    if (e.type === "touchend" || e.type === "touchcancel") {
      touchIdRef.current = null;
      wheelCenterRef.current = null;
      touchRef.current!.steerX = 0;
      setWheelAngle(0);
    }
  };

  const pedalStyle = (color: string): React.CSSProperties => ({
    flex: 1,
    height: 70,
    borderRadius: 14,
    background: `linear-gradient(135deg, rgba(0,0,0,0.8), ${color}22)`,
    border: `2px solid ${color}88`,
    color: "white",
    fontWeight: 900,
    fontSize: 14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
    WebkitUserSelect: "none",
    touchAction: "none",
    boxShadow: `0 4px 16px ${color}44, inset 0 1px 0 ${color}33`,
    letterSpacing: "0.05em",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 20,
      }}
    >
      {/* Steering wheel */}
      <div
        onTouchStart={handleWheelTouch}
        onTouchMove={handleWheelTouch}
        onTouchEnd={handleWheelTouch}
        onTouchCancel={handleWheelTouch}
        style={{
          pointerEvents: "auto",
          touchAction: "none",
          marginBottom: 14,
          width: 140,
          height: 140,
          position: "relative",
          userSelect: "none",
        }}
      >
        {/* Outer ring */}
        <svg
          role="img"
          aria-label="Steering wheel"
          width="140"
          height="140"
          viewBox="0 0 140 140"
          style={{
            position: "absolute",
            inset: 0,
            transform: `rotate(${wheelAngle}deg)`,
            transition: wheelAngle === 0 ? "transform 0.3s ease" : "none",
            filter: "drop-shadow(0 0 12px rgba(255,140,0,0.7))",
          }}
        >
          <title>Steering Wheel</title>
          <circle
            cx="70"
            cy="70"
            r="62"
            fill="none"
            stroke="rgba(255,140,0,0.9)"
            strokeWidth="12"
            strokeDasharray="none"
          />
          {/* Grip bumps */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <rect
              key={a}
              x="66"
              y="4"
              width="8"
              height="14"
              rx="4"
              fill="rgba(255,160,60,0.9)"
              transform={`rotate(${a} 70 70)`}
            />
          ))}
          {/* Spokes */}
          <line
            x1="70"
            y1="8"
            x2="70"
            y2="40"
            stroke="rgba(200,100,0,0.9)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <line
            x1="70"
            y1="100"
            x2="70"
            y2="132"
            stroke="rgba(200,100,0,0.9)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <line
            x1="8"
            y1="70"
            x2="40"
            y2="70"
            stroke="rgba(200,100,0,0.9)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <line
            x1="100"
            y1="70"
            x2="132"
            y2="70"
            stroke="rgba(200,100,0,0.9)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Center hub */}
          <circle
            cx="70"
            cy="70"
            r="18"
            fill="rgba(30,15,0,0.95)"
            stroke="rgba(255,140,0,0.8)"
            strokeWidth="3"
          />
          <text
            x="70"
            y="75"
            textAnchor="middle"
            fill="rgba(255,180,60,0.9)"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
          >
            M5
          </text>
        </svg>
      </div>

      {/* Pedals row */}
      <div
        style={{
          display: "flex",
          gap: 12,
          width: "min(340px, 90vw)",
          pointerEvents: "auto",
        }}
      >
        <button
          type="button"
          style={pedalStyle("#ff4444")}
          onTouchStart={() => {
            touchRef.current!.brake = true;
          }}
          onTouchEnd={() => {
            touchRef.current!.brake = false;
          }}
        >
          🛑 BRAKE
        </button>
        <button
          type="button"
          style={pedalStyle("#ffcc00")}
          onTouchStart={() => {
            touchRef.current!.drift = true;
          }}
          onTouchEnd={() => {
            touchRef.current!.drift = false;
          }}
        >
          💨 DRIFT
        </button>
        <button
          type="button"
          style={pedalStyle("#44ff88")}
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

// Main mobile control dispatcher
function MobileControls({
  touchRef,
  controlMode,
}: {
  touchRef: React.RefObject<{
    gas: boolean;
    brake: boolean;
    drift: boolean;
    steerX: number;
    steerY: number;
  }>;
  controlMode: ControlMode;
}) {
  if (controlMode === "wheel")
    return <SteeringWheelControls touchRef={touchRef} />;
  if (controlMode === "joystick")
    return <JoystickControls touchRef={touchRef} />;
  // keyboard - show a minimal hint overlay only
  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,150,0,0.4)",
        borderRadius: 8,
        padding: "8px 16px",
        color: "rgba(255,200,100,0.8)",
        fontSize: 11,
        fontFamily: "monospace",
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      WASD / ↑↓←→ · SHIFT drift · C camera
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
  selectedControlMode,
  onMapChange,
  onWeatherChange,
  onChallengeChange,
  onColorChange,
  onControlModeChange,
}: {
  onStart: () => void;
  selectedMap: MapType;
  selectedWeather: WeatherType;
  selectedChallenge: ChallengeType;
  selectedColor: string;
  selectedControlMode: ControlMode;
  onMapChange: (m: MapType) => void;
  onWeatherChange: (w: WeatherType) => void;
  onChallengeChange: (c: ChallengeType) => void;
  onColorChange: (c: string) => void;
  onControlModeChange: (m: ControlMode) => void;
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

      {/* Control Mode */}
      <div
        style={{ marginTop: 20, marginBottom: 8, width: "100%", maxWidth: 520 }}
      >
        <div
          style={{
            color: "rgba(255,180,80,0.8)",
            fontSize: 11,
            marginBottom: 10,
            fontFamily: "monospace",
            letterSpacing: "0.08em",
          }}
        >
          🎮 CONTROL MODE
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {(["wheel", "joystick", "keyboard"] as ControlMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onControlModeChange(mode)}
              data-ocid={`sdl.controlmode.${mode}.button`}
              style={{
                flex: 1,
                padding: "12px 8px",
                borderRadius: 10,
                cursor: "pointer",
                background:
                  selectedControlMode === mode
                    ? "linear-gradient(135deg, rgba(255,100,0,0.4), rgba(255,60,0,0.2))"
                    : "rgba(0,0,0,0.6)",
                border: `2px solid ${selectedControlMode === mode ? "rgba(255,160,0,0.9)" : "rgba(255,150,0,0.3)"}`,
                color:
                  selectedControlMode === mode
                    ? "#ffcc00"
                    : "rgba(255,200,100,0.6)",
                fontSize: 12,
                fontFamily: "monospace",
                fontWeight: 700,
                transition: "all 0.2s",
                boxShadow:
                  selectedControlMode === mode
                    ? "0 0 14px rgba(255,100,0,0.5)"
                    : "none",
              }}
            >
              {mode === "wheel"
                ? "🚗 WHEEL"
                : mode === "joystick"
                  ? "🕹️ STICK"
                  : "⌨️ KEYS"}
            </button>
          ))}
        </div>
        <div
          style={{
            color: "rgba(255,180,80,0.45)",
            fontSize: 10,
            fontFamily: "monospace",
            marginTop: 7,
            textAlign: "center",
            lineHeight: 1.8,
          }}
        >
          {selectedControlMode === "wheel" &&
            "Steering wheel + GAS / BRAKE / DRIFT pedals"}
          {selectedControlMode === "joystick" &&
            "Joystick to steer + on-screen buttons"}
          {selectedControlMode === "keyboard" &&
            "WASD / Arrows · SHIFT drift · C camera · ESC pause"}
        </div>
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
    controlMode: "wheel" as ControlMode,
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
          dpr={[1, 2]}
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            stencil: false,
          }}
          camera={{ fov: 65, near: 0.1, far: 1200, position: [0, 5, 10] }}
          style={{ width: "100%", height: "100%", filter: motionBlur }}
          onCreated={({ gl }) => {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.4;
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
            selectedControlMode={gameState.controlMode}
            onMapChange={(m) => setGameState((s) => ({ ...s, map: m }))}
            onWeatherChange={(w) => setGameState((s) => ({ ...s, weather: w }))}
            onChallengeChange={(c) =>
              setGameState((s) => ({ ...s, challenge: c }))
            }
            onColorChange={(c) => setGameState((s) => ({ ...s, carColor: c }))}
            onControlModeChange={(m) =>
              setGameState((s) => ({ ...s, controlMode: m }))
            }
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
            onControlModeChange={(m) =>
              setGameState((s) => ({ ...s, controlMode: m }))
            }
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
          <MobileControls
            touchRef={touchRef}
            controlMode={gameState.controlMode}
          />
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
