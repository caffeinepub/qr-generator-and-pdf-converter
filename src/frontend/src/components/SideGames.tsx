import { AnimatePresence, motion } from "motion/react";
import { Suspense, lazy, useState } from "react";

const FlappyBird3D = lazy(() => import("@/games/FlappyBird3D"));
const NightCentipedeHunt = lazy(() => import("@/games/NightCentipedeHunt"));
const StreetDriftLegends = lazy(() => import("@/games/StreetDriftLegends"));

export default function SideGames() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const [nightCentipedeOpen, setNightCentipedeOpen] = useState(false);
  const [streetDriftOpen, setStreetDriftOpen] = useState(false);

  return (
    <>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setSidebarOpen((prev) => !prev)}
        data-ocid="sidegames.toggle"
        style={{
          position: "fixed",
          right: "0px",
          bottom: "20px",
          zIndex: 1001,
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(59,130,246,0.25)",
          borderRight: "none",
          borderRadius: "12px 0 0 12px",
          padding: "8px 6px",
          cursor: "pointer",
          transition: "opacity 0.2s ease",
          color: "#1D4ED8",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "3px",
          lineHeight: 1,
        }}
      >
        <span style={{ fontSize: "18px" }}>🎮</span>
        <span
          style={{
            fontSize: "7px",
            fontWeight: 800,
            letterSpacing: "0.04em",
            writingMode: "vertical-rl",
            opacity: 0.9,
            color: "#3B82F6",
          }}
        >
          GAMES
        </span>
      </button>

      {/* Sidebar panel */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            style={{
              position: "fixed",
              right: 0,
              top: 0,
              bottom: 0,
              width: "280px",
              zIndex: 1000,
              background:
                "linear-gradient(155deg, #000510 0%, #0a0a2e 55%, #050520 100%)",
              backdropFilter: "blur(20px)",
              borderLeft: "1px solid rgba(100,100,255,0.3)",
              boxShadow:
                "-6px 0 40px rgba(80,40,255,0.4), inset 0 0 30px rgba(50,100,255,0.05)",
              display: "flex",
              flexDirection: "column",
              padding: "20px 16px",
              overflowY: "auto",
            }}
          >
            {/* Header */}
            <div
              style={{
                marginBottom: "20px",
                paddingBottom: "16px",
                borderBottom: "1px solid rgba(100,150,255,0.2)",
              }}
            >
              <h2
                style={{
                  color: "#00e5ff",
                  fontSize: "18px",
                  fontWeight: 700,
                  textShadow:
                    "0 0 10px rgba(0,229,255,0.9), 0 0 22px rgba(0,200,255,0.4)",
                  margin: 0,
                  letterSpacing: "0.03em",
                }}
              >
                🎮 Side Games
              </h2>
              <p
                style={{
                  color: "rgba(150,200,255,0.55)",
                  fontSize: "11px",
                  margin: "5px 0 0",
                }}
              >
                Play while you work!
              </p>
            </div>

            {/* Flappy Bird 3D card */}
            <GameCard onPlay={() => setGameOpen(true)} />

            {/* Divider */}
            <div
              style={{
                height: "1px",
                background:
                  "linear-gradient(90deg, transparent, rgba(200,50,50,0.35), transparent)",
                margin: "16px 0",
              }}
            />

            {/* Night Centipede Hunt card */}
            <NightCentipedeCard onPlay={() => setNightCentipedeOpen(true)} />

            {/* Divider */}
            <div
              style={{
                height: "1px",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,150,0,0.35), transparent)",
                margin: "16px 0",
              }}
            />

            {/* Street Drift Legends card */}
            <StreetDriftLegendsCard onPlay={() => setStreetDriftOpen(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flappy Bird 3D overlay (lazy) */}
      {gameOpen && (
        <Suspense
          fallback={
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "#000010",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#00e5ff",
                fontSize: "20px",
                fontFamily: "monospace",
                letterSpacing: "0.1em",
              }}
            >
              Loading game...
            </div>
          }
        >
          <FlappyBird3D onClose={() => setGameOpen(false)} />
        </Suspense>
      )}

      {/* Night Centipede Hunt overlay (lazy) */}
      {nightCentipedeOpen && (
        <Suspense
          fallback={
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "#050000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "40px",
                  animation: "spin 1s linear infinite",
                }}
              >
                🐛
              </div>
              <div
                style={{
                  color: "#ff4444",
                  fontSize: "16px",
                  fontFamily: "monospace",
                  letterSpacing: "0.12em",
                  textShadow: "0 0 10px #ff0000",
                }}
              >
                LOADING HORROR...
              </div>
              <style>
                {
                  "@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }"
                }
              </style>
            </div>
          }
        >
          <NightCentipedeHunt onClose={() => setNightCentipedeOpen(false)} />
        </Suspense>
      )}

      {/* Street Drift Legends overlay (lazy) */}
      {streetDriftOpen && (
        <Suspense
          fallback={
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "#0a0500",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div style={{ fontSize: "48px" }}>🚗</div>
              <div
                style={{
                  color: "#ff8800",
                  fontSize: "16px",
                  fontFamily: "monospace",
                  letterSpacing: "0.12em",
                  textShadow: "0 0 12px #ff6600",
                }}
              >
                LOADING STREET DRIFT LEGENDS...
              </div>
              <div
                style={{
                  width: "200px",
                  height: "3px",
                  background: "rgba(255,100,0,0.2)",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    background: "linear-gradient(90deg, #ff6600, #ffcc00)",
                    animation: "loadBar 1.5s ease-in-out infinite",
                    borderRadius: "2px",
                  }}
                />
              </div>
              <style>
                {
                  "@keyframes loadBar { 0% { width: 0%; margin-left: 0; } 50% { width: 70%; margin-left: 30%; } 100% { width: 0%; margin-left: 100%; } }"
                }
              </style>
            </div>
          }
        >
          <StreetDriftLegends onClose={() => setStreetDriftOpen(false)} />
        </Suspense>
      )}
    </>
  );
}

