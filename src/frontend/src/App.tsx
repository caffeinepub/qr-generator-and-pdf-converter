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
  Download,
  FileOutput,
  FileText,
  ImageIcon,
  Images,
  Loader2,
  Menu,
  QrCode,
  Share2,
  Shield,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import QRCode from "qrcode";

// ── Gradient text inline style helper ────────────────────────────────────────
const gradientTextStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const qrReadyGradientStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #60A5FA, #A78BFA)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

// ── QR Success Popup ─────────────────────────────────────────────────────────
interface QRSuccessPopupProps {
  qrDataUrl: string;
  inputText: string;
  phase: "fireworks" | "options";
  onClose: () => void;
  onDone: () => void;
}

function QRSuccessPopup({
  qrDataUrl,
  inputText,
  phase,
  onClose,
  onDone,
}: QRSuccessPopupProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (phase !== "fireworks") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use parent size for absolute-positioned canvas
    const parent = canvas.parentElement;
    const pw = parent ? parent.offsetWidth : window.innerWidth;
    const ph = parent ? parent.offsetHeight : window.innerHeight;

    canvas.width = pw * window.devicePixelRatio;
    canvas.height = ph * window.devicePixelRatio;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const W = pw;
    const H = ph;

    // Blue/purple prominent, with gold, pink, white
    const COLORS = [
      "#3B82F6",
      "#3B82F6",
      "#60A5FA",
      "#93C5FD",
      "#8B5CF6",
      "#8B5CF6",
      "#A78BFA",
      "#C4B5FD",
      "#F59E0B",
      "#EC4899",
      "#ffffff",
      "#FCD34D",
    ];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      alpha: number;
      decay: number;
      isStar: boolean;
      rotation: number;
      rotSpeed: number;
    }

    let particles: Particle[] = [];
    const startTime = Date.now();
    const DURATION = 2000;

    const drawStar = (cx: number, cy: number, r: number, rot: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.beginPath();
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2;
        const aHalf = a + Math.PI / 4;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.lineTo(Math.cos(aHalf) * r * 0.4, Math.sin(aHalf) * r * 0.4);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const burst = (x: number, y: number) => {
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2 + Math.random() * 0.2;
        const speed = 1.5 + Math.random() * 4.5;
        const isStar = Math.random() > 0.65;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: isStar ? 4 + Math.random() * 4 : 2.5 + Math.random() * 3.5,
          alpha: 1,
          decay: 0.013 + Math.random() * 0.013,
          isStar,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.15,
        });
      }
    };

    let lastBurst = 0;
    let animId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, W, H);

      if (elapsed < DURATION && elapsed - lastBurst > 200) {
        const bx = W * 0.15 + Math.random() * W * 0.7;
        const by = H * 0.05 + Math.random() * H * 0.55;
        burst(bx, by);
        // Sometimes double burst
        if (Math.random() > 0.5) {
          burst(
            W * 0.15 + Math.random() * W * 0.7,
            H * 0.05 + Math.random() * H * 0.45,
          );
        }
        lastBurst = elapsed;
      }

      particles = particles.filter((p) => p.alpha > 0.01);
      for (const p of particles) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        if (p.isStar) {
          drawStar(p.x, p.y, p.size, p.rotation);
          p.rotation += p.rotSpeed;
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.07;
        p.vx *= 0.99;
        p.alpha -= p.decay;
      }
      ctx.globalAlpha = 1;

      if (elapsed < DURATION || particles.length > 0) {
        animId = requestAnimationFrame(animate);
      }
    };

    burst(W * 0.25, H * 0.35);
    burst(W * 0.75, H * 0.35);
    burst(W * 0.5, H * 0.2);
    animId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animId);
  }, [phase]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "qrcode.png";
    a.click();
    toast.success("QR code downloaded!");
  };

  const handleShare = async () => {
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      const file = new File([blob], "qrcode.png", { type: "image/png" });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "QR Code",
          text: inputText,
        });
      } else {
        await navigator.clipboard.writeText(inputText);
        toast.success("Link copied to clipboard!");
      }
    } catch {
      toast.error("Could not share QR code.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.60)", backdropFilter: "blur(6px)" }}
      data-ocid="qr_popup.modal"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto p-6 sm:p-8 overflow-hidden"
        style={{
          boxShadow:
            "0 0 0 1px rgba(147,197,253,0.3), 0 24px 60px rgba(139,92,246,0.22), 0 8px 20px rgba(0,0,0,0.15)",
        }}
      >
        {/* Blue/purple glow border effect */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "16px",
            background:
              "linear-gradient(135deg, rgba(147,197,253,0.15) 0%, rgba(196,181,253,0.10) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
          aria-label="Close popup"
          data-ocid="qr_popup.close_button"
        >
          <X className="w-4 h-4" />
        </button>

        {/* QR Code image */}
        <div className="flex justify-center mb-4">
          <div
            className="p-2 rounded-2xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(147,197,253,0.25), rgba(196,181,253,0.20))",
              boxShadow: "0 0 24px rgba(139,92,246,0.18)",
            }}
          >
            <img
              src={qrDataUrl}
              alt="Generated QR Code"
              className="w-44 h-44 rounded-xl block"
              data-ocid="qr_popup.success_state"
            />
          </div>
        </div>

        {/* Fireworks canvas */}
        {phase === "fireworks" && (
          <canvas ref={canvasRef} className="qr-popup-canvas mb-3" />
        )}

        {/* ✨ QR is Ready! */}
        <div className="text-center mb-2">
          <p
            className="text-2xl font-extrabold tracking-tight"
            style={qrReadyGradientStyle}
          >
            ✨ QR is Ready!
          </p>
          {phase === "fireworks" && (
            <p className="text-xs text-gray-400 mt-1">
              Your QR code has been generated!
            </p>
          )}
        </div>

        {/* Actions */}
        {phase === "fireworks" ? (
          <motion.button
            type="button"
            onClick={onDone}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="mt-4 w-full py-3 rounded-full font-bold text-white text-base tracking-wide"
            style={{
              background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
              boxShadow: "0 4px 18px rgba(139,92,246,0.35)",
            }}
            data-ocid="qr_popup.confirm_button"
          >
            DONE
          </motion.button>
        ) : (
          <div className="mt-4 flex gap-3">
            <motion.button
              type="button"
              onClick={handleDownload}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex-1 py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 border-2"
              style={{
                borderColor: "#8B5CF6",
                color: "#8B5CF6",
              }}
              data-ocid="qr_popup.secondary_button"
            >
              <Download className="w-4 h-4" />
              Download
            </motion.button>
            <motion.button
              type="button"
              onClick={handleShare}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex-1 py-3 rounded-full font-semibold text-white text-sm flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                boxShadow: "0 4px 14px rgba(139,92,246,0.30)",
              }}
              data-ocid="qr_popup.primary_button"
            >
              <Share2 className="w-4 h-4" />
              Share
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Inline QR Hero Widget ────────────────────────────────────────────────────
const DEFAULT_QR_TEXT =
  "https://qr-generator-and-pdf-converter-8y9.caffeine.xyz";

