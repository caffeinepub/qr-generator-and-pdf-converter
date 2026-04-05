import { Sky } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

const SandboxMode = lazy(() => import("./SandboxMode"));

type GameState = "start" | "playing" | "dead";
type GameMode = "dodge" | "sandbox";
type CameraView = "tpv" | "fpv";

interface PipeRenderData {
  id: number;
  gapY: number;
}
interface PipePhysicsData {
  id: number;
  x: number;
  gapY: number;
  scored: boolean;
}

// ─── Audio ─────────────────────────────────────────────────────────────────────────────
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
    if (ref.current.state === "suspended") {
      ref.current.resume().catch(() => {});
    }
    return ref.current;
  } catch {
    return null;
  }
}

function playFlap(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.05);
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.06);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  } catch {
    // silent
  }
}

function playHit(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * 0.18);
    const buf = ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 400;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    src.connect(filt);
    filt.connect(g);
    g.connect(ctx.destination);
    src.start();
  } catch {
    // silent
  }
}

function startBgMusic(
  ctx: AudioContext,
  stopRef: React.MutableRefObject<(() => void) | null>,
) {
  if (stopRef.current) return;
  const notes = [130.81, 146.83, 164.81, 174.61, 196.0, 174.61];
  const beatDur = 0.4;
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.07;
  masterGain.connect(ctx.destination);
  let t = ctx.currentTime + 0.1;
  let stopped = false;

  const schedule = () => {
    if (stopped) return;
    while (t < ctx.currentTime + 2.5) {
      for (const freq of notes) {
        if (stopped) break;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.8, t);
        g.gain.linearRampToValueAtTime(0, t + beatDur * 0.75);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(t);
        osc.stop(t + beatDur);
        t += beatDur;
      }
    }
    setTimeout(schedule, 700);
  };
  schedule();
  stopRef.current = () => {
    stopped = true;
    try {
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    } catch {
      // silent
    }
    stopRef.current = null;
  };
}

// ─── Cloud ──────────────────────────────────────────────────────────────────────────
const CLOUD_CONFIGS = [
  { id: "c1", pos: [8, 8, -18] as [number, number, number], scale: 1.8 },
  { id: "c2", pos: [-6, 10, -22] as [number, number, number], scale: 2.2 },
  { id: "c3", pos: [14, 6, -28] as [number, number, number], scale: 1.4 },
  { id: "c4", pos: [-12, 12, -15] as [number, number, number], scale: 1.9 },
  { id: "c5", pos: [20, 9, -12] as [number, number, number], scale: 1.5 },
  { id: "c6", pos: [0, 11, -35] as [number, number, number], scale: 2.5 },
  { id: "c7", pos: [-20, 7, -25] as [number, number, number], scale: 1.6 },
];

function CloudMesh({
  initPos,
  scale,
}: {
  initPos: [number, number, number];
  scale: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const speed = useMemo(() => 0.6 + Math.random() * 0.4, []);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.x -= speed * delta;
    if (ref.current.position.x < -50) ref.current.position.x = 55;
  });
  return (
    <group ref={ref} position={initPos} scale={scale}>
      <mesh>
        <sphereGeometry args={[1.5, 7, 5]} />
        <meshStandardMaterial
          color="white"
          transparent
          opacity={0.88}
          roughness={1}
        />
      </mesh>
      <mesh position={[1.6, 0.3, 0.2]}>
        <sphereGeometry args={[1.1, 7, 5]} />
        <meshStandardMaterial
          color="white"
          transparent
          opacity={0.82}
          roughness={1}
        />
      </mesh>
      <mesh position={[-1.3, 0.1, -0.2]}>
        <sphereGeometry args={[1.2, 7, 5]} />
        <meshStandardMaterial
          color="white"
          transparent
          opacity={0.85}
          roughness={1}
        />
      </mesh>
      <mesh position={[0.2, 0.9, 0]}>
        <sphereGeometry args={[0.9, 7, 5]} />
        <meshStandardMaterial
          color="white"
          transparent
          opacity={0.8}
          roughness={1}
        />
      </mesh>
    </group>
  );
}