// ─── Flappy Bird 3D Card ───────────────────────────────────────────────────────
function GameCard({ onPlay }: { onPlay: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "rgba(10,10,40,0.8)",
        border: `1px solid rgba(100,150,255,${hovered ? 0.7 : 0.2})`,
        borderRadius: "16px",
        padding: "16px",
        transition: "all 0.3s ease",
        boxShadow: hovered
          ? "0 0 30px rgba(80,50,255,0.65), 0 0 60px rgba(50,100,255,0.2)"
          : "0 4px 20px rgba(0,0,30,0.5)",
        transform: hovered ? "scale(1.03)" : "scale(1)",
      }}
    >
      {/* Logo */}
      <img
        src="/assets/generated/flappy-bird-3d-logo-transparent.dim_400x200.png"
        alt="Flappy Bird 3D Logo"
        style={{
          width: "100%",
          maxHeight: "100px",
          objectFit: "contain",
          marginBottom: "12px",
          filter: hovered
            ? "drop-shadow(0 0 12px #00cfff)"
            : "drop-shadow(0 0 4px #0080aa)",
          transition: "filter 0.3s ease",
        }}
      />
      {/* Name */}
      <h3
        style={{
          color: "white",
          fontWeight: 700,
          fontSize: "16px",
          margin: "0 0 4px",
          textShadow: hovered
            ? "0 0 12px rgba(100,180,255,0.9)"
            : "0 0 6px rgba(80,140,255,0.5)",
          transition: "text-shadow 0.3s ease",
        }}
      >
        Flappy Bird 3D
      </h3>
      {/* Description */}
      <p
        style={{
          color: "#00ccff",
          fontSize: "12px",
          margin: "0 0 14px",
          opacity: 0.8,
        }}
      >
        3D arcade game · Dodge &amp; Sandbox modes
      </p>
      {/* Play button */}
      <button
        type="button"
        onClick={onPlay}
        data-ocid="sidegames.flappy.button"
        style={{
          width: "100%",
          padding: "10px 0",
          background: hovered
            ? "linear-gradient(135deg, #3535ff, #9900ff)"
            : "linear-gradient(135deg, #1a1acc, #7700cc)",
          border: "1px solid rgba(160,100,255,0.55)",
          borderRadius: "8px",
          color: "white",
          fontWeight: 700,
          fontSize: "14px",
          cursor: "pointer",
          boxShadow: hovered
            ? "0 0 22px rgba(100,50,255,0.85), 0 4px 16px rgba(60,0,200,0.5)"
            : "0 4px 10px rgba(50,0,200,0.3)",
          transition: "all 0.2s ease",
          letterSpacing: "0.06em",
          fontFamily: "monospace",
        }}
      >
        ▶ PLAY NOW
      </button>
    </div>
  );
}

