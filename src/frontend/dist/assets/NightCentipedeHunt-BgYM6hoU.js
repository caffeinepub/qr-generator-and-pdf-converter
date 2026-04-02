import { r as reactExports, j as jsxRuntimeExports } from "./index-sF3w0N2q.js";
import { V as Vector3, C as Canvas, b as useThree, F as FogExp2, c as Color, u as useFrame } from "./react-three-fiber.esm-ayI3axKt.js";
const MAP_COLORS = {
  forest: {
    ground: "#2d5016",
    skyDay: "#87ceeb",
    skyNight: "#050a02",
    fogDay: "#c8e8c8",
    fogNight: "#0a1505"
  },
  village: {
    ground: "#5a4a2a",
    skyDay: "#a0c8e0",
    skyNight: "#080605",
    fogDay: "#d8d0b8",
    fogNight: "#0f0a05"
  },
  graveyard: {
    ground: "#3a3a3f",
    skyDay: "#9090b0",
    skyNight: "#050508",
    fogDay: "#c0c0cc",
    fogNight: "#08080f"
  },
  city: {
    ground: "#444444",
    skyDay: "#b0c0d8",
    skyNight: "#060606",
    fogDay: "#d0d8e0",
    fogNight: "#0a0a0a"
  },
  swamp: {
    ground: "#2a4020",
    skyDay: "#8aad7a",
    skyNight: "#030805",
    fogDay: "#b8d0a8",
    fogNight: "#051008"
  }
};
function getAC(ref) {
  try {
    if (!ref.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ref.current = new AC();
    }
    if (ref.current.state === "suspended") ref.current.resume().catch(() => {
    });
    return ref.current;
  } catch {
    return null;
  }
}
function playJumpscare(ctx) {
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
  } catch {
  }
}
function playCreak(ctx) {
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
  } catch {
  }
}
function playHeartbeat(ctx) {
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
  } catch {
  }
}
let ambientStop = null;
function startAmbient(ctx) {
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
      } catch {
      }
    };
  } catch {
  }
}
function stopAmbient() {
  if (ambientStop) {
    ambientStop();
    ambientStop = null;
  }
}
function buildHousePositions() {
  const positions = [];
  const angles = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];
  for (let i = 0; i < 10; i++) {
    const angle = angles[i] * Math.PI / 180;
    const r = 30 + i % 3 * 12;
    positions.push(
      new Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r)
    );
  }
  return positions;
}
const HOUSE_POSITIONS = buildHousePositions();
function Ground({ map }) {
  const color = MAP_COLORS[map].ground;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { rotation: [-Math.PI / 2, 0, 0], receiveShadow: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [300, 300] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("meshLambertMaterial", { color })
  ] });
}
const TREE_DATA = (() => {
  const arr = [];
  let s = 42;
  const rng = () => {
    s = s * 1664525 + 1013904223 & 4294967295;
    return (s >>> 0) / 4294967295;
  };
  for (let i = 0; i < 60; i++) {
    let x;
    let z;
    do {
      x = (rng() - 0.5) * 240;
      z = (rng() - 0.5) * 240;
    } while (x * x + z * z < 64);
    arr.push({ x, z, h: 2 + rng() * 3, id: `tree-${i}` });
  }
  return arr;
})();
function Trees() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("group", { children: TREE_DATA.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [t.x, 0, t.z], children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, t.h / 2, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.2, 0.35, t.h, 6] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshLambertMaterial", { color: "#3d2b1f" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, t.h + t.h * 0.35, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [t.h * 0.4, t.h * 0.7, 7] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshLambertMaterial", { color: "#1a5c1a" })
    ] })
  ] }, t.id)) });
}
const NPC_DATA = [
  { id: "npc-a", x: 25, z: 10 },
  { id: "npc-b", x: -30, z: 20 },
  { id: "npc-c", x: 15, z: -35 },
  { id: "npc-d", x: -20, z: -15 }
];
function Houses({ canHide, dayMode }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("group", { children: HOUSE_POSITIONS.map((pos) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "group",
    {
      position: [pos.x, 0, pos.z],
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 1.5, 0], castShadow: true, receiveShadow: true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [4, 3, 4] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "meshLambertMaterial",
            {
              color: dayMode === "day" ? "#8b6a4a" : "#2a1e14"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 3.5, 0], castShadow: true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [3.2, 2, 4] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "meshLambertMaterial",
            {
              color: dayMode === "day" ? "#5a3030" : "#1a1010"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.75, 2.01], castShadow: true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1, 1.5, 0.05] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshLambertMaterial", { color: canHide ? "#8b5a28" : "#1a0e00" })
        ] }),
        dayMode === "night" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "pointLight",
          {
            position: [0, 2, 0],
            color: "#ff6600",
            intensity: 0.5,
            distance: 8
          }
        )
      ]
    },
    `house-${Math.round(pos.x)}-${Math.round(pos.z)}`
  )) });
}
function NPC({
  startX,
  startZ,
  fleeing
}) {
  const groupRef = reactExports.useRef(null);
  const state = reactExports.useRef({
    x: startX,
    z: startZ,
    angle: Math.random() * Math.PI * 2,
    timer: 0
  });
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const s = state.current;
    s.timer += delta;
    if (s.timer > (fleeing ? 0.5 : 2)) {
      s.timer = 0;
      if (!fleeing) s.angle += (Math.random() - 0.5) * Math.PI * 0.8;
    }
    const speed = fleeing ? 6 : 1.5;
    s.x += Math.cos(s.angle) * speed * delta;
    s.z += Math.sin(s.angle) * speed * delta;
    s.x = Math.max(-120, Math.min(120, s.x));
    s.z = Math.max(-120, Math.min(120, s.z));
    groupRef.current.position.set(s.x, 0, s.z);
    groupRef.current.rotation.y = -s.angle + Math.PI / 2;
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref: groupRef, position: [startX, 0, startZ], children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.9, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.2, 0.25, 1, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshLambertMaterial", { color: fleeing ? "#cc2200" : "#885533" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 1.6, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.22, 8, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshLambertMaterial", { color: "#cc9966" })
    ] })
  ] });
}
function Centipede({
  playerPosRef,
  speed,
  onCatch,
  isHiddenRef,
  startOffset,
  segKey,
  onDistanceUpdate
}) {
  const SEGMENTS = 16;
  const headRef = reactExports.useRef(null);
  const bodyRefs = reactExports.useRef([]);
  const positions = reactExports.useRef(
    Array.from({ length: SEGMENTS }, (_, i) => {
      const angle = startOffset;
      return new Vector3(
        Math.cos(angle) * (85 + i * 1.2),
        0.5,
        Math.sin(angle) * (85 + i * 1.2)
      );
    })
  );
  const velocity = reactExports.useRef(new Vector3());
  const catchCalled = reactExports.useRef(false);
  useFrame((_, delta) => {
    const head = positions.current[0];
    const player = playerPosRef.current;
    const dist = head.distanceTo(new Vector3(player.x, 0.5, player.z));
    if (onDistanceUpdate) onDistanceUpdate(dist);
    const dir = new Vector3(player.x - head.x, 0, player.z - head.z);
    if (dir.length() > 0.1) dir.normalize();
    const effectiveSpeed = speed * (dist < 20 ? 1.4 : 1);
    velocity.current.lerp(dir.multiplyScalar(effectiveSpeed), 3 * delta);
    head.x += velocity.current.x * delta;
    head.z += velocity.current.z * delta;
    head.y = 0.5;
    for (let i = 1; i < SEGMENTS; i++) {
      const prev = positions.current[i - 1];
      const cur = positions.current[i];
      const segDir = new Vector3().subVectors(cur, prev);
      if (segDir.length() > 1.2) {
        segDir.normalize().multiplyScalar(1.2);
        positions.current[i].copy(prev).add(segDir);
      }
    }
    if (headRef.current) headRef.current.position.copy(positions.current[0]);
    for (let i = 0; i < bodyRefs.current.length; i++) {
      const m = bodyRefs.current[i];
      if (m) m.position.copy(positions.current[i + 1]);
    }
    if (!catchCalled.current && !isHiddenRef.current && dist < 1.8) {
      catchCalled.current = true;
      onCatch();
    }
  });
  const segmentKeys = Array.from(
    { length: SEGMENTS - 1 },
    (_, i) => `${segKey}-seg-${i}`
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { ref: headRef, position: positions.current[0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.55, 10, 10] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshLambertMaterial", { color: "#1a3300" })
    ] }),
    segmentKeys.map((k, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "mesh",
      {
        ref: (el) => {
          bodyRefs.current[i] = el;
        },
        position: positions.current[i + 1],
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.38 - i * 0.01, 8, 8] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshLambertMaterial", { color: i % 2 === 0 ? "#1a4400" : "#0d2200" })
        ]
      },
      k
    )),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref: headRef, position: positions.current[0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.22, 0.18, 0.45], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.1, 6, 6] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "meshStandardMaterial",
          {
            color: "#00ff00",
            emissive: "#00ff00",
            emissiveIntensity: 2
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-0.22, 0.18, 0.45], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.1, 6, 6] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "meshStandardMaterial",
          {
            color: "#00ff00",
            emissive: "#00ff00",
            emissiveIntensity: 2
          }
        )
      ] })
    ] })
  ] });
}
function PlayerTorch({
  playerPosRef,
  yawRef,
  pitchRef,
  enabled
}) {
  const lightRef = reactExports.useRef(null);
  const targetRef = reactExports.useRef(null);
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("object3D", { ref: targetRef }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "spotLight",
      {
        ref: lightRef,
        color: "#fffae0",
        intensity: 3,
        distance: 25,
        angle: Math.PI / 5,
        penumbra: 0.4,
        castShadow: true,
        "shadow-mapSize": [512, 512]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "pointLight",
      {
        position: [0, 1.7, 0],
        color: "#ffeecc",
        intensity: 0.3,
        distance: 4
      }
    )
  ] });
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
  jumpRef
}) {
  const { camera } = useThree();
  const velYRef = reactExports.useRef(0);
  const onGroundRef = reactExports.useRef(true);
  useFrame((_, delta) => {
    const keys = keysRef.current;
    const running = keys.has("ShiftLeft") || keys.has("ShiftRight");
    const speed = running ? 8 : 4;
    const isMoving = keys.has("KeyW") || keys.has("KeyS") || keys.has("KeyA") || keys.has("KeyD") || Math.abs(joystickRef.current.x) > 0.1 || Math.abs(joystickRef.current.y) > 0.1;
    if (running && isMoving) {
      staminaRef.current = Math.max(0, staminaRef.current - delta * 20);
    } else {
      staminaRef.current = Math.min(100, staminaRef.current + delta * 10);
    }
    onStaminaChange(staminaRef.current);
    const { dx, dy } = mouseRef.current;
    yawRef.current -= dx * 2e-3;
    pitchRef.current = Math.max(
      -0.6,
      Math.min(0.6, pitchRef.current - dy * 2e-3)
    );
    mouseRef.current.dx = 0;
    mouseRef.current.dy = 0;
    const forward = new Vector3(
      -Math.sin(yawRef.current),
      0,
      -Math.cos(yawRef.current)
    );
    const right = new Vector3(
      Math.cos(yawRef.current),
      0,
      -Math.sin(yawRef.current)
    );
    const move = new Vector3();
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
      Math.min(140, pos.x + move.x * effectiveSpeed * delta)
    );
    pos.z = Math.max(
      -140,
      Math.min(140, pos.z + move.z * effectiveSpeed * delta)
    );
    const GRAVITY = -18;
    const JUMP_VEL = 7;
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
      if (pos.distanceTo(hp) < 5) {
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
      const tpDist = 5;
      const behind = new Vector3(
        Math.sin(yawRef.current) * tpDist,
        2.5,
        Math.cos(yawRef.current) * tpDist
      );
      camera.position.set(pos.x + behind.x, pos.y + behind.y, pos.z + behind.z);
      camera.lookAt(pos.x, pos.y + 1.2, pos.z);
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "group",
    {
      position: [
        playerPosRef.current.x,
        playerPosRef.current.y,
        playerPosRef.current.z
      ],
      children: cameraMode === "third" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.9, 0], castShadow: true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.2, 0.25, 1.1, 8] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshLambertMaterial", { color: "#3366aa" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 1.7, 0], castShadow: true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.22, 8, 8] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshLambertMaterial", { color: "#ffcc99" })
        ] })
      ] })
    }
  );
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
  playerPosRef
}) {
  const timeRef = reactExports.useRef(0);
  const jumpscareTimerRef = reactExports.useRef(60 + Math.random() * 120);
  const heartbeatTimerRef = reactExports.useRef(0);
  const gameOverCalledRef = reactExports.useRef(false);
  const centipedeSpeed = mode === "nightmare" ? 7 : mode === "challenge" ? 6 : 4.5;
  const canHide = mode !== "challenge";
  const isDay = dayMode === "day";
  const fogDensity = isDay ? 6e-3 : mode === "challenge" ? 0.035 : 0.018;
  const skyColor = isDay ? MAP_COLORS[map].skyDay : MAP_COLORS[map].skyNight;
  const fogColor = isDay ? MAP_COLORS[map].fogDay : MAP_COLORS[map].fogNight;
  const { scene } = useThree();
  reactExports.useEffect(() => {
    scene.fog = new FogExp2(fogColor, fogDensity);
    scene.background = new Color(skyColor);
    return () => {
      scene.fog = null;
    };
  }, [scene, skyColor, fogColor, fogDensity]);
  useFrame((_, delta) => {
    if (gameOverCalledRef.current) return;
    timeRef.current += delta;
    onTimeChange(Math.floor(timeRef.current));
    jumpscareTimerRef.current -= delta;
    if (jumpscareTimerRef.current <= 0) {
      jumpscareTimerRef.current = 60 + Math.random() * 120;
      onJumpscare();
      playJumpscare(getAC(audioRef));
    }
    heartbeatTimerRef.current -= delta;
  });
  const handleCatch = reactExports.useCallback(() => {
    if (!gameOverCalledRef.current) {
      gameOverCalledRef.current = true;
      onGameOver(Math.floor(timeRef.current));
    }
  }, [onGameOver]);
  const handleDistanceUpdate = reactExports.useCallback(
    (dist) => {
      if (dist < 20 && heartbeatTimerRef.current <= 0) {
        heartbeatTimerRef.current = 1.2 - Math.max(0, (20 - dist) / 20) * 0.8;
        playHeartbeat(getAC(audioRef));
      }
    },
    [audioRef]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "ambientLight",
      {
        intensity: isDay ? 1.2 : 0.15,
        color: isDay ? "#ffffff" : "#334466"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "directionalLight",
      {
        position: [50, 80, 30],
        intensity: isDay ? 2.5 : 0.3,
        color: isDay ? "#fffbe0" : "#aabbff",
        castShadow: true,
        "shadow-mapSize": [1024, 1024],
        "shadow-camera-far": 200
      }
    ),
    !isDay && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "directionalLight",
      {
        position: [-40, 60, -20],
        intensity: 0.2,
        color: "#8899cc"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PlayerTorch,
      {
        playerPosRef,
        yawRef,
        pitchRef,
        enabled: torchEnabled && !isDay
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Ground, { map }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Trees, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Houses, { canHide, dayMode }),
    NPC_DATA.map((npc) => /* @__PURE__ */ jsxRuntimeExports.jsx(NPC, { startX: npc.x, startZ: npc.z, fleeing: false }, npc.id)),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Centipede,
      {
        playerPosRef,
        speed: centipedeSpeed,
        onCatch: handleCatch,
        isHiddenRef,
        startOffset: 0,
        segKey: "c1",
        onDistanceUpdate: handleDistanceUpdate
      }
    ),
    mode === "nightmare" && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Centipede,
      {
        playerPosRef,
        speed: centipedeSpeed,
        onCatch: handleCatch,
        isHiddenRef,
        startOffset: Math.PI,
        segKey: "c2"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PlayerController,
      {
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
        jumpRef
      }
    )
  ] });
}
function MovementButtons({
  keysRef,
  joystickRef,
  jumpRef,
  onJump
}) {
  const joystickAreaRef = reactExports.useRef(null);
  const joystickKnobRef = reactExports.useRef(null);
  const touchIdRef = reactExports.useRef(null);
  const baseCenter = reactExports.useRef({ x: 0, y: 0 });
  const MAX_DIST = 38;
  const updateJoystick = reactExports.useCallback(
    (clientX, clientY) => {
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
    [joystickRef]
  );
  const resetJoystick = reactExports.useCallback(() => {
    joystickRef.current.x = 0;
    joystickRef.current.y = 0;
    touchIdRef.current = null;
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = "translate(-50%, -50%)";
    }
  }, [joystickRef]);
  reactExports.useEffect(() => {
    const el = joystickAreaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    baseCenter.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    const onTouchStart = (e) => {
      if (touchIdRef.current !== null) return;
      const t = e.changedTouches[0];
      touchIdRef.current = t.identifier;
      const r = el.getBoundingClientRect();
      baseCenter.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      updateJoystick(t.clientX, t.clientY);
    };
    const onTouchMove = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          updateJoystick(
            e.changedTouches[i].clientX,
            e.changedTouches[i].clientY
          );
        }
      }
    };
    const onTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          resetJoystick();
        }
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
  const btnStyle = (color) => ({
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
    touchAction: "none"
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      style: {
        position: "fixed",
        bottom: 16,
        left: 0,
        right: 0,
        zIndex: 10010,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        padding: "0 24px",
        pointerEvents: "none"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            ref: joystickAreaRef,
            style: {
              width: 110,
              height: 110,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.35)",
              border: "2px solid rgba(255,255,255,0.25)",
              position: "relative",
              pointerEvents: "all",
              touchAction: "none",
              flexShrink: 0
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                ref: joystickKnobRef,
                style: {
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.6)",
                  border: "2px solid rgba(255,255,255,0.9)",
                  pointerEvents: "none"
                }
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: 10,
              pointerEvents: "all",
              alignItems: "center"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onPointerDown: (e) => {
                    e.preventDefault();
                    jumpRef.current = true;
                    onJump();
                  },
                  style: btnStyle("255, 200, 50"),
                  children: "↑"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onPointerDown: (e) => {
                    e.preventDefault();
                    keysRef.current.add("ShiftLeft");
                  },
                  onPointerUp: () => keysRef.current.delete("ShiftLeft"),
                  onPointerLeave: () => keysRef.current.delete("ShiftLeft"),
                  style: btnStyle("100, 200, 100"),
                  children: "🏃"
                }
              )
            ]
          }
        )
      ]
    }
  );
}
function MenuScreen({ onStart, onClose }) {
  const [mode, setMode] = reactExports.useState("endless");
  const [map, setMap] = reactExports.useState("forest");
  const [cam, setCam] = reactExports.useState("third");
  const [day, setDay] = reactExports.useState("night");
  const modes = [
    {
      v: "endless",
      label: "Endless",
      desc: "Infinite survival, hide in houses"
    },
    {
      v: "challenge",
      label: "Challenge",
      desc: "Fog night, fast hunt, one life"
    },
    { v: "nightmare", label: "Nightmare", desc: "2 centipedes, 2× speed" }
  ];
  const maps = [
    { v: "forest", label: "Dark Forest" },
    { v: "village", label: "Abandoned Village" },
    { v: "graveyard", label: "Graveyard" },
    { v: "city", label: "Deserted City" },
    { v: "swamp", label: "Swamp" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "linear-gradient(135deg, #000000 0%, #0a0510 50%, #050210 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        color: "#fff",
        padding: "20px",
        overflowY: "auto"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: onClose,
            style: {
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
              justifyContent: "center"
            },
            "data-ocid": "game.close_button",
            children: "✕"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", marginBottom: 28 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              style: {
                fontSize: 36,
                fontWeight: 900,
                letterSpacing: 2,
                textShadow: "0 0 30px #ff0000, 0 0 60px #880000",
                color: "#ff3333"
              },
              children: "🦟 NIGHT CENTIPEDE HUNT"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              style: { fontSize: 14, color: "#ff9999", marginTop: 8, opacity: 0.8 },
              children: "Survive the darkness. Hide. Run. Don't look back."
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              maxWidth: 680,
              width: "100%"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  style: {
                    background: "rgba(255,0,0,0.05)",
                    border: "1px solid rgba(255,0,0,0.2)",
                    borderRadius: 12,
                    padding: 14
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        style: {
                          fontSize: 12,
                          color: "#ff9999",
                          marginBottom: 8,
                          fontWeight: 700,
                          letterSpacing: 1
                        },
                        children: "GAME MODE"
                      }
                    ),
                    modes.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => setMode(m.v),
                        "data-ocid": `game.${m.v}.tab`,
                        style: {
                          display: "block",
                          width: "100%",
                          marginBottom: 6,
                          padding: "9px 12px",
                          background: mode === m.v ? "rgba(255,0,0,0.25)" : "rgba(255,255,255,0.04)",
                          border: mode === m.v ? "1px solid rgba(255,80,80,0.8)" : "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 8,
                          color: mode === m.v ? "#ff9999" : "#aaa",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s"
                        },
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontWeight: 700, fontSize: 13 }, children: m.label }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 10, opacity: 0.7, marginTop: 2 }, children: m.desc })
                        ]
                      },
                      m.v
                    ))
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  style: {
                    background: "rgba(255,0,0,0.05)",
                    border: "1px solid rgba(255,0,0,0.2)",
                    borderRadius: 12,
                    padding: 14
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        style: {
                          fontSize: 12,
                          color: "#ff9999",
                          marginBottom: 8,
                          fontWeight: 700,
                          letterSpacing: 1
                        },
                        children: "MAP"
                      }
                    ),
                    maps.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setMap(m.v),
                        "data-ocid": `game.${m.v}.tab`,
                        style: {
                          display: "block",
                          width: "100%",
                          marginBottom: 6,
                          padding: "9px 12px",
                          background: map === m.v ? "rgba(255,0,0,0.25)" : "rgba(255,255,255,0.04)",
                          border: map === m.v ? "1px solid rgba(255,80,80,0.8)" : "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 8,
                          color: map === m.v ? "#ff9999" : "#aaa",
                          cursor: "pointer",
                          textAlign: "left"
                        },
                        children: m.label
                      },
                      m.v
                    ))
                  ]
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              marginTop: 18,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "center"
            },
            children: [
              ["third", "first"].map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setCam(c),
                  "data-ocid": `game.${c}_camera.toggle`,
                  style: {
                    padding: "9px 20px",
                    background: cam === c ? "rgba(255,0,0,0.3)" : "rgba(255,255,255,0.06)",
                    border: cam === c ? "1px solid #ff5555" : "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 8,
                    color: cam === c ? "#fff" : "#888",
                    cursor: "pointer",
                    fontSize: 13
                  },
                  children: c === "third" ? "🎥 Third Person" : "👁 First Person"
                },
                c
              )),
              ["day", "night"].map((d) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setDay(d),
                  "data-ocid": `game.${d}_mode.toggle`,
                  style: {
                    padding: "9px 20px",
                    background: day === d ? "rgba(255,180,0,0.3)" : "rgba(255,255,255,0.06)",
                    border: day === d ? "1px solid #ffcc44" : "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 8,
                    color: day === d ? "#ffee88" : "#888",
                    cursor: "pointer",
                    fontSize: 13
                  },
                  children: d === "day" ? "☀️ Day" : "🌙 Night"
                },
                d
              ))
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => onStart(mode, map, cam, day),
            "data-ocid": "game.start.primary_button",
            style: {
              marginTop: 24,
              padding: "14px 56px",
              background: "linear-gradient(135deg, #cc0000, #880000)",
              border: "1px solid #ff4444",
              borderRadius: 10,
              color: "#fff",
              fontSize: 18,
              fontWeight: 800,
              cursor: "pointer",
              letterSpacing: 2,
              boxShadow: "0 0 30px rgba(255,0,0,0.4)"
            },
            children: "▶ START GAME"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              marginTop: 14,
              fontSize: 11,
              color: "#555",
              textAlign: "center"
            },
            children: "WASD = Move  |  Mouse = Look  |  Space / ↑ = Jump  |  Shift / 🏃 = Run  |  E = Hide  |  V = Camera  |  T = Torch"
          }
        )
      ]
    }
  );
}
function HUD({
  stamina,
  time,
  cameraMode,
  dayMode,
  torchEnabled,
  nearHouse,
  isHidden,
  jumpscareActive,
  onToggleCamera,
  onToggleDay,
  onToggleTorch,
  onPause,
  onClose
}) {
  const mins = Math.floor(time / 60).toString().padStart(2, "0");
  const secs = (time % 60).toString().padStart(2, "0");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    jumpscareActive && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        style: {
          position: "fixed",
          inset: 0,
          zIndex: 10002,
          background: "rgba(255,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none"
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              fontSize: 80,
              color: "#fff",
              fontWeight: 900,
              textShadow: "0 0 40px #ff0000"
            },
            children: "⚠"
          }
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        style: {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10001,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)",
          pointerEvents: "none"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { pointerEvents: "none" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                style: {
                  fontSize: 10,
                  color: "#ff9999",
                  marginBottom: 3,
                  letterSpacing: 1
                },
                children: "STAMINA"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                style: {
                  width: 110,
                  height: 7,
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: 4
                },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    style: {
                      height: "100%",
                      borderRadius: 4,
                      width: `${stamina}%`,
                      background: stamina > 50 ? "#44ff88" : stamina > 25 ? "#ffaa00" : "#ff3333",
                      transition: "width 0.1s"
                    }
                  }
                )
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              style: {
                fontSize: 22,
                fontWeight: 900,
                color: "#fff",
                textShadow: "0 0 10px rgba(255,100,100,0.5)",
                pointerEvents: "none"
              },
              children: [
                "⏱ ",
                mins,
                ":",
                secs
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              style: {
                display: "flex",
                gap: 6,
                pointerEvents: "all",
                flexWrap: "wrap",
                justifyContent: "flex-end"
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: onToggleCamera,
                    "data-ocid": "game.camera.toggle",
                    style: {
                      padding: "5px 9px",
                      background: "rgba(0,0,0,0.65)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      borderRadius: 6,
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 11
                    },
                    children: cameraMode === "third" ? "👁 FPV" : "🎥 TPV"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: onToggleDay,
                    "data-ocid": "game.day.toggle",
                    style: {
                      padding: "5px 9px",
                      background: "rgba(0,0,0,0.65)",
                      border: "1px solid rgba(255,220,0,0.4)",
                      borderRadius: 6,
                      color: "#ffee88",
                      cursor: "pointer",
                      fontSize: 11
                    },
                    children: dayMode === "day" ? "🌙 Night" : "☀️ Day"
                  }
                ),
                dayMode === "night" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: onToggleTorch,
                    "data-ocid": "game.torch.toggle",
                    style: {
                      padding: "5px 9px",
                      background: torchEnabled ? "rgba(255,180,0,0.3)" : "rgba(0,0,0,0.65)",
                      border: torchEnabled ? "1px solid #ffcc44" : "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 6,
                      color: torchEnabled ? "#ffee88" : "#888",
                      cursor: "pointer",
                      fontSize: 11
                    },
                    children: "🔦 Torch"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: onPause,
                    "data-ocid": "game.pause.button",
                    style: {
                      padding: "5px 9px",
                      background: "rgba(0,0,0,0.65)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      borderRadius: 6,
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 11
                    },
                    children: "⏸ Menu"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: onClose,
                    "data-ocid": "game.close_button",
                    style: {
                      padding: "5px 9px",
                      background: "rgba(180,0,0,0.5)",
                      border: "1px solid rgba(255,80,80,0.5)",
                      borderRadius: 6,
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 11
                    },
                    children: "✕ Exit"
                  }
                )
              ]
            }
          )
        ]
      }
    ),
    nearHouse && !isHidden && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        style: {
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
          pointerEvents: "none"
        },
        children: "Press E to hide"
      }
    ),
    isHidden && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        style: {
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
          pointerEvents: "none"
        },
        children: "🏠 HIDDEN — Press E to exit"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        style: {
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 16,
          height: 16,
          pointerEvents: "none",
          zIndex: 10001
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              style: {
                position: "absolute",
                top: 7,
                left: 0,
                width: 16,
                height: 2,
                background: "rgba(255,255,255,0.7)"
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              style: {
                position: "absolute",
                top: 0,
                left: 7,
                width: 2,
                height: 16,
                background: "rgba(255,255,255,0.7)"
              }
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        style: {
          position: "fixed",
          bottom: 130,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 10,
          color: "rgba(255,255,255,0.3)",
          pointerEvents: "none",
          zIndex: 10001,
          whiteSpace: "nowrap"
        },
        children: "Click to lock mouse | WASD/joystick move | Space/↑ jump | Shift/🏃 run | E hide | V cam | T torch | Esc menu"
      }
    )
  ] });
}
function GameOverScreen({
  time,
  onRestart,
  onMenu,
  onClose
}) {
  const mins = Math.floor(time / 60).toString().padStart(2, "0");
  const secs = (time % 60).toString().padStart(2, "0");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 1e4,
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        color: "#fff"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: onClose,
            style: {
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
              justifyContent: "center"
            },
            "data-ocid": "gameover.close_button",
            children: "✕"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 60, marginBottom: 10 }, children: "💀" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              fontSize: 34,
              fontWeight: 900,
              color: "#ff3333",
              textShadow: "0 0 20px #ff0000",
              marginBottom: 8
            },
            children: "CAUGHT!"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { fontSize: 16, color: "#aaa", marginBottom: 28 }, children: [
          "You survived for",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { color: "#fff", fontWeight: 700 }, children: [
            mins,
            ":",
            secs
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 14 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: onRestart,
              "data-ocid": "gameover.restart.primary_button",
              style: {
                padding: "11px 28px",
                background: "linear-gradient(135deg, #cc0000, #880000)",
                border: "1px solid #ff4444",
                borderRadius: 8,
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer"
              },
              children: "▶ Play Again"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: onMenu,
              "data-ocid": "gameover.menu.secondary_button",
              style: {
                padding: "11px 28px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
                color: "#ccc",
                fontSize: 15,
                cursor: "pointer"
              },
              children: "☰ Main Menu"
            }
          )
        ] })
      ]
    }
  );
}
function NightCentipedeHunt({ onClose }) {
  const [gameState, setGameState] = reactExports.useState("menu");
  const [gameMode, setGameMode] = reactExports.useState("endless");
  const [gameMap, setGameMap] = reactExports.useState("forest");
  const [cameraMode, setCameraMode] = reactExports.useState("third");
  const [dayMode, setDayMode] = reactExports.useState("night");
  const [torchEnabled, setTorchEnabled] = reactExports.useState(true);
  const [stamina, setStamina] = reactExports.useState(100);
  const [time, setTime] = reactExports.useState(0);
  const [nearHouse, setNearHouse] = reactExports.useState(false);
  const [isHidden, setIsHidden] = reactExports.useState(false);
  const [jumpscareActive, setJumpscareActive] = reactExports.useState(false);
  const [finalTime, setFinalTime] = reactExports.useState(0);
  const [sceneKey, setSceneKey] = reactExports.useState(0);
  const isHiddenRef = reactExports.useRef(false);
  const keysRef = reactExports.useRef(/* @__PURE__ */ new Set());
  const mouseRef = reactExports.useRef({ dx: 0, dy: 0 });
  const yawRef = reactExports.useRef(0);
  const pitchRef = reactExports.useRef(0);
  const staminaRef = reactExports.useRef(100);
  const audioRef = reactExports.useRef(null);
  const nearHouseRef = reactExports.useRef(false);
  const canvasRef = reactExports.useRef(null);
  const joystickRef = reactExports.useRef({ x: 0, y: 0 });
  const jumpRef = reactExports.useRef(false);
  const playerPosRef = reactExports.useRef(new Vector3(0, 0, 0));
  reactExports.useEffect(() => {
    const down = (e) => {
      keysRef.current.add(e.code);
      if (e.code === "KeyV" && gameState === "playing") {
        setCameraMode((c) => c === "third" ? "first" : "third");
      }
      if (e.code === "KeyT" && gameState === "playing") {
        setTorchEnabled((v) => !v);
      }
      if (e.code === "KeyE" && gameState === "playing" && nearHouseRef.current) {
        const next = !isHiddenRef.current;
        isHiddenRef.current = next;
        setIsHidden(next);
        playCreak(getAC(audioRef));
      }
      if (e.code === "Escape" && gameState === "playing") {
        document.exitPointerLock();
        setGameState("menu");
        stopAmbient();
      }
    };
    const up = (e) => {
      keysRef.current.delete(e.code);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [gameState]);
  reactExports.useEffect(() => {
    const move = (e) => {
      if (document.pointerLockElement) {
        mouseRef.current.dx += e.movementX;
        mouseRef.current.dy += e.movementY;
      }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  const requestPointerLock = reactExports.useCallback(() => {
    if (canvasRef.current) canvasRef.current.requestPointerLock();
  }, []);
  const handleStart = reactExports.useCallback(
    (mode, map, cam, day) => {
      setGameMode(mode);
      setGameMap(map);
      setCameraMode(cam);
      setDayMode(day);
      setStamina(100);
      setTime(0);
      setIsHidden(false);
      setNearHouse(false);
      isHiddenRef.current = false;
      nearHouseRef.current = false;
      staminaRef.current = 100;
      yawRef.current = 0;
      pitchRef.current = 0;
      keysRef.current.clear();
      joystickRef.current = { x: 0, y: 0 };
      playerPosRef.current.set(0, 0, 0);
      setSceneKey((k) => k + 1);
      setGameState("playing");
      const ctx = getAC(audioRef);
      if (ctx) startAmbient(ctx);
      setTimeout(requestPointerLock, 200);
    },
    [requestPointerLock]
  );
  const handleGameOver = reactExports.useCallback((t) => {
    setFinalTime(t);
    setGameState("gameover");
    stopAmbient();
    document.exitPointerLock();
  }, []);
  const handleJumpscare = reactExports.useCallback(() => {
    setJumpscareActive(true);
    setTimeout(() => setJumpscareActive(false), 600);
  }, []);
  const handleRestart = reactExports.useCallback(
    () => handleStart(gameMode, gameMap, cameraMode, dayMode),
    [handleStart, gameMode, gameMap, cameraMode, dayMode]
  );
  const handleMenu = reactExports.useCallback(() => {
    setGameState("menu");
    stopAmbient();
    document.exitPointerLock();
  }, []);
  const handleClose = reactExports.useCallback(() => {
    stopAmbient();
    document.exitPointerLock();
    onClose();
  }, [onClose]);
  const handleToggleCamera = reactExports.useCallback(
    () => setCameraMode((c) => c === "third" ? "first" : "third"),
    []
  );
  const handleToggleDay = reactExports.useCallback(
    () => setDayMode((d) => d === "day" ? "night" : "day"),
    []
  );
  const handleToggleTorch = reactExports.useCallback(() => setTorchEnabled((v) => !v), []);
  if (gameState === "menu") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(MenuScreen, { onStart: handleStart, onClose: handleClose });
  }
  if (gameState === "gameover") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      GameOverScreen,
      {
        time: finalTime,
        onRestart: handleRestart,
        onMenu: handleMenu,
        onClose: handleClose
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      style: { position: "fixed", inset: 0, zIndex: 9999, background: "#000" },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            ref: canvasRef,
            style: { width: "100%", height: "100%", cursor: "crosshair" },
            onClick: requestPointerLock,
            onKeyDown: requestPointerLock,
            role: "presentation",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Canvas,
              {
                shadows: true,
                camera: { fov: 75, near: 0.1, far: 300 },
                style: { width: "100%", height: "100%" },
                gl: { antialias: true },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: null, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  GameScene,
                  {
                    mode: gameMode,
                    map: gameMap,
                    dayMode,
                    cameraMode,
                    torchEnabled,
                    onGameOver: handleGameOver,
                    onStaminaChange: setStamina,
                    onTimeChange: setTime,
                    onNearHouseChange: setNearHouse,
                    onJumpscare: handleJumpscare,
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
                    playerPosRef
                  }
                ) })
              },
              sceneKey
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          HUD,
          {
            stamina,
            time,
            cameraMode,
            dayMode,
            torchEnabled,
            nearHouse,
            isHidden,
            jumpscareActive,
            onToggleCamera: handleToggleCamera,
            onToggleDay: handleToggleDay,
            onToggleTorch: handleToggleTorch,
            onPause: handleMenu,
            onClose: handleClose
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          MovementButtons,
          {
            keysRef,
            joystickRef,
            jumpRef,
            onJump: () => {
              jumpRef.current = true;
            }
          }
        )
      ]
    }
  );
}
export {
  NightCentipedeHunt as default
};