// ─── Bird ────────────────────────────────────────────────────────────────────────────
function Bird({
  groupRef,
}: { groupRef: React.MutableRefObject<THREE.Group | null> }) {
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const a = Math.sin(t * 14) * 0.65;
    if (leftWingRef.current) leftWingRef.current.rotation.x = a;
    if (rightWingRef.current) rightWingRef.current.rotation.x = -a;
  });
  return (
    <group scale={1.3}>
      <group ref={groupRef}>
        {/* Body - elongated sphere for rounder look */}
        <mesh castShadow scale={[1.4, 1.0, 1.0]}>
          <sphereGeometry args={[0.32, 14, 12]} />
          <meshStandardMaterial color="#FFB800" roughness={0.3} metalness={0} />
        </mesh>
        {/* Breast - lighter chest patch */}
        <mesh position={[0.15, -0.08, 0.2]} castShadow>
          <sphereGeometry args={[0.22, 10, 8]} />
          <meshStandardMaterial color="#FFDA6A" roughness={0.3} metalness={0} />
        </mesh>
        {/* Head */}
        <mesh position={[0.28, 0.22, 0]} castShadow>
          <sphereGeometry args={[0.26, 14, 12]} />
          <meshStandardMaterial color="#FFB800" roughness={0.3} metalness={0} />
        </mesh>
        {/* Left wing */}
        <group ref={leftWingRef} position={[0, 0, -0.32]}>
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.08, 0.38]} />
            <meshStandardMaterial
              color="#FF8C00"
              roughness={0.3}
              metalness={0}
            />
          </mesh>
          {/* Secondary feather layer */}
          <mesh position={[0, -0.02, -0.1]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.35, 0.05, 0.22]} />
            <meshStandardMaterial
              color="#CC6600"
              roughness={0.3}
              metalness={0}
            />
          </mesh>
        </group>
        {/* Right wing */}
        <group ref={rightWingRef} position={[0, 0, 0.32]}>
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.08, 0.38]} />
            <meshStandardMaterial
              color="#FF8C00"
              roughness={0.3}
              metalness={0}
            />
          </mesh>
          {/* Secondary feather layer */}
          <mesh position={[0, -0.02, 0.1]} rotation={[-0.1, 0, 0]}>
            <boxGeometry args={[0.35, 0.05, 0.22]} />
            <meshStandardMaterial
              color="#CC6600"
              roughness={0.3}
              metalness={0}
            />
          </mesh>
        </group>
        {/* Beak */}
        <mesh position={[0.55, 0.2, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.068, 0.24, 8]} />
          <meshStandardMaterial color="#FF4500" roughness={0.4} metalness={0} />
        </mesh>
        {/* Right eye white sclera */}
        <mesh position={[0.34, 0.29, 0.14]}>
          <sphereGeometry args={[0.07, 9, 9]} />
          <meshStandardMaterial color="#f8f8f8" roughness={0.1} metalness={0} />
        </mesh>
        {/* Right eye pupil */}
        <mesh position={[0.36, 0.29, 0.17]}>
          <sphereGeometry args={[0.042, 8, 8]} />
          <meshStandardMaterial color="#1a0a00" roughness={0.2} metalness={0} />
        </mesh>
        {/* Right eye glint */}
        <mesh position={[0.375, 0.295, 0.2]}>
          <sphereGeometry args={[0.018, 6, 6]} />
          <meshStandardMaterial color="white" roughness={0.1} metalness={0} />
        </mesh>
        {/* Tail feathers - 3 overlapping */}
        <mesh position={[-0.38, -0.04, 0]} rotation={[0, 0, 0.35]} castShadow>
          <boxGeometry args={[0.28, 0.07, 0.34]} />
          <meshStandardMaterial color="#CC7700" roughness={0.3} metalness={0} />
        </mesh>
        <mesh
          position={[-0.36, -0.03, 0.1]}
          rotation={[0, 0.2, 0.35]}
          castShadow
        >
          <boxGeometry args={[0.22, 0.055, 0.22]} />
          <meshStandardMaterial color="#AA5500" roughness={0.3} metalness={0} />
        </mesh>
        <mesh
          position={[-0.36, -0.03, -0.1]}
          rotation={[0, -0.2, 0.35]}
          castShadow
        >
          <boxGeometry args={[0.22, 0.055, 0.22]} />
          <meshStandardMaterial color="#AA5500" roughness={0.3} metalness={0} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Pipe Pair ───────────────────────────────────────────────────────────────────────