// ─── Night Centipede Hunt Card ─────────────────────────────────────────────────
function NightCentipedeCard({ onPlay }: { onPlay: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(30,0,0,0.9)" : "rgba(15,0,0,0.85)",
        border: `1px solid rgba(200,0,0,${hovered ? 0.7 : 0.3})`,
        borderRadius: "16px",
        padding: "16px",
        transition: "all 0.3s ease",
        boxShadow: hovered
          ? "0 0 30px rgba(180,0,0,0.7), 0 0 60px rgba(100,0,0,0.3), inset 0 0 20px rgba(80,0,0,0.2)"
          : "0 4px 20px rgba(50,0,0,0.6), inset 0 0 10px rgba(50,0,0,0.1)",
        transform: hovered ? "scale(1.03)" : "scale(1)",
      }}
    >
      {/* Logo */}
      <img
        src="/assets/generated/night-centipede-logo-transparent.dim_400x200.png"
        alt="Night Centipede Hunt Logo"
        style={{
          width: "100%",
          maxHeight: "100px",
          objectFit: "contain",
          marginBottom: "12px",
          filter: hovered
            ? "drop-shadow(0 0 14px #ff0000) drop-shadow(0 0 6px #800000)"
            : "drop-shadow(0 0 6px #cc0000) drop-shadow(0 0 2px #500000)",
          transition: "filter 0.3s ease",
        }}
      />
      {/* Name */}
      <h3
        style={{
          color: hovered ? "#ff4444" : "#cc2222",
          fontWeight: 700,
          fontSize: "15px",
          margin: "0 0 4px",
          textShadow: hovered
            ? "0 0 14px rgba(255,50,50,0.9), 0 0 28px rgba(200,0,0,0.5)"
            : "0 0 6px rgba(200,0,0,0.6)",
          transition: "color 0.3s ease, text-shadow 0.3s ease",
          fontFamily: "monospace",
          letterSpacing: "0.03em",
        }}
      >
        🐛 Night Centipede Hunt
      </h3>
      {/* Description */}
      <p
        style={{
          color: "rgba(200,80,80,0.75)",
          fontSize: "11px",
          margin: "0 0 14px",
          fontFamily: "monospace",
          letterSpacing: "0.04em",
        }}
      >
        3D Horror Survival · Night Chase
      </p>
      {/* Play button */}
      <button
        type="button"
        onClick={onPlay}
        data-ocid="sidegames.centipede.button"
        style={{
          width: "100%",
          padding: "10px 0",
          background: hovered
            ? "linear-gradient(135deg, #aa0000, #ff2222, #aa0000)"
            : "linear-gradient(135deg, #6b0000, #cc0000, #6b0000)",
          border: `1px solid rgba(255,80,80,${hovered ? 0.8 : 0.4})`,
          borderRadius: "8px",
          color: "white",
          fontWeight: 700,
          fontSize: "13px",
          cursor: "pointer",
          boxShadow: hovered
            ? "0 0 24px rgba(255,0,0,0.8), 0 4px 16px rgba(150,0,0,0.6)"
            : "0 4px 10px rgba(100,0,0,0.5)",
          transition: "all 0.2s ease",
          letterSpacing: "0.08em",
          fontFamily: "monospace",
          textShadow: "0 0 8px rgba(255,100,100,0.8)",
        }}
      >
        ▶ PLAY NOW
      </button>
    </div>
  );
}

