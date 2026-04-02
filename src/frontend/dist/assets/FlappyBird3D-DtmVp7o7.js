const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/SandboxMode-iLlY17Ve.js","assets/index-sF3w0N2q.js","assets/index-B_a-Wshn.css","assets/react-three-fiber.esm-ayI3axKt.js"])))=>i.map(i=>d[i]);
import { r as reactExports, j as jsxRuntimeExports, _ as __vitePreload } from "./index-sF3w0N2q.js";
import { R as REVISION, V as Vector3, S as ShaderMaterial, B as BackSide, U as UniformsUtils, M as Mesh, a as BoxGeometry, C as Canvas, u as useFrame, b as useThree } from "./react-three-fiber.esm-ayI3axKt.js";
function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function(n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}
const version = /* @__PURE__ */ (() => parseInt(REVISION.replace(/\D+/g, "")))();
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const Sky$1 = /* @__PURE__ */ (() => {
  const SkyShader = {
    uniforms: {
      turbidity: { value: 2 },
      rayleigh: { value: 1 },
      mieCoefficient: { value: 5e-3 },
      mieDirectionalG: { value: 0.8 },
      sunPosition: { value: new Vector3() },
      up: { value: new Vector3(0, 1, 0) }
    },
    vertexShader: (
      /* glsl */
      `
      uniform vec3 sunPosition;
      uniform float rayleigh;
      uniform float turbidity;
      uniform float mieCoefficient;
      uniform vec3 up;

      varying vec3 vWorldPosition;
      varying vec3 vSunDirection;
      varying float vSunfade;
      varying vec3 vBetaR;
      varying vec3 vBetaM;
      varying float vSunE;

      // constants for atmospheric scattering
      const float e = 2.71828182845904523536028747135266249775724709369995957;
      const float pi = 3.141592653589793238462643383279502884197169;

      // wavelength of used primaries, according to preetham
      const vec3 lambda = vec3( 680E-9, 550E-9, 450E-9 );
      // this pre-calcuation replaces older TotalRayleigh(vec3 lambda) function:
      // (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn))
      const vec3 totalRayleigh = vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 );

      // mie stuff
      // K coefficient for the primaries
      const float v = 4.0;
      const vec3 K = vec3( 0.686, 0.678, 0.666 );
      // MieConst = pi * pow( ( 2.0 * pi ) / lambda, vec3( v - 2.0 ) ) * K
      const vec3 MieConst = vec3( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 );

      // earth shadow hack
      // cutoffAngle = pi / 1.95;
      const float cutoffAngle = 1.6110731556870734;
      const float steepness = 1.5;
      const float EE = 1000.0;

      float sunIntensity( float zenithAngleCos ) {
        zenithAngleCos = clamp( zenithAngleCos, -1.0, 1.0 );
        return EE * max( 0.0, 1.0 - pow( e, -( ( cutoffAngle - acos( zenithAngleCos ) ) / steepness ) ) );
      }

      vec3 totalMie( float T ) {
        float c = ( 0.2 * T ) * 10E-18;
        return 0.434 * c * MieConst;
      }

      void main() {

        vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        vWorldPosition = worldPosition.xyz;

        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        gl_Position.z = gl_Position.w; // set z to camera.far

        vSunDirection = normalize( sunPosition );

        vSunE = sunIntensity( dot( vSunDirection, up ) );

        vSunfade = 1.0 - clamp( 1.0 - exp( ( sunPosition.y / 450000.0 ) ), 0.0, 1.0 );

        float rayleighCoefficient = rayleigh - ( 1.0 * ( 1.0 - vSunfade ) );

      // extinction (absorbtion + out scattering)
      // rayleigh coefficients
        vBetaR = totalRayleigh * rayleighCoefficient;

      // mie coefficients
        vBetaM = totalMie( turbidity ) * mieCoefficient;

      }
    `
    ),
    fragmentShader: (
      /* glsl */
      `
      varying vec3 vWorldPosition;
      varying vec3 vSunDirection;
      varying float vSunfade;
      varying vec3 vBetaR;
      varying vec3 vBetaM;
      varying float vSunE;

      uniform float mieDirectionalG;
      uniform vec3 up;

      const vec3 cameraPos = vec3( 0.0, 0.0, 0.0 );

      // constants for atmospheric scattering
      const float pi = 3.141592653589793238462643383279502884197169;

      const float n = 1.0003; // refractive index of air
      const float N = 2.545E25; // number of molecules per unit volume for air at 288.15K and 1013mb (sea level -45 celsius)

      // optical length at zenith for molecules
      const float rayleighZenithLength = 8.4E3;
      const float mieZenithLength = 1.25E3;
      // 66 arc seconds -> degrees, and the cosine of that
      const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

      // 3.0 / ( 16.0 * pi )
      const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
      // 1.0 / ( 4.0 * pi )
      const float ONE_OVER_FOURPI = 0.07957747154594767;

      float rayleighPhase( float cosTheta ) {
        return THREE_OVER_SIXTEENPI * ( 1.0 + pow( cosTheta, 2.0 ) );
      }

      float hgPhase( float cosTheta, float g ) {
        float g2 = pow( g, 2.0 );
        float inverse = 1.0 / pow( 1.0 - 2.0 * g * cosTheta + g2, 1.5 );
        return ONE_OVER_FOURPI * ( ( 1.0 - g2 ) * inverse );
      }

      void main() {

        vec3 direction = normalize( vWorldPosition - cameraPos );

      // optical length
      // cutoff angle at 90 to avoid singularity in next formula.
        float zenithAngle = acos( max( 0.0, dot( up, direction ) ) );
        float inverse = 1.0 / ( cos( zenithAngle ) + 0.15 * pow( 93.885 - ( ( zenithAngle * 180.0 ) / pi ), -1.253 ) );
        float sR = rayleighZenithLength * inverse;
        float sM = mieZenithLength * inverse;

      // combined extinction factor
        vec3 Fex = exp( -( vBetaR * sR + vBetaM * sM ) );

      // in scattering
        float cosTheta = dot( direction, vSunDirection );

        float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
        vec3 betaRTheta = vBetaR * rPhase;

        float mPhase = hgPhase( cosTheta, mieDirectionalG );
        vec3 betaMTheta = vBetaM * mPhase;

        vec3 Lin = pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - Fex ), vec3( 1.5 ) );
        Lin *= mix( vec3( 1.0 ), pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * Fex, vec3( 1.0 / 2.0 ) ), clamp( pow( 1.0 - dot( up, vSunDirection ), 5.0 ), 0.0, 1.0 ) );

      // nightsky
        float theta = acos( direction.y ); // elevation --> y-axis, [-pi/2, pi/2]
        float phi = atan( direction.z, direction.x ); // azimuth --> x-axis [-pi/2, pi/2]
        vec2 uv = vec2( phi, theta ) / vec2( 2.0 * pi, pi ) + vec2( 0.5, 0.0 );
        vec3 L0 = vec3( 0.1 ) * Fex;

      // composition + solar disc
        float sundisk = smoothstep( sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta );
        L0 += ( vSunE * 19000.0 * Fex ) * sundisk;

        vec3 texColor = ( Lin + L0 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 );

        vec3 retColor = pow( texColor, vec3( 1.0 / ( 1.2 + ( 1.2 * vSunfade ) ) ) );

        gl_FragColor = vec4( retColor, 1.0 );

      #include <tonemapping_fragment>
      #include <${version >= 154 ? "colorspace_fragment" : "encodings_fragment"}>

      }
    `
    )
  };
  const material = new ShaderMaterial({
    name: "SkyShader",
    fragmentShader: SkyShader.fragmentShader,
    vertexShader: SkyShader.vertexShader,
    uniforms: UniformsUtils.clone(SkyShader.uniforms),
    side: BackSide,
    depthWrite: false
  });
  class Sky2 extends Mesh {
    constructor() {
      super(new BoxGeometry(1, 1, 1), material);
    }
  }
  __publicField(Sky2, "SkyShader", SkyShader);
  __publicField(Sky2, "material", material);
  return Sky2;
})();
function calcPosFromAngles(inclination, azimuth, vector = new Vector3()) {
  const theta = Math.PI * (inclination - 0.5);
  const phi = 2 * Math.PI * (azimuth - 0.5);
  vector.x = Math.cos(phi);
  vector.y = Math.sin(theta);
  vector.z = Math.sin(phi);
  return vector;
}
const Sky = /* @__PURE__ */ reactExports.forwardRef(({
  inclination = 0.6,
  azimuth = 0.1,
  distance = 1e3,
  mieCoefficient = 5e-3,
  mieDirectionalG = 0.8,
  rayleigh = 0.5,
  turbidity = 10,
  sunPosition = calcPosFromAngles(inclination, azimuth),
  ...props
}, ref) => {
  const scale = reactExports.useMemo(() => new Vector3().setScalar(distance), [distance]);
  const [sky] = reactExports.useState(() => new Sky$1());
  return /* @__PURE__ */ reactExports.createElement("primitive", _extends({
    object: sky,
    ref,
    "material-uniforms-mieCoefficient-value": mieCoefficient,
    "material-uniforms-mieDirectionalG-value": mieDirectionalG,
    "material-uniforms-rayleigh-value": rayleigh,
    "material-uniforms-sunPosition-value": sunPosition,
    "material-uniforms-turbidity-value": turbidity,
    scale
  }, props));
});
const SandboxMode = reactExports.lazy(() => __vitePreload(() => import("./SandboxMode-iLlY17Ve.js"), true ? __vite__mapDeps([0,1,2,3]) : void 0));
function getAudioCtx(ref) {
  try {
    if (!ref.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ref.current = new AC();
    }
    if (ref.current.state === "suspended") {
      ref.current.resume().catch(() => {
      });
    }
    return ref.current;
  } catch {
    return null;
  }
}
function playFlap(ctx) {
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
  }
}
function playHit(ctx) {
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
  }
}
function startBgMusic(ctx, stopRef) {
  if (stopRef.current) return;
  const notes = [130.81, 146.83, 164.81, 174.61, 196, 174.61];
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
    }
    stopRef.current = null;
  };
}
const CLOUD_CONFIGS = [
  { id: "c1", pos: [8, 8, -18], scale: 1.8 },
  { id: "c2", pos: [-6, 10, -22], scale: 2.2 },
  { id: "c3", pos: [14, 6, -28], scale: 1.4 },
  { id: "c4", pos: [-12, 12, -15], scale: 1.9 },
  { id: "c5", pos: [20, 9, -12], scale: 1.5 },
  { id: "c6", pos: [0, 11, -35], scale: 2.5 },
  { id: "c7", pos: [-20, 7, -25], scale: 1.6 }
];
function CloudMesh({
  initPos,
  scale
}) {
  const ref = reactExports.useRef(null);
  const speed = reactExports.useMemo(() => 0.6 + Math.random() * 0.4, []);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.x -= speed * delta;
    if (ref.current.position.x < -50) ref.current.position.x = 55;
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref, position: initPos, scale, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [1.5, 7, 5] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: "white",
          transparent: true,
          opacity: 0.88,
          roughness: 1
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [1.6, 0.3, 0.2], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [1.1, 7, 5] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: "white",
          transparent: true,
          opacity: 0.82,
          roughness: 1
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-1.3, 0.1, -0.2], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [1.2, 7, 5] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: "white",
          transparent: true,
          opacity: 0.85,
          roughness: 1
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.2, 0.9, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.9, 7, 5] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "meshStandardMaterial",
        {
          color: "white",
          transparent: true,
          opacity: 0.8,
          roughness: 1
        }
      )
    ] })
  ] });
}
function Bird({
  groupRef
}) {
  const leftWingRef = reactExports.useRef(null);
  const rightWingRef = reactExports.useRef(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const a = Math.sin(t * 14) * 0.65;
    if (leftWingRef.current) leftWingRef.current.rotation.x = a;
    if (rightWingRef.current) rightWingRef.current.rotation.x = -a;
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref: groupRef, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.6, 0.4, 0.42] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#FFB800" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.22, 0.18, 0], castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.23, 12, 10] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#FFB800" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("group", { ref: leftWingRef, position: [0, 0, -0.28], children: /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.38, 0.07, 0.32] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#FF8C00" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("group", { ref: rightWingRef, position: [0, 0, 0.28], children: /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { castShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.38, 0.07, 0.32] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#FF8C00" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.46, 0.14, 0], rotation: [0, 0, -Math.PI / 2], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("coneGeometry", { args: [0.065, 0.2, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#FF4500" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.34, 0.27, 0.13], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.06, 8, 8] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#222" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0.37, 0.29, 0.15], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("sphereGeometry", { args: [0.025, 6, 6] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "white" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [-0.37, -0.04, 0], rotation: [0, 0, 0.35], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [0.22, 0.07, 0.3] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#CC7700" })
    ] })
  ] });
}
function PipePair({
  id,
  gapY,
  onMount
}) {
  const groupRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    onMount(id, groupRef.current);
    return () => onMount(id, null);
  }, [id, onMount]);
  const GAP = 3.5;
  const H = 13;
  const topY = gapY + GAP / 2 + H / 2;
  const botY = gapY - GAP / 2 - H / 2;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("group", { ref: groupRef, position: [15, 0, 0], children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, topY, 0], castShadow: true, receiveShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.2, H, 1.2] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#27ae60" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, gapY + GAP / 2, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.55, 0.35, 1.55] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#2ecc71" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, botY, 0], castShadow: true, receiveShadow: true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.2, H, 1.2] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#27ae60" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("mesh", { position: [0, gapY - GAP / 2, 0], children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("boxGeometry", { args: [1.55, 0.35, 1.55] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#2ecc71" })
    ] })
  ] });
}
function CameraController({
  birdY,
  birdVel,
  cameraViewRef
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
function GameScene({
  resetKey,
  gameStateRef,
  modeRef,
  cameraViewRef,
  flapRef,
  onDeath,
  onScoreChange,
  audioRef
}) {
  const birdGroupRef = reactExports.useRef(null);
  const birdY = reactExports.useRef(0);
  const birdVel = reactExports.useRef(0);
  const gameTime = reactExports.useRef(0);
  const gameSpeed = reactExports.useRef(4);
  const lastSpawn = reactExports.useRef(-10);
  const scoreRef = reactExports.useRef(0);
  const deadRef = reactExports.useRef(false);
  const pipeIdCounter = reactExports.useRef(0);
  const pipesPhysics = reactExports.useRef([]);
  const pipeGroupMap = reactExports.useRef(/* @__PURE__ */ new Map());
  const [pipeRenderData, setPipeRenderData] = reactExports.useState([]);
  reactExports.useEffect(() => {
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
  const flap = reactExports.useCallback(() => {
    if (gameStateRef.current !== "playing") return;
    birdVel.current = 4.5;
    playFlap(getAudioCtx(audioRef));
  }, [gameStateRef, audioRef]);
  reactExports.useEffect(() => {
    flapRef.current = flap;
  }, [flapRef, flap]);
  const handlePipeMount = reactExports.useCallback((id, g) => {
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
        Math.min(0.45, -birdVel.current * 0.09)
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
          const inGap = birdY.current > pipe.gapY - GAP / 2 + 0.25 && birdY.current < pipe.gapY + GAP / 2 - 0.25;
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Sky, { sunPosition: [100, 20, 100], turbidity: 8, rayleigh: 2 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ambientLight", { intensity: 0.6 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "directionalLight",
      {
        position: [10, 20, 10],
        castShadow: true,
        intensity: 1.5,
        "shadow-mapSize": [1024, 1024]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "mesh",
      {
        position: [0, -10, -5],
        rotation: [-Math.PI / 2, 0, 0],
        receiveShadow: true,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("planeGeometry", { args: [200, 60] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("meshStandardMaterial", { color: "#4a7c59" })
        ]
      }
    ),
    CLOUD_CONFIGS.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(CloudMesh, { initPos: c.pos, scale: c.scale }, c.id)),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Bird, { groupRef: birdGroupRef }),
    pipeRenderData.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      PipePair,
      {
        id: p.id,
        gapY: p.gapY,
        onMount: handlePipeMount
      },
      p.id
    )),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      CameraController,
      {
        birdY,
        birdVel,
        cameraViewRef
      }
    )
  ] });
}
function btnStyle(color) {
  return {
    background: `linear-gradient(135deg, ${color}22, ${color}44)`,
    border: `1px solid ${color}`,
    borderRadius: "8px",
    color,
    fontWeight: 700,
    fontSize: "13px",
    padding: "8px 16px",
    cursor: "pointer",
    textShadow: `0 0 8px ${color}`,
    boxShadow: `0 0 12px ${color}44`,
    transition: "all 0.2s",
    letterSpacing: "0.05em",
    fontFamily: "monospace"
  };
}
function FlappyBird3DGame({ onClose }) {
  const [gameState, setGameState] = reactExports.useState("start");
  const [score, setScore] = reactExports.useState(0);
  const [mode, setMode] = reactExports.useState("dodge");
  const [cameraView, setCameraView] = reactExports.useState("tpv");
  const [musicOn, setMusicOn] = reactExports.useState(false);
  const [resetKey, setResetKey] = reactExports.useState(0);
  const [highScore, setHighScore] = reactExports.useState(
    () => Number.parseInt(localStorage.getItem("flappy3d_highscore") || "0")
  );
  const gameStateRef = reactExports.useRef("start");
  const modeRef = reactExports.useRef("dodge");
  const cameraViewRef = reactExports.useRef("tpv");
  const flapRef = reactExports.useRef(null);
  const audioRef = reactExports.useRef(null);
  const stopMusicRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  reactExports.useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  reactExports.useEffect(() => {
    cameraViewRef.current = cameraView;
  }, [cameraView]);
  reactExports.useEffect(() => {
    if (musicOn) {
      const ctx = getAudioCtx(audioRef);
      if (ctx) startBgMusic(ctx, stopMusicRef);
    } else {
      if (stopMusicRef.current) stopMusicRef.current();
    }
  }, [musicOn]);
  reactExports.useEffect(() => {
    return () => {
      var _a;
      if (stopMusicRef.current) stopMusicRef.current();
      (_a = audioRef.current) == null ? void 0 : _a.close().catch(() => {
      });
    };
  }, []);
  const handleDeath = reactExports.useCallback(
    (finalScore) => {
      setGameState("dead");
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem("flappy3d_highscore", String(finalScore));
      }
    },
    [highScore]
  );
  const handleStart = (selectedMode) => {
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
  reactExports.useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (gameStateRef.current === "playing" && modeRef.current === "dodge" && flapRef.current) {
          flapRef.current();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const handleCanvasClick = (e) => {
    if (e.target.closest("button")) return;
    if (gameStateRef.current === "playing" && modeRef.current === "dodge" && flapRef.current) {
      flapRef.current();
    }
  };
  const NEON_BLUE = "#00cfff";
  const NEON_PURPLE = "#cc00ff";
  const NEON_GREEN = "#00ff88";
  const HUD_BG = "rgba(0,0,30,0.75)";
  const showSandbox = mode === "sandbox" && gameState === "playing";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      role: "presentation",
      style: {
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#0a1628",
        overflow: "hidden"
      },
      onClick: handleCanvasClick,
      onKeyDown: () => {
      },
      children: showSandbox ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        reactExports.Suspense,
        {
          fallback: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              style: {
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#00cfff",
                fontFamily: "monospace",
                fontSize: 18,
                background: "#0a1628"
              },
              children: "Loading Sandbox..."
            }
          ),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            SandboxMode,
            {
              onExit: () => {
                setGameState("start");
              }
            }
          )
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Canvas,
          {
            shadows: true,
            dpr: [1, 1.5],
            camera: { fov: 70, position: [0, 0, 8] },
            style: { position: "absolute", inset: 0 },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              GameScene,
              {
                resetKey,
                gameStateRef,
                modeRef,
                cameraViewRef,
                flapRef,
                onDeath: handleDeath,
                onScoreChange: setScore,
                audioRef
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: { position: "absolute", inset: 0, pointerEvents: "none" },
            children: [
              gameState === "playing" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    style: {
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
                      textAlign: "center"
                    },
                    children: score
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    style: {
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
                      whiteSpace: "nowrap"
                    },
                    children: [
                      mode === "dodge" ? "🏆 DODGE" : "🌤 SANDBOX",
                      " •",
                      " ",
                      cameraView.toUpperCase()
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  style: {
                    position: "absolute",
                    top: 12,
                    right: 12,
                    display: "flex",
                    gap: "8px",
                    pointerEvents: "all"
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setMusicOn((m) => !m),
                        "data-ocid": "game.toggle",
                        style: btnStyle(musicOn ? NEON_GREEN : "#888"),
                        children: musicOn ? "🎵" : "🔇"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setCameraView((v) => v === "tpv" ? "fpv" : "tpv"),
                        "data-ocid": "game.toggle",
                        style: btnStyle(NEON_BLUE),
                        children: cameraView.toUpperCase()
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: onClose,
                        "data-ocid": "game.close_button",
                        style: btnStyle("#ff5555"),
                        children: "✕ EXIT"
                      }
                    )
                  ]
                }
              ),
              gameState === "start" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  style: {
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,20,0.65)",
                    backdropFilter: "blur(4px)",
                    pointerEvents: "all",
                    gap: "24px"
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "img",
                      {
                        src: "/assets/generated/flappy-bird-3d-logo-transparent.dim_400x200.png",
                        alt: "Flappy Bird 3D",
                        style: {
                          maxWidth: "360px",
                          width: "88%",
                          filter: "drop-shadow(0 0 22px #00cfff)"
                        }
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "p",
                      {
                        style: {
                          color: "rgba(200,240,255,0.85)",
                          fontSize: "16px",
                          fontFamily: "monospace",
                          letterSpacing: "0.08em",
                          margin: 0
                        },
                        children: "SPACE / CLICK / TAP to Flap"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        style: {
                          display: "flex",
                          gap: "16px",
                          flexWrap: "wrap",
                          justifyContent: "center"
                        },
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "button",
                            {
                              type: "button",
                              onClick: () => handleStart("dodge"),
                              "data-ocid": "game.primary_button",
                              style: {
                                ...btnStyle(NEON_BLUE),
                                fontSize: "16px",
                                padding: "12px 28px"
                              },
                              children: "🏆 DODGE MODE"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "button",
                            {
                              type: "button",
                              onClick: () => handleStart("sandbox"),
                              "data-ocid": "game.secondary_button",
                              style: {
                                ...btnStyle(NEON_GREEN),
                                fontSize: "16px",
                                padding: "12px 28px"
                              },
                              children: "🌆 GTA SANDBOX"
                            }
                          )
                        ]
                      }
                    ),
                    highScore > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        style: {
                          color: "#FFD700",
                          fontFamily: "monospace",
                          fontSize: "14px",
                          letterSpacing: "0.1em",
                          textShadow: "0 0 10px #FFD700"
                        },
                        children: [
                          "🏅 BEST: ",
                          highScore
                        ]
                      }
                    )
                  ]
                }
              ),
              gameState === "dead" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  style: {
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,20,0.72)",
                    backdropFilter: "blur(6px)",
                    pointerEvents: "all",
                    gap: "22px"
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "h2",
                      {
                        style: {
                          color: "#ff4444",
                          fontFamily: "monospace",
                          fontSize: "clamp(28px, 6vw, 52px)",
                          fontWeight: 900,
                          textShadow: "0 0 20px #ff4444, 0 0 40px #ff4444",
                          letterSpacing: "0.1em",
                          margin: 0
                        },
                        children: "GAME OVER"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { display: "flex", gap: "36px" }, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center" }, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "div",
                          {
                            style: {
                              color: "#aaa",
                              fontFamily: "monospace",
                              fontSize: "11px",
                              letterSpacing: "0.12em"
                            },
                            children: "SCORE"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "div",
                          {
                            style: {
                              color: NEON_BLUE,
                              fontFamily: "monospace",
                              fontSize: "40px",
                              fontWeight: 700,
                              textShadow: `0 0 15px ${NEON_BLUE}`
                            },
                            children: score
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center" }, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "div",
                          {
                            style: {
                              color: "#aaa",
                              fontFamily: "monospace",
                              fontSize: "11px",
                              letterSpacing: "0.12em"
                            },
                            children: "BEST"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "div",
                          {
                            style: {
                              color: "#FFD700",
                              fontFamily: "monospace",
                              fontSize: "40px",
                              fontWeight: 700,
                              textShadow: "0 0 15px #FFD700"
                            },
                            children: highScore
                          }
                        )
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        style: {
                          display: "flex",
                          gap: "16px",
                          flexWrap: "wrap",
                          justifyContent: "center"
                        },
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "button",
                            {
                              type: "button",
                              onClick: handleRestart,
                              "data-ocid": "game.primary_button",
                              style: {
                                ...btnStyle(NEON_GREEN),
                                fontSize: "16px",
                                padding: "12px 28px"
                              },
                              children: "↺ RESTART"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "button",
                            {
                              type: "button",
                              onClick: () => {
                                setScore(0);
                                setGameState("start");
                              },
                              "data-ocid": "game.secondary_button",
                              style: {
                                ...btnStyle(NEON_PURPLE),
                                fontSize: "16px",
                                padding: "12px 28px"
                              },
                              children: "🏠 MENU"
                            }
                          )
                        ]
                      }
                    )
                  ]
                }
              ),
              gameState === "playing" && score === 0 && mode === "dodge" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  style: {
                    position: "absolute",
                    bottom: 20,
                    left: "50%",
                    transform: "translateX(-50%)",
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    whiteSpace: "nowrap"
                  },
                  children: "SPACE / Click / Tap to flap"
                }
              )
            ]
          }
        )
      ] })
    }
  );
}
function FlappyBird3D({ onClose }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000"
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(FlappyBird3DGame, { onClose })
    }
  );
}
const FlappyBird3D$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: FlappyBird3D
}, Symbol.toStringTag, { value: "Module" }));
export {
  FlappyBird3D$1 as F,
  Sky as S
};