function PipePair({
  id,
  gapY,
  onMount,
}: {
  id: number;
  gapY: number;
  onMount: (id: number, g: THREE.Group | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useEffect(() => {
    onMount(id, groupRef.current);
    return () => onMount(id, null);
  }, [id, onMount]);
  const GAP = 3.5;
  const H = 13;
  const topY = gapY + GAP / 2 + H / 2;
  const botY = gapY - GAP / 2 - H / 2;
  return (
    <group ref={groupRef} position={[15, 0, 0]}>
      <mesh position={[0, topY, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, H, 1.2]} />
        <meshStandardMaterial
          color="#27ae60"
          metalness={0.12}
          roughness={0.4}
        />
      </mesh>
      {/* Highlight stripe top pipe */}
      <mesh position={[0.61, topY, 0]}>
        <boxGeometry args={[0.04, H, 1.2]} />
        <meshStandardMaterial color="#44cc77" metalness={0.2} roughness={0.3} />
      </mesh>
      <mesh position={[0, gapY + GAP / 2, 0]}>
        <boxGeometry args={[1.55, 0.35, 1.55]} />
        <meshStandardMaterial
          color="#2ecc71"
          metalness={0.12}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, botY, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, H, 1.2]} />
        <meshStandardMaterial
          color="#27ae60"
          metalness={0.12}
          roughness={0.4}
        />
      </mesh>
      {/* Highlight stripe bottom pipe */}
      <mesh position={[0.61, botY, 0]}>
        <boxGeometry args={[0.04, H, 1.2]} />
        <meshStandardMaterial color="#44cc77" metalness={0.2} roughness={0.3} />
      </mesh>
      <mesh position={[0, gapY - GAP / 2, 0]}>
        <boxGeometry args={[1.55, 0.35, 1.55]} />
        <meshStandardMaterial
          color="#2ecc71"
          metalness={0.12}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

// ─── Camera controller ────────────────────────────────────────────────────────────────
function CameraController({
  birdY,
  birdVel,
  cameraViewRef,
}: {
  birdY: React.MutableRefObject<number>;
  birdVel: React.MutableRefObject<number>;
  cameraViewRef: React.MutableRefObject<CameraView>;
}) {
  const { camera } = useThree();
  useFrame(() => {
    if (cameraViewRef.current === "tpv") {
      camera.position.set(-5, birdY.current + 1.5, 7);
      camera.lookAt(2, birdY.current, 0);
    } else {
      camera.position.set(0.3, birdY.current + 0.08, 0.1);
      camera.lookAt(8, birdY.current - birdVel.current * 0.05, 0);
    }
  });
  return null;
}

// ─── GameScene (inside Canvas) ───────────────────────────────────────────────────────────
interface GameSceneProps {
  resetKey: number;
  gameStateRef: React.MutableRefObject<GameState>;
  modeRef: React.MutableRefObject<GameMode>;
  cameraViewRef: React.MutableRefObject<CameraView>;
  flapRef: React.MutableRefObject<(() => void) | null>;
  onDeath: (score: number) => void;
  onScoreChange: (score: number) => void;
  audioRef: React.MutableRefObject<AudioContext | null>;
}

function GameScene({
  resetKey,
  gameStateRef,
  modeRef,
  cameraViewRef,
  flapRef,
  onDeath,
  onScoreChange,
  audioRef,
}: GameSceneProps) {
  const birdGroupRef = useRef<THREE.Group | null>(null);
  const birdY = useRef(0);
  const birdVel = useRef(0);
  const gameTime = useRef(0);
  const gameSpeed = useRef(4);
  const lastSpawn = useRef(-10);
  const scoreRef = useRef(0);
  const deadRef = useRef(false);
  const pipeIdCounter = useRef(0);
  const pipesPhysics = useRef<PipePhysicsData[]>([]);
  const pipeGroupMap = useRef<Map<number, THREE.Group>>(new Map());
  const [pipeRenderData, setPipeRenderData] = useState<PipeRenderData[]>([]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: resetKey is an intentional reset trigger
  useEffect(() => {
    birdY.current = 0;
    birdVel.current = 0;
    gameTime.current = 0;
    gameSpeed.current = 4;
    lastSpawn.current = -10;
    scoreRef.current = 0;
    deadRef.current = false;
    pipeIdCounter.current = 0;
    pipesPhysics.current = [];
    pipeGroupMap.current.clear();
    setPipeRenderData([]);
  }, [resetKey]);

  const flap = useCallback(() => {
    if (gameStateRef.current !== "playing") return;
    birdVel.current = 4.5;
    playFlap(getAudioCtx(audioRef));
  }, [gameStateRef, audioRef]);

  useEffect(() => {
    flapRef.current = flap;
  }, [flapRef, flap]);

  const handlePipeMount = useCallback((id: number, g: THREE.Group | null) => {
    if (g) {
      pipeGroupMap.current.set(id, g);
      const pd = pipesPhysics.current.find((p) => p.id === id);
      if (pd) g.position.x = pd.x;
    } else {
      pipeGroupMap.current.delete(id);
    }
  }, []);

  useFrame((_, delta) => {
    if (gameStateRef.current !== "playing" || deadRef.current) return;
    const dt = Math.min(delta, 0.05);
    const mode = modeRef.current;

    birdVel.current -= 9.8 * dt;
    birdY.current += birdVel.current * dt;
    gameTime.current += dt;
    gameSpeed.current = 4 + Math.floor(gameTime.current / 5) * 0.15;

    if (birdGroupRef.current) {
      birdGroupRef.current.position.y = birdY.current;
      birdGroupRef.current.rotation.z = Math.max(
        -0.9,
        Math.min(0.45, -birdVel.current * 0.09),
      );
    }

    if (mode === "dodge") {
      let renderChanged = false;
      for (const pipe of pipesPhysics.current) {
        pipe.x -= gameSpeed.current * dt;
        const g = pipeGroupMap.current.get(pipe.id);
        if (g) g.position.x = pipe.x;
        if (!pipe.scored && pipe.x < -0.6) {
          pipe.scored = true;
          scoreRef.current++;
          onScoreChange(scoreRef.current);
        }
        if (!deadRef.current && pipe.x > -1.3 && pipe.x < 1.3) {
          const GAP = 3.5;
          const inGap =
            birdY.current > pipe.gapY - GAP / 2 + 0.25 &&
            birdY.current < pipe.gapY + GAP / 2 - 0.25;
          if (!inGap) {
            deadRef.current = true;
            playHit(getAudioCtx(audioRef));
            onDeath(scoreRef.current);
            return;
          }
        }
      }
      const prevLen = pipesPhysics.current.length;
      pipesPhysics.current = pipesPhysics.current.filter((p) => p.x > -15);
      if (pipesPhysics.current.length !== prevLen) renderChanged = true;
      if (gameTime.current - lastSpawn.current > 2.5) {
        lastSpawn.current = gameTime.current;
        const id = ++pipeIdCounter.current;
        const gapY = (Math.random() - 0.5) * 5;
        pipesPhysics.current.push({ id, x: 15, gapY, scored: false });
        setPipeRenderData((prev) => [...prev, { id, gapY }]);
        renderChanged = false;
      }
      if (renderChanged) {
        const activeIds = new Set(pipesPhysics.current.map((p) => p.id));
        setPipeRenderData((prev) => prev.filter((p) => activeIds.has(p.id)));
      }
      if (!deadRef.current && (birdY.current < -9 || birdY.current > 15)) {
        deadRef.current = true;
        playHit(getAudioCtx(audioRef));
        onDeath(scoreRef.current);
      }
    } else {
      if (birdY.current < -20) {
        birdY.current = -20;
        birdVel.current = 0;
      }
      if (birdY.current > 25) {
        birdY.current = 25;
        birdVel.current = 0;
      }
    }
  });

  return (
    <>
      <Sky sunPosition={[100, 20, 100]} turbidity={8} rayleigh={2} />
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 20, 10]}
        castShadow
        intensity={2.0}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <hemisphereLight args={["#87CEEB", "#4a7c59", 0.35]} />
      <mesh
        position={[0, -10, -5]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 60]} />
        <meshStandardMaterial color="#4a7a40" roughness={0.95} metalness={0} />
      </mesh>
      {CLOUD_CONFIGS.map((c) => (
        <CloudMesh key={c.id} initPos={c.pos} scale={c.scale} />
      ))}
      <Bird groupRef={birdGroupRef} />
      {pipeRenderData.map((p) => (
        <PipePair
          key={p.id}
          id={p.id}
          gapY={p.gapY}
          onMount={handlePipeMount}
        />
      ))}
      <CameraController
        birdY={birdY}
        birdVel={birdVel}
        cameraViewRef={cameraViewRef}
      />
    </>
  );
}

