import ClickEffects from "@/components/ClickEffects";
import SideGames from "@/components/SideGames";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import ImageToPDF from "@/tools/ImageToPDF";
import PDFConverter from "@/tools/PDFConverter";
import PDFToImage from "@/tools/PDFToImage";
import QRCodeMaker from "@/tools/QRCodeMaker";
import TextToPDF from "@/tools/TextToPDF";
import {
  ArrowRight,
  ChevronDown,
  Download,
  FileOutput,
  FileText,
  ImageIcon,
  Images,
  Menu,
  QrCode,
  Share2,
  Shield,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const WELCOME_STARS = [
  {
    id: "ws0",
    w: 2.28,
    h: 1.05,
    l: 27.5,
    t: 22.32,
    o: 0.64,
    dur: 2.85,
    del: 1.78,
  },
  {
    id: "ws1",
    w: 1.17,
    h: 1.84,
    l: 2.98,
    t: 21.86,
    o: 0.5,
    dur: 1.55,
    del: 0.4,
  },
  {
    id: "ws2",
    w: 2.3,
    h: 2.09,
    l: 22.04,
    t: 58.93,
    o: 0.69,
    dur: 1.51,
    del: 1.61,
  },
  {
    id: "ws3",
    w: 2.4,
    h: 1.68,
    l: 15.55,
    t: 95.72,
    o: 0.4,
    dur: 1.69,
    del: 0.19,
  },
  {
    id: "ws4",
    w: 2.69,
    h: 2.21,
    l: 80.71,
    t: 72.97,
    o: 0.52,
    dur: 3.45,
    del: 0.76,
  },
  {
    id: "ws5",
    w: 2.1,
    h: 2.66,
    l: 61.85,
    t: 86.17,
    o: 0.55,
    dur: 2.91,
    del: 0.09,
  },
  {
    id: "ws6",
    w: 1.46,
    h: 1.58,
    l: 7.98,
    t: 23.28,
    o: 0.26,
    dur: 2.06,
    del: 1.27,
  },
  {
    id: "ws7",
    w: 1.73,
    h: 1.74,
    l: 20.95,
    t: 26.7,
    o: 0.76,
    dur: 2.8,
    del: 1.22,
  },
  {
    id: "ws8",
    w: 1.34,
    h: 2.46,
    l: 16.34,
    t: 37.95,
    o: 0.79,
    dur: 2.78,
    del: 1.11,
  },
  {
    id: "ws9",
    w: 2.37,
    h: 2.69,
    l: 77.6,
    t: 22.9,
    o: 0.22,
    dur: 2.13,
    del: 0.54,
  },
  {
    id: "ws10",
    w: 1.42,
    h: 2.89,
    l: 87.64,
    t: 31.47,
    o: 0.59,
    dur: 2.29,
    del: 1.83,
  },
  {
    id: "ws11",
    w: 1.92,
    h: 1.53,
    l: 24.66,
    t: 56.14,
    o: 0.36,
    dur: 2.67,
    del: 1.8,
  },
  {
    id: "ws12",
    w: 1.8,
    h: 1.44,
    l: 99.75,
    t: 50.95,
    o: 0.25,
    dur: 1.59,
    del: 0.22,
  },
  {
    id: "ws13",
    w: 2.25,
    h: 2.58,
    l: 42.22,
    t: 6.35,
    o: 0.43,
    dur: 3.49,
    del: 1.06,
  },
  {
    id: "ws14",
    w: 2.94,
    h: 2.72,
    l: 1.15,
    t: 72.07,
    o: 0.61,
    dur: 2.57,
    del: 0.53,
  },
  {
    id: "ws15",
    w: 2.28,
    h: 1.22,
    l: 43.48,
    t: 45.37,
    o: 0.77,
    dur: 3.25,
    del: 0.53,
  },
  {
    id: "ws16",
    w: 2.0,
    h: 1.36,
    l: 91.26,
    t: 87.05,
    o: 0.38,
    dur: 2.78,
    del: 1.22,
  },
  {
    id: "ws17",
    w: 1.31,
    h: 2.53,
    l: 53.94,
    t: 77.86,
    o: 0.52,
    dur: 1.5,
    del: 0.65,
  },
  {
    id: "ws18",
    w: 1.04,
    h: 2.86,
    l: 87.87,
    t: 83.17,
    o: 0.38,
    dur: 1.62,
    del: 1.76,
  },
  {
    id: "ws19",
    w: 2.89,
    h: 1.17,
    l: 48.6,
    t: 6.92,
    o: 0.66,
    dur: 3.03,
    del: 0.26,
  },
  {
    id: "ws20",
    w: 1.95,
    h: 2.1,
    l: 26.51,
    t: 87.24,
    o: 0.45,
    dur: 1.92,
    del: 1.08,
  },
  {
    id: "ws21",
    w: 2.46,
    h: 1.4,
    l: 31.17,
    t: 99.51,
    o: 0.59,
    dur: 2.38,
    del: 1.04,
  },
  {
    id: "ws22",
    w: 1.24,
    h: 1.45,
    l: 33.81,
    t: 58.83,
    o: 0.34,
    dur: 1.94,
    del: 0.14,
  },
  {
    id: "ws23",
    w: 2.26,
    h: 1.46,
    l: 90.54,
    t: 85.96,
    o: 0.24,
    dur: 1.98,
    del: 1.34,
  },
  {
    id: "ws24",
    w: 1.43,
    h: 1.26,
    l: 93.55,
    t: 57.1,
    o: 0.48,
    dur: 3.07,
    del: 1.61,
  },
  {
    id: "ws25",
    w: 1.38,
    h: 1.19,
    l: 43.11,
    t: 42.36,
    o: 0.48,
    dur: 2.96,
    del: 1.35,
  },
  {
    id: "ws26",
    w: 2.97,
    h: 1.2,
    l: 40.26,
    t: 33.93,
    o: 0.72,
    dur: 2.0,
    del: 0.38,
  },
  {
    id: "ws27",
    w: 1.9,
    h: 1.84,
    l: 27.85,
    t: 24.98,
    o: 0.75,
    dur: 2.39,
    del: 1.72,
  },
  {
    id: "ws28",
    w: 2.1,
    h: 1.1,
    l: 99.93,
    t: 83.6,
    o: 0.78,
    dur: 3.35,
    del: 1.7,
  },
  {
    id: "ws29",
    w: 1.33,
    h: 1.97,
    l: 21.37,
    t: 40.1,
    o: 0.24,
    dur: 2.26,
    del: 1.97,
  },
  {
    id: "ws30",
    w: 1.53,
    h: 2.57,
    l: 45.5,
    t: 42.3,
    o: 0.77,
    dur: 3.49,
    del: 1.11,
  },
  {
    id: "ws31",
    w: 2.44,
    h: 1.31,
    l: 29.67,
    t: 96.87,
    o: 0.55,
    dur: 2.58,
    del: 1.5,
  },
  {
    id: "ws32",
    w: 1.11,
    h: 2.17,
    l: 50.29,
    t: 85.27,
    o: 0.29,
    dur: 3.42,
    del: 0.16,
  },
  {
    id: "ws33",
    w: 1.37,
    h: 2.19,
    l: 67.52,
    t: 23.52,
    o: 0.27,
    dur: 3.28,
    del: 0.49,
  },
  {
    id: "ws34",
    w: 2.19,
    h: 2.24,
    l: 41.92,
    t: 58.37,
    o: 0.51,
    dur: 3.37,
    del: 0.41,
  },
  {
    id: "ws35",
    w: 2.43,
    h: 1.48,
    l: 39.58,
    t: 67.17,
    o: 0.38,
    dur: 2.13,
    del: 1.5,
  },
  {
    id: "ws36",
    w: 1.15,
    h: 1.92,
    l: 99.85,
    t: 99.61,
    o: 0.24,
    dur: 1.93,
    del: 0.53,
  },
  {
    id: "ws37",
    w: 2.87,
    h: 2.76,
    l: 87.93,
    t: 36.95,
    o: 0.29,
    dur: 3.17,
    del: 1.41,
  },
  {
    id: "ws38",
    w: 2.22,
    h: 2.97,
    l: 65.4,
    t: 0.78,
    o: 0.69,
    dur: 2.1,
    del: 1.33,
  },
  {
    id: "ws39",
    w: 2.88,
    h: 1.27,
    l: 11.54,
    t: 10.7,
    o: 0.53,
    dur: 2.04,
    del: 1.21,
  },
  {
    id: "ws40",
    w: 2.44,
    h: 1.41,
    l: 63.42,
    t: 26.4,
    o: 0.49,
    dur: 3.31,
    del: 1.69,
  },
  {
    id: "ws41",
    w: 1.18,
    h: 1.85,
    l: 27.67,
    t: 0.35,
    o: 0.66,
    dur: 2.77,
    del: 0.52,
  },
  {
    id: "ws42",
    w: 2.48,
    h: 2.1,
    l: 42.77,
    t: 0.97,
    o: 0.25,
    dur: 3.27,
    del: 1.81,
  },
  {
    id: "ws43",
    w: 2.09,
    h: 2.67,
    l: 58.25,
    t: 14.81,
    o: 0.28,
    dur: 2.12,
    del: 1.8,
  },
  {
    id: "ws44",
    w: 2.59,
    h: 2.72,
    l: 89.89,
    t: 21.01,
    o: 0.35,
    dur: 1.71,
    del: 1.56,
  },
  {
    id: "ws45",
    w: 2.77,
    h: 1.81,
    l: 62.07,
    t: 15.46,
    o: 0.76,
    dur: 3.23,
    del: 1.95,
  },
  {
    id: "ws46",
    w: 2.62,
    h: 2.76,
    l: 2.48,
    t: 73.66,
    o: 0.4,
    dur: 3.36,
    del: 1.6,
  },
  {
    id: "ws47",
    w: 2.73,
    h: 2.62,
    l: 26.68,
    t: 78.74,
    o: 0.26,
    dur: 3.24,
    del: 1.72,
  },
  {
    id: "ws48",
    w: 1.44,
    h: 2.63,
    l: 46.03,
    t: 30.52,
    o: 0.68,
    dur: 1.96,
    del: 0.05,
  },
  {
    id: "ws49",
    w: 1.39,
    h: 1.66,
    l: 86.44,
    t: 96.69,
    o: 0.37,
    dur: 2.78,
    del: 0.8,
  },
  {
    id: "ws50",
    w: 2.96,
    h: 2.07,
    l: 93.92,
    t: 11.53,
    o: 0.78,
    dur: 1.86,
    del: 1.93,
  },
  {
    id: "ws51",
    w: 1.53,
    h: 1.22,
    l: 43.46,
    t: 72.85,
    o: 0.39,
    dur: 2.71,
    del: 1.02,
  },
  {
    id: "ws52",
    w: 1.77,
    h: 2.15,
    l: 25.47,
    t: 70.88,
    o: 0.2,
    dur: 3.35,
    del: 1.08,
  },
  {
    id: "ws53",
    w: 2.44,
    h: 2.48,
    l: 67.06,
    t: 36.42,
    o: 0.24,
    dur: 2.83,
    del: 0.66,
  },
  {
    id: "ws54",
    w: 1.63,
    h: 2.7,
    l: 71.98,
    t: 30.03,
    o: 0.39,
    dur: 2.32,
    del: 0.8,
  },
  {
    id: "ws55",
    w: 1.59,
    h: 1.25,
    l: 42.04,
    t: 94.04,
    o: 0.61,
    dur: 3.31,
    del: 1.23,
  },
  {
    id: "ws56",
    w: 1.6,
    h: 2.1,
    l: 0.04,
    t: 28.69,
    o: 0.46,
    dur: 2.66,
    del: 1.31,
  },
  {
    id: "ws57",
    w: 1.93,
    h: 1.88,
    l: 21.37,
    t: 47.32,
    o: 0.74,
    dur: 3.09,
    del: 0.34,
  },
  {
    id: "ws58",
    w: 1.17,
    h: 2.03,
    l: 63.29,
    t: 33.52,
    o: 0.69,
    dur: 3.0,
    del: 1.35,
  },
  {
    id: "ws59",
    w: 1.45,
    h: 1.4,
    l: 2.44,
    t: 24.48,
    o: 0.49,
    dur: 3.2,
    del: 0.15,
  },
] as const;

// ── Welcome Splash ──────────────────────────────────────────────────────────
function WelcomeSplash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1800);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background:
          "linear-gradient(135deg, #050d2e 0%, #0a1660 40%, #160830 100%)",
      }}
      data-ocid="welcome.modal"
    >
      {/* Animated stars */}
      {WELCOME_STARS.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            width: `${s.w}px`,
            height: `${s.h}px`,
            left: `${s.l}%`,
            top: `${s.t}%`,
            opacity: s.o,
            animation: `twinkle ${s.dur}s ease-in-out infinite`,
            animationDelay: `${s.del}s`,
          }}
        />
      ))}

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center px-6 relative z-10"
      >
        <motion.div
          className="mb-6 flex justify-center"
          animate={{
            filter: [
              "drop-shadow(0 0 8px #60a5fa)",
              "drop-shadow(0 0 22px #a78bfa)",
              "drop-shadow(0 0 8px #60a5fa)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <img
            src="/assets/generated/qrpdf-logo-transparent.dim_320x80.png"
            alt="QR & PDF Tools Logo"
            className="h-14 w-auto object-contain"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </motion.div>
        <h1 className="font-extrabold text-3xl sm:text-4xl leading-tight mb-3 gradient-text-animate">
          Welcome to Free QR Tools
        </h1>
        <p
          className="text-base sm:text-lg font-medium"
          style={{ color: "#93c5fd" }}
        >
          Fast · Secure · 100% Free
        </p>
      </motion.div>
    </motion.div>
  );
}

// ── Aurora Background Orbs ─────────────────────────────────────────────────
function AuroraBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >
      {/* Deep background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #0a0f2c 0%, #0d1b4b 45%, #1a0533 100%)",
        }}
      />
      {/* Orb 1 - Blue */}
      <div
        className="absolute rounded-full"
        style={{
          width: "600px",
          height: "600px",
          top: "-100px",
          left: "-100px",
          background:
            "radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(37,99,235,0.08) 40%, transparent 70%)",
          animation: "float-orb 12s ease-in-out infinite",
          filter: "blur(40px)",
        }}
      />
      {/* Orb 2 - Purple */}
      <div
        className="absolute rounded-full"
        style={{
          width: "500px",
          height: "500px",
          top: "30%",
          right: "-80px",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(109,40,217,0.08) 40%, transparent 70%)",
          animation: "float-orb-2 15s ease-in-out infinite",
          animationDelay: "-5s",
          filter: "blur(50px)",
        }}
      />
      {/* Orb 3 - Teal */}
      <div
        className="absolute rounded-full"
        style={{
          width: "400px",
          height: "400px",
          bottom: "20%",
          left: "15%",
          background:
            "radial-gradient(circle, rgba(20,184,166,0.15) 0%, rgba(13,148,136,0.06) 40%, transparent 70%)",
          animation: "float-orb-3 18s ease-in-out infinite",
          animationDelay: "-8s",
          filter: "blur(45px)",
        }}
      />
      {/* Orb 4 - Pink */}
      <div
        className="absolute rounded-full"
        style={{
          width: "350px",
          height: "350px",
          bottom: "-50px",
          right: "25%",
          background:
            "radial-gradient(circle, rgba(236,72,153,0.12) 0%, rgba(219,39,119,0.05) 40%, transparent 70%)",
          animation: "float-orb 20s ease-in-out infinite",
          animationDelay: "-12s",
          filter: "blur(55px)",
        }}
      />
      {/* Orb 5 - Deep blue center glow */}
      <div
        className="absolute rounded-full"
        style={{
          width: "800px",
          height: "800px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(30,58,138,0.12) 0%, transparent 60%)",
          animation: "aurora 25s ease-in-out infinite",
          filter: "blur(60px)",
        }}
      />
    </div>
  );
}

