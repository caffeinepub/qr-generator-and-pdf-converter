import { useEffect } from "react";

export default function ClickEffects() {
  useEffect(() => {
    // Inject CSS animation once
    if (!document.getElementById("splash-ripple-style")) {
      const style = document.createElement("style");
      style.id = "splash-ripple-style";
      style.textContent = `
        @keyframes splashRipple {
          0%   { transform: scale(0); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    // Visual ripple only — no audio
    const showRipple = (x: number, y: number) => {
      const ripple = document.createElement("div");
      const size = 56;
      ripple.style.cssText = `
        position: fixed;
        left: ${x - size / 2}px;
        top: ${y - size / 2}px;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(59,130,246,0) 70%);
        pointer-events: none;
        z-index: 99999;
        transform: scale(0);
        animation: splashRipple 0.4s ease-out forwards;
      `;
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 420);
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
    document.addEventListener("touchstart", onTouchStart);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("touchstart", onTouchStart);
    };
  }, []);

  return null;
}
