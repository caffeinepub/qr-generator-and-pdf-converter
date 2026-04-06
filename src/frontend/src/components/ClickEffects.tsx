import { useEffect } from "react";

// Ripple color palette: alternates between blue and purple
const RIPPLE_COLORS = [
  {
    inner: "rgba(59,130,246,0.55)",
    mid: "rgba(59,130,246,0.25)",
    ring: "rgba(59,130,246,0.7)",
    sparkles: ["#3B82F6", "#60A5FA", "#93C5FD"],
  },
  {
    inner: "rgba(139,92,246,0.55)",
    mid: "rgba(139,92,246,0.25)",
    ring: "rgba(139,92,246,0.7)",
    sparkles: ["#8B5CF6", "#A78BFA", "#C4B5FD"],
  },
  {
    inner: "rgba(56,189,248,0.55)",
    mid: "rgba(56,189,248,0.25)",
    ring: "rgba(56,189,248,0.7)",
    sparkles: ["#38BDF8", "#7DD3FC", "#A78BFA"],
  },
];

let colorIndex = 0;

// Web Audio API soft pop sound (no external files)
function playPopSound() {
  try {
    const AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Primary tone: short sine wave pop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.14);

    // Shimmer overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1760, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05);
    gain2.gain.setValueAtTime(0.06, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.1);

    // Auto-close context
    setTimeout(() => ctx.close(), 300);
  } catch {
    // Web Audio not available — silently skip
  }
}

export default function ClickEffects() {
  useEffect(() => {
    const showRipple = (x: number, y: number) => {
      const colors = RIPPLE_COLORS[colorIndex % RIPPLE_COLORS.length];
      colorIndex++;

      // Play soft pop sound
      playPopSound();

      // Main soft glow ripple — larger 80px
      const size = 80;
      const ripple = document.createElement("div");
      ripple.style.cssText = `
        position: fixed;
        left: ${x - size / 2}px;
        top: ${y - size / 2}px;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: radial-gradient(circle, ${colors.inner} 0%, ${colors.mid} 45%, rgba(0,0,0,0) 70%);
        pointer-events: none;
        z-index: 99999;
        transform: scale(0);
        animation: splashRipple 0.45s cubic-bezier(0.22,1,0.36,1) forwards;
      `;
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 480);

      // Outer ring — stronger glow
      const ringSize = 48;
      const ring = document.createElement("div");
      ring.style.cssText = `
        position: fixed;
        left: ${x - ringSize / 2}px;
        top: ${y - ringSize / 2}px;
        width: ${ringSize}px;
        height: ${ringSize}px;
        border-radius: 50%;
        border: 2px solid ${colors.ring};
        box-shadow: 0 0 8px ${colors.ring};
        pointer-events: none;
        z-index: 99999;
        transform: scale(0);
        animation: rippleRing 0.5s ease-out forwards;
      `;
      document.body.appendChild(ring);
      setTimeout(() => ring.remove(), 540);

      // Sparkle dots flying outward
      const count = 5;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 32 + Math.random() * 22;
        const sx = Math.cos(angle) * dist;
        const sy = Math.sin(angle) * dist;
        const sparkColor =
          colors.sparkles[Math.floor(Math.random() * colors.sparkles.length)];
        const dotSize = 3 + Math.random() * 2;
        const dot = document.createElement("div");
        dot.style.cssText = `
          position: fixed;
          left: ${x - dotSize / 2}px;
          top: ${y - dotSize / 2}px;
          width: ${dotSize}px;
          height: ${dotSize}px;
          border-radius: 50%;
          background: ${sparkColor};
          box-shadow: 0 0 4px ${sparkColor};
          pointer-events: none;
          z-index: 99999;
          --sx: ${sx}px;
          --sy: ${sy}px;
          animation: sparkleOut 0.5s ease-out forwards;
        `;
        document.body.appendChild(dot);
        setTimeout(() => dot.remove(), 540);
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      showRipple(e.clientX, e.clientY);
    };

    const onTouchStart = (e: TouchEvent) => {
      for (const touch of Array.from(e.touches)) {
        showRipple(touch.clientX, touch.clientY);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("touchstart", onTouchStart);
    };
  }, []);

  return null;
}