// ─── HUD button style ───────────────────────────────────────────────────────────────────
function btnStyle(color: string): React.CSSProperties {
  return {
    background: `linear-gradient(135deg, ${color}22, ${color}44)`,
    border: `1px solid ${color}`,
    borderRadius: "8px",
    color: color,
    fontWeight: 700,
    fontSize: "13px",
    padding: "8px 16px",
    cursor: "pointer",
    textShadow: `0 0 8px ${color}`,
    boxShadow: `0 0 12px ${color}44`,
    transition: "all 0.2s",
    letterSpacing: "0.05em",
    fontFamily: "monospace",
  };
}

// ─── Main Component ─────────────────────────────────────────────────────────────────────
export default function FlappyBird3DGame({ onClose }: { onClose: () => void }) {
  const [gameState, setGameState] = useState<GameState>("start");
  const [score, setScore] = useState(0);
  const [mode, setMode] = useState<GameMode>("dodge");
  const [cameraView, setCameraView] = useState<CameraView>("tpv");
  const [musicOn, setMusicOn] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [highScore, setHighScore] = useState(() =>
    Number.parseInt(localStorage.getItem("flappy3d_highscore") || "0"),
  );

  const gameStateRef = useRef<GameState>("start");
  const modeRef = useRef<GameMode>("dodge");
  const cameraViewRef = useRef<CameraView>("tpv");
  const flapRef = useRef<(() => void) | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const stopMusicRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    cameraViewRef.current = cameraView;
  }, [cameraView]);

  useEffect(() => {
    if (musicOn) {
      const ctx = getAudioCtx(audioRef);
      if (ctx) startBgMusic(ctx, stopMusicRef);
    } else {
      if (stopMusicRef.current) stopMusicRef.current();
    }
  }, [musicOn]);

  useEffect(() => {
    return () => {
      if (stopMusicRef.current) stopMusicRef.current();
      audioRef.current?.close().catch(() => {});
    };
  }, []);

  const handleDeath = useCallback(
    (finalScore: number) => {
      setGameState("dead");
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem("flappy3d_highscore", String(finalScore));
      }
    },
    [highScore],
  );

  const handleStart = (selectedMode: GameMode) => {
    setMode(selectedMode);
    modeRef.current = selectedMode;
    setScore(0);
    setGameState("playing");
    setResetKey((k) => k + 1);
  };

  const handleRestart = () => {
    setScore(0);
    setGameState("playing");
    setResetKey((k) => k + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        // Only flap in dodge mode; sandbox handles its own space key
        if (
          gameStateRef.current === "playing" &&
          modeRef.current === "dodge" &&
          flapRef.current
        ) {
          flapRef.current();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    // Only flap in dodge mode; sandbox handles its own clicks
    if (
      gameStateRef.current === "playing" &&
      modeRef.current === "dodge" &&
      flapRef.current
    ) {
      flapRef.current();
    }
  };

  const NEON_BLUE = "#00cfff";
  const NEON_PURPLE = "#cc00ff";
  const NEON_GREEN = "#00ff88";
  const HUD_BG = "rgba(0,0,30,0.75)";

  // When in sandbox playing mode, render the GTA sandbox
  const showSandbox = mode === "sandbox" && gameState === "playing";

  return (
    <div
      role="presentation"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#0a1628",
        overflow: "hidden",
      }}
      onClick={handleCanvasClick}
      onKeyDown={() => {}}
    >
      {/* ── GTA Sandbox Mode ── */}
      {showSandbox ? (
        <Suspense
          fallback={
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#00cfff",
                fontFamily: "monospace",
                fontSize: 18,
                background: "#0a1628",
              }}
            >
              Loading Sandbox...
            </div>
          }
        >
          <SandboxMode
            onExit={() => {
              setGameState("start");
            }}
          />
        </Suspense>
      ) : (
        <>
          {/* ── 3D Canvas (Dodge + Bird) ── */}
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.1,
              antialias: true,
            }}
            camera={{ fov: 70, position: [0, 0, 8] }}
            style={{ position: "absolute", inset: 0 }}
          >
            <GameScene
              resetKey={resetKey}
              gameStateRef={gameStateRef}
              modeRef={modeRef}
              cameraViewRef={cameraViewRef}
              flapRef={flapRef}
              onDeath={handleDeath}
              onScoreChange={setScore}
              audioRef={audioRef}
            />
          </Canvas>

          {/* ── HUD Overlay ── */}
          <div
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            {gameState === "playing" && (
              <>
                <div
                  style={{
                    position: "absolute",
                    top: 16,
                    left: 16,
                    background: HUD_BG,
                    backdropFilter: "blur(8px)",
                    borderRadius: "12px",
                    padding: "8px 18px",
                    border: `1px solid ${NEON_BLUE}44`,
                    color: NEON_BLUE,
                    fontFamily: "monospace",
                    fontSize: "26px",
                    fontWeight: 700,
                    textShadow: `0 0 12px ${NEON_BLUE}`,
                    minWidth: "60px",
                    textAlign: "center",
                  }}
                >
                  {score}
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: 16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: HUD_BG,
                    backdropFilter: "blur(8px)",
                    borderRadius: "10px",
                    padding: "6px 14px",
                    border: `1px solid ${NEON_PURPLE}44`,
                    color: NEON_PURPLE,
                    fontFamily: "monospace",
                    fontSize: "12px",
                    fontWeight: 600,
                    textShadow: `0 0 8px ${NEON_PURPLE}`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {mode === "dodge" ? "🏆 DODGE" : "🌤 SANDBOX"} •{" "}
                  {cameraView.toUpperCase()}
                </div>
              </>
            )}

            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                display: "flex",
                gap: "8px",
                pointerEvents: "all",
              }}
            >
              <button
                type="button"
                onClick={() => setMusicOn((m) => !m)}
                data-ocid="game.toggle"
                style={btnStyle(musicOn ? NEON_GREEN : "#888")}
              >
                {musicOn ? "🎵" : "🔇"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setCameraView((v) => (v === "tpv" ? "fpv" : "tpv"))
                }
                data-ocid="game.toggle"
                style={btnStyle(NEON_BLUE)}
              >
                {cameraView.toUpperCase()}
              </button>
              <button
                type="button"
                onClick={onClose}
                data-ocid="game.close_button"
                style={btnStyle("#ff5555")}
              >
                ✕ EXIT
              </button>
            </div>

            {/* START SCREEN */}
            {gameState === "start" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,20,0.65)",
                  backdropFilter: "blur(4px)",
                  pointerEvents: "all",
                  gap: "24px",
                }}
              >
                <img
                  src="/assets/generated/flappy-bird-3d-logo-transparent.dim_400x200.png"
                  alt="Flappy Bird 3D"
                  style={{
                    maxWidth: "360px",
                    width: "88%",
                    filter: "drop-shadow(0 0 22px #00cfff)",
                  }}
                />
                <p
                  style={{
                    color: "rgba(200,240,255,0.85)",
                    fontSize: "16px",
                    fontFamily: "monospace",
                    letterSpacing: "0.08em",
                    margin: 0,
                  }}
                >
                  SPACE / CLICK / TAP to Flap
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleStart("dodge")}
                    data-ocid="game.primary_button"
                    style={{
                      ...btnStyle(NEON_BLUE),
                      fontSize: "16px",
                      padding: "12px 28px",
                    }}
                  >
                    🏆 DODGE MODE
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStart("sandbox")}
                    data-ocid="game.secondary_button"
                    style={{
                      ...btnStyle(NEON_GREEN),
                      fontSize: "16px",
                      padding: "12px 28px",
                    }}
                  >
                    🌆 GTA SANDBOX
                  </button>
                </div>
                {highScore > 0 && (
                  <div
                    style={{
                      color: "#FFD700",
                      fontFamily: "monospace",
                      fontSize: "14px",
                      letterSpacing: "0.1em",
                      textShadow: "0 0 10px #FFD700",
                    }}
                  >
                    🏅 BEST: {highScore}
                  </div>
                )}
              </div>
            )}

            {/* GAME OVER SCREEN */}
            {gameState === "dead" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,20,0.72)",
                  backdropFilter: "blur(6px)",
                  pointerEvents: "all",
                  gap: "22px",
                }}
              >
                <h2
                  style={{
                    color: "#ff4444",
                    fontFamily: "monospace",
                    fontSize: "clamp(28px, 6vw, 52px)",
                    fontWeight: 900,
                    textShadow: "0 0 20px #ff4444, 0 0 40px #ff4444",
                    letterSpacing: "0.1em",
                    margin: 0,
                  }}
                >
                  GAME OVER
                </h2>
                <div style={{ display: "flex", gap: "36px" }}>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        color: "#aaa",
                        fontFamily: "monospace",
                        fontSize: "11px",
                        letterSpacing: "0.12em",
                      }}
                    >
                      SCORE
                    </div>
                    <div
                      style={{
                        color: NEON_BLUE,
                        fontFamily: "monospace",
                        fontSize: "40px",
                        fontWeight: 700,
                        textShadow: `0 0 15px ${NEON_BLUE}`,
                      }}
                    >
                      {score}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        color: "#aaa",
                        fontFamily: "monospace",
                        fontSize: "11px",
                        letterSpacing: "0.12em",
                      }}
                    >
                      BEST
                    </div>
                    <div
                      style={{
                        color: "#FFD700",
                        fontFamily: "monospace",
                        fontSize: "40px",
                        fontWeight: 700,
                        textShadow: "0 0 15px #FFD700",
                      }}
                    >
                      {highScore}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleRestart}
                    data-ocid="game.primary_button"
                    style={{
                      ...btnStyle(NEON_GREEN),
                      fontSize: "16px",
                      padding: "12px 28px",
                    }}
                  >
                    ↺ RESTART
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScore(0);
                      setGameState("start");
                    }}
                    data-ocid="game.secondary_button"
                    style={{
                      ...btnStyle(NEON_PURPLE),
                      fontSize: "16px",
                      padding: "12px 28px",
                    }}
                  >
                    🏠 MENU
                  </button>
                </div>
              </div>
            )}

            {/* Dodge mode flap hint */}
            {gameState === "playing" && score === 0 && mode === "dodge" && (
              <div
                style={{
                  position: "absolute",
                  bottom: 20,
                  left: "50%",
                  transform: "translateX(-50%)",
                  color: "rgba(255,255,255,0.5)",
                  fontFamily: "monospace",
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                }}
              >
                SPACE / Click / Tap to flap
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
