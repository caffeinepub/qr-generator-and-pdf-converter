import { useEffect } from "react";

// Ripple color palette: alternates between blue and purple
const RIPPLE_COLORS = [
  {
    inner: "rgba(59,130,246,0.45)",
    mid: "rgba(59,130,246,0.2)",
    ring: "rgba(59,130,246,0.6)",
  },
  {
    inner: "rgba(139,92,246,0.45)",
    mid: "rgba(139,92,246,0.2)",
    ring: "rgba(139,92,246,0.6)",
  },
  {
    inner: "rgba(56,189,248,0.45)",
    mid: "rgba(56,189,248,0.2)",
    ring: "rgba(56,189,248,0.6)",
  },
];

let colorIndex = 0;

export default function ClickEffects() {
  useEffect(() => {
    const showRipple = (x: number, y: number) => {
      const colors = RIPPLE_COLORS[colorIndex % RIPPLE_COLORS.length];
      colorIndex++;

      // Main soft glow ripple
      const size = 56;
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
        animation: splashRipple 0.4s cubic-bezier(0.22,1,0.36,1) forwards;
      `;
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 420);

      // Outer ring
      const ringSize = 32;
      const ring = document.createElement("div");
      ring.style.cssText = `
        position: fixed;
        left: ${x - ringSize / 2}px;
        top: ${y - ringSize / 2}px;
        width: ${ringSize}px;
        height: ${ringSize}px;
        border-radius: 50%;
        border: 1.5px solid ${colors.ring};
        pointer-events: none;
        z-index: 99999;
        transform: scale(0);
        animation: rippleRing 0.45s ease-out forwards;
      `;
      document.body.appendChild(ring);
      setTimeout(() => ring.remove(), 480);
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
