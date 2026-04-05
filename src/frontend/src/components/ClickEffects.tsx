import { useEffect } from "react";

// Ripple color palette: alternates between purple and light blue
const RIPPLE_COLORS = [
  // Purple
  {
    inner: "rgba(168,85,247,0.55)",
    mid: "rgba(168,85,247,0.25)",
    ring: "rgba(168,85,247,0.7)",
  },
  // Light Blue
  {
    inner: "rgba(56,189,248,0.55)",
    mid: "rgba(56,189,248,0.25)",
    ring: "rgba(56,189,248,0.7)",
  },
  // Violet-Blue blend
  {
    inner: "rgba(139,92,246,0.55)",
    mid: "rgba(96,165,250,0.25)",
    ring: "rgba(139,92,246,0.65)",
  },
];

let colorIndex = 0;

function playClickSound() {
  try {
    const ctx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();

    // Layer 1: soft pop (sine burst)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);
    gain1.gain.setValueAtTime(0.13, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.13);

    // Layer 2: high sparkle (triangle)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1800, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.06);
    gain2.gain.setValueAtTime(0.07, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.08);

    // Auto-close context after sound finishes
    setTimeout(() => ctx.close(), 300);
  } catch (_) {
    // Audio not supported — fail silently
  }
}

export default function ClickEffects() {
  useEffect(() => {
    // Inject CSS animations once
    if (!document.getElementById("splash-ripple-style")) {
      const style = document.createElement("style");
      style.id = "splash-ripple-style";
      style.textContent = `
        @keyframes splashRipple {
          0%   { transform: scale(0); opacity: 1; }
          60%  { opacity: 0.7; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes rippleRing {
          0%   { transform: scale(0); opacity: 0.9; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes sparkle {
          0%   { transform: scale(0) rotate(0deg); opacity: 1; }
          60%  { opacity: 0.8; }
          100% { transform: scale(1.6) rotate(45deg); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    const showRipple = (x: number, y: number) => {
      const colors = RIPPLE_COLORS[colorIndex % RIPPLE_COLORS.length];
      colorIndex++;

      // Main soft glow ripple
      const size = 64;
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
      setTimeout(() => ripple.remove(), 460);

      // Outer ring burst
      const ringSize = 36;
      const ring = document.createElement("div");
      ring.style.cssText = `
        position: fixed;
        left: ${x - ringSize / 2}px;
        top: ${y - ringSize / 2}px;
        width: ${ringSize}px;
        height: ${ringSize}px;
        border-radius: 50%;
        border: 2px solid ${colors.ring};
        pointer-events: none;
        z-index: 99999;
        transform: scale(0);
        animation: rippleRing 0.5s ease-out forwards;
      `;
      document.body.appendChild(ring);
      setTimeout(() => ring.remove(), 520);

      // Small sparkle dot in the center
      const dotSize = 10;
      const dot = document.createElement("div");
      dot.style.cssText = `
        position: fixed;
        left: ${x - dotSize / 2}px;
        top: ${y - dotSize / 2}px;
        width: ${dotSize}px;
        height: ${dotSize}px;
        border-radius: 50%;
        background: ${colors.ring};
        box-shadow: 0 0 8px 4px ${colors.inner};
        pointer-events: none;
        z-index: 100000;
        transform: scale(0);
        animation: sparkle 0.35s ease-out forwards;
      `;
      document.body.appendChild(dot);
      setTimeout(() => dot.remove(), 380);
    };

    const onMouseDown = (e: MouseEvent) => {
      showRipple(e.clientX, e.clientY);
      playClickSound();
    };

    const onTouchStart = (e: TouchEvent) => {
      for (const touch of Array.from(e.touches)) {
        showRipple(touch.clientX, touch.clientY);
      }
      playClickSound();
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("touchstart", onTouchStart);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("touchstart", onTouchStart);
    };
  }, []);

  return null;
}
