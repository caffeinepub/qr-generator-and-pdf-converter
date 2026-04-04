var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { r as reactExports, j as jsxRuntimeExports } from "./index-C2kEbAWK.js";
import { C as Canvas, P as PCFSoftShadowMap, A as ACESFilmicToneMapping, b as useThree, V as Vector3, F as FogExp2, G as Group, u as useFrame, c as Color, B as BackSide, O as Object3D } from "./react-three-fiber.esm-d5bW1IHa.js";
class GameAudio {
  constructor() {
    __publicField(this, "ctx", null);
    __publicField(this, "engineOsc", null);
    __publicField(this, "engineGain", null);
    __publicField(this, "screeOsc", null);
    __publicField(this, "screeGain", null);
    __publicField(this, "policeOsc", null);
    __publicField(this, "policeGain", null);
    __publicField(this, "ambientSource", null);
    __publicField(this, "policeTimer", 0);
    __publicField(this, "running", false);
  }
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = "sawtooth";
      this.engineOsc.frequency.value = 80;
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0.07;
      this.engineOsc.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);
      this.engineOsc.start();
      this.screeOsc = this.ctx.createOscillator();
      this.screeOsc.type = "sine";
      this.screeOsc.frequency.value = 200;
      this.screeGain = this.ctx.createGain();
      this.screeGain.gain.value = 0;
      this.screeOsc.connect(this.screeGain);
      this.screeGain.connect(this.ctx.destination);
      this.screeOsc.start();
      this.policeOsc = this.ctx.createOscillator();
      this.policeOsc.type = "square";
      this.policeOsc.frequency.value = 800;
      this.policeGain = this.ctx.createGain();
      this.policeGain.gain.value = 0;
      this.policeOsc.connect(this.policeGain);
      this.policeGain.connect(this.ctx.destination);
      this.policeOsc.start();
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
  update(speed, drifting, policeActive, dt) {
    if (!this.ctx || !this.running) return;
    const freq = 80 + speed * 2.2;
    if (this.engineOsc)
      this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
    if (this.screeGain)
      this.screeGain.gain.setTargetAtTime(
        drifting && speed > 20 ? 0.04 : 0,
        this.ctx.currentTime,
        0.05
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
          0.05
        );
      }
    } else if (this.policeGain) {
      this.policeGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
  }
  stop() {
    var _a, _b, _c, _d, _e;
    this.running = false;
    try {
      (_a = this.engineOsc) == null ? void 0 : _a.stop();
      (_b = this.screeOsc) == null ? void 0 : _b.stop();
      (_c = this.policeOsc) == null ? void 0 : _c.stop();
      (_d = this.ambientSource) == null ? void 0 : _d.stop();
      (_e = this.ctx) == null ? void 0 : _e.close();
    } catch (_e2) {
    }
    this.ctx = null;
    this.engineOsc = null;
    this.screeGain = null;
    this.policeOsc = null;
    this.policeGain = null;
  }
}
const MAP_CONFIGS = {
  city: {
    name: "City Downtown",
    groundColor: "#2a2a2a",
    skyTop: "#87ceeb",
    skyBot: "#ffffff",
    fogColor: "#d0e8ff",
    fogDensity: 3e-3,
    ambientIntensity: 0.8,
    sunIntensity: 1.8,
    sunPos: [50, 80, 30]
  },
  highway: {
    name: "Highway",
    groundColor: "#3a3a3a",
    skyTop: "#6ab0de",
    skyBot: "#e8f4fd",
    fogColor: "#c8e4f8",
    fogDensity: 1e-3,
    ambientIntensity: 1,
    sunIntensity: 2,
    sunPos: [100, 60, 0]
  },
  mountain: {
    name: "Mountain Road",
    groundColor: "#4a5040",
    skyTop: "#5a8ab8",
    skyBot: "#c0d8e8",
    fogColor: "#b8d0e4",
    fogDensity: 5e-3,
    ambientIntensity: 0.7,
    sunIntensity: 1.5,
    sunPos: [40, 100, -20]
  },
  desert: {
    name: "Desert Area",
    groundColor: "#c8a870",
    skyTop: "#e8c040",
    skyBot: "#fff8e0",
    fogColor: "#f0e8c0",
    fogDensity: 2e-3,
    ambientIntensity: 1.2,
    sunIntensity: 2.5,
    sunPos: [0, 100, 0]
  },
  night_city: {
    name: "Night City",
    groundColor: "#1a1a1a",
    skyTop: "#050510",
    skyBot: "#0a0a20",
    fogColor: "#050518",
    fogDensity: 6e-3,
    ambientIntensity: 0.08,
    sunIntensity: 0.3,
    sunPos: [50, 80, 30]
  }
};
function BMWM5({
  carRef,
  color
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref: carRef, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.35, 0], castShadow: true, receiveShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [2.1, 0.5, 4.8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color, metalness: 0.9, roughness: 0.1 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.85, -0.1], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.85, 0.55, 2.6] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color, metalness: 0.9, roughness: 0.1 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.52, 1.5], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [2, 0.18, 1.8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color, metalness: 0.9, roughness: 0.08 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.64, 1.4], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.7, 0.1, 1.5] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color, metalness: 0.9, roughness: 0.08 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.55, -1.7], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [2, 0.22, 1.4] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color, metalness: 0.9, roughness: 0.1 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.88, 1.05], rotation: [-0.52, 0, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [1.75, 0.9] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: "#334455",
          transparent: true,
          opacity: 0.35,
          metalness: 0.5,
          roughness: 0
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.88, -1.2], rotation: [0.52, 0, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [1.75, 0.8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: "#334455",
          transparent: true,
          opacity: 0.35,
          metalness: 0.5,
          roughness: 0
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-0.93, 0.85, -0.1], rotation: [0, Math.PI / 2, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [2.2, 0.5] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#223344", transparent: true, opacity: 0.3 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.93, 0.85, -0.1], rotation: [0, -Math.PI / 2, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [2.2, 0.5] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#223344", transparent: true, opacity: 0.3 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.6, 0.42, 2.42], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.12, 8, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: "#fffcee",
          emissive: "#fffcee",
          emissiveIntensity: 3
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-0.6, 0.42, 2.42], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.12, 8, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: "#fffcee",
          emissive: "#fffcee",
          emissiveIntensity: 3
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.62, 0.34, 2.41], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.3, 0.04, 0.04] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: "#ffffff",
          emissive: "#ffffff",
          emissiveIntensity: 4
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-0.62, 0.34, 2.41], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.3, 0.04, 0.04] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: "#ffffff",
          emissive: "#ffffff",
          emissiveIntensity: 4
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.65, 0.42, -2.42], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.35, 0.12, 0.04] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: "#ff2200",
          emissive: "#ff2200",
          emissiveIntensity: 2
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-0.65, 0.42, -2.42], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.35, 0.12, 0.04] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: "#ff2200",
          emissive: "#ff2200",
          emissiveIntensity: 2
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.28, 2.41], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.2, 0.25, 0.05] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#111111", metalness: 0.8, roughness: 0.3 })
    ] }),
    [-0.4, 0, 0.4].map((x) => /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [x, 0.28, 2.42], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.04, 0.22, 0.04] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: "#888888",
          metalness: 0.9,
          roughness: 0.1
        }
      )
    ] }, String(x))),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [1.06, 0.15, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.08, 0.18, 4.2] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color, metalness: 0.8, roughness: 0.15 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-1.06, 0.15, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.08, 0.18, 4.2] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color, metalness: 0.8, roughness: 0.15 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.62, 2.43], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("circleGeometry", { args: [0.12, 16] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#0060a8", metalness: 0.7, roughness: 0.2 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(WheelGroup, { position: [1.05, 0.2, 1.6] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(WheelGroup, { position: [-1.05, 0.2, 1.6], mirrorX: true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(WheelGroup, { position: [1.05, 0.2, -1.6] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(WheelGroup, { position: [-1.05, 0.2, -1.6], mirrorX: true }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.5, 0.18, -2.44], rotation: [Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.06, 0.07, 0.15, 12] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: "#666666",
          metalness: 0.95,
          roughness: 0.1
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-0.5, 0.18, -2.44], rotation: [Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.06, 0.07, 0.15, 12] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: "#666666",
          metalness: 0.95,
          roughness: 0.1
        }
      )
    ] })
  ] });
}
function WheelGroup({
  position,
  mirrorX
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position, scale: [mirrorX ? -1 : 1, 1, 1], children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { rotation: [0, 0, Math.PI / 2], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.3, 0.3, 0.22, 20] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#111111", roughness: 0.9, metalness: 0 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { rotation: [0, 0, Math.PI / 2], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.22, 0.22, 0.24, 16] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: "#cccccc",
          metalness: 0.95,
          roughness: 0.05
        }
      )
    ] }),
    [0, 1, 2, 3, 4].map((spoke) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "mesh",
      {
        rotation: [0, 0, spoke / 5 * Math.PI * 2],
        position: [0.12, 0, 0],
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.2, 0.04, 0.04] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "meshStandardMaterial",
            {
              color: "#aaaaaa",
              metalness: 0.9,
              roughness: 0.1
            }
          )
        ]
      },
      spoke
    ))
  ] });
}
function CarInterior() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, -0.2, 0.9], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.6, 0.25, 0.35] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#0a0a0a", roughness: 0.8 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.3, -0.05, 0.65], rotation: [0.4, 0, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("torusGeometry", { args: [0.18, 0.025, 10, 24] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#1a1a1a", roughness: 0.6, metalness: 0.3 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.3, -0.18, 0.72], rotation: [0.4, 0, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.02, 0.02, 0.3, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#333333" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, -0.12, 0.88], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("circleGeometry", { args: [0.1, 16] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: "#111111",
          emissive: "#002244",
          emissiveIntensity: 0.5
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, -0.3, 0.5], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.3, 0.2, 0.5] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#151515", roughness: 0.8 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-0.4, 0, -0.3], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.5, 0.7, 0.12] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#1a1a1a", roughness: 0.9 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.4, 0, -0.3], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.5, 0.7, 0.12] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#1a1a1a", roughness: 0.9 })
    ] })
  ] });
}
function NPCCarMesh({ color, isPolice }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.3, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.8, 0.5, 4] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: isPolice ? "#ffffff" : color,
          metalness: 0.6,
          roughness: 0.3
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.7, -0.1], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.6, 0.45, 2.2] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: isPolice ? "#ffffff" : color,
          metalness: 0.6,
          roughness: 0.3
        }
      )
    ] }),
    isPolice && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 1, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.5, 0.12, 0.35] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#222222" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-0.35, 1.07, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.3, 0.08, 0.28] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "meshStandardMaterial",
          {
            color: "#0044ff",
            emissive: "#0044ff",
            emissiveIntensity: 3
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.35, 1.07, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.3, 0.08, 0.28] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "meshStandardMaterial",
          {
            color: "#ff0000",
            emissive: "#ff0000",
            emissiveIntensity: 3
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.92, 0.2, 1.3], rotation: [0, 0, Math.PI / 2], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.28, 0.28, 0.18, 12] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#111111", roughness: 0.9 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-0.92, 0.2, 1.3], rotation: [0, 0, Math.PI / 2], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.28, 0.28, 0.18, 12] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#111111", roughness: 0.9 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.92, 0.2, -1.3], rotation: [0, 0, Math.PI / 2], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.28, 0.28, 0.18, 12] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#111111", roughness: 0.9 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-0.92, 0.2, -1.3], rotation: [0, 0, Math.PI / 2], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.28, 0.28, 0.18, 12] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#111111", roughness: 0.9 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.55, 0.38, 2.02], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.1, 8, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: "#fffcee",
          emissive: "#fffcee",
          emissiveIntensity: 2
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-0.55, 0.38, 2.02], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.1, 8, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: "#fffcee",
          emissive: "#fffcee",
          emissiveIntensity: 2
        }
      )
    ] })
  ] });
}
function Building({
  position,
  size,
  color,
  floors,
  nightCity
}) {
  const windows = [];
  for (let f = 0; f < floors; f++) {
    for (let w = -1; w <= 1; w++) {
      windows.push(
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "mesh",
          {
            position: [
              w * (size[0] * 0.25),
              0.5 + f * (size[1] / floors),
              size[2] / 2 + 0.01
            ],
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [size[0] * 0.18, size[1] / floors * 0.5] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "meshStandardMaterial",
                {
                  color: nightCity ? Math.random() > 0.4 ? "#ffee88" : "#002244" : "#aaccff",
                  emissive: nightCity ? Math.random() > 0.4 ? "#ffee88" : "#000000" : "#445566",
                  emissiveIntensity: nightCity ? 1.5 : 0.3
                }
              )
            ]
          },
          `${f}-${w}`
        )
      );
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, size[1] / 2, 0], castShadow: true, receiveShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: size }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color, roughness: 0.7, metalness: 0.2 })
    ] }),
    windows,
    nightCity && /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, size[1] + 0.1, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [size[0] * 0.8, 0.15, size[2] * 0.8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: `hsl(${Math.floor(Math.random() * 360)}, 100%, 60%)`,
          emissive: `hsl(${Math.floor(Math.random() * 360)}, 100%, 60%)`,
          emissiveIntensity: 2
        }
      )
    ] })
  ] });
}
function StreetLight({
  position,
  active
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 3, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.05, 0.08, 6, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#666666", metalness: 0.7, roughness: 0.3 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.8, 5.8, 0], rotation: [0, 0, 0.2], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.04, 0.04, 1.6, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#666666", metalness: 0.7, roughness: 0.3 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [1.6, 5.85, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.4, 0.18, 0.3] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: active ? "#ffeeaa" : "#333322",
          emissive: active ? "#ffeeaa" : "#000000",
          emissiveIntensity: active ? 2.5 : 0
        }
      )
    ] }),
    active && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "pointLight",
      {
        position: [1.6, 5.6, 0],
        intensity: 1.8,
        distance: 18,
        color: "#ffddaa",
        castShadow: false
      }
    )
  ] });
}
function Tree({ position }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 1.2, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.15, 0.2, 2.4, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#4a3020", roughness: 0.9 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 3.5, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [1.1, 2.5, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#1a5a1a", roughness: 0.8 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 4.8, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [0.8, 2, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#1e6e1e", roughness: 0.8 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 5.9, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [0.5, 1.4, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#228822", roughness: 0.8 })
    ] })
  ] });
}
function Cactus({ position }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 1.5, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.2, 0.25, 3, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#2d5a1e", roughness: 0.8 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.6, 1.4, 0], rotation: [0, 0, -0.6], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.12, 0.15, 1.5, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#2d5a1e", roughness: 0.8 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.6, 2.15, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.12, 0.12, 1, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#2d5a1e", roughness: 0.8 })
    ] })
  ] });
}
function CheckpointRing({
  position,
  active
}) {
  const meshRef = reactExports.useRef(null);
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 1.5;
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { ref: meshRef, position, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("torusGeometry", { args: [3, 0.3, 12, 32] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "meshStandardMaterial",
      {
        color: active ? "#ffaa00" : "#555544",
        emissive: active ? "#ffaa00" : "#000000",
        emissiveIntensity: active ? 2 : 0
      }
    )
  ] });
}
function CityDowntownMap({
  nightCity,
  weather
}) {
  const lightsOn = nightCity || weather === "night";
  const buildings = [
    {
      pos: [18, 0, 10],
      size: [8, 30, 8],
      color: "#445566",
      floors: 8
    },
    {
      pos: [-18, 0, 10],
      size: [8, 22, 8],
      color: "#556677",
      floors: 6
    },
    {
      pos: [18, 0, -10],
      size: [8, 18, 8],
      color: "#4a5a6a",
      floors: 5
    },
    {
      pos: [-18, 0, -10],
      size: [8, 35, 8],
      color: "#445060",
      floors: 10
    },
    {
      pos: [18, 0, 40],
      size: [8, 25, 8],
      color: "#5a6070",
      floors: 7
    },
    {
      pos: [-18, 0, 40],
      size: [8, 20, 8],
      color: "#4a5868",
      floors: 6
    },
    {
      pos: [18, 0, -40],
      size: [8, 28, 8],
      color: "#505a6a",
      floors: 8
    },
    {
      pos: [-18, 0, -40],
      size: [8, 32, 8],
      color: "#445566",
      floors: 9
    },
    {
      pos: [18, 0, 70],
      size: [8, 16, 8],
      color: "#556677",
      floors: 5
    },
    {
      pos: [-18, 0, 70],
      size: [8, 24, 8],
      color: "#445566",
      floors: 7
    },
    {
      pos: [18, 0, -70],
      size: [8, 20, 8],
      color: "#4a5a6a",
      floors: 6
    },
    {
      pos: [-18, 0, -70],
      size: [8, 28, 8],
      color: "#505060",
      floors: 8
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { rotation: [-Math.PI / 2, 0, 0], receiveShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [300, 300] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: "#2a2a2a",
          roughness: weather === "rain" ? 0.05 : 0.75,
          metalness: weather === "rain" ? 0.6 : 0.05
        }
      )
    ] }),
    Array.from({ length: 30 }, (_, laneIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "mesh",
      {
        position: [0, 0.01, -75 + laneIdx * 5],
        rotation: [-Math.PI / 2, 0, 0],
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [0.25, 3] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#ffffff", roughness: 0.8 })
        ]
      },
      `z-${-75 + laneIdx * 5}`
    )),
    buildings.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      Building,
      {
        position: b.pos,
        size: b.size,
        color: b.color,
        floors: b.floors,
        nightCity
      },
      `${b.pos[0]}-${b.pos[2]}`
    )),
    [-60, -40, -20, 0, 20, 40, 60].map((z) => /* @__PURE__ */ jsxRuntimeExports.jsx(StreetLight, { position: [8, 0, z], active: lightsOn }, z)),
    [-60, -40, -20, 0, 20, 40, 60].map((z) => /* @__PURE__ */ jsxRuntimeExports.jsx(StreetLight, { position: [-8, 0, z], active: lightsOn }, `r${z}`)),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "mesh",
      {
        position: [10, 0.02, 0],
        rotation: [-Math.PI / 2, 0, 0],
        receiveShadow: true,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [4, 300] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#888888", roughness: 0.9 })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "mesh",
      {
        position: [-10, 0.02, 0],
        rotation: [-Math.PI / 2, 0, 0],
        receiveShadow: true,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [4, 300] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#888888", roughness: 0.9 })
        ]
      }
    ),
    [-50, -30, -10, 10, 30, 50].map((z) => /* @__PURE__ */ jsxRuntimeExports.jsx(Tree, { position: [11.5, 0, z] }, z)),
    [-50, -30, -10, 10, 30, 50].map((z) => /* @__PURE__ */ jsxRuntimeExports.jsx(Tree, { position: [-11.5, 0, z] }, `l${z}`))
  ] });
}
function HighwayMap({ weather }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { rotation: [-Math.PI / 2, 0, 0], receiveShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [400, 400] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#6a7a50", roughness: 0.95 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "mesh",
      {
        position: [0, 0.01, 0],
        rotation: [-Math.PI / 2, 0, 0],
        receiveShadow: true,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [22, 400] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "meshStandardMaterial",
            {
              color: "#383838",
              roughness: weather === "rain" ? 0.05 : 0.8,
              metalness: weather === "rain" ? 0.5 : 0.02
            }
          )
        ]
      }
    ),
    Array.from({ length: 40 }, (_, laneIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "mesh",
      {
        position: [0, 0.02, -100 + laneIdx * 5],
        rotation: [-Math.PI / 2, 0, 0],
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [0.25, 3] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#ffffff", roughness: 0.8 })
        ]
      },
      `z-${-100 + laneIdx * 5}`
    )),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [11.5, 0.3, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.15, 0.6, 400] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#888888", metalness: 0.7, roughness: 0.3 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-11.5, 0.3, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.15, 0.6, 400] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#888888", metalness: 0.7, roughness: 0.3 })
    ] }),
    [-80, -40, 0, 40, 80].map((z) => /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { position: [13, 0, z], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 2, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("cylinderGeometry", { args: [0.04, 0.04, 4, 8] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#888888" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 4.2, 0], children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.8, 0.8, 0.1] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#ffffff" })
      ] })
    ] }, z)),
    [
      [-40, 0, -80],
      [40, 0, -80],
      [-40, 0, 80],
      [40, 0, 80]
    ].map(([x, _y, z]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [x, -1, z], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [20, 12, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#5a6a40", roughness: 0.95 })
    ] }, `${x}-${z}`))
  ] });
}
function MountainMap({ weather }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { rotation: [-Math.PI / 2, 0, 0], receiveShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [400, 400] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#4a5040", roughness: 0.95 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "mesh",
      {
        position: [0, 0.01, 0],
        rotation: [-Math.PI / 2, 0, 0],
        receiveShadow: true,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [10, 300] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "meshStandardMaterial",
            {
              color: "#3a3a3a",
              roughness: weather === "rain" ? 0.05 : 0.8,
              metalness: weather === "rain" ? 0.5 : 0.02
            }
          )
        ]
      }
    ),
    [
      [-60, 0, -60],
      [60, 0, -60],
      [-60, 0, 60],
      [60, 0, 60],
      [0, 0, -100],
      [0, 0, 100]
    ].map(([x, _y, z]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [x, 0, z], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [25, 45, 6] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#787060", roughness: 0.9 })
    ] }, `${x}-${z}`)),
    [-30, -20, -10, 10, 20, 30].map((z) => /* @__PURE__ */ jsxRuntimeExports.jsx(Tree, { position: [8, 0, z] }, z)),
    [-30, -20, -10, 10, 20, 30].map((z) => /* @__PURE__ */ jsxRuntimeExports.jsx(Tree, { position: [-8, 0, z] }, `l${z}`)),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [5.5, 0.4, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.12, 0.8, 300] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#aaaaaa", metalness: 0.8, roughness: 0.2 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-5.5, 0.4, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.12, 0.8, 300] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#aaaaaa", metalness: 0.8, roughness: 0.2 })
    ] })
  ] });
}
function DesertMap({ weather }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { rotation: [-Math.PI / 2, 0, 0], receiveShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [400, 400] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#c8a870", roughness: 0.95 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "mesh",
      {
        position: [0, 0.01, 0],
        rotation: [-Math.PI / 2, 0, 0],
        receiveShadow: true,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [14, 300] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "meshStandardMaterial",
            {
              color: "#3a3530",
              roughness: weather === "rain" ? 0.05 : 0.85,
              metalness: weather === "rain" ? 0.4 : 0.01
            }
          )
        ]
      }
    ),
    Array.from({ length: 30 }, (_, laneIdx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "mesh",
      {
        position: [0, 0.02, -75 + laneIdx * 5],
        rotation: [-Math.PI / 2, 0, 0],
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [0.2, 3] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#ffff88", roughness: 0.8 })
        ]
      },
      `dz-${-75 + laneIdx * 5}`
    )),
    [
      [-60, 0, -40],
      [60, 0, -40],
      [-60, 0, 40],
      [60, 0, 40],
      [-50, 0, 0],
      [50, 0, 0]
    ].map(([x, _y, z]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [x, -2, z], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [22, 10, 6] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#c0a060", roughness: 0.95 })
    ] }, `d-${x}-${z}`)),
    [-40, -20, 20, 40].map((z) => /* @__PURE__ */ jsxRuntimeExports.jsx(Cactus, { position: [12, 0, z] }, z)),
    [-40, -20, 20, 40].map((z) => /* @__PURE__ */ jsxRuntimeExports.jsx(Cactus, { position: [-12, 0, z] }, `l${z}`))
  ] });
}
function RainEffect({ active }) {
  const meshRef = reactExports.useRef(null);
  const dummy = reactExports.useRef(new Object3D());
  const positions = reactExports.useRef([]);
  reactExports.useEffect(() => {
    if (!active) return;
    positions.current = Array.from({ length: 600 }, () => ({
      x: (Math.random() - 0.5) * 80,
      y: Math.random() * 40,
      z: (Math.random() - 0.5) * 80
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
      meshRef.current.setMatrixAt(i, dummy.current.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  if (!active) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("instancedMesh", { ref: meshRef, args: [void 0, void 0, 600], children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.02, 0.4, 0.02] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#88aacc", transparent: true, opacity: 0.5 })
  ] });
}
function GhostCar({
  name: _name,
  color,
  offset
}) {
  const ref = reactExports.useRef(null);
  const t = reactExports.useRef(offset);
  useFrame((_, delta) => {
    if (!ref.current) return;
    t.current += delta * 0.4;
    const radius = 25 + offset * 5;
    ref.current.position.x = Math.sin(t.current) * radius;
    ref.current.position.z = Math.cos(t.current) * radius;
    ref.current.position.y = 0;
    ref.current.rotation.y = -t.current + Math.PI / 2;
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.3, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.8, 0.5, 3.8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color, metalness: 0.7, roughness: 0.2 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 0.7, -0.1], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.6, 0.42, 2] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color, metalness: 0.7, roughness: 0.2 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, 1.8, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [1.5, 0.4] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#000000", transparent: true, opacity: 0.7 })
    ] })
  ] });
}
function SkySphere({
  topColor,
  botColor
}) {
  const meshRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material;
    mat.uniforms.topColor.value.set(topColor);
    mat.uniforms.botColor.value.set(botColor);
  }, [topColor, botColor]);
  const uniforms = reactExports.useRef({
    topColor: { value: new Color(topColor) },
    botColor: { value: new Color(botColor) }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { ref: meshRef, scale: [-1, 1, 1], children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [450, 16, 16] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "shaderMaterial",
      {
        uniforms: uniforms.current,
        vertexShader: `
          varying vec3 vPos;
          void main() {
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 botColor;
          varying vec3 vPos;
          void main() {
            float h = normalize(vPos).y;
            gl_FragColor = vec4(mix(botColor, topColor, max(h, 0.0)), 1.0);
          }
        `,
        side: BackSide
      }
    )
  ] });
}
function GameScene({
  stateRef,
  keysRef,
  touchRef,
  audioRef,
  onStateUpdate
}) {
  var _a, _b, _c;
  const { scene, camera } = useThree();
  const carRef = reactExports.useRef(null);
  const carPosRef = reactExports.useRef(new Vector3(0, 0.2, 0));
  const carRotRef = reactExports.useRef(0);
  const carSpeedRef = reactExports.useRef(0);
  const carDriftRef = reactExports.useRef(0);
  const carVelRef = reactExports.useRef(new Vector3());
  const speedLimitTimerRef = reactExports.useRef(0);
  const wantedLevelRef = reactExports.useRef(0);
  const challengeTimerRef = reactExports.useRef(0);
  const driftScoreRef = reactExports.useRef(0);
  const checkpointIdxRef = reactExports.useRef(0);
  const escapeTimerRef = reactExports.useRef(0);
  const policeSpawnedRef = reactExports.useRef(false);
  const nightTimerRef = reactExports.useRef(0);
  const npcGroupRef = reactExports.useRef(null);
  const npcsRef = reactExports.useRef([]);
  reactExports.useRef([]);
  reactExports.useRef(null);
  reactExports.useEffect(() => {
    const st = stateRef.current;
    const cfg2 = MAP_CONFIGS[st.map];
    scene.fog = new FogExp2(
      cfg2.fogColor,
      st.weather === "fog" ? 0.025 : st.weather === "rain" ? 0.015 : cfg2.fogDensity
    );
    return () => {
      scene.fog = null;
    };
  }, [(_a = stateRef.current) == null ? void 0 : _a.map, (_b = stateRef.current) == null ? void 0 : _b.weather]);
  reactExports.useEffect(() => {
    if (!npcGroupRef.current) return;
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
      "#446600"
    ];
    const count = 6;
    for (let i = 0; i < count; i++) {
      const group = new Group();
      group.position.set(
        (Math.random() - 0.5) * 20,
        0,
        (Math.random() - 0.5) * 60
      );
      npcGroupRef.current.add(group);
      const isPolice = false;
      const color = colors[i % colors.length];
      const radius = 20 + i * 8;
      const wps = [];
      for (let w = 0; w < 8; w++) {
        const angle = w / 8 * Math.PI * 2;
        wps.push(
          new Vector3(
            Math.sin(angle) * radius,
            0,
            Math.cos(angle) * radius
          )
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
        lightTimer: 0
      });
    }
  }, [(_c = stateRef.current) == null ? void 0 : _c.map]);
  const spawnPolice = reactExports.useCallback(() => {
    if (!npcGroupRef.current || policeSpawnedRef.current) return;
    policeSpawnedRef.current = true;
    const wantedLvl = wantedLevelRef.current;
    const count = Math.min(wantedLvl, 3);
    for (let i = 0; i < count; i++) {
      const group = new Group();
      const spawnAngle = i / count * Math.PI * 2;
      group.position.set(
        carPosRef.current.x + Math.sin(spawnAngle) * 30,
        0,
        carPosRef.current.z + Math.cos(spawnAngle) * 30
      );
      npcGroupRef.current.add(group);
      const wps = [];
      for (let w = 0; w < 4; w++) {
        wps.push(
          carPosRef.current.clone().add(
            new Vector3(
              (Math.random() - 0.5) * 10,
              0,
              (Math.random() - 0.5) * 10
            )
          )
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
        lightTimer: 0
      });
    }
  }, []);
  const checkpoints = [
    new Vector3(0, 1, -30),
    new Vector3(15, 1, -60),
    new Vector3(-15, 1, -90),
    new Vector3(0, 1, -120),
    new Vector3(15, 1, -150)
  ];
  useFrame((state, delta) => {
    var _a2;
    const dt = Math.min(delta, 0.05);
    const gs2 = stateRef.current;
    if (!gs2.started || gs2.paused || gs2.gameOver) return;
    const keys = keysRef.current;
    const touch = touchRef.current;
    const accel = keys.has("ArrowUp") || keys.has("w") || keys.has("W") || touch.gas;
    const brake = keys.has("ArrowDown") || keys.has("s") || keys.has("S") || touch.brake;
    const steerLeft = keys.has("ArrowLeft") || keys.has("a") || keys.has("A") || touch.steerX < -0.3;
    const steerRight = keys.has("ArrowRight") || keys.has("d") || keys.has("D") || touch.steerX > 0.3;
    const drifting = keys.has("Shift") || keys.has("ShiftLeft") || keys.has("ShiftRight") || touch.drift;
    const maxSpeed = gs2.challenge === "speed" ? 80 : 60;
    const accelRate = 18;
    const brakeRate = 25;
    const grip = drifting ? 0.3 : 0.92;
    const steerAmount = Math.max(0.01, 1.5 - carSpeedRef.current * 0.01);
    if (accel)
      carSpeedRef.current = Math.min(
        carSpeedRef.current + accelRate * dt,
        maxSpeed
      );
    else if (brake)
      carSpeedRef.current = Math.max(carSpeedRef.current - brakeRate * dt, -10);
    else carSpeedRef.current *= 0.985;
    if (steerLeft)
      carRotRef.current += steerAmount * dt * (carSpeedRef.current > 0 ? 1 : -1);
    if (steerRight)
      carRotRef.current -= steerAmount * dt * (carSpeedRef.current > 0 ? 1 : -1);
    if (drifting && Math.abs(carSpeedRef.current) > 10) {
      carDriftRef.current += (steerLeft ? 1 : steerRight ? -1 : 0) * dt * 3;
      carDriftRef.current *= 0.95;
    } else {
      carDriftRef.current *= 0.88;
    }
    const forward = new Vector3(
      -Math.sin(carRotRef.current + carDriftRef.current * 0.4),
      0,
      -Math.cos(carRotRef.current + carDriftRef.current * 0.4)
    );
    carVelRef.current.lerp(forward.multiplyScalar(carSpeedRef.current), grip);
    carPosRef.current.addScaledVector(carVelRef.current, dt);
    const speedKmh = Math.abs(carSpeedRef.current) * 3.6;
    const bob = Math.sin(state.clock.elapsedTime * 8) * Math.min(speedKmh / 200, 0.04);
    if (carRef.current) {
      carRef.current.position.copy(carPosRef.current);
      carRef.current.position.y = 0 + bob;
      carRef.current.rotation.y = carRotRef.current;
      carRef.current.rotation.z = carDriftRef.current * 0.15;
    }
    if (gs2.camera === "third") {
      const camOffset = new Vector3(
        Math.sin(carRotRef.current) * 10,
        3.5,
        Math.cos(carRotRef.current) * 10
      );
      camera.position.lerp(carPosRef.current.clone().add(camOffset), 0.08);
      camera.lookAt(carPosRef.current);
    } else {
      const fwd = new Vector3(
        -Math.sin(carRotRef.current),
        0,
        -Math.cos(carRotRef.current)
      );
      const fpPos = carPosRef.current.clone().add(new Vector3(0, 1.1, 0)).addScaledVector(fwd, 0.5);
      camera.position.copy(fpPos);
      camera.lookAt(fpPos.clone().addScaledVector(fwd, 10));
    }
    for (const npc of npcsRef.current) {
      if (npc.isPolice) {
        const dir = carPosRef.current.clone().sub(npc.mesh.position).normalize();
        npc.mesh.position.addScaledVector(dir, npc.speed * dt);
        npc.mesh.rotation.y = Math.atan2(-dir.x, -dir.z);
        npc.lightTimer += dt;
        const flashOn = Math.floor(npc.lightTimer * 4) % 2 === 0;
        const blueLight = npc.mesh.children.find(
          (c) => {
            var _a3, _b2;
            return ((_b2 = (_a3 = c.material) == null ? void 0 : _a3.emissive) == null ? void 0 : _b2.getHexString()) === "0044ff";
          }
        );
        const redLight = npc.mesh.children.find(
          (c) => {
            var _a3, _b2;
            return ((_b2 = (_a3 = c.material) == null ? void 0 : _a3.emissive) == null ? void 0 : _b2.getHexString()) === "ff0000";
          }
        );
        if (blueLight)
          blueLight.material.emissiveIntensity = flashOn ? 4 : 0.5;
        if (redLight)
          redLight.material.emissiveIntensity = flashOn ? 0.5 : 4;
      } else {
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
    if (speedKmh > 150) {
      speedLimitTimerRef.current += dt;
      if (speedLimitTimerRef.current > 3 && wantedLevelRef.current === 0) {
        wantedLevelRef.current = 1;
        onStateUpdate({
          wantedLevel: 1,
          policeActive: true,
          notification: "⚠️ POLICE ALERT!"
        });
        spawnPolice();
      }
    } else {
      speedLimitTimerRef.current = Math.max(
        0,
        speedLimitTimerRef.current - dt * 0.5
      );
    }
    if (wantedLevelRef.current > 0 && gs2.policeActive) {
      const closestPolice = npcsRef.current.filter((n) => n.isPolice).reduce(
        (min, n) => Math.min(min, carPosRef.current.distanceTo(n.mesh.position)),
        Number.POSITIVE_INFINITY
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
              notification: "✅ Escaped!"
            });
          }
          escapeTimerRef.current = 0;
        }
      } else {
        escapeTimerRef.current = 0;
      }
    }
    if (drifting && Math.abs(carSpeedRef.current) > 10 && Math.abs(carDriftRef.current) > 0.1) {
      driftScoreRef.current += dt * speedKmh * 0.5;
    }
    if (gs2.challenge === "drift") {
      onStateUpdate({
        driftScore: Math.floor(driftScoreRef.current),
        speed: Math.floor(speedKmh)
      });
    } else if (gs2.challenge === "speed") {
      challengeTimerRef.current += dt;
      if (speedKmh >= 200) {
        onStateUpdate({
          notification: "🏁 200 KM/H ACHIEVED! Challenge Complete!",
          challengeTime: Math.floor(challengeTimerRef.current)
        });
      }
      onStateUpdate({
        challengeTime: Math.floor(challengeTimerRef.current),
        speed: Math.floor(speedKmh)
      });
    } else if (gs2.challenge === "time_trial" || gs2.challenge === "checkpoint") {
      challengeTimerRef.current += dt;
      const cp = checkpoints[checkpointIdxRef.current];
      if (cp && carPosRef.current.distanceTo(cp) < 5) {
        checkpointIdxRef.current = (checkpointIdxRef.current + 1) % checkpoints.length;
        onStateUpdate({
          checkpointIndex: checkpointIdxRef.current,
          notification: `🏁 Checkpoint ${checkpointIdxRef.current}!`
        });
      }
      onStateUpdate({
        challengeTime: Math.floor(challengeTimerRef.current),
        speed: Math.floor(speedKmh)
      });
    } else if (gs2.challenge === "escape") {
      challengeTimerRef.current += dt;
      const remaining = 60 - Math.floor(challengeTimerRef.current);
      if (remaining <= 0) {
        onStateUpdate({ notification: "✅ Escaped! Challenge Complete!" });
      }
      onStateUpdate({ challengeTime: remaining, speed: Math.floor(speedKmh) });
    } else {
      onStateUpdate({ speed: Math.floor(speedKmh) });
    }
    nightTimerRef.current += dt * 0.02;
    (_a2 = audioRef.current) == null ? void 0 : _a2.update(
      carSpeedRef.current,
      drifting,
      wantedLevelRef.current > 0,
      dt
    );
  });
  const gs = stateRef.current;
  const cfg = MAP_CONFIGS[gs.map];
  const isNight = gs.map === "night_city" || gs.weather === "night";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SkySphere, { topColor: cfg.skyTop, botColor: cfg.skyBot }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ambientLight", { intensity: isNight ? 0.08 : cfg.ambientIntensity }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "directionalLight",
      {
        position: cfg.sunPos,
        intensity: isNight ? 0.3 : cfg.sunIntensity,
        castShadow: true,
        "shadow-mapSize-width": 1024,
        "shadow-mapSize-height": 1024,
        "shadow-camera-near": 0.1,
        "shadow-camera-far": 500,
        "shadow-camera-left": -100,
        "shadow-camera-right": 100,
        "shadow-camera-top": 100,
        "shadow-camera-bottom": -100
      }
    ),
    isNight && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "pointLight",
        {
          position: [0, 20, 0],
          intensity: 0.4,
          color: "#8888ff",
          distance: 80
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("hemisphereLight", { args: ["#1a1a3a", "#000000", 0.15] })
    ] }),
    gs.map === "city" && /* @__PURE__ */ jsxRuntimeExports.jsx(CityDowntownMap, { nightCity: false, weather: gs.weather }),
    gs.map === "night_city" && /* @__PURE__ */ jsxRuntimeExports.jsx(CityDowntownMap, { nightCity: true, weather: gs.weather }),
    gs.map === "highway" && /* @__PURE__ */ jsxRuntimeExports.jsx(HighwayMap, { weather: gs.weather }),
    gs.map === "mountain" && /* @__PURE__ */ jsxRuntimeExports.jsx(MountainMap, { weather: gs.weather }),
    gs.map === "desert" && /* @__PURE__ */ jsxRuntimeExports.jsx(DesertMap, { weather: gs.weather }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(BMWM5, { carRef, color: gs.carColor }),
    gs.camera === "first" && /* @__PURE__ */ jsxRuntimeExports.jsx(CarInterior, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("group", { ref: npcGroupRef, children: npcsRef.current.map((npc, npcIdx) => /* @__PURE__ */ jsxRuntimeExports.jsx("primitive", { object: npc.mesh, children: /* @__PURE__ */ jsxRuntimeExports.jsx(NPCCarMesh, { color: npc.color, isPolice: npc.isPolice }) }, `vehicle-${npcIdx * 7 + 3}`)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(GhostCar, { name: "Player2", color: "#ff6600", offset: 0 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(GhostCar, { name: "DriftKing", color: "#00aaff", offset: 2 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(GhostCar, { name: "RacerX", color: "#aa00ff", offset: 4 }),
    (gs.challenge === "time_trial" || gs.challenge === "checkpoint") && checkpoints.map((cp, cpIdx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      CheckpointRing,
      {
        position: cp.toArray(),
        active: cpIdx === gs.checkpointIndex
      },
      `ring-pos-${cpIdx * 11}`
    )),
    /* @__PURE__ */ jsxRuntimeExports.jsx(RainEffect, { active: gs.weather === "rain" })
  ] });
}
function MiniMap({
  carX,
  carZ,
  carAngle
}) {
  const canvasRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, 100, 100);
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
    const cx = 50 + carX / 150 * 50;
    const cz = 50 + carZ / 150 * 50;
    ctx.save();
    ctx.translate(cx, cz);
    ctx.rotate(-carAngle);
    ctx.fillStyle = "#ff6600";
    ctx.fillRect(-3, -5, 6, 10);
    ctx.restore();
    ctx.strokeStyle = "rgba(255,150,0,0.6)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 100, 100);
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "canvas",
    {
      ref: canvasRef,
      width: 100,
      height: 100,
      style: { borderRadius: "8px", border: "1px solid rgba(255,150,0,0.4)" }
    }
  );
}
function HUD({
  state,
  carX,
  carZ,
  carAngle,
  onCameraToggle,
  onPause,
  onMapChange,
  onWeatherChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      style: {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: "'Courier New', monospace"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              position: "absolute",
              top: 12,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 12,
              pointerEvents: "auto"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  value: state.map,
                  onChange: (e) => onMapChange(e.target.value),
                  "data-ocid": "sdl.map.select",
                  style: {
                    background: "rgba(0,0,0,0.75)",
                    color: "#ffaa00",
                    border: "1px solid rgba(255,150,0,0.5)",
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: 12,
                    cursor: "pointer"
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "city", children: "🏙️ City Downtown" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "highway", children: "🛣️ Highway" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "mountain", children: "⛰️ Mountain" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "desert", children: "🏜️ Desert" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "night_city", children: "🌃 Night City" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "select",
                {
                  value: state.weather,
                  onChange: (e) => onWeatherChange(e.target.value),
                  "data-ocid": "sdl.weather.select",
                  style: {
                    background: "rgba(0,0,0,0.75)",
                    color: "#88ccff",
                    border: "1px solid rgba(100,200,255,0.5)",
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: 12,
                    cursor: "pointer"
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "sunny", children: "☀️ Sunny" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "night", children: "🌙 Night" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "rain", children: "🌧️ Rain" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "fog", children: "🌫️ Fog" })
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
              position: "absolute",
              top: 12,
              right: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 6,
              pointerEvents: "auto"
            },
            children: [
              state.wantedLevel > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 3 }, children: Array.from({ length: 5 }, (_, starIdx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  style: {
                    fontSize: 18,
                    color: starIdx < state.wantedLevel ? "#ff2222" : "rgba(255,100,100,0.3)",
                    textShadow: starIdx < state.wantedLevel ? "0 0 8px #ff0000" : "none"
                  },
                  children: "★"
                },
                `star-level-${starIdx * 13}`
              )) }),
              state.challenge !== "free" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  style: {
                    background: "rgba(0,0,0,0.7)",
                    border: "1px solid rgba(255,150,0,0.5)",
                    borderRadius: 6,
                    padding: "4px 10px",
                    color: "#ffaa00",
                    fontSize: 13
                  },
                  children: [
                    "⏱ ",
                    state.challengeTime,
                    "s"
                  ]
                }
              ),
              state.challenge === "drift" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  style: {
                    background: "rgba(0,0,0,0.7)",
                    border: "1px solid rgba(255,200,0,0.5)",
                    borderRadius: 6,
                    padding: "4px 10px",
                    color: "#ffdd00",
                    fontSize: 13
                  },
                  children: [
                    "🌀 Drift: ",
                    state.driftScore
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: onPause,
                  "data-ocid": "sdl.pause.button",
                  style: {
                    background: "rgba(0,0,0,0.7)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: 6,
                    padding: "4px 12px",
                    color: "white",
                    fontSize: 12,
                    cursor: "pointer",
                    pointerEvents: "auto"
                  },
                  children: "⏸ PAUSE"
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
              bottom: 20,
              left: 20,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              pointerEvents: "none"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MiniMap, { carX, carZ, carAngle }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  style: {
                    background: "rgba(0,0,0,0.75)",
                    border: "2px solid rgba(255,150,0,0.7)",
                    borderRadius: 12,
                    padding: "10px 18px",
                    textAlign: "center"
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        style: {
                          color: "#ff8800",
                          fontSize: 36,
                          fontWeight: 700,
                          lineHeight: 1,
                          textShadow: "0 0 12px #ff6600"
                        },
                        children: state.speed
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        style: { color: "#ffaa44", fontSize: 11, letterSpacing: "0.1em" },
                        children: "KM/H"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#ff4444", fontSize: 11, marginTop: 2 }, children: state.speed > 180 ? "MAX SPEED" : state.speed > 120 ? "HIGH" : "" })
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
              position: "absolute",
              bottom: 20,
              right: 20,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 8,
              pointerEvents: "auto"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: onCameraToggle,
                  "data-ocid": "sdl.camera.toggle",
                  style: {
                    background: "rgba(0,0,0,0.75)",
                    border: "1px solid rgba(100,200,255,0.6)",
                    borderRadius: 8,
                    padding: "6px 14px",
                    color: "#88ddff",
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "monospace"
                  },
                  children: [
                    "📷 ",
                    state.camera === "third" ? "TPV" : "FPV"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  style: {
                    background: "rgba(0,0,0,0.7)",
                    border: "1px solid rgba(255,150,0,0.4)",
                    borderRadius: 8,
                    padding: "6px 12px",
                    color: "rgba(255,200,100,0.9)",
                    fontSize: 11,
                    textAlign: "right"
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: MAP_CONFIGS[state.map].name }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "rgba(150,200,255,0.8)" }, children: state.weather.toUpperCase() }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "rgba(200,255,150,0.8)" }, children: state.challenge.toUpperCase().replace("_", " ") })
                  ]
                }
              )
            ]
          }
        ),
        state.notification && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
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
              zIndex: 10
            },
            children: state.notification
          }
        )
      ]
    }
  );
}
function MobileControls({
  touchRef
}) {
  const joystickRef = reactExports.useRef(null);
  const joystickBaseRef = reactExports.useRef(null);
  const btnStyle = (color, active = false) => ({
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
    boxShadow: `0 0 12px ${color}44`
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      style: {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        padding: "0 20px 100px"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            ref: joystickRef,
            style: {
              width: 110,
              height: 110,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              border: "2px solid rgba(255,255,255,0.3)",
              position: "relative",
              pointerEvents: "auto",
              touchAction: "none"
            },
            onTouchStart: (e) => {
              const t = e.touches[0];
              joystickBaseRef.current = { x: t.clientX, y: t.clientY };
            },
            onTouchMove: (e) => {
              if (!joystickBaseRef.current) return;
              const t = e.touches[0];
              const dx = (t.clientX - joystickBaseRef.current.x) / 55;
              const dy = (t.clientY - joystickBaseRef.current.y) / 55;
              touchRef.current.steerX = Math.max(-1, Math.min(1, dx));
              touchRef.current.steerY = Math.max(-1, Math.min(1, dy));
              if (Math.abs(dy) > 0.3) {
                touchRef.current.gas = dy < -0.3;
                touchRef.current.brake = dy > 0.3;
              }
            },
            onTouchEnd: () => {
              joystickBaseRef.current = null;
              touchRef.current.steerX = 0;
              touchRef.current.steerY = 0;
              touchRef.current.gas = false;
              touchRef.current.brake = false;
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                style: {
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.3)",
                  border: "2px solid rgba(255,255,255,0.6)"
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
              pointerEvents: "auto"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: 10 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    "data-ocid": "sdl.drift.button",
                    style: btnStyle("#ffcc00"),
                    onTouchStart: () => {
                      touchRef.current.drift = true;
                    },
                    onTouchEnd: () => {
                      touchRef.current.drift = false;
                    },
                    children: "DRIFT"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    "data-ocid": "sdl.brake.button",
                    style: btnStyle("#ff4444"),
                    onTouchStart: () => {
                      touchRef.current.brake = true;
                    },
                    onTouchEnd: () => {
                      touchRef.current.brake = false;
                    },
                    children: "BRAKE"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  "data-ocid": "sdl.gas.button",
                  style: {
                    ...btnStyle("#44ff88"),
                    width: 148,
                    borderRadius: 12,
                    height: 58
                  },
                  onTouchStart: () => {
                    touchRef.current.gas = true;
                  },
                  onTouchEnd: () => {
                    touchRef.current.gas = false;
                  },
                  children: "⚡ GAS"
                }
              )
            ]
          }
        )
      ]
    }
  );
}
function PauseMenu({
  onResume,
  onExit,
  onMapChange,
  onWeatherChange,
  map,
  weather
}) {
  const btn = (style) => ({
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
    ...style
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      style: {
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          style: {
            background: "rgba(10,5,0,0.95)",
            border: "2px solid rgba(255,150,0,0.6)",
            borderRadius: 16,
            padding: "32px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            minWidth: 280
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "h2",
              {
                style: {
                  color: "#ff8800",
                  fontFamily: "monospace",
                  margin: 0,
                  textAlign: "center",
                  letterSpacing: "0.1em"
                },
                children: "⏸ PAUSED"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                style: btn(),
                onClick: onResume,
                "data-ocid": "sdl.resume.button",
                children: "▶ RESUME"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                value: map,
                onChange: (e) => onMapChange(e.target.value),
                style: { ...btn(), textAlign: "center" },
                "data-ocid": "sdl.pause.map.select",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "city", children: "🏙️ City Downtown" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "highway", children: "🛣️ Highway" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "mountain", children: "⛰️ Mountain" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "desert", children: "🏜️ Desert" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "night_city", children: "🌃 Night City" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                value: weather,
                onChange: (e) => onWeatherChange(e.target.value),
                style: { ...btn(), textAlign: "center" },
                "data-ocid": "sdl.pause.weather.select",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "sunny", children: "☀️ Sunny" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "night", children: "🌙 Night" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "rain", children: "🌧️ Rain" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "fog", children: "🌫️ Fog" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                style: btn({
                  background: "rgba(50,0,0,0.9)",
                  borderColor: "rgba(255,50,50,0.6)",
                  color: "#ff5555"
                }),
                onClick: onExit,
                "data-ocid": "sdl.exit.button",
                children: "✕ EXIT GAME"
              }
            )
          ]
        }
      )
    }
  );
}
function StartScreen({
  onStart,
  selectedMap,
  selectedWeather,
  selectedChallenge,
  selectedColor,
  onMapChange,
  onWeatherChange,
  onChallengeChange,
  onColorChange
}) {
  const carColors = ["#1a1a2e", "#c0392b", "#f39c12", "#2ecc71", "#8e44ad"];
  const colorNames = [
    "Midnight Navy",
    "Racing Red",
    "Amber Gold",
    "Emerald",
    "Royal Purple"
  ];
  const selStyle = (active) => ({
    padding: "8px 14px",
    borderRadius: 8,
    border: `1px solid ${active ? "rgba(255,150,0,0.9)" : "rgba(255,150,0,0.3)"}`,
    background: active ? "rgba(255,100,0,0.3)" : "rgba(0,0,0,0.6)",
    color: active ? "#ffcc00" : "rgba(255,200,100,0.7)",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "monospace",
    transition: "all 0.2s"
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      style: {
        position: "absolute",
        inset: 0,
        background: "linear-gradient(160deg, #050500 0%, #100800 40%, #0a0400 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 30,
        overflow: "auto",
        padding: 20
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: "/assets/generated/street-drift-legends-thumb.dim_400x225.jpg",
            alt: "Street Drift Legends",
            style: {
              width: "min(400px, 90vw)",
              borderRadius: 16,
              boxShadow: "0 0 40px rgba(255,100,0,0.6), 0 0 80px rgba(255,60,0,0.3)",
              marginBottom: 20,
              objectFit: "cover"
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "h1",
          {
            style: {
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
              filter: "drop-shadow(0 0 16px rgba(255,120,0,0.8))"
            },
            children: "STREET DRIFT LEGENDS"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            style: {
              color: "rgba(255,180,80,0.7)",
              fontSize: 14,
              fontFamily: "monospace",
              marginBottom: 24,
              letterSpacing: "0.1em"
            },
            children: "3D OPEN WORLD DRIVING SIMULATOR"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              maxWidth: 520,
              width: "100%",
              marginBottom: 20
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    style: {
                      color: "rgba(255,180,80,0.8)",
                      fontSize: 11,
                      marginBottom: 6,
                      fontFamily: "monospace",
                      letterSpacing: "0.08em"
                    },
                    children: "📍 MAP"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "select",
                  {
                    value: selectedMap,
                    onChange: (e) => onMapChange(e.target.value),
                    "data-ocid": "sdl.start.map.select",
                    style: {
                      width: "100%",
                      background: "rgba(0,0,0,0.7)",
                      color: "#ffcc88",
                      border: "1px solid rgba(255,150,0,0.5)",
                      borderRadius: 8,
                      padding: "8px 10px",
                      fontSize: 12,
                      cursor: "pointer"
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "city", children: "🏙️ City Downtown" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "highway", children: "🛣️ Highway" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "mountain", children: "⛰️ Mountain Road" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "desert", children: "🏜️ Desert Area" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "night_city", children: "🌃 Night City" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    style: {
                      color: "rgba(255,180,80,0.8)",
                      fontSize: 11,
                      marginBottom: 6,
                      fontFamily: "monospace",
                      letterSpacing: "0.08em"
                    },
                    children: "🌤 WEATHER"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "select",
                  {
                    value: selectedWeather,
                    onChange: (e) => onWeatherChange(e.target.value),
                    "data-ocid": "sdl.start.weather.select",
                    style: {
                      width: "100%",
                      background: "rgba(0,0,0,0.7)",
                      color: "#88ccff",
                      border: "1px solid rgba(100,200,255,0.5)",
                      borderRadius: 8,
                      padding: "8px 10px",
                      fontSize: 12,
                      cursor: "pointer"
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "sunny", children: "☀️ Sunny" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "night", children: "🌙 Night" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "rain", children: "🌧️ Rain" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "fog", children: "🌫️ Fog" })
                    ]
                  }
                )
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: 20, width: "100%", maxWidth: 520 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              style: {
                color: "rgba(255,180,80,0.8)",
                fontSize: 11,
                marginBottom: 8,
                fontFamily: "monospace",
                letterSpacing: "0.08em"
              },
              children: "🏆 CHALLENGE"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 }, children: [
            "free",
            "time_trial",
            "drift",
            "speed",
            "checkpoint",
            "escape"
          ].map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              style: selStyle(selectedChallenge === c),
              onClick: () => onChallengeChange(c),
              "data-ocid": `sdl.challenge.${c}.button`,
              children: c === "free" ? "🚗 Free Drive" : c === "time_trial" ? "⏱ Time Trial" : c === "drift" ? "🌀 Drift" : c === "speed" ? "⚡ Speed" : c === "checkpoint" ? "🏁 Race" : "🚔 Escape"
            },
            c
          )) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: 28, width: "100%", maxWidth: 520 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              style: {
                color: "rgba(255,180,80,0.8)",
                fontSize: 11,
                marginBottom: 8,
                fontFamily: "monospace",
                letterSpacing: "0.08em"
              },
              children: "🎨 CAR COLOR"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", gap: 10 }, children: carColors.map((c, colorIdx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => onColorChange(c),
              "data-ocid": `sdl.carcolor.${colorIdx + 1}.button`,
              title: colorNames[colorIdx],
              style: {
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: c,
                border: selectedColor === c ? "3px solid #ffaa00" : "2px solid rgba(255,255,255,0.3)",
                cursor: "pointer",
                boxShadow: selectedColor === c ? `0 0 12px ${c}` : "none",
                transition: "all 0.2s"
              }
            },
            c
          )) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "center"
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: onStart,
                "data-ocid": "sdl.play.primary_button",
                style: {
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
                  boxShadow: "0 0 24px rgba(255,100,0,0.7), 0 4px 20px rgba(200,60,0,0.5)",
                  transition: "all 0.2s"
                },
                children: "🚗 PLAY NOW"
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            style: {
              marginTop: 24,
              color: "rgba(255,180,80,0.5)",
              fontSize: 11,
              fontFamily: "monospace",
              textAlign: "center",
              lineHeight: 1.8
            },
            children: "WASD / ARROWS: Drive  |  SHIFT: Drift  |  C: Camera  |  ESC: Pause"
          }
        )
      ]
    }
  );
}
function StreetDriftLegends({
  onClose
}) {
  const audioRef = reactExports.useRef(new GameAudio());
  const keysRef = reactExports.useRef(/* @__PURE__ */ new Set());
  const touchRef = reactExports.useRef({
    gas: false,
    brake: false,
    drift: false,
    steerX: 0,
    steerY: 0
  });
  const carPosForHUD = reactExports.useRef({ x: 0, z: 0, angle: 0 });
  const [gameState, setGameState] = reactExports.useState({
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
    notificationTimer: 0
  });
  const stateRef = reactExports.useRef(gameState);
  stateRef.current = gameState;
  reactExports.useEffect(() => {
    if (!gameState.notification) return;
    const t = setTimeout(
      () => setGameState((s) => ({ ...s, notification: "" })),
      3e3
    );
    return () => clearTimeout(t);
  }, [gameState.notification]);
  reactExports.useEffect(() => {
    const onDown = (e) => {
      keysRef.current.add(e.key);
      if (e.key === "c" || e.key === "C") {
        setGameState((s) => ({
          ...s,
          camera: s.camera === "third" ? "first" : "third"
        }));
      }
      if (e.key === "Escape") {
        setGameState((s) => ({ ...s, paused: !s.paused }));
      }
      if (["ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault();
    };
    const onUp = (e) => keysRef.current.delete(e.key);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);
  reactExports.useEffect(() => {
    return () => {
      audioRef.current.stop();
    };
  }, []);
  const onStateUpdate = reactExports.useCallback((patch) => {
    setGameState((s) => ({ ...s, ...patch }));
  }, []);
  const handleStart = reactExports.useCallback(() => {
    audioRef.current.init();
    setGameState((s) => ({ ...s, started: true }));
  }, []);
  const handlePause = reactExports.useCallback(() => {
    setGameState((s) => ({ ...s, paused: !s.paused }));
  }, []);
  const handleResume = reactExports.useCallback(() => {
    setGameState((s) => ({ ...s, paused: false }));
  }, []);
  const handleCameraToggle = reactExports.useCallback(() => {
    setGameState((s) => ({
      ...s,
      camera: s.camera === "third" ? "first" : "third"
    }));
  }, []);
  const motionBlur = gameState.speed > 180 ? `blur(${Math.min((gameState.speed - 180) / 40, 1)}px)` : "none";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000"
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { width: "100%", height: "100%", position: "relative" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Canvas,
          {
            shadows: true,
            gl: { antialias: true, powerPreference: "high-performance" },
            camera: { fov: 70, near: 0.1, far: 1e3, position: [0, 5, 10] },
            style: { width: "100%", height: "100%", filter: motionBlur },
            onCreated: ({ gl }) => {
              gl.shadowMap.enabled = true;
              gl.shadowMap.type = PCFSoftShadowMap;
              gl.toneMapping = ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.2;
            },
            children: gameState.started && /* @__PURE__ */ jsxRuntimeExports.jsx(
              GameScene,
              {
                stateRef,
                keysRef,
                touchRef,
                audioRef,
                onStateUpdate
              }
            )
          }
        ),
        !gameState.started && /* @__PURE__ */ jsxRuntimeExports.jsx(
          StartScreen,
          {
            onStart: handleStart,
            selectedMap: gameState.map,
            selectedWeather: gameState.weather,
            selectedChallenge: gameState.challenge,
            selectedColor: gameState.carColor,
            onMapChange: (m) => setGameState((s) => ({ ...s, map: m })),
            onWeatherChange: (w) => setGameState((s) => ({ ...s, weather: w })),
            onChallengeChange: (c) => setGameState((s) => ({ ...s, challenge: c })),
            onColorChange: (c) => setGameState((s) => ({ ...s, carColor: c }))
          }
        ),
        gameState.started && !gameState.paused && /* @__PURE__ */ jsxRuntimeExports.jsx(
          HUD,
          {
            state: gameState,
            carX: carPosForHUD.current.x,
            carZ: carPosForHUD.current.z,
            carAngle: carPosForHUD.current.angle,
            onCameraToggle: handleCameraToggle,
            onPause: handlePause,
            onMapChange: (m) => setGameState((s) => ({ ...s, map: m })),
            onWeatherChange: (w) => setGameState((s) => ({ ...s, weather: w }))
          }
        ),
        gameState.started && gameState.paused && /* @__PURE__ */ jsxRuntimeExports.jsx(
          PauseMenu,
          {
            onResume: handleResume,
            onExit: onClose,
            map: gameState.map,
            weather: gameState.weather,
            onMapChange: (m) => setGameState((s) => ({ ...s, map: m })),
            onWeatherChange: (w) => setGameState((s) => ({ ...s, weather: w }))
          }
        ),
        gameState.started && !gameState.paused && /* @__PURE__ */ jsxRuntimeExports.jsx(MobileControls, { touchRef }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: onClose,
            "data-ocid": "sdl.close.button",
            style: {
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
              pointerEvents: "auto"
            },
            children: "✕ EXIT"
          }
        )
      ] })
    }
  );
}
export {
  StreetDriftLegends as default
};
