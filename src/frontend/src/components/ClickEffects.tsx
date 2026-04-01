import { useEffect } from "react";

// Shared AudioContext – reused across all clicks to avoid browser limits
let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!sharedCtx || sharedCtx.state === "closed") {
      sharedCtx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }
    // Resume if suspended (browser autoplay policy)
    if (sharedCtx.state === "suspended") {
      sharedCtx.resume();
    }
    return sharedCtx;
  } catch (_) {
    return null;
  }
}

export default function ClickEffects() {
  useEffect(() => {
    // Ensure CSS animation is injected
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

    // Visual ripple
    const showRipple = (x: number, y: number) => {
      const ripple = document.createElement("div");
      const size = 60;
      ripple.style.cssText = `
        position: fixed;
        left: ${x - size / 2}px;
        top: ${y - size / 2}px;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(59,130,246,0.5) 0%, rgba(59,130,246,0) 70%);
        pointer-events: none;
        z-index: 99999;
        transform: scale(0);
        animation: splashRipple 0.5s ease-out forwards;
      `;
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 520);
    };

    // Splash sound – reuses sharedCtx to avoid browser AudioContext limit
    const playSound = () => {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(900, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.18);
      } catch (_) {}
    };

    const onMouseDown = (e: MouseEvent) => {
      showRipple(e.clientX, e.clientY);
      playSound();
    };

    const onTouchStart = (e: TouchEvent) => {
      for (const touch of Array.from(e.touches)) {
        showRipple(touch.clientX, touch.clientY);
      }
      playSound();
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