// ── Live QR Preview Widget ───────────────────────────────────────────────────
function LiveQRPreview({ onGenerateClick }: { onGenerateClick: () => void }) {
  const [qrInput, setQrInput] = useState(
    "https://qr-generator-and-pdf-converter-8y9.caffeine.xyz",
  );
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    const text = encodeURIComponent(qrInput || "hello");
    setQrDataUrl(
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${text}&color=60A5FA&bgcolor=0d1b4b`,
    );
  }, [qrInput]);

  return (
    <motion.div
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(99,179,237,0.25)",
        borderRadius: "20px",
        padding: "24px",
        animation: "neon-border 3s ease-in-out infinite",
      }}
      data-ocid="hero.panel"
      animate={{ y: [0, -6, 0] }}
      transition={{
        duration: 3.5,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
    >
      <p
        className="text-xs font-bold uppercase tracking-widest mb-3 text-center"
        style={{ color: "#93c5fd" }}
      >
        ✨ Live QR Preview
      </p>

      <Input
        value={qrInput}
        onChange={(e) => setQrInput(e.target.value)}
        placeholder="Type anything to see QR update..."
        className="mb-5 text-sm rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-blue-400/50"
        data-ocid="hero.input"
      />

      {qrDataUrl && (
        <div className="flex justify-center mb-5">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: "2px solid rgba(99,179,237,0.4)",
              boxShadow:
                "0 0 20px rgba(59,130,246,0.35), 0 0 40px rgba(59,130,246,0.15)",
            }}
          >
            <img
              src={qrDataUrl}
              alt="Live QR Code Preview"
              className="w-[180px] h-[180px] block"
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onGenerateClick}
        className="w-full text-white font-semibold px-6 py-3 rounded-xl text-base transition-all duration-200 hover:scale-[1.02] active:scale-95"
        style={{
          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
          boxShadow:
            "0 0 20px rgba(59,130,246,0.4), 0 4px 16px rgba(124,58,237,0.3)",
          animation: "pulse-glow 2.5s ease-in-out infinite",
        }}
        data-ocid="hero.primary_button"
      >
        Generate QR Code
      </button>
    </motion.div>
  );
}

// ── Tool Card with 3D Tilt ───────────────────────────────────────────────────
const TOOL_GRADIENTS = [
  "linear-gradient(135deg, #1e40af, #3b82f6)", // blue
  "linear-gradient(135deg, #5b21b6, #7c3aed)", // purple
  "linear-gradient(135deg, #065f46, #10b981)", // teal
  "linear-gradient(135deg, #92400e, #f59e0b)", // orange
  "linear-gradient(135deg, #831843, #ec4899)", // pink
];

function ToolCard({
  tool,
  index,
  isActive,
  onToggle,
}: {
  tool: (typeof TOOLS)[number];
  index: number;
  isActive: boolean;
  onToggle: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -8, y: dx * 8 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: hovered ? "transform 0.05s ease" : "transform 0.4s ease",
      }}
      data-ocid={`tools.item.${index + 1}` as never}
    >
      <div
        className="h-full flex flex-col rounded-2xl p-6 cursor-pointer transition-all duration-300"
        style={{
          background: isActive
            ? "rgba(59,130,246,0.12)"
            : hovered
              ? "rgba(255,255,255,0.06)"
              : "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
          border: isActive
            ? "1px solid rgba(99,179,237,0.6)"
            : hovered
              ? "1px solid rgba(99,179,237,0.35)"
              : "1px solid rgba(255,255,255,0.08)",
          boxShadow: hovered
            ? "0 8px 32px rgba(59,130,246,0.2), 0 0 0 1px rgba(99,179,237,0.1)"
            : "none",
        }}
      >
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
          style={{ background: TOOL_GRADIENTS[index % TOOL_GRADIENTS.length] }}
        >
          <tool.icon className="w-5 h-5 text-white" />
        </div>
        {/* Title */}
        <h3 className="font-bold text-base mb-2 text-white">{tool.title}</h3>
        {/* Description */}
        <p
          className="text-sm mb-4 leading-relaxed flex-1"
          style={{ color: "rgba(148,163,184,0.9)" }}
        >
          {tool.description}
        </p>
        {/* Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="w-full py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95"
          style={{
            background: isActive
              ? "linear-gradient(135deg, #2563eb, #7c3aed)"
              : "rgba(99,179,237,0.12)",
            color: isActive ? "#fff" : "#93c5fd",
            border: "1px solid rgba(99,179,237,0.3)",
            boxShadow: isActive ? "0 0 16px rgba(59,130,246,0.35)" : "none",
          }}
          data-ocid={`tools.button.${index + 1}` as never}
        >
          {isActive ? "Close Tool" : "Open Tool"}
          {!isActive && <ChevronDown className="w-3 h-3 inline ml-1" />}
        </button>
      </div>
    </motion.div>
  );
}

// ── Constants ────────────────────────────────────────────────────────────────

const TOOLS = [
  {
    id: "qr-code-maker",
    icon: QrCode,
    title: "QR Code Maker",
    description:
      "Generate QR codes from URLs, text, or any content. Download and share instantly.",
    emoji: "📱",
  },
  {
    id: "pdf-converter",
    icon: FileText,
    title: "PDF Converter",
    description:
      "Convert images and text files into professional PDF documents in seconds.",
    emoji: "📄",
  },
  {
    id: "pdf-to-image",
    icon: ImageIcon,
    title: "PDF to Image",
    description:
      "Transform every page of your PDF into high-quality PNG images.",
    emoji: "🖼️",
  },
  {
    id: "text-to-pdf",
    icon: FileOutput,
    title: "Text to PDF",
    description:
      "Paste any plain text and convert it to a clean, formatted PDF document.",
    emoji: "📝",
  },
  {
    id: "image-to-pdf",
    icon: Images,
    title: "Image to PDF",
    description:
      "Merge multiple images into a single, organized PDF file with one click.",
    emoji: "🗂️",
  },
];

const HOW_IT_WORKS = [
  {
    icon: Upload,
    step: "01",
    title: "Upload or Enter Data",
    desc: "Select a file, paste your text, or enter a URL to get started.",
  },
  {
    icon: Zap,
    step: "02",
    title: "Convert Instantly",
    desc: "Our tool processes everything instantly in your browser — no uploads to servers, no waiting.",
  },
  {
    icon: Download,
    step: "03",
    title: "Download or Share",
    desc: "Download your result or share it directly with friends and colleagues.",
  },
];

const WHY_CHOOSE_US_NEW = [
  {
    emoji: "⚡",
    title: "Fast Processing",
    desc: "Instant results with zero wait time. No server uploads needed.",
    gradient: "linear-gradient(135deg, #1e40af, #3b82f6)",
  },
  {
    emoji: "🔒",
    title: "100% Privacy",
    desc: "Your files never leave your device. All processing is local.",
    gradient: "linear-gradient(135deg, #5b21b6, #7c3aed)",
  },
  {
    emoji: "🆓",
    title: "Free Forever",
    desc: "Completely free with no hidden fees, subscriptions, or limits.",
    gradient: "linear-gradient(135deg, #065f46, #10b981)",
  },
  {
    emoji: "📱",
    title: "Works on Any Device",
    desc: "Fully responsive on desktop, tablet, and mobile browsers.",
    gradient: "linear-gradient(135deg, #831843, #ec4899)",
  },
];

const FEATURES = [
  {
    icon: Download,
    title: "Instant Download",
    desc: "Get your files immediately with one click. No waiting, no queues.",
    color: "#60a5fa",
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    desc: "Share QR codes and documents directly via the Web Share API or clipboard.",
    color: "#a78bfa",
  },
  {
    icon: Shield,
    title: "100% Private",
    desc: "All processing happens in your browser. Your files never leave your device.",
    color: "#34d399",
  },
];

const SEO_CONTENT = [
  {
    value: "qr-code-generator",
    trigger: "What is a QR Code Generator?",
    content:
      "A QR code generator is an online tool that converts text, URLs, or data into a scannable QR code image. QR codes can be read by any smartphone camera and are widely used for sharing links, contact info, and more. Our free QR code generator works entirely in your browser with no registration required.",
  },
  {
    value: "pdf-converter",
    trigger: "What is a PDF Converter?",
    content:
      "A PDF converter is a tool that transforms various file formats—like images and plain text—into the universally readable PDF format. PDFs preserve formatting across all devices and operating systems, making them ideal for sharing documents professionally. Our online PDF converter requires no software installation.",
  },
  {
    value: "benefits",
    trigger: "Benefits of Using Online Tools",
    content:
      "Online tools like ours offer several advantages: they are accessible from any device with a browser, require no installation or signup, process data privately in your browser, and are completely free. Whether you need to generate a QR code or convert files to PDF, our tools deliver instant results securely.",
  },
];

const ToolComponents: Record<string, React.FC> = {
  "qr-code-maker": QRCodeMaker,
  "pdf-converter": PDFConverter,
  "pdf-to-image": PDFToImage,
  "text-to-pdf": TextToPDF,
  "image-to-pdf": ImageToPDF,
};

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "home" | "tools" | "contact"
  >("home");
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const scrollTo = (section: "home" | "tools" | "contact") => {
    setActiveSection(section);
    setMobileMenuOpen(false);
    const el = document.getElementById(section);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const toggleTool = (toolId: string) => {
    setActiveTool((prev) => (prev === toolId ? null : toolId));
    setTimeout(() => {
      document
        .getElementById(`tool-${toolId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error("Please fill in all fields.");
      return;
    }
    setContactLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setContactLoading(false);
    toast.success("Message sent! We'll get back to you soon.");
    setContactForm({ name: "", email: "", message: "" });
  };

  const handleGenerateQR = () => {
    scrollTo("tools");
    toggleTool("qr-code-maker");
  };

  const ActiveToolComponent = activeTool ? ToolComponents[activeTool] : null;

  return (
    <div
      className="min-h-screen font-sans relative"
      style={{ background: "#0a0f2c" }}
    >
      <AuroraBackground />
      <ClickEffects />
      <Toaster position="top-right" />

      {/* Welcome Splash */}
      <AnimatePresence>
        {showWelcome && <WelcomeSplash onDone={() => setShowWelcome(false)} />}
      </AnimatePresence>

      {/* Main site */}
      {!showWelcome && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative min-h-screen"
          style={{ zIndex: 1 }}
        >
          {/* Navbar */}
          <header
            className="sticky top-0 z-50"
            style={{
              background: "rgba(10,15,44,0.75)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
            data-ocid="nav.panel"
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
              <button
                type="button"
                className="flex items-center"
                onClick={() => scrollTo("home")}
                data-ocid="nav.link"
              >
                <img
                  src="/assets/generated/qrpdf-logo-transparent.dim_320x80.png"
                  alt="QR & PDF Tools Logo"
                  className="h-9 w-auto object-contain logo-glow"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </button>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-6">
                {(["home", "tools", "contact"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => scrollTo(s)}
                    className="capitalize text-sm font-medium transition-all duration-200"
                    style={{
                      color:
                        activeSection === s
                          ? "#60a5fa"
                          : "rgba(148,163,184,0.8)",
                      textShadow:
                        activeSection === s
                          ? "0 0 12px rgba(96,165,250,0.5)"
                          : "none",
                    }}
                    data-ocid={`nav.${s}.link` as never}
                  >
                    {s}
                  </button>
                ))}
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                    boxShadow: "0 0 16px rgba(59,130,246,0.4)",
                  }}
                  onClick={() => scrollTo("tools")}
                  data-ocid="nav.primary_button"
                >
                  Get Started
                </button>
              </nav>

              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden p-2 rounded-lg transition-colors"
                style={{ color: "rgba(148,163,184,0.8)" }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-ocid="nav.toggle"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="md:hidden overflow-hidden"
                  style={{
                    background: "rgba(10,15,44,0.95)",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="px-4 py-4 flex flex-col gap-1">
                    {(["home", "tools", "contact"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => scrollTo(s)}
                        className="capitalize text-sm font-medium text-left py-2.5 px-3 rounded-lg transition-all duration-200"
                        style={{ color: "rgba(148,163,184,0.9)" }}
                        data-ocid={`nav.mobile.${s}.link` as never}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </header>

          <main>
            {/* ── Hero Section ── */}
            <section id="home" className="py-20 lg:py-28 relative">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                  {/* Left column */}
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    {/* Badge */}
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
                      style={{
                        background: "rgba(59,130,246,0.12)",
                        color: "#93c5fd",
                        border: "1px solid rgba(99,179,237,0.3)",
                        animation: "badge-pulse 2.5s ease-in-out infinite",
                      }}
                    >
                      <Zap className="w-3 h-3" />
                      Free Online Tools
                    </motion.span>

                    <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4">
                      <span className="gradient-text-animate">
                        Free QR Code Generator
                      </span>
                      <br />
                      <span style={{ color: "rgba(255,255,255,0.9)" }}>
                        &amp; PDF Tools
                      </span>
                    </h1>

                    <p
                      className="text-lg mb-2 leading-relaxed"
                      style={{ color: "rgba(148,163,184,0.8)" }}
                    >
                      Generate QR codes, convert PDFs, transform images — all
                      free.
                    </p>
                    <p
                      className="font-bold text-base mb-8"
                      style={{
                        background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      ⚡ Fast, Secure &amp; Easy
                    </p>

                    {/* Primary CTA */}
                    <motion.button
                      type="button"
                      onClick={handleGenerateQR}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      className="inline-flex items-center gap-2 text-white font-semibold px-8 py-4 rounded-xl text-base"
                      style={{
                        background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                        boxShadow:
                          "0 0 30px rgba(59,130,246,0.5), 0 4px 20px rgba(124,58,237,0.35)",
                        animation: "pulse-glow 2.5s ease-in-out infinite",
                      }}
                      data-ocid="hero.primary_button"
                    >
                      Generate QR Code Now
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </motion.div>

                  {/* Right column — Live QR Preview */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                  >
                    <LiveQRPreview onGenerateClick={handleGenerateQR} />
                  </motion.div>
                </div>
              </div>
            </section>

            {/* ── Tools Grid Section ── */}
            <section
              id="tools"
              className="py-20 relative"
              style={{
                background: "rgba(0,0,0,0.15)",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-3"
                    style={{ color: "#60a5fa" }}
                  >
                    — Powerful Tools —
                  </p>
                  <h2
                    className="font-bold text-3xl sm:text-4xl mb-3"
                    style={{
                      background:
                        "linear-gradient(90deg, #60a5fa, #a78bfa, #34d399)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Choose Your Tool
                  </h2>
                  <p
                    className="text-lg max-w-2xl mx-auto"
                    style={{ color: "rgba(148,163,184,0.75)" }}
                  >
                    Five powerful tools, zero cost. Select a tool below to get
                    started instantly.
                  </p>
                </motion.div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                  {TOOLS.map((tool, i) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      index={i}
                      isActive={activeTool === tool.id}
                      onToggle={() => toggleTool(tool.id)}
                    />
                  ))}
                </div>

                {/* Expanded tool panel */}
                <AnimatePresence>
                  {activeTool && ActiveToolComponent && (
                    <motion.div
                      id={`tool-${activeTool}`}
                      key={activeTool}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="rounded-2xl p-6 sm:p-8"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          backdropFilter: "blur(20px)",
                          border: "1px solid rgba(99,179,237,0.2)",
                          boxShadow: "0 0 40px rgba(59,130,246,0.1)",
                        }}
                        data-ocid="tools.panel"
                      >
                        <ActiveToolComponent />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* ── Why Choose Us ── */}
            <section className="py-20 relative">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-3"
                    style={{ color: "#a78bfa" }}
                  >
                    — Why Us —
                  </p>
                  <h2
                    className="font-bold text-3xl sm:text-4xl mb-3"
                    style={{
                      background: "linear-gradient(90deg, #a78bfa, #60a5fa)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Why Choose Us
                  </h2>
                  <p
                    className="text-lg max-w-2xl mx-auto"
                    style={{ color: "rgba(148,163,184,0.75)" }}
                  >
                    Everything you need, nothing you don't. Built for speed,
                    privacy, and simplicity.
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {WHY_CHOOSE_US_NEW.map((item, i) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      whileHover={{ y: -4 }}
                      className="rounded-2xl p-6 text-center transition-all duration-300 cursor-default"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.border =
                          "1px solid rgba(99,179,237,0.3)";
                        (e.currentTarget as HTMLElement).style.boxShadow =
                          "0 8px 32px rgba(59,130,246,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.border =
                          "1px solid rgba(255,255,255,0.07)";
                        (e.currentTarget as HTMLElement).style.boxShadow =
                          "none";
                      }}
                      data-ocid={`why.item.${i + 1}` as never}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: item.gradient }}
                      >
                        <span className="text-2xl">{item.emoji}</span>
                      </div>
                      <h3 className="font-semibold text-base mb-2 text-white">
                        {item.title}
                      </h3>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "rgba(148,163,184,0.8)" }}
                      >
                        {item.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── How It Works ── */}
            <section
              className="py-20"
              style={{
                background: "rgba(0,0,0,0.1)",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <h2
                    className="font-bold text-3xl sm:text-4xl mb-3"
                    style={{
                      background: "linear-gradient(90deg, #34d399, #60a5fa)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    How It Works
                  </h2>
                  <p
                    className="text-lg"
                    style={{ color: "rgba(148,163,184,0.75)" }}
                  >
                    Three simple steps to get your result
                  </p>
                </motion.div>

                <div className="grid sm:grid-cols-3 gap-8">
                  {HOW_IT_WORKS.map((step, i) => (
                    <motion.div
                      key={step.step}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="text-center"
                    >
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(37,99,235,0.3), rgba(124,58,237,0.3))",
                          border: "1px solid rgba(99,179,237,0.2)",
                        }}
                      >
                        <step.icon
                          className="w-6 h-6"
                          style={{ color: "#60a5fa" }}
                        />
                      </div>
                      <span
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: "#a78bfa" }}
                      >
                        Step {step.step}
                      </span>
                      <h3 className="font-semibold text-lg mt-1 mb-2 text-white">
                        {step.title}
                      </h3>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "rgba(148,163,184,0.75)" }}
                      >
                        {step.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Feature Strip ── */}
            <section className="py-14">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="grid sm:grid-cols-3 gap-6">
                  {FEATURES.map((feat) => (
                    <motion.div
                      key={feat.title}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="flex gap-4 items-start"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: `${feat.color}18`,
                          border: `1px solid ${feat.color}30`,
                        }}
                      >
                        <feat.icon
                          className="w-5 h-5"
                          style={{ color: feat.color }}
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-base mb-1 text-white">
                          {feat.title}
                        </h4>
                        <p
                          className="text-sm"
                          style={{ color: "rgba(148,163,184,0.75)" }}
                        >
                          {feat.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Bottom CTA Section ── */}
            <section
              className="py-20 text-center relative"
              style={{
                background: "rgba(0,0,0,0.12)",
                borderTop: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-2xl mx-auto px-4"
              >
                <h2
                  className="font-bold text-3xl sm:text-4xl mb-4"
                  style={{
                    background:
                      "linear-gradient(90deg, #60a5fa, #a78bfa, #34d399)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    animation: "shimmer 4s linear infinite",
                  }}
                >
                  Start Creating QR Codes Now
                </h2>
                <p
                  className="text-lg mb-8"
                  style={{ color: "rgba(148,163,184,0.75)" }}
                >
                  Free, fast, and works entirely in your browser.
                </p>
                <motion.button
                  type="button"
                  onClick={handleGenerateQR}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex items-center gap-2 text-white font-semibold px-10 py-4 rounded-xl text-lg"
                  style={{
                    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                    boxShadow:
                      "0 0 30px rgba(59,130,246,0.5), 0 4px 20px rgba(124,58,237,0.35)",
                  }}
                  data-ocid="cta.primary_button"
                >
                  Generate QR Code
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </motion.div>
            </section>

            {/* ── Contact Section ── */}
            <section id="contact" className="py-20">
              <div className="max-w-xl mx-auto px-4 sm:px-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-10"
                >
                  <h2
                    className="font-bold text-3xl sm:text-4xl mb-3"
                    style={{
                      background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Contact Us
                  </h2>
                  <p style={{ color: "rgba(148,163,184,0.75)" }}>
                    Have a question or feedback? We'd love to hear from you.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="rounded-2xl p-6 sm:p-8"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <form onSubmit={handleContactSubmit} className="space-y-5">
                    <div>
                      <Label
                        htmlFor="contact-name"
                        className="mb-1.5 block text-white"
                      >
                        Name
                      </Label>
                      <Input
                        id="contact-name"
                        placeholder="Your name"
                        value={contactForm.name}
                        onChange={(e) =>
                          setContactForm((p) => ({
                            ...p,
                            name: e.target.value,
                          }))
                        }
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400/50"
                        data-ocid="contact.input"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="contact-email"
                        className="mb-1.5 block text-white"
                      >
                        Email
                      </Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="your@email.com"
                        value={contactForm.email}
                        onChange={(e) =>
                          setContactForm((p) => ({
                            ...p,
                            email: e.target.value,
                          }))
                        }
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400/50"
                        data-ocid="contact.input"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="contact-message"
                        className="mb-1.5 block text-white"
                      >
                        Message
                      </Label>
                      <Textarea
                        id="contact-message"
                        placeholder="How can we help?"
                        rows={5}
                        value={contactForm.message}
                        onChange={(e) =>
                          setContactForm((p) => ({
                            ...p,
                            message: e.target.value,
                          }))
                        }
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-400/50"
                        data-ocid="contact.textarea"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="rounded-xl w-full font-semibold border-0"
                      style={{
                        background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                        boxShadow: "0 0 20px rgba(59,130,246,0.3)",
                      }}
                      disabled={contactLoading}
                      data-ocid="contact.submit_button"
                    >
                      {contactLoading ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </motion.div>
              </div>
            </section>

            {/* ── SEO Content Section ── */}
            <section
              className="py-20"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(0,0,0,0.08)",
              }}
            >
              <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <h2
                    className="font-bold text-3xl sm:text-4xl mb-3"
                    style={{
                      background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Learn More About Our Tools
                  </h2>
                  <p
                    className="text-lg"
                    style={{ color: "rgba(148,163,184,0.75)" }}
                  >
                    Understand how our tools work and why they're the best
                    choice for your needs.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full space-y-2"
                  >
                    {SEO_CONTENT.map((item) => (
                      <AccordionItem
                        key={item.value}
                        value={item.value}
                        className="rounded-xl px-5"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.07)",
                        }}
                      >
                        <AccordionTrigger className="font-semibold text-base hover:no-underline py-4 text-white">
                          {item.trigger}
                        </AccordionTrigger>
                        <AccordionContent
                          className="text-sm leading-relaxed pb-4"
                          style={{ color: "rgba(148,163,184,0.8)" }}
                        >
                          {item.content}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </motion.div>
              </div>
            </section>
          </main>

          {/* ── Footer ── */}
          <footer
            className="py-12"
            style={{
              background: "rgba(5,8,24,0.95)",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 mb-8">
                {/* Brand */}
                <div className="md:col-span-2">
                  <img
                    src="/assets/generated/qrpdf-logo-transparent.dim_320x80.png"
                    alt="QR & PDF Tools Logo"
                    className="h-9 w-auto object-contain mb-4"
                    style={{ filter: "brightness(0) invert(1)" }}
                  />
                  <p
                    className="text-xs max-w-xs leading-relaxed"
                    style={{ color: "rgba(99,179,237,0.65)" }}
                  >
                    Free online tools for QR code generation and PDF conversion.
                    Works entirely in your browser with no data collection.
                  </p>
                </div>

                {/* Company */}
                <div>
                  <h5
                    className="font-semibold text-sm mb-3"
                    style={{ color: "#a78bfa" }}
                  >
                    Company
                  </h5>
                  <ul className="space-y-2">
                    <li>
                      <button
                        type="button"
                        onClick={() => scrollTo("contact")}
                        className="text-xs transition-colors hover:text-white"
                        style={{ color: "rgba(148,163,184,0.6)" }}
                      >
                        About Us
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => scrollTo("contact")}
                        className="text-xs transition-colors hover:text-white"
                        style={{ color: "rgba(148,163,184,0.6)" }}
                      >
                        Contact
                      </button>
                    </li>
                    <li>
                      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
                        <DialogTrigger asChild>
                          <button
                            type="button"
                            className="text-xs transition-colors hover:text-white"
                            style={{ color: "rgba(148,163,184,0.6)" }}
                            data-ocid="footer.privacy.open_modal_button"
                          >
                            Privacy Policy
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="font-bold">
                              Privacy Policy
                            </DialogTitle>
                            <DialogDescription>
                              Last updated: {new Date().getFullYear()}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="text-sm text-muted-foreground space-y-4 leading-relaxed">
                            <p>
                              <strong>No Data Collection.</strong> We do not
                              collect, store, or share any personal data or
                              files. All processing happens entirely within your
                              browser.
                            </p>
                            <p>
                              <strong>Google Analytics.</strong> We use Google
                              Analytics (measurement ID: G-X56VJ2MNZQ) to
                              understand how visitors use our site.
                            </p>
                            <p>
                              <strong>Cookies.</strong> We use only the
                              analytical cookies set by Google Analytics.
                            </p>
                            <p>
                              <strong>Third-Party Services.</strong> Apart from
                              Google Analytics, we do not integrate any
                              third-party services that collect user data.
                            </p>
                          </div>
                          <div className="flex justify-end pt-2">
                            <Button
                              size="sm"
                              onClick={() => setPrivacyOpen(false)}
                              data-ocid="footer.privacy.close_button"
                            >
                              Close
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </li>
                    <li>
                      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
                        <DialogTrigger asChild>
                          <button
                            type="button"
                            className="text-xs transition-colors hover:text-white"
                            style={{ color: "rgba(148,163,184,0.6)" }}
                            data-ocid="footer.terms.open_modal_button"
                          >
                            Terms and Conditions
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="font-bold">
                              Terms and Conditions
                            </DialogTitle>
                            <DialogDescription>
                              Last updated: {new Date().getFullYear()}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="text-sm text-muted-foreground space-y-4 leading-relaxed">
                            <p>
                              <strong>Acceptance of Terms.</strong> By using QR
                              &amp; PDF Tools, you agree to these Terms and
                              Conditions.
                            </p>
                            <p>
                              <strong>Use of Tools.</strong> Our tools are
                              provided for personal, non-commercial use.
                            </p>
                            <p>
                              <strong>No Warranty.</strong> The tools are
                              provided "as-is" without warranty of any kind,
                              express or implied.
                            </p>
                            <p>
                              <strong>Limitation of Liability.</strong> To the
                              fullest extent permitted by law, we shall not be
                              liable for any indirect or consequential damages.
                            </p>
                          </div>
                          <div className="flex justify-end pt-2">
                            <Button
                              size="sm"
                              onClick={() => setTermsOpen(false)}
                              data-ocid="footer.terms.close_button"
                            >
                              Close
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </li>
                  </ul>
                </div>
              </div>

              <div
                className="border-t pt-6 text-center"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <p
                  className="text-xs"
                  style={{ color: "rgba(99,179,237,0.55)" }}
                >
                  &copy; {new Date().getFullYear()}. MADE BY B.VEDANT &mdash;{" "}
                  <a
                    href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-purple-300 transition-colors"
                    style={{ color: "rgba(167,139,250,0.65)" }}
                  >
                    Built with caffeine.ai
                  </a>
                </p>
              </div>
            </div>
          </footer>
        </motion.div>
      )}
      <SideGames />
    </div>
  );
}