// ─── Street Drift Legends Card ─────────────────────────────────────────────────
function StreetDriftLegendsCard({ onPlay }: { onPlay: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(20,8,0,0.95)" : "rgba(10,5,0,0.9)",
        border: `1px solid rgba(255,${hovered ? 140 : 100},0,${hovered ? 0.8 : 0.3})`,
        borderRadius: "16px",
        padding: "16px",
        transition: "all 0.3s ease",
        boxShadow: hovered
          ? "0 0 30px rgba(255,100,0,0.6), 0 0 60px rgba(200,60,0,0.25), inset 0 0 20px rgba(100,40,0,0.2)"
          : "0 4px 20px rgba(80,30,0,0.5), inset 0 0 10px rgba(60,20,0,0.1)",
        transform: hovered ? "scale(1.03)" : "scale(1)",
      }}
    >
      {/* Thumbnail */}
      <img
        src="/assets/generated/street-drift-legends-thumb.dim_400x225.jpg"
        alt="Street Drift Legends"
        style={{
          width: "100%",
          borderRadius: "10px",
          objectFit: "cover",
          marginBottom: "12px",
          maxHeight: "110px",
          filter: hovered
            ? "drop-shadow(0 0 10px rgba(255,120,0,0.7)) brightness(1.1)"
            : "drop-shadow(0 0 4px rgba(200,80,0,0.5))",
          transition: "filter 0.3s ease",
        }}
      />
      {/* Name */}
      <h3
        style={{
          fontWeight: 700,
          fontSize: "15px",
          margin: "0 0 4px",
          background: hovered
            ? "linear-gradient(90deg, #ff8800, #ffcc00, #ff8800)"
            : "linear-gradient(90deg, #cc6600, #ffaa00, #cc6600)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          fontFamily: "'Impact', monospace",
          letterSpacing: "0.04em",
          filter: hovered ? "drop-shadow(0 0 8px rgba(255,150,0,0.7))" : "none",
          transition: "filter 0.3s ease",
        }}
      >
        🚗 Street Drift Legends
      </h3>
      {/* Description */}
      <p
        style={{
          color: "rgba(255,170,80,0.7)",
          fontSize: "11px",
          margin: "0 0 14px",
          fontFamily: "monospace",
          letterSpacing: "0.04em",
        }}
      >
        3D Open World · Drive · Drift · Race
      </p>
      {/* Play button */}
      <button
        type="button"
        onClick={onPlay}
        data-ocid="sidegames.streetdrift.button"
        style={{
          width: "100%",
          padding: "10px 0",
          background: hovered
            ? "linear-gradient(135deg, #cc5500, #ff8800, #cc5500)"
            : "linear-gradient(135deg, #8a3800, #cc6600, #8a3800)",
          border: `1px solid rgba(255,150,0,${hovered ? 0.85 : 0.45})`,
          borderRadius: "8px",
          color: "white",
          fontWeight: 700,
          fontSize: "13px",
          cursor: "pointer",
          boxShadow: hovered
            ? "0 0 24px rgba(255,100,0,0.8), 0 4px 16px rgba(200,60,0,0.6)"
            : "0 4px 10px rgba(150,60,0,0.5)",
          transition: "all 0.2s ease",
          letterSpacing: "0.08em",
          fontFamily: "monospace",
          textShadow: "0 0 8px rgba(255,180,80,0.8)",
        }}
      >
        ▶ PLAY NOW
      </button>
    </div>
  );
}