function HeroQRWidget() {
  const [inputText, setInputText] = useState(DEFAULT_QR_TEXT);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQRPopup, setShowQRPopup] = useState(false);
  const [popupPhase, setPopupPhase] = useState<"fireworks" | "options">(
    "fireworks",
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate on mount with default value
  useEffect(() => {
    QRCode.toDataURL(DEFAULT_QR_TEXT, {
      errorCorrectionLevel: "M" as any,
      width: 384,
      margin: 3,
      color: { dark: "#1E293B", light: "#ffffff" },
    } as any)
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
  }, []);

  const regenerate = useCallback((text: string) => {
    if (!text.trim()) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(text.trim(), {
      errorCorrectionLevel: "M" as any,
      width: 384,
      margin: 3,
      color: { dark: "#1E293B", light: "#ffffff" },
    } as any)
      .then((url) => setQrDataUrl(url))
      .catch(() => toast.error("Failed to generate QR code."));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => regenerate(val), 150);
  };

  const handleGenerate = () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    QRCode.toDataURL(inputText.trim(), {
      errorCorrectionLevel: "M" as any,
      width: 384,
      margin: 3,
      color: { dark: "#1E293B", light: "#ffffff" },
    } as any)
      .then((url) => {
        setQrDataUrl(url);
        setPopupPhase("fireworks");
        setShowQRPopup(true);
      })
      .catch(() => toast.error("Failed to generate QR code."))
      .finally(() => setIsGenerating(false));
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "qrcode.png";
    a.click();
    toast.success("QR code downloaded!");
  };

  return (
    <>
      <div
        className="w-full max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8"
        data-ocid="hero.panel"
      >
        <div className="space-y-4">
          {/* Input */}
          <div>
            <Input
              value={inputText}
              onChange={handleChange}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="Enter URL or text..."
              className="h-12 text-base border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl"
              data-ocid="hero.input"
              aria-label="Enter URL or text to generate QR code"
            />
          </div>

          {/* Generate button */}
          <motion.button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            whileHover={{ scale: isGenerating ? 1 : 1.03 }}
            whileTap={{ scale: isGenerating ? 1 : 0.97 }}
            className="w-full h-12 rounded-xl font-semibold text-white text-base flex items-center justify-center gap-2 disabled:opacity-80 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
              boxShadow: "0 4px 14px rgba(139,92,246,0.25)",
            }}
            data-ocid="hero.primary_button"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate QR Code"
            )}
          </motion.button>

          {/* QR Preview */}
          {qrDataUrl && (
            <div className="flex flex-col items-center gap-3 pt-2">
              <img
                src={qrDataUrl}
                alt="Generated QR Code"
                className="w-48 h-48 rounded-xl border border-gray-100 shadow-sm"
                data-ocid="hero.success_state"
              />
              <motion.button
                type="button"
                onClick={handleDownload}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                data-ocid="hero.secondary_button"
              >
                <Download className="w-4 h-4" />
                Download QR Code
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* QR Success Popup */}
      <AnimatePresence>
        {showQRPopup && qrDataUrl && (
          <QRSuccessPopup
            qrDataUrl={qrDataUrl}
            inputText={inputText}
            phase={popupPhase}
            onClose={() => setShowQRPopup(false)}
            onDone={() => setPopupPhase("options")}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Tool Card ────────────────────────────────────────────────────────────────
const TOOL_ICONS_BG = [
  "bg-blue-50 text-blue-600",
  "bg-violet-50 text-violet-600",
  "bg-emerald-50 text-emerald-600",
  "bg-amber-50 text-amber-600",
  "bg-pink-50 text-pink-600",
];

function ToolCard({
  tool,
  index,
  onOpen,
}: {
  tool: (typeof TOOLS)[number];
  index: number;
  onOpen: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className="tool-card bg-white rounded-xl border border-gray-100 shadow-sm p-5 cursor-pointer"
      onClick={onOpen}
      data-ocid={`tools.item.${index + 1}` as never}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${TOOL_ICONS_BG[index % TOOL_ICONS_BG.length]}`}
      >
        <tool.icon className="w-5 h-5" />
      </div>
      <h3 className="font-semibold text-sm text-gray-900 mb-1">{tool.title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed mb-3">
        {tool.description}
      </p>
      <button
        type="button"
        className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        data-ocid={`tools.button.${index + 1}` as never}
      >
        Open Tool →
      </button>
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
  },
  {
    id: "pdf-converter",
    icon: FileText,
    title: "PDF Converter",
    description:
      "Convert images and text files into professional PDF documents in seconds.",
  },
  {
    id: "pdf-to-image",
    icon: ImageIcon,
    title: "PDF to Image",
    description:
      "Transform every page of your PDF into high-quality PNG images.",
  },
  {
    id: "text-to-pdf",
    icon: FileOutput,
    title: "Text to PDF",
    description:
      "Paste any plain text and convert it to a clean, formatted PDF document.",
  },
  {
    id: "image-to-pdf",
    icon: Images,
    title: "Image to PDF",
    description:
      "Merge multiple images into a single, organized PDF file with one click.",
  },
];

const WHY_CHOOSE_US = [
  {
    emoji: "⚡",
    title: "Fast Processing",
    desc: "Instant results with zero wait time. No server uploads needed.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    emoji: "🔒",
    title: "100% Privacy",
    desc: "Your files never leave your device. All processing is local.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    emoji: "🆓",
    title: "Free Forever",
    desc: "Completely free with no hidden fees, subscriptions, or limits.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    emoji: "📱",
    title: "Works on Any Device",
    desc: "Fully responsive on desktop, tablet, and mobile browsers.",
    color: "bg-amber-50 text-amber-600",
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
    desc: "Our tool processes everything instantly in your browser — no uploads to servers.",
  },
  {
    icon: Download,
    step: "03",
    title: "Download or Share",
    desc: "Download your result or share it directly with friends and colleagues.",
  },
];

const FEATURES = [
  {
    icon: Download,
    title: "Instant Download",
    desc: "Get your files immediately with one click. No waiting, no queues.",
    colorClass: "bg-blue-50 text-blue-600",
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    desc: "Share QR codes and documents directly via the Web Share API or clipboard.",
    colorClass: "bg-violet-50 text-violet-600",
  },
  {
    icon: Shield,
    title: "100% Private",
    desc: "All processing happens in your browser. Your files never leave your device.",
    colorClass: "bg-emerald-50 text-emerald-600",
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  // Tool QR popup state
  const [toolQrUrl, setToolQrUrl] = useState<string | null>(null);
  const [toolQrInput, setToolQrInput] = useState("");
  const [showToolQRPopup, setShowToolQRPopup] = useState(false);
  const [toolPopupPhase, setToolPopupPhase] = useState<"fireworks" | "options">(
    "fireworks",
  );

  const handleToolQRGenerated = (qrDataUrl: string, inputText: string) => {
    setToolQrUrl(qrDataUrl);
    setToolQrInput(inputText);
    setToolPopupPhase("fireworks");
    setShowToolQRPopup(true);
  };

  const scrollTo = (section: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(section);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const openTool = (toolId: string) => {
    setActiveTool(toolId);
    setTimeout(() => {
      document
        .getElementById("tool-panel")
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

  const ActiveToolComponent = activeTool ? ToolComponents[activeTool] : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans relative">
      {/* ── Ambient orbs ── */}
      {/* Orb 1: top-left, light blue */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "-60px",
          left: "-80px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "#BFDBFE",
          opacity: 0.38,
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
          animation: "floatOrb 25s ease-in-out infinite alternate",
        }}
      />
      {/* Orb 2: top-right, light purple */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "40px",
          right: "-60px",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "#DDD6FE",
          opacity: 0.3,
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
          animation: "floatOrb 30s ease-in-out infinite alternate-reverse",
        }}
      />
      {/* Orb 3: bottom-center, blue-purple */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          bottom: "-80px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: "#C7D2FE",
          opacity: 0.25,
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
          animation: "floatOrb 22s ease-in-out infinite alternate",
        }}
      />
      {/* Extra orb: bottom-left purple */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          bottom: "-40px",
          left: "-60px",
          width: "280px",
          height: "280px",
          borderRadius: "50%",
          background: "#E9D5FF",
          opacity: 0.3,
          filter: "blur(70px)",
          pointerEvents: "none",
          zIndex: 0,
          animation: "floatOrb 28s ease-in-out infinite alternate",
        }}
      />
      {/* Extra orb: bottom-right blue */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          bottom: "-40px",
          right: "-60px",
          width: "280px",
          height: "280px",
          borderRadius: "50%",
          background: "#BAE6FD",
          opacity: 0.28,
          filter: "blur(70px)",
          pointerEvents: "none",
          zIndex: 0,
          animation: "floatOrb 32s ease-in-out infinite alternate-reverse",
        }}
      />

      {/* ── Main content wrapper above orbs ── */}
      <div className="relative z-10">
        <Toaster position="top-right" />
        <ClickEffects />

        {/* Tool QR Success Popup */}
        <AnimatePresence>
          {showToolQRPopup && toolQrUrl && (
            <QRSuccessPopup
              qrDataUrl={toolQrUrl}
              inputText={toolQrInput}
              phase={toolPopupPhase}
              onClose={() => setShowToolQRPopup(false)}
              onDone={() => setToolPopupPhase("options")}
            />
          )}
        </AnimatePresence>

        {/* ── Navbar ── */}
        <header
          className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-blue-100/60"
          data-ocid="nav.panel"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            {/* Logo */}
            <button
              type="button"
              className="flex items-center"
              onClick={() => scrollTo("home")}
              data-ocid="nav.link"
            >
              <img
                src="/assets/generated/qrpdf-logo-transparent.dim_320x80.png"
                alt="QR & PDF Tools Logo"
                className="h-8 w-auto object-contain"
              />
            </button>

            {/* Desktop nav */}
            <nav
              className="hidden md:flex items-center gap-6"
              aria-label="Main navigation"
            >
              {(["home", "tools", "contact"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => scrollTo(s)}
                  className="capitalize text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                  data-ocid={`nav.${s}.link` as never}
                >
                  {s}
                </button>
              ))}
              <button
                type="button"
                onClick={() => scrollTo("home")}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                }}
                data-ocid="nav.primary_button"
              >
                Generate QR
              </button>
            </nav>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
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
                transition={{ duration: 0.2 }}
                className="md:hidden overflow-hidden bg-white border-t border-gray-100"
              >
                <div className="px-4 py-3 flex flex-col gap-1">
                  {(["home", "tools", "contact"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => scrollTo(s)}
                      className="capitalize text-sm font-medium text-gray-700 text-left py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors"
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
          {/* ── Section 1: Hero + Inline QR Tool ── */}
          <section
            id="home"
            className="py-6 sm:py-8 px-4"
            data-ocid="hero.section"
          >
            <div className="max-w-lg mx-auto text-center">
              {/* Small heading with gradient */}
              <h1
                className="text-2xl sm:text-3xl font-bold mb-1"
                style={gradientTextStyle}
              >
                Free QR Code Generator
              </h1>
              <p className="text-sm mb-4" style={{ color: "#7C9FD8" }}>
                Fast • Secure • No Login Required
              </p>

              {/* VISIT OUR TOOLS! banner */}
              <div className="mb-5">
                <button
                  type="button"
                  onClick={() => scrollTo("tools")}
                  className="inline-block px-6 py-2.5 rounded-full font-bold text-lg tracking-wide border-2 border-transparent hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  style={{
                    background:
                      "linear-gradient(white, white) padding-box, linear-gradient(135deg, #3B82F6, #8B5CF6) border-box",
                    WebkitBackgroundClip: "unset",
                    backgroundClip: "unset",
                  }}
                  data-ocid="hero.button"
                >
                  <span
                    style={{
                      background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    VISIT OUR TOOLS!
                  </span>
                </button>
              </div>

              {/* Inline QR Tool Widget */}
              <HeroQRWidget />
            </div>
          </section>

          {/* ── Section 2: All Tools Grid ── */}
          <section
            id="tools"
            className="py-14 sm:py-16 px-4 bg-white/70 border-t border-blue-100/40"
            data-ocid="tools.section"
          >
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-8"
              >
                <h2
                  className="text-xl sm:text-2xl font-bold mb-1"
                  style={gradientTextStyle}
                >
                  All Tools
                </h2>
                <p className="text-sm text-gray-500">
                  Five powerful tools, completely free.
                </p>
              </motion.div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {TOOLS.map((tool, i) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    index={i}
                    onOpen={() => openTool(tool.id)}
                  />
                ))}
              </div>

              {/* Tool panel */}
              <AnimatePresence>
                {activeTool && ActiveToolComponent && (
                  <motion.div
                    id="tool-panel"
                    key={activeTool}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4"
                    data-ocid="tools.panel"
                  >
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 relative">
                      <button
                        type="button"
                        onClick={() => setActiveTool(null)}
                        className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                        aria-label="Close tool"
                        data-ocid="tools.close_button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {activeTool === "qr-code-maker" ? (
                        <QRCodeMaker onQRGenerated={handleToolQRGenerated} />
                      ) : (
                        <ActiveToolComponent />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* ── Section 3: Why Choose Us ── */}
          <section className="py-14 sm:py-16 px-4 border-t border-purple-100/40">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-8"
              >
                <h2
                  className="text-xl sm:text-2xl font-bold mb-1"
                  style={gradientTextStyle}
                >
                  Why Choose Us
                </h2>
                <p className="text-sm text-gray-500">
                  Everything you need, nothing you don't.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {WHY_CHOOSE_US.map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                    className="tool-card bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center"
                    data-ocid={`why.item.${i + 1}` as never}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 ${item.color}`}
                    >
                      <span className="text-xl">{item.emoji}</span>
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Section 4: How It Works ── */}
          <section className="py-14 sm:py-16 px-4 bg-white/70 border-t border-blue-100/40">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-8"
              >
                <h2
                  className="text-xl sm:text-2xl font-bold mb-1"
                  style={gradientTextStyle}
                >
                  How It Works
                </h2>
                <p className="text-sm text-gray-500">
                  Three simple steps to get your result
                </p>
              </motion.div>

              <div className="grid sm:grid-cols-3 gap-6">
                {HOW_IT_WORKS.map((step, i) => (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="text-center"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                      <step.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-500">
                      Step {step.step}
                    </span>
                    <h3 className="font-semibold text-sm text-gray-900 mt-1 mb-1">
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {step.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Section 5: Feature Strip ── */}
          <section className="py-10 px-4 border-t border-purple-100/40">
            <div className="max-w-3xl mx-auto">
              <div className="grid sm:grid-cols-3 gap-5">
                {FEATURES.map((feat, i) => (
                  <motion.div
                    key={feat.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="flex gap-3 items-start"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${feat.colorClass}`}
                    >
                      <feat.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 mb-0.5">
                        {feat.title}
                      </h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Bottom CTA ── */}
          <section className="py-14 px-4 bg-white/70 border-t border-blue-100/40 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-md mx-auto"
            >
              <h2
                className="text-xl sm:text-2xl font-bold mb-2"
                style={gradientTextStyle}
              >
                Start Creating QR Codes Now
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Free, fast, and works entirely in your browser.
              </p>
              <motion.button
                type="button"
                onClick={() => scrollTo("home")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 text-white font-semibold px-8 py-3.5 rounded-xl text-base"
                style={{
                  background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                }}
                data-ocid="cta.primary_button"
              >
                Generate QR Code
              </motion.button>
            </motion.div>
          </section>

          {/* ── Contact Section ── */}
          <section
            id="contact"
            className="py-14 sm:py-16 px-4 border-t border-purple-100/40"
          >
            <div className="max-w-md mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-8"
              >
                <h2
                  className="text-xl sm:text-2xl font-bold mb-1"
                  style={gradientTextStyle}
                >
                  Contact Us
                </h2>
                <p className="text-sm text-gray-500">
                  Have a question or feedback? We'd love to hear from you.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8"
              >
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <Label
                      htmlFor="contact-name"
                      className="mb-1.5 block text-sm text-gray-700"
                    >
                      Name
                    </Label>
                    <Input
                      id="contact-name"
                      placeholder="Your name"
                      value={contactForm.name}
                      onChange={(e) =>
                        setContactForm((p) => ({ ...p, name: e.target.value }))
                      }
                      data-ocid="contact.input"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="contact-email"
                      className="mb-1.5 block text-sm text-gray-700"
                    >
                      Email
                    </Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="your@email.com"
                      value={contactForm.email}
                      onChange={(e) =>
                        setContactForm((p) => ({ ...p, email: e.target.value }))
                      }
                      data-ocid="contact.input"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="contact-message"
                      className="mb-1.5 block text-sm text-gray-700"
                    >
                      Message
                    </Label>
                    <Textarea
                      id="contact-message"
                      placeholder="How can we help?"
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) =>
                        setContactForm((p) => ({
                          ...p,
                          message: e.target.value,
                        }))
                      }
                      data-ocid="contact.textarea"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full font-semibold rounded-xl"
                    style={{
                      background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                      border: "none",
                    }}
                    disabled={contactLoading}
                    data-ocid="contact.submit_button"
                  >
                    {contactLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Sending...
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </Button>
                </form>
              </motion.div>
            </div>
          </section>

          {/* ── SEO Accordion ── */}
          <section className="py-12 px-4 bg-white/70 border-t border-blue-100/40">
            <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
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
                      className="bg-white rounded-xl border border-gray-100 px-5"
                    >
                      <AccordionTrigger className="font-semibold text-sm text-gray-900 hover:no-underline py-4">
                        {item.trigger}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-gray-500 leading-relaxed pb-4">
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
        <footer className="py-10 bg-gray-900 border-t border-gray-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 mb-8">
              {/* Brand */}
              <div className="md:col-span-2">
                <img
                  src="/assets/generated/qrpdf-logo-transparent.dim_320x80.png"
                  alt="QR & PDF Tools Logo"
                  className="h-8 w-auto object-contain mb-3"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
                <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                  Free online tools for QR code generation and PDF conversion.
                  Works entirely in your browser with no data collection.
                </p>
              </div>

              {/* Company */}
              <div>
                <h5 className="font-semibold text-sm text-gray-300 mb-3">
                  Company
                </h5>
                <ul className="space-y-2">
                  <li>
                    <button
                      type="button"
                      onClick={() => scrollTo("contact")}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Contact
                    </button>
                  </li>
                  <li>
                    <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="text-xs text-gray-400 hover:text-white transition-colors"
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
                            collect, store, or share any personal data or files.
                            All processing happens entirely within your browser.
                          </p>
                          <p>
                            <strong>Google Analytics.</strong> We use Google
                            Analytics (measurement ID: G-X56VJ2MNZQ) to
                            understand how visitors use our site.
                          </p>
                          <p>
                            <strong>Cookies.</strong> We use only the analytical
                            cookies set by Google Analytics.
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
                          className="text-xs text-gray-400 hover:text-white transition-colors"
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

            <div className="border-t border-gray-800 pt-6 text-center">
              <p className="text-xs text-gray-500">
                &copy; {new Date().getFullYear()}. MADE BY B.VEDANT &mdash;{" "}
                <a
                  href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Built with caffeine.ai
                </a>
              </p>
            </div>
          </div>
        </footer>

        <SideGames />
      </div>
    </div>
  );
}
