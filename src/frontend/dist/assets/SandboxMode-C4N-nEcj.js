import { r as reactExports, j as jsxRuntimeExports } from "./index-C2kEbAWK.js";
import { C as Canvas, V as Vector3, u as useFrame, b as useThree } from "./react-three-fiber.esm-d5bW1IHa.js";
import { S as Sky } from "./FlappyBird3D-LPUiXWVj.js";
const WEAPONS = [
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
    pellets: 1
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
    pellets: 1
  },
  {
    name: "Shotgun",
    levelReq: 10,
    damage: 55,
    speed: 20,
    fireRate: 1,
    color: "#CC4400",
    size: 0.15,
    explosive: false,
    dmgRadius: 0,
    ammoMax: 15,
    pellets: 5
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
    pellets: 1
  },
  {
    name: "Sniper",
    levelReq: 20,
    damage: 100,
    speed: 60,
    fireRate: 2,
    color: "#ffffff",
    size: 0.13,
    explosive: false,
    dmgRadius: 0,
    ammoMax: 10,
    pellets: 1
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
    pellets: 1
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
    pellets: 1
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
    pellets: 1
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
    pellets: 1
  },
  {
    name: "Nuke Launcher",
    levelReq: 50,
    damage: 9999,
    speed: 8,
    fireRate: 6,
    color: "#FFFF44",
    size: 0.5,
    explosive: true,
    dmgRadius: 40,
    ammoMax: 2,
    pellets: 1
  }
];
const LEVEL_XP = [
  0,
  100,
  250,
  450,
  700,
  1e3,
  1400,
  1900,
  2500,
  3200,
  4e3,
  5e3,
  6200,
  7600,
  9200,
  11e3,
  13e3,
  15200,
  17600,
  20200,
  23e3,
  26e3,
  29200,
  32600,
  36200,
  4e4,
  44e3,
  48200,
  52600,
  57200,
  62e3,
  67e3,
  72200,
  77600,
  83200,
  89e3,
  95e3,
  101200,
  107600,
  114200,
  121e3,
  128e3,
  135200,
  142600,
  150200,
  158e3,
  166e3,
  174200,
  182600,
  191200,
  2e5
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
  "#85C1E9"
];
const TASK_TEMPLATES = [
  { type: "poop", desc: "Poop near {N} people", counts: [3, 5, 10] },
  { type: "kill_civ", desc: "Eliminate {N} civilians", counts: [3, 5, 10] },
  { type: "kill_police", desc: "Take down {N} police", counts: [2, 5, 8] },
  { type: "escape", desc: "Evade police {N} times", counts: [1, 2, 3] },
  { type: "survive", desc: "Survive {N} seconds", counts: [60, 120, 180] }
];
const HOUSE_DEFS = [
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
  [80, -40, 6, 6, 4, "#CC4466"]
];
const ROCKET_POS = [0, 0, -60];
const NEON_BLUE = "#00cfff";
const NEON_RED = "#ff4444";
const NEON_GREEN = "#00ff88";
const NEON_YELLOW = "#FFD700";
const HUD_BG = "rgba(0,0,20,0.80)";
function btnStyle(color) {
  return {
    background: `linear-gradient(135deg, ${color}22, ${color}44)`,
    border: `1px solid ${color}`,
    borderRadius: "8px",
    color,
    fontWeight: 700,
    fontSize: "12px",
    padding: "6px 12px",
    cursor: "pointer",
    textShadow: `0 0 8px ${color}`,
    boxShadow: `0 0 10px ${color}44`,
    fontFamily: "monospace",
    letterSpacing: "0.05em"
  };
}
function makeRng(seed) {
  let s = seed | 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 | 0;
    return (s >>> 0) / 4294967296;
  };
}
function getAudioCtx(ref) {
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
function playGunshot(ctx, weaponType) {
  var _a;
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    if (weaponType >= 5 && ((_a = WEAPONS[weaponType]) == null ? void 0 : _a.explosive)) {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3);
      g.gain.setValueAtTime(0.4, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
    } else if (weaponType === 1) {
      osc.type = "square";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.06);
    } else {
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
  }
}
function playPoopSound(ctx) {
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
  }
}
function playDeathSound(ctx) {
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
  }
}
function playLevelUp(ctx) {
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
    }
  });
}
function updateSiren(ctx, sirenRef, sirenGainRef, wantedLevel) {
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
    }
  } else if (wantedLevel === 0 && sirenRef.current) {
    try {
      sirenRef.current.stop();
    } catch {
    }
    sirenRef.current = null;
    sirenGainRef.current = null;
  }
}
let taskIdCounter = 0;
function generateTask(exclude) {
  const available = TASK_TEMPLATES.filter((t) => !exclude.includes(t.type));
  const pool = available.length > 0 ? available : TASK_TEMPLATES;
  const tmpl = pool[Math.floor(Math.random() * pool.length)];
  const count = tmpl.counts[Math.floor(Math.random() * tmpl.counts.length)];
  return {
    id: ++taskIdCounter,
    type: tmpl.type,
    description: tmpl.desc.replace("{N}", String(count)),
    target: count,
    progress: 0
  };
}
function initTasks() {
  const t1 = generateTask([]);
  const t2 = generateTask([t1.type]);
  const t3 = generateTask([t1.type, t2.type]);
  return [t1, t2, t3];
}
function Ground() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { rotation: [-Math.PI / 2, 0, 0], receiveShadow: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [200, 200] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#3a6b3a" })
  ] });
}
function Road() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "mesh",
      {
        position: [0, 0.01, 0],
        rotation: [-Math.PI / 2, 0, 0],
        receiveShadow: true,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [6, 200] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#444" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "mesh",
      {
        position: [0, 0.01, 0],
        rotation: [-Math.PI / 2, Math.PI / 2, 0],
        receiveShadow: true,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [6, 200] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#444" })
        ]
      }
    )
  ] });
}
function TreeMesh({ tree }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [tree.x, 0, tree.z], children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, tree.trunkH / 2, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.3, 0.4, tree.trunkH, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#6B4226" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, tree.trunkH + tree.coneH * 0.4, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [tree.coneR, tree.coneH, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#1a6b1a" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, tree.trunkH + tree.coneH * 0.75, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [tree.coneR * 0.7, tree.coneH * 0.7, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#228b22" })
    ] })
  ] });
}
function HouseMesh({
  def
}) {
  const [x, z, w, d, h, color] = def;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [x, 0, z], children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, h / 2, 0], castShadow: true, receiveShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [w, h, d] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, h + 1.2, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [Math.max(w, d) * 0.75, 2.5, 4] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#8B0000" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 1, d / 2 + 0.01], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.2, 2, 0.1] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#5C3317" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-1.6, h * 0.55, d / 2 + 0.01], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.1, 1, 0.1] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#aaddff" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [1.6, h * 0.55, d / 2 + 0.01], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.1, 1, 0.1] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#aaddff" })
    ] })
  ] });
}
function RocketMesh() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: ROCKET_POS, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 4, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [1.2, 1.2, 8, 12] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#cccccc", metalness: 0.8, roughness: 0.2 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 9, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [1.2, 3, 12] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#ff3333" })
    ] }),
    [0, Math.PI / 2, Math.PI, -Math.PI / 2].map((angle, _rocketFinIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "mesh",
      {
        position: [Math.sin(angle) * 1.8, 1.5, Math.cos(angle) * 1.8],
        rotation: [0, angle, 0],
        castShadow: true,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.2, 2.5, 1.5] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#ff3333" })
        ]
      },
      String(angle)
    )),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, -0.5, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [0.8, 2.5, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: "#ff8800",
          emissive: "#ff4400",
          emissiveIntensity: 2,
          transparent: true,
          opacity: 0.7
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "pointLight",
      {
        position: [0, 4, 0],
        color: "#ff8800",
        intensity: 3,
        distance: 8
      }
    )
  ] });
}
function NpcMesh({
  npc,
  onMount
}) {
  const groupRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    onMount(npc.id, groupRef.current);
    return () => onMount(npc.id, null);
  }, [npc.id, onMount]);
  const bodyColor = npc.type === "police" ? "#2255cc" : npc.color;
  const shirtColor = npc.type === "police" ? "#1a44aa" : npc.color;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref: groupRef, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.55, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.5, 0.8, 0.28] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: shirtColor })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 1.18, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.22, 8, 6] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#f4c98a" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-0.33, 0.6, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.17, 0.6, 0.17] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: bodyColor })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.33, 0.6, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.17, 0.6, 0.17] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: bodyColor })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-0.15, 0, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.18, 0.55, 0.18] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: npc.type === "police" ? "#111133" : "#2244aa"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.15, 0, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.18, 0.55, 0.18] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: npc.type === "police" ? "#111133" : "#2244aa"
        }
      )
    ] }),
    npc.type === "police" && /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 1.48, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.25, 0.25, 0.15, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#0a0a44" })
    ] })
  ] });
}
function ProjMesh({
  proj,
  onMount
}) {
  const meshRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    onMount(proj.id, meshRef.current);
    return () => onMount(proj.id, null);
  }, [proj.id, onMount]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { ref: meshRef, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [proj.size, 6, 6] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: proj.color,
        emissive: proj.color,
        emissiveIntensity: 1.5
      }
    )
  ] });
}
function BloodDecal({ pos }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "mesh",
    {
      position: [pos[0], 0.02, pos[2]],
      rotation: [-Math.PI / 2, 0, Math.random() * Math.PI],
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("circleGeometry", { args: [0.4 + Math.random() * 0.3, 8] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#880000" })
      ]
    }
  );
}
function BloodParticleMesh({
  bp,
  onMount
}) {
  const meshRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    onMount(bp.id, meshRef.current);
    return () => onMount(bp.id, null);
  }, [bp.id, onMount]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { ref: meshRef, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.1, 5, 5] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#cc0000" })
  ] });
}
function PoopMesh({ pos }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [pos[0], 0.05, pos[2]], rotation: [-Math.PI / 2, 0, 0], children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.28, 0.35, 0.18, 8] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#5C3317" })
  ] });
}
function ExplosionMesh({
  exp,
  onMount
}) {
  const meshRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    onMount(exp.id, meshRef.current);
    return () => onMount(exp.id, null);
  }, [exp.id, onMount]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { ref: meshRef, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [1, 10, 10] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: exp.color,
        emissive: exp.color,
        emissiveIntensity: 3,
        transparent: true,
        opacity: 0.75
      }
    )
  ] });
}
function PlayerMesh({
  groupRef
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref: groupRef, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.55, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.55, 0.9, 0.32] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#cc2222" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 1.22, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.25, 10, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#f4c98a" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-0.37, 0.62, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.18, 0.65, 0.18] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#cc2222" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.37, 0.62, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.18, 0.65, 0.18] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#cc2222" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-0.16, -0.02, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.2, 0.6, 0.22] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#222266" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.16, -0.02, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.2, 0.6, 0.22] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#222266" })
    ] })
  ] });
}
function DayNightScene({
  isDayModeRef
}) {
  const [isDay, setIsDay] = reactExports.useState(true);
  useFrame(() => {
    const d = isDayModeRef.current;
    if (d !== isDay) setIsDay(d);
  });
  return isDay ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Sky, { sunPosition: [100, 20, 100], turbidity: 8, rayleigh: 2 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("fog", { attach: "fog", args: ["#87CEEB", 80, 200] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ambientLight", { intensity: 0.6 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "directionalLight",
      {
        position: [30, 50, 30],
        castShadow: true,
        intensity: 1.5,
        "shadow-mapSize-width": 1024,
        "shadow-mapSize-height": 1024,
        "shadow-camera-far": 200,
        "shadow-camera-left": -100,
        "shadow-camera-right": 100,
        "shadow-camera-top": 100,
        "shadow-camera-bottom": -100
      }
    )
  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("color", { attach: "background", args: ["#0a0a1a"] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("fog", { attach: "fog", args: ["#0a0a1a", 40, 150] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ambientLight", { intensity: 0.15, color: "#2233aa" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "directionalLight",
      {
        position: [-50, 30, -50],
        intensity: 0.2,
        color: "#4466cc",
        castShadow: true
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "pointLight",
      {
        position: [10, 5, 10],
        intensity: 1.5,
        color: "#ffaa44",
        distance: 20
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "pointLight",
      {
        position: [-20, 5, -15],
        intensity: 1.5,
        color: "#ffaa44",
        distance: 20
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "pointLight",
      {
        position: [30, 5, -25],
        intensity: 1.5,
        color: "#ffaa44",
        distance: 20
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "pointLight",
      {
        position: [-40, 5, 20],
        intensity: 1.5,
        color: "#ffaa44",
        distance: 20
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "pointLight",
      {
        position: [0, 5, 40],
        intensity: 1.2,
        color: "#ffbb55",
        distance: 18
      }
    )
  ] });
}
function SandboxCamera({
  playerPosRef,
  camYawRef,
  isHidingRef,
  cameraModeRef
}) {
  const { camera } = useThree();
  const camPosSmooth = reactExports.useRef(new Vector3(0, 8, 12));
  useFrame(() => {
    const pp = playerPosRef.current;
    const yaw = camYawRef.current;
    if (cameraModeRef.current === "fpv") {
      camera.position.set(pp.x, pp.y + 1.6, pp.z);
      const lookX = pp.x - Math.sin(yaw);
      const lookZ = pp.z - Math.cos(yaw);
      camera.lookAt(lookX, pp.y + 1.6, lookZ);
    } else {
      const dist = 12;
      const height = 7;
      const targetCamPos = new Vector3(
        pp.x + Math.sin(yaw) * dist,
        pp.y + height,
        pp.z + Math.cos(yaw) * dist
      );
      camPosSmooth.current.lerp(targetCamPos, 0.1);
      camera.position.copy(camPosSmooth.current);
      const lookTarget = new Vector3(pp.x, pp.y + 1.2, pp.z);
      camera.lookAt(lookTarget);
      if (isHidingRef.current) {
        camera.position.y = Math.max(camera.position.y, pp.y + 3);
      }
    }
  });
  return null;
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
  isDayModeRef
}) {
  const treeData = reactExports.useMemo(() => {
    const rng = makeRng(42);
    const trees = [];
    while (trees.length < 38) {
      const x = (rng() - 0.5) * 180;
      const z = (rng() - 0.5) * 180;
      const dist = Math.sqrt(x * x + z * z);
      if (dist < 18) continue;
      let nearHouse = false;
      for (const [hx, hz] of HOUSE_DEFS) {
        if (Math.abs(x - hx) < 10 && Math.abs(z - hz) < 10) {
          nearHouse = true;
          break;
        }
      }
      if (nearHouse) continue;
      if (Math.abs(x - ROCKET_POS[0]) < 8 && Math.abs(z - ROCKET_POS[2]) < 8)
        continue;
      trees.push({
        id: trees.length,
        x,
        z,
        trunkH: 1.2 + rng() * 1.5,
        coneH: 2.5 + rng() * 2,
        coneR: 1.2 + rng() * 0.8
      });
    }
    return trees;
  }, []);
  const playerPosRef = reactExports.useRef(new Vector3(0, 0.8, 0));
  const playerVelRef = reactExports.useRef(new Vector3());
  const playerGroupRef = reactExports.useRef(null);
  const camYawRef = reactExports.useRef(Math.PI);
  const isHidingRef = reactExports.useRef(false);
  const inRocketRef = reactExports.useRef(false);
  const flyRef = reactExports.useRef(false);
  const healthRef = reactExports.useRef(100);
  const xpRef = reactExports.useRef(0);
  const levelRef = reactExports.useRef(1);
  const wantedLevelRef = reactExports.useRef(0);
  const weaponRef = reactExports.useRef(0);
  const ammoRef = reactExports.useRef(WEAPONS.map((w) => w.ammoMax));
  const npcsRef = reactExports.useRef([]);
  const projs = reactExports.useRef([]);
  const bloodParticles = reactExports.useRef([]);
  const explosions = reactExports.useRef([]);
  const poopPositions = reactExports.useRef([]);
  const fireTimerRef = reactExports.useRef(0);
  const hudTimerRef = reactExports.useRef(0);
  const policeSpawnTimerRef = reactExports.useRef(0);
  const hidingTimerRef = reactExports.useRef(0);
  const wantedCooldownRef = reactExports.useRef(0);
  const survivTimerRef = reactExports.useRef(0);
  const escapeCountRef = reactExports.useRef(0);
  const prevWantedRef = reactExports.useRef(0);
  const idCounterRef = reactExports.useRef(1e3);
  const levelUpTextTimerRef = reactExports.useRef(0);
  const flashMsgTimerRef = reactExports.useRef(0);
  const flashMsgRef = reactExports.useRef("");
  const levelUpTextRef = reactExports.useRef("");
  const killsRef = reactExports.useRef(0);
  const tasksDoneRef = reactExports.useRef(0);
  const gameOverRef = reactExports.useRef(false);
  const tasksRef = reactExports.useRef(initTasks());
  const [npcRenderList, setNpcRenderList] = reactExports.useState([]);
  const [projRenderList, setProjRenderList] = reactExports.useState([]);
  const [bloodDecalList, setBloodDecalList] = reactExports.useState([]);
  const [bloodParticleList, setBloodParticleList] = reactExports.useState(
    []
  );
  const [poopRenderList, setPoopRenderList] = reactExports.useState([]);
  const [explosionRenderList, setExplosionRenderList] = reactExports.useState([]);
  const npcGroupMap = reactExports.useRef(/* @__PURE__ */ new Map());
  const projMeshMap = reactExports.useRef(/* @__PURE__ */ new Map());
  const bloodParticleMeshMap = reactExports.useRef(/* @__PURE__ */ new Map());
  const explosionMeshMap = reactExports.useRef(/* @__PURE__ */ new Map());
  const registerNpc = reactExports.useCallback((id, g) => {
    if (g) npcGroupMap.current.set(id, g);
    else npcGroupMap.current.delete(id);
  }, []);
  const registerProj = reactExports.useCallback((id, m) => {
    if (m) projMeshMap.current.set(id, m);
    else projMeshMap.current.delete(id);
  }, []);
  const registerBloodParticle = reactExports.useCallback(
    (id, m) => {
      if (m) bloodParticleMeshMap.current.set(id, m);
      else bloodParticleMeshMap.current.delete(id);
    },
    []
  );
  const registerExplosion = reactExports.useCallback((id, m) => {
    if (m) explosionMeshMap.current.set(id, m);
    else explosionMeshMap.current.delete(id);
  }, []);
  reactExports.useEffect(() => {
    const rng = makeRng(99);
    const civs = [];
    for (let i = 0; i < 25; i++) {
      let x;
      let z;
      do {
        x = (rng() - 0.5) * 150;
        z = (rng() - 0.5) * 150;
      } while (Math.sqrt(x * x + z * z) < 12);
      civs.push({
        id: i,
        pos: new Vector3(x, 0.8, z),
        vel: new Vector3(),
        yaw: rng() * Math.PI * 2,
        type: "civilian",
        state: "wander",
        health: 100,
        color: CIVILIAN_COLORS[i % CIVILIAN_COLORS.length],
        target: new Vector3(
          x + (rng() - 0.5) * 20,
          0.8,
          z + (rng() - 0.5) * 20
        ),
        wanderTimer: rng() * 3
      });
    }
    npcsRef.current = civs;
    setNpcRenderList(
      civs.map((c) => ({ id: c.id, color: c.color, type: c.type }))
    );
  }, []);
  const spawnPolice = reactExports.useCallback((count) => {
    const currentPolice = npcsRef.current.filter(
      (n) => n.type === "police" && n.state !== "dead"
    ).length;
    const maxPolice = Math.min(10, count);
    const toSpawn = maxPolice - currentPolice;
    if (toSpawn <= 0) return;
    const newPolice = [];
    for (let i = 0; i < toSpawn; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 85 + Math.random() * 10;
      const id = idCounterRef.current++;
      newPolice.push({
        id,
        pos: new Vector3(Math.cos(angle) * r, 0.8, Math.sin(angle) * r),
        vel: new Vector3(),
        yaw: 0,
        type: "police",
        state: "chase",
        health: 100,
        color: "#2255cc",
        target: playerPosRef.current.clone(),
        wanderTimer: 0
      });
    }
    npcsRef.current = [...npcsRef.current, ...newPolice];
    setNpcRenderList((prev) => [
      ...prev,
      ...newPolice.map((p) => ({ id: p.id, color: p.color, type: p.type }))
    ]);
  }, []);
  const killNpc = reactExports.useCallback((npc, audioCtx) => {
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
    if (npc.type === "civilian") {
      wantedLevelRef.current = Math.min(5, wantedLevelRef.current + 2);
    } else {
      wantedLevelRef.current = Math.min(5, wantedLevelRef.current + 1);
    }
    const newBPs = [];
    for (let i = 0; i < 7; i++) {
      const bpId = idCounterRef.current++;
      const bp = {
        id: bpId,
        pos: npc.pos.clone().add(new Vector3(0, 0.8, 0)),
        vel: new Vector3(
          (Math.random() - 0.5) * 6,
          2 + Math.random() * 4,
          (Math.random() - 0.5) * 6
        ),
        alive: true
      };
      newBPs.push(bp);
    }
    bloodParticles.current = [...bloodParticles.current, ...newBPs];
    setBloodParticleList((prev) => [
      ...prev,
      ...newBPs.map((b) => ({ id: b.id }))
    ]);
    const newDecal = {
      id: idCounterRef.current++,
      pos: [npc.pos.x, 0, npc.pos.z]
    };
    setBloodDecalList((prev) => {
      const next = [...prev, newDecal];
      return next.length > 50 ? next.slice(next.length - 50) : next;
    });
    const taskType = npc.type === "civilian" ? "kill_civ" : "kill_police";
    tasksRef.current = tasksRef.current.map(
      (t) => t.type === taskType ? { ...t, progress: t.progress + 1 } : t
    );
  }, []);
  useFrame((_, delta) => {
    if (gameOverRef.current) return;
    const dt = Math.min(delta, 0.05);
    const keys = keysRef.current;
    const audioCtx = getAudioCtx(audioRef);
    const dx = mouseDeltaRef.current.dx;
    if (Math.abs(dx) > 0.5) {
      camYawRef.current += dx * 5e-3;
    }
    mouseDeltaRef.current.dx = 0;
    mouseDeltaRef.current.dy = 0;
    survivTimerRef.current += dt;
    if (!isHidingRef.current) {
      const speed = 8;
      const yaw = camYawRef.current;
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
        if (playerGroupRef.current) {
          playerGroupRef.current.rotation.y = Math.atan2(mx, mz);
        }
      }
      if (flyRef.current) {
        if (keys.has("Space")) playerPosRef.current.y += 6 * dt;
        if (keys.has("ShiftLeft") || keys.has("ShiftRight"))
          playerPosRef.current.y -= 6 * dt;
      } else {
        playerVelRef.current.y -= 20 * dt;
        playerPosRef.current.y += playerVelRef.current.y * dt;
        if (playerPosRef.current.y <= 0.8) {
          playerPosRef.current.y = 0.8;
          playerVelRef.current.y = 0;
        }
      }
      playerPosRef.current.x = Math.max(
        -98,
        Math.min(98, playerPosRef.current.x)
      );
      playerPosRef.current.z = Math.max(
        -98,
        Math.min(98, playerPosRef.current.z)
      );
      playerPosRef.current.y = Math.max(
        0.8,
        Math.min(80, playerPosRef.current.y)
      );
    }
    if (playerGroupRef.current) {
      playerGroupRef.current.position.copy(playerPosRef.current);
    }
    fireTimerRef.current -= dt;
    if (fireRef.current && fireTimerRef.current <= 0) {
      fireRef.current = false;
      const w = weaponRef.current;
      if (w === 0) {
        playPoopSound(audioCtx);
        const pp = playerPosRef.current;
        const newPoop = [pp.x, 0, pp.z];
        poopPositions.current = [...poopPositions.current, newPoop];
        if (poopPositions.current.length > 30)
          poopPositions.current = poopPositions.current.slice(-30);
        setPoopRenderList([...poopPositions.current]);
        wantedLevelRef.current = Math.min(5, wantedLevelRef.current + 1);
        for (const npc of npcsRef.current) {
          if (npc.state === "dead" || npc.type === "police") continue;
          const d = npc.pos.distanceTo(pp);
          if (d < 8) {
            npc.state = "flee";
            npc.target.set(
              npc.pos.x + (Math.random() - 0.5) * 30,
              0.8,
              npc.pos.z + (Math.random() - 0.5) * 30
            );
            tasksRef.current = tasksRef.current.map(
              (t) => t.type === "poop" ? { ...t, progress: t.progress + 1 } : t
            );
          }
        }
        fireTimerRef.current = 0.3;
      } else {
        const wDef = WEAPONS[w - 1];
        if (!wDef) {
          fireRef.current = false;
        } else if (levelRef.current >= wDef.levelReq && ammoRef.current[w - 1] > 0) {
          const pellets = wDef.pellets;
          const yaw = camYawRef.current;
          const fwdX = -Math.sin(yaw);
          const fwdZ = -Math.cos(yaw);
          for (let p = 0; p < pellets; p++) {
            const spread = pellets > 1 ? (Math.random() - 0.5) * 0.4 : 0;
            const vx = (fwdX + spread) * wDef.speed;
            const vz = (fwdZ + (pellets > 1 ? (Math.random() - 0.5) * 0.4 : 0)) * wDef.speed;
            const id = idCounterRef.current++;
            projs.current.push({
              id,
              pos: playerPosRef.current.clone().add(new Vector3(0, 0.9, 0)),
              vel: new Vector3(vx, 0, vz),
              weaponType: w,
              timer: 0,
              alive: true
            });
            setProjRenderList((prev) => [
              ...prev,
              { id, color: wDef.color, size: wDef.size }
            ]);
          }
          ammoRef.current[w - 1]--;
          playGunshot(audioCtx, w - 1);
          fireTimerRef.current = wDef.fireRate;
        }
      }
    }
    let projsChanged = false;
    for (const proj of projs.current) {
      if (!proj.alive) continue;
      proj.pos.add(proj.vel.clone().multiplyScalar(dt));
      proj.timer += dt;
      const m = projMeshMap.current.get(proj.id);
      if (m) m.position.copy(proj.pos);
      if (proj.timer > 3 || Math.abs(proj.pos.x) > 100 || Math.abs(proj.pos.z) > 100) {
        proj.alive = false;
        projsChanged = true;
        continue;
      }
      if (proj.pos.y < 0.1) {
        const wDef = WEAPONS[proj.weaponType - 1];
        if (wDef == null ? void 0 : wDef.explosive) {
          triggerExplosion(proj.pos, wDef.dmgRadius, audioCtx);
        }
        proj.alive = false;
        projsChanged = true;
        continue;
      }
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
        (b) => !b.alive || b.pos.y > 0.05
      );
      bloodParticles.current = bloodParticles.current.slice(-80);
    }
    let expChanged = false;
    for (const exp of explosions.current) {
      exp.timer += dt;
      const m = explosionMeshMap.current.get(exp.id);
      const t = exp.timer / exp.maxTimer;
      if (m) {
        const s = exp.dmgRadius * t * 1.2;
        m.scale.setScalar(s);
        const mat = m.material;
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
    for (const npc of npcsRef.current) {
      if (npc.state === "dead") continue;
      const g = npcGroupMap.current.get(npc.id);
      let speed = 2.5;
      if (npc.type === "police") {
        const dir = playerPosRef.current.clone().sub(npc.pos);
        const dist = dir.length();
        speed = 6;
        if (dist > 1.5) {
          dir.normalize();
          npc.pos.add(dir.clone().multiplyScalar(speed * dt));
          npc.yaw = Math.atan2(dir.x, dir.z);
        } else {
          healthRef.current = Math.max(0, healthRef.current - 15 * dt);
          if (healthRef.current <= 0) {
            gameOverRef.current = true;
            onGameOver();
          }
        }
      } else {
        if (npc.state === "flee") speed = 5;
        if (npc.wanderTimer > 0) {
          npc.wanderTimer -= dt;
        } else {
          const dir = npc.target.clone().sub(npc.pos);
          const dist = dir.length();
          if (dist < 2) {
            npc.state = "wander";
            npc.target.set(
              npc.pos.x + (Math.random() - 0.5) * 40,
              0.8,
              npc.pos.z + (Math.random() - 0.5) * 40
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
    policeSpawnTimerRef.current -= dt;
    if (wantedLevelRef.current > 0 && policeSpawnTimerRef.current <= 0) {
      const maxPolice = wantedLevelRef.current <= 2 ? 2 : wantedLevelRef.current <= 4 ? 4 : 6;
      spawnPolice(maxPolice);
      policeSpawnTimerRef.current = 5;
    }
    if (isHidingRef.current) {
      hidingTimerRef.current += dt;
      if (hidingTimerRef.current >= 10 && wantedLevelRef.current > 0) {
        wantedLevelRef.current--;
        hidingTimerRef.current = 0;
      }
      if (wantedLevelRef.current === 0) {
        updateSiren(audioCtx, sirenRef, sirenGainRef, 0);
      }
    }
    wantedCooldownRef.current += dt;
    if (wantedCooldownRef.current >= 30 && wantedLevelRef.current > 0 && !isHidingRef.current) {
      wantedLevelRef.current--;
      wantedCooldownRef.current = 0;
    }
    if (prevWantedRef.current > 0 && wantedLevelRef.current === 0) {
      escapeCountRef.current++;
      tasksRef.current = tasksRef.current.map(
        (t) => t.type === "escape" ? { ...t, progress: t.progress + 1 } : t
      );
    }
    prevWantedRef.current = wantedLevelRef.current;
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
    tasksRef.current = tasksRef.current.map((t) => {
      if (t.type === "survive") {
        return { ...t, progress: Math.floor(survivTimerRef.current) };
      }
      return t;
    });
    tasksRef.current = tasksRef.current.map((t) => {
      if (t.type === "reach_level") {
        return { ...t, progress: levelRef.current };
      }
      return t;
    });
    const completedTypes = [];
    tasksRef.current = tasksRef.current.map((t) => {
      if (t.progress >= t.target) {
        xpRef.current += 50;
        tasksDoneRef.current++;
        completedTypes.push(t.type);
        flashMsgRef.current = "TASK COMPLETE! +50 XP";
        flashMsgTimerRef.current = 2.5;
        return generateTask(
          tasksRef.current.filter((x) => x.id !== t.id).map((x) => x.type)
        );
      }
      return t;
    });
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
        levelUpText: levelUpTextTimerRef.current > 0 ? levelUpTextRef.current : "",
        flashMsg: flashMsgTimerRef.current > 0 ? flashMsgRef.current : "",
        isHiding: isHidingRef.current,
        inRocket: inRocketRef.current
      });
    }
  });
  function triggerExplosion(pos, dmgRadius, audioCtx) {
    playGunshot(audioCtx, 5);
    const id = idCounterRef.current++;
    const newExp = {
      id,
      pos: pos.clone(),
      timer: 0,
      maxTimer: 0.6,
      radius: dmgRadius * 0.8,
      dmgRadius
    };
    explosions.current.push(newExp);
    setExplosionRenderList((prev) => [...prev, { id, color: "#FF6600" }]);
    for (const npc of npcsRef.current) {
      if (npc.state === "dead") continue;
      if (npc.pos.distanceTo(pos) < dmgRadius) {
        npc.health -= 150;
        if (npc.health <= 0) killNpc(npc, audioCtx);
      }
    }
    if (playerPosRef.current.distanceTo(pos) < dmgRadius * 0.5) {
      healthRef.current = Math.max(0, healthRef.current - 30);
    }
  }
  reactExports.useEffect(() => {
    const onKey = (e) => {
      if (gameOverRef.current) return;
      if (e.code === "Digit0") {
        weaponRef.current = 0;
      } else if (e.code === "Digit1") {
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
      } else if (e.code === "KeyF") {
        flyRef.current = !flyRef.current;
      } else if (e.code === "KeyC") {
        cameraModeRef.current = cameraModeRef.current === "tpv" ? "fpv" : "tpv";
      } else if (e.code === "KeyE") {
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
          if (playerGroupRef.current)
            playerGroupRef.current.visible = !isHidingRef.current;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cameraModeRef]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DayNightScene, { isDayModeRef }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [20, 18, -30], castShadow: true, receiveShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [10, 1, 10] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#888899", roughness: 0.8 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-35, 22, 15], castShadow: true, receiveShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [12, 1, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#777788", roughness: 0.8 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [50, 26, 30], castShadow: true, receiveShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [8, 1, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#999aaa", roughness: 0.7 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-20, 15, -50], castShadow: true, receiveShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [10, 1, 14] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#aaa8b8", roughness: 0.75 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [20, 25, -30], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [2, 15, 2] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#556677", roughness: 0.6, metalness: 0.4 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-35, 28, 15], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [2, 12, 2] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#445566", roughness: 0.6, metalness: 0.4 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [50, 25.5, 30], castShadow: true, receiveShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [4, 8, 6] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#5a7a3a", roughness: 0.9 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [50, 29.5, 30], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.2, 0.3, 2, 6] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#6b4226", roughness: 1 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [50, 31.5, 30], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [1.5, 7, 6] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#2d7a3a", roughness: 0.8 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Ground, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Road, {}),
    treeData.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(TreeMesh, { tree: t }, t.id)),
    HOUSE_DEFS.map((def) => /* @__PURE__ */ jsxRuntimeExports.jsx(HouseMesh, { def }, def[0] * 1e3 + def[1])),
    /* @__PURE__ */ jsxRuntimeExports.jsx(RocketMesh, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(PlayerMesh, { groupRef: playerGroupRef }),
    npcRenderList.map((npc) => /* @__PURE__ */ jsxRuntimeExports.jsx(NpcMesh, { npc, onMount: registerNpc }, npc.id)),
    projRenderList.map((proj) => /* @__PURE__ */ jsxRuntimeExports.jsx(ProjMesh, { proj, onMount: registerProj }, proj.id)),
    bloodDecalList.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsx(BloodDecal, { pos: d.pos }, d.id)),
    bloodParticleList.map((bp) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      BloodParticleMesh,
      {
        bp,
        onMount: registerBloodParticle
      },
      bp.id
    )),
    poopRenderList.map((pos) => /* @__PURE__ */ jsxRuntimeExports.jsx(PoopMesh, { pos }, `${pos[0].toFixed(1)}_${pos[2].toFixed(1)}`)),
    explosionRenderList.map((exp) => /* @__PURE__ */ jsxRuntimeExports.jsx(ExplosionMesh, { exp, onMount: registerExplosion }, exp.id)),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SandboxCamera,
      {
        playerPosRef,
        camYawRef,
        isHidingRef,
        cameraModeRef
      }
    )
  ] });
}
function SandboxHUD({
  hud,
  onExit,
  cameraMode,
  isDayMode,
  onToggleCam,
  onToggleDay
}) {
  var _a;
  const [showControls, setShowControls] = reactExports.useState(false);
  const [showSettings, setShowSettings] = reactExports.useState(false);
  const [showRating, setShowRating] = reactExports.useState(false);
  const [ratingStars, setRatingStars] = reactExports.useState(0);
  const [ratingComment, setRatingComment] = reactExports.useState("");
  const [ratingSubmitted, setRatingSubmitted] = reactExports.useState(false);
  const [prevRating, setPrevRating] = reactExports.useState(null);
  reactExports.useState(() => {
    try {
      const saved = localStorage.getItem("sandboxRating");
      if (saved) {
        const parsed = JSON.parse(saved);
        setPrevRating(parsed);
        setRatingStars(parsed.rating);
        setRatingComment(parsed.comment || "");
      }
    } catch {
    }
  });
  const submitRating = () => {
    if (ratingStars === 0) return;
    const entry = {
      rating: ratingStars,
      comment: ratingComment,
      date: (/* @__PURE__ */ new Date()).toISOString()
    };
    try {
      localStorage.setItem("sandboxRating", JSON.stringify(entry));
      let arr = [];
      try {
        arr = JSON.parse(localStorage.getItem("sandboxRatings") || "[]");
      } catch {
        arr = [];
      }
      arr.push(ratingStars);
      localStorage.setItem("sandboxRatings", JSON.stringify(arr));
    } catch {
    }
    setPrevRating(entry);
    setRatingSubmitted(true);
    setTimeout(() => setRatingSubmitted(false), 2e3);
    setShowRating(false);
  };
  const getAvgRating = () => {
    try {
      const arr = JSON.parse(
        localStorage.getItem("sandboxRatings") || "[]"
      );
      if (arr.length === 0) return null;
      return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
    } catch {
      return null;
    }
  };
  const currentWeaponName = hud.weapon === 0 ? "💩 POOP" : ((_a = WEAPONS[hud.weapon - 1]) == null ? void 0 : _a.name) ?? "";
  const currentAmmo = hud.weapon === 0 ? "∞" : String(hud.ammo[hud.weapon - 1] ?? 0);
  const xpNext = LEVEL_XP[hud.level] ?? 999999;
  const xpPrev = LEVEL_XP[hud.level - 1] ?? 0;
  const xpPct = Math.min(
    100,
    Math.round((hud.xp - xpPrev) / (xpNext - xpPrev) * 100)
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      style: {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: "monospace"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              position: "absolute",
              top: 12,
              left: 12,
              background: HUD_BG,
              backdropFilter: "blur(8px)",
              borderRadius: 10,
              padding: "8px 14px",
              border: `1px solid ${NEON_RED}44`,
              minWidth: 140
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#aaa", fontSize: 10, letterSpacing: "0.1em" }, children: "HEALTH" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 3
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        style: {
                          flex: 1,
                          height: 10,
                          background: "#333",
                          borderRadius: 5,
                          overflow: "hidden"
                        },
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "div",
                          {
                            style: {
                              height: "100%",
                              width: `${hud.health}%`,
                              background: hud.health > 50 ? NEON_GREEN : hud.health > 25 ? NEON_YELLOW : NEON_RED,
                              transition: "width 0.1s",
                              borderRadius: 5
                            }
                          }
                        )
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        style: {
                          color: NEON_RED,
                          fontSize: 13,
                          fontWeight: 700,
                          textShadow: `0 0 8px ${NEON_RED}`,
                          minWidth: 28,
                          textAlign: "right"
                        },
                        children: Math.ceil(hud.health)
                      }
                    )
                  ]
                }
              ),
              hud.isHiding && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  style: {
                    color: NEON_GREEN,
                    fontSize: 10,
                    marginTop: 4,
                    textShadow: `0 0 8px ${NEON_GREEN}`
                  },
                  children: "🏠 HIDING — WANTED DROPPING"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              position: "absolute",
              top: 12,
              left: "50%",
              transform: "translateX(-50%)",
              background: HUD_BG,
              backdropFilter: "blur(8px)",
              borderRadius: 10,
              padding: "6px 16px",
              border: `1px solid ${NEON_YELLOW}44`,
              textAlign: "center"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#aaa", fontSize: 9, letterSpacing: "0.1em" }, children: "WANTED" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 18, letterSpacing: 3, marginTop: 2 }, children: [0, 1, 2, 3, 4].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  style: {
                    color: i < hud.wantedLevel ? NEON_YELLOW : "#333",
                    textShadow: i < hud.wantedLevel ? `0 0 8px ${NEON_YELLOW}` : "none"
                  },
                  children: "★"
                },
                i
              )) })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
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
              gap: 4
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        style: {
                          color: NEON_BLUE,
                          fontSize: 14,
                          fontWeight: 700,
                          textShadow: `0 0 8px ${NEON_BLUE}`
                        },
                        children: [
                          "LVL ",
                          hud.level
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        "data-ocid": "sandbox.close_button",
                        style: {
                          ...btnStyle("#ff5555"),
                          pointerEvents: "all",
                          fontSize: 11
                        },
                        onClick: onExit,
                        children: "✕ EXIT"
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    style: {
                      flex: 1,
                      height: 6,
                      background: "#333",
                      borderRadius: 3,
                      overflow: "hidden"
                    },
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        style: {
                          height: "100%",
                          width: `${xpPct}%`,
                          background: NEON_BLUE,
                          borderRadius: 3,
                          transition: "width 0.1s"
                        }
                      }
                    )
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#88aacc", fontSize: 10 }, children: [
                  hud.xp,
                  " XP"
                ] })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              position: "absolute",
              bottom: 70,
              left: 12,
              background: HUD_BG,
              backdropFilter: "blur(8px)",
              borderRadius: 10,
              padding: "10px 14px",
              border: `1px solid ${NEON_GREEN}33`,
              maxWidth: 220
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  style: {
                    color: NEON_GREEN,
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    marginBottom: 6,
                    textShadow: `0 0 8px ${NEON_GREEN}`
                  },
                  children: "📋 TASKS"
                }
              ),
              hud.tasks.map((task, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": `sandbox.item.${i + 1}`,
                  style: { marginBottom: 6 },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#ccc", fontSize: 10 }, children: task.description }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          marginTop: 2
                        },
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "div",
                            {
                              style: {
                                flex: 1,
                                height: 4,
                                background: "#333",
                                borderRadius: 2,
                                overflow: "hidden"
                              },
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "div",
                                {
                                  style: {
                                    height: "100%",
                                    width: `${Math.min(100, task.progress / task.target * 100)}%`,
                                    background: NEON_GREEN,
                                    borderRadius: 2
                                  }
                                }
                              )
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: NEON_GREEN, fontSize: 9 }, children: [
                            task.progress,
                            "/",
                            task.target
                          ] })
                        ]
                      }
                    )
                  ]
                },
                task.id
              ))
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              background: HUD_BG,
              backdropFilter: "blur(8px)",
              borderRadius: 10,
              padding: "8px 20px",
              border: `1px solid ${NEON_YELLOW}44`,
              textAlign: "center"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  style: {
                    color: NEON_YELLOW,
                    fontSize: 14,
                    fontWeight: 700,
                    textShadow: `0 0 10px ${NEON_YELLOW}`
                  },
                  children: currentWeaponName
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#aaa", fontSize: 11, marginTop: 2 }, children: [
                "AMMO: ",
                currentAmmo
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              position: "absolute",
              top: 12,
              right: 12,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              pointerEvents: "all",
              maxHeight: "calc(100vh - 100px)",
              overflowY: "auto"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  "data-ocid": "sandbox.toggle",
                  style: btnStyle(NEON_BLUE),
                  onClick: onToggleCam,
                  children: [
                    "👁 ",
                    cameraMode.toUpperCase()
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  "data-ocid": "sandbox.toggle",
                  style: btnStyle(isDayMode ? NEON_YELLOW : "#8888ff"),
                  onClick: onToggleDay,
                  children: isDayMode ? "☀ DAY" : "🌙 NIGHT"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  "data-ocid": "sandbox.open_modal_button",
                  style: btnStyle("#aaddff"),
                  onClick: () => setShowControls(true),
                  children: "⌨ CONTROLS"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  "data-ocid": "sandbox.open_modal_button",
                  style: btnStyle("#ffaaff"),
                  onClick: () => setShowSettings(true),
                  children: "⚙ SETTINGS"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              position: "absolute",
              bottom: 12,
              right: 12,
              pointerEvents: "all"
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                "data-ocid": "sandbox.open_modal_button",
                style: btnStyle(NEON_YELLOW),
                onClick: () => setShowRating(true),
                children: "Rate ⭐"
              }
            )
          }
        ),
        showControls && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,20,0.7)",
              backdropFilter: "blur(6px)",
              pointerEvents: "all",
              zIndex: 100
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                style: {
                  background: HUD_BG,
                  border: `1px solid ${NEON_BLUE}66`,
                  borderRadius: 14,
                  padding: "24px 32px",
                  minWidth: 320,
                  fontFamily: "monospace",
                  boxShadow: `0 0 30px ${NEON_BLUE}44`
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      style: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 16
                      },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "div",
                          {
                            style: {
                              color: NEON_BLUE,
                              fontSize: 16,
                              fontWeight: 700,
                              textShadow: `0 0 10px ${NEON_BLUE}`,
                              letterSpacing: "0.1em"
                            },
                            children: "⌨ CONTROLS"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            type: "button",
                            "data-ocid": "sandbox.close_button",
                            style: { ...btnStyle(NEON_RED), padding: "3px 8px" },
                            onClick: () => setShowControls(false),
                            children: "✕"
                          }
                        )
                      ]
                    }
                  ),
                  [
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
                    ["Mouse Drag", "Rotate Camera"]
                  ].map(([key, desc]) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      style: {
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 20,
                        marginBottom: 6,
                        fontSize: 12
                      },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "span",
                          {
                            style: {
                              color: NEON_YELLOW,
                              minWidth: 110,
                              textShadow: `0 0 6px ${NEON_YELLOW}66`
                            },
                            children: key
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { color: "#aaccdd" }, children: desc })
                      ]
                    },
                    key
                  ))
                ]
              }
            )
          }
        ),
        showSettings && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,20,0.7)",
              backdropFilter: "blur(6px)",
              pointerEvents: "all",
              zIndex: 100
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                style: {
                  background: HUD_BG,
                  border: `1px solid ${NEON_BLUE}66`,
                  borderRadius: 14,
                  padding: "24px 32px",
                  minWidth: 280,
                  fontFamily: "monospace",
                  boxShadow: `0 0 30px ${NEON_BLUE}44`
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      style: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 20
                      },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "div",
                          {
                            style: {
                              color: "#ffaaff",
                              fontSize: 16,
                              fontWeight: 700,
                              letterSpacing: "0.1em",
                              textShadow: "0 0 10px #ffaaff"
                            },
                            children: "⚙ SETTINGS"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            type: "button",
                            "data-ocid": "sandbox.close_button",
                            style: { ...btnStyle(NEON_RED), padding: "3px 8px" },
                            onClick: () => setShowSettings(false),
                            children: "✕"
                          }
                        )
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      style: {
                        color: "#aaa",
                        fontSize: 11,
                        marginBottom: 10,
                        letterSpacing: "0.1em"
                      },
                      children: "LIGHTING"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 10 }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        "data-ocid": "sandbox.toggle",
                        style: {
                          ...btnStyle(isDayMode ? NEON_YELLOW : "#555555"),
                          padding: "10px 20px",
                          fontSize: 14
                        },
                        onClick: () => {
                          onToggleDay();
                        },
                        children: "☀ DAY"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        "data-ocid": "sandbox.toggle",
                        style: {
                          ...btnStyle(!isDayMode ? "#8888ff" : "#555555"),
                          padding: "10px 20px",
                          fontSize: 14
                        },
                        onClick: () => {
                          onToggleDay();
                        },
                        children: "🌙 NIGHT"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      style: {
                        color: "#aaa",
                        fontSize: 11,
                        marginTop: 18,
                        marginBottom: 10,
                        letterSpacing: "0.1em"
                      },
                      children: "CAMERA"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 10 }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        "data-ocid": "sandbox.toggle",
                        style: {
                          ...btnStyle(cameraMode === "tpv" ? NEON_BLUE : "#555555"),
                          padding: "10px 20px",
                          fontSize: 14
                        },
                        onClick: () => {
                          if (cameraMode !== "tpv") onToggleCam();
                        },
                        children: "👁 TPV"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        "data-ocid": "sandbox.toggle",
                        style: {
                          ...btnStyle(cameraMode === "fpv" ? NEON_BLUE : "#555555"),
                          padding: "10px 20px",
                          fontSize: 14
                        },
                        onClick: () => {
                          if (cameraMode !== "fpv") onToggleCam();
                        },
                        children: "🎯 FPV"
                      }
                    )
                  ] })
                ]
              }
            )
          }
        ),
        showRating && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,20,0.7)",
              backdropFilter: "blur(6px)",
              pointerEvents: "all",
              zIndex: 100
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                style: {
                  background: HUD_BG,
                  border: `1px solid ${NEON_YELLOW}66`,
                  borderRadius: 14,
                  padding: "24px 32px",
                  minWidth: 300,
                  fontFamily: "monospace",
                  boxShadow: `0 0 30px ${NEON_YELLOW}44`
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      style: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 16
                      },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "div",
                          {
                            style: {
                              color: NEON_YELLOW,
                              fontSize: 16,
                              fontWeight: 700,
                              letterSpacing: "0.1em",
                              textShadow: `0 0 10px ${NEON_YELLOW}`
                            },
                            children: "Rate Sandbox Mode"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            type: "button",
                            "data-ocid": "sandbox.close_button",
                            style: { ...btnStyle(NEON_RED), padding: "3px 8px" },
                            onClick: () => setShowRating(false),
                            children: "✕"
                          }
                        )
                      ]
                    }
                  ),
                  prevRating && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#88aacc", fontSize: 11, marginBottom: 10 }, children: [
                    "Your previous rating: ",
                    "⭐".repeat(prevRating.rating),
                    " ",
                    prevRating.comment && `— "${prevRating.comment}"`
                  ] }),
                  (() => {
                    const avg = getAvgRating();
                    return avg ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#aaa", fontSize: 11, marginBottom: 12 }, children: [
                      "Average rating: ",
                      avg,
                      " ⭐"
                    ] }) : null;
                  })(),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      style: {
                        display: "flex",
                        gap: 6,
                        marginBottom: 16,
                        justifyContent: "center"
                      },
                      children: [1, 2, 3, 4, 5].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          "data-ocid": `sandbox.toggle.${s}`,
                          style: {
                            background: "none",
                            border: "none",
                            fontSize: 28,
                            cursor: "pointer",
                            opacity: s <= ratingStars ? 1 : 0.3,
                            filter: s <= ratingStars ? `drop-shadow(0 0 8px ${NEON_YELLOW})` : "none",
                            transition: "all 0.15s"
                          },
                          onClick: () => setRatingStars(s),
                          children: "⭐"
                        },
                        s
                      ))
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "textarea",
                    {
                      "data-ocid": "sandbox.textarea",
                      value: ratingComment,
                      onChange: (e) => setRatingComment(e.target.value.slice(0, 100)),
                      placeholder: "Optional comment (max 100 chars)...",
                      style: {
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
                        boxSizing: "border-box"
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      "data-ocid": "sandbox.submit_button",
                      style: {
                        ...btnStyle(NEON_GREEN),
                        width: "100%",
                        padding: "10px",
                        fontSize: 13
                      },
                      onClick: submitRating,
                      disabled: ratingStars === 0,
                      children: ratingSubmitted ? "✓ SUBMITTED!" : "✓ SUBMIT RATING"
                    }
                  )
                ]
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              position: "absolute",
              top: 80,
              left: 12,
              background: "rgba(0,0,20,0.6)",
              backdropFilter: "blur(6px)",
              borderRadius: 8,
              padding: "6px 10px",
              border: "1px solid rgba(100,200,255,0.1)",
              maxWidth: 175
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  style: {
                    color: "#667",
                    fontSize: 9,
                    letterSpacing: "0.1em",
                    marginBottom: 3
                  },
                  children: "WEAPONS"
                }
              ),
              WEAPONS.map((w, i) => {
                const unlocked = hud.level >= w.levelReq;
                const selected = hud.weapon === i + 1;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    style: {
                      color: selected ? NEON_YELLOW : unlocked ? "#88aacc" : "#444",
                      fontSize: 9,
                      lineHeight: 1.5,
                      textShadow: selected ? `0 0 6px ${NEON_YELLOW}` : "none",
                      fontWeight: selected ? 700 : 400
                    },
                    children: [
                      selected ? "▶ " : "  ",
                      i + 1 === 10 ? "G" : i + 1,
                      ": ",
                      w.name,
                      " ",
                      !unlocked && `(Lv${w.levelReq})`
                    ]
                  },
                  w.name
                );
              })
            ]
          }
        ),
        hud.levelUpText && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
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
              animation: "none"
            },
            children: hud.levelUpText
          }
        ),
        hud.flashMsg && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
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
              border: `1px solid ${NEON_GREEN}55`
            },
            children: hud.flashMsg
          }
        )
      ]
    }
  );
}
function GameOverScreen({
  hud,
  onRestart,
  onExit
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      style: {
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,20,0.85)",
        backdropFilter: "blur(8px)",
        gap: 20,
        fontFamily: "monospace"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              color: NEON_RED,
              fontSize: "clamp(32px,7vw,60px)",
              fontWeight: 900,
              textShadow: `0 0 24px ${NEON_RED}, 0 0 48px ${NEON_RED}`,
              letterSpacing: "0.1em"
            },
            children: "BUSTED!"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: { display: "flex", gap: 40, color: "#ccc", textAlign: "center" },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 11, color: "#888", letterSpacing: "0.1em" }, children: "KILLS" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    style: {
                      color: NEON_RED,
                      fontSize: 36,
                      fontWeight: 700,
                      textShadow: `0 0 14px ${NEON_RED}`
                    },
                    children: hud.kills
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 11, color: "#888", letterSpacing: "0.1em" }, children: "LEVEL" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    style: {
                      color: NEON_BLUE,
                      fontSize: 36,
                      fontWeight: 700,
                      textShadow: `0 0 14px ${NEON_BLUE}`
                    },
                    children: hud.level
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: 11, color: "#888", letterSpacing: "0.1em" }, children: "TASKS" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    style: {
                      color: NEON_GREEN,
                      fontSize: 36,
                      fontWeight: 700,
                      textShadow: `0 0 14px ${NEON_GREEN}`
                    },
                    children: hud.tasksDone
                  }
                )
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 16 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              "data-ocid": "sandbox.primary_button",
              style: {
                ...btnStyle(NEON_GREEN),
                fontSize: 15,
                padding: "12px 28px",
                pointerEvents: "all"
              },
              onClick: onRestart,
              children: "↺ RESTART"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              "data-ocid": "sandbox.secondary_button",
              style: {
                ...btnStyle(NEON_BLUE),
                fontSize: 15,
                padding: "12px 28px",
                pointerEvents: "all"
              },
              onClick: onExit,
              children: "🏠 EXIT"
            }
          )
        ] })
      ]
    }
  );
}
function SandboxMode({ onExit }) {
  const [hudState, setHudState] = reactExports.useState({
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
    inRocket: false
  });
  const [gameOver, setGameOver] = reactExports.useState(false);
  const [resetKey, setResetKey] = reactExports.useState(0);
  const [cameraMode, setCameraMode] = reactExports.useState("tpv");
  const [isDayMode, setIsDayMode] = reactExports.useState(true);
  const cameraModeRef = reactExports.useRef("tpv");
  const isDayModeRef = reactExports.useRef(true);
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
  const keysRef = reactExports.useRef(/* @__PURE__ */ new Set());
  const mouseDeltaRef = reactExports.useRef({ dx: 0, dy: 0 });
  const mousePosRef = reactExports.useRef({ x: 0, y: 0 });
  const fireRef = reactExports.useRef(false);
  const audioRef = reactExports.useRef(null);
  const sirenRef = reactExports.useRef(null);
  const sirenGainRef = reactExports.useRef(null);
  const containerRef = reactExports.useRef(null);
  const lastMouseRef = reactExports.useRef({ x: 0, y: 0, down: false });
  reactExports.useEffect(() => {
    const onKeyDown = (e) => {
      keysRef.current.add(e.code);
      if (["Space", "ArrowUp", "ArrowDown"].includes(e.code))
        e.preventDefault();
    };
    const onKeyUp = (e) => keysRef.current.delete(e.code);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);
  reactExports.useEffect(() => {
    return () => {
      var _a;
      if (sirenRef.current) {
        try {
          sirenRef.current.stop();
        } catch {
        }
        sirenRef.current = null;
      }
      (_a = audioRef.current) == null ? void 0 : _a.close().catch(() => {
      });
    };
  }, []);
  const handleMouseMove = (e) => {
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
        x: (e.clientX - rect.left) / rect.width * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1
      };
    }
  };
  const handleMouseDown = (e) => {
    lastMouseRef.current.down = true;
    lastMouseRef.current.x = e.clientX;
    lastMouseRef.current.y = e.clientY;
    if (e.button === 0 && !e.target.closest("button")) {
      fireRef.current = true;
    }
  };
  const handleMouseUp = () => {
    lastMouseRef.current.down = false;
  };
  const handleHudUpdate = reactExports.useCallback((partial) => {
    setHudState((prev) => ({ ...prev, ...partial }));
  }, []);
  const handleGameOver = reactExports.useCallback(() => {
    setGameOver(true);
    if (sirenRef.current) {
      try {
        sirenRef.current.stop();
      } catch {
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
      inRocket: false
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref: containerRef,
      role: "presentation",
      style: {
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#0a1628",
        overflow: "hidden",
        cursor: "crosshair"
      },
      onMouseMove: handleMouseMove,
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onClick: (e) => e.stopPropagation(),
      onKeyDown: (e) => e.stopPropagation(),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Canvas,
          {
            shadows: true,
            dpr: [1, 1.5],
            camera: { fov: 65, position: [0, 8, 14], near: 0.1, far: 220 },
            style: { position: "absolute", inset: 0 },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              SandboxScene,
              {
                keysRef,
                mouseDeltaRef,
                mousePosRef,
                fireRef,
                audioRef,
                sirenRef,
                sirenGainRef,
                onHudUpdate: handleHudUpdate,
                onGameOver: handleGameOver,
                cameraModeRef,
                isDayModeRef
              }
            )
          },
          resetKey
        ),
        !gameOver && /* @__PURE__ */ jsxRuntimeExports.jsx(
          SandboxHUD,
          {
            hud: hudState,
            onExit,
            cameraMode,
            isDayMode,
            onToggleCam: handleToggleCam,
            onToggleDay: handleToggleDay
          }
        ),
        gameOver && /* @__PURE__ */ jsxRuntimeExports.jsx(
          GameOverScreen,
          {
            hud: hudState,
            onRestart: handleRestart,
            onExit
          }
        )
      ]
    }
  );
}
export {
  SandboxMode as default
};
