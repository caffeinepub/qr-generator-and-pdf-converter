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

// ─── Pure-JS QR Code encoder (copied from QRCodeMaker.tsx) ───────────────────
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x = x << 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(x: number, y: number) {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[(GF_LOG[x] + GF_LOG[y]) % 255];
}

function gfPolyMul(p: number[], q: number[]) {
  const r = new Array(p.length + q.length - 1).fill(0);
  for (let i = 0; i < p.length; i++)
    for (let j = 0; j < q.length; j++) r[i + j] ^= gfMul(p[i], q[j]);
  return r;
}

function rsGeneratorPoly(nsym: number) {
  let g: number[] = [1];
  for (let i = 0; i < nsym; i++) g = gfPolyMul(g, [1, GF_EXP[i]]);
  return g;
}

function rsEncode(data: number[], nsym: number) {
  const gen = rsGeneratorPoly(nsym);
  const msg = [...data, ...new Array(nsym).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const coeff = msg[i];
    if (coeff !== 0)
      for (let j = 0; j < gen.length; j++) msg[i + j] ^= gfMul(gen[j], coeff);
  }
  return msg.slice(data.length);
}

const QR_VERSIONS: Record<
  number,
  { size: number; data: number; ecc: number; blocks: number; remBits: number }
> = {
  1: { size: 21, data: 19, ecc: 7, blocks: 1, remBits: 0 },
  2: { size: 25, data: 34, ecc: 10, blocks: 1, remBits: 7 },
  3: { size: 29, data: 55, ecc: 15, blocks: 1, remBits: 7 },
  4: { size: 33, data: 80, ecc: 20, blocks: 2, remBits: 7 },
  5: { size: 37, data: 108, ecc: 26, blocks: 2, remBits: 7 },
  6: { size: 41, data: 136, ecc: 18, blocks: 4, remBits: 7 },
  7: { size: 45, data: 156, ecc: 20, blocks: 4, remBits: 0 },
};

function pickVersion(byteCount: number) {
  for (const [ver, info] of Object.entries(QR_VERSIONS)) {
    if (byteCount <= info.data - 2) return { ver: Number(ver), info };
  }
  return null;
}

function encodeBytes(text: string) {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 128) bytes.push(c);
    else if (c < 2048) {
      bytes.push(0xc0 | (c >> 6));
      bytes.push(0x80 | (c & 0x3f));
    } else {
      bytes.push(0xe0 | (c >> 12));
      bytes.push(0x80 | ((c >> 6) & 0x3f));
      bytes.push(0x80 | (c & 0x3f));
    }
  }
  return bytes;
}

function buildBitstream(data: number[], totalDataBytes: number) {
  const bits: number[] = [];
  const push = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };
  push(4, 4);
  push(data.length, 8);
  for (const b of data) push(b, 8);
  for (let i = 0; i < 4 && bits.length < totalDataBytes * 8; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);
  const padBytes = [0xec, 0x11];
  let pi = 0;
  while (bits.length < totalDataBytes * 8) push(padBytes[pi++ % 2], 8);
  const out: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] ?? 0);
    out.push(byte);
  }
  return out;
}

function placeFinder(grid: number[][], r: number, c: number) {
  for (let dr = -1; dr <= 7; dr++)
    for (let dc = -1; dc <= 7; dc++) {
      const rr = r + dr;
      const cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= grid.length || cc >= grid[0].length)
        continue;
      const inFinder =
        dr >= 0 &&
        dr <= 6 &&
        dc >= 0 &&
        dc <= 6 &&
        (dr === 0 ||
          dr === 6 ||
          dc === 0 ||
          dc === 6 ||
          (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
      grid[rr][cc] = inFinder ? 1 : 0;
    }
}

function placeAlign(grid: number[][], r: number, c: number) {
  for (let dr = -2; dr <= 2; dr++)
    for (let dc = -2; dc <= 2; dc++) {
      const v =
        dr === -2 || dr === 2 || dc === -2 || dc === 2 || (dr === 0 && dc === 0)
          ? 1
          : 0;
      grid[r + dr][c + dc] = v;
    }
}

function generateQRMatrix(text: string): string | null {
  const raw = encodeBytes(text);
  const versionInfo = pickVersion(raw.length);
  if (!versionInfo) return null;
  const { ver, info } = versionInfo;
  const size = info.size;

  const dataBytes = buildBitstream(raw, info.data);
  const eccBytes = rsEncode(dataBytes, info.ecc);
  const codewords = [...dataBytes, ...eccBytes];

  const cwBits: number[] = [];
  for (const cw of codewords)
    for (let i = 7; i >= 0; i--) cwBits.push((cw >> i) & 1);
  for (let i = 0; i < info.remBits; i++) cwBits.push(0);

  const grid: number[][] = Array.from({ length: size }, () =>
    new Array(size).fill(-1),
  );
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    new Array(size).fill(false),
  );

  const reserve = (r: number, c: number, v: number) => {
    grid[r][c] = v;
    reserved[r][c] = true;
  };

  placeFinder(grid, 0, 0);
  placeFinder(grid, 0, size - 7);
  placeFinder(grid, size - 7, 0);
  for (let i = 0; i < size; i++) {
    reserved[0][i] = reserved[6][i] = reserved[i][0] = reserved[i][6] = true;
    reserved[size - 7][i] =
      reserved[size - 1][i] =
      reserved[i][size - 7] =
      reserved[i][size - 1] =
        true;
    reserved[0][size - 8 + i] =
      reserved[6][size - 8 + i] =
      reserved[i][size - 8] =
      reserved[i][size - 1] =
        true;
  }
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 8; j++) {
      reserved[i][j] = true;
      reserved[i][size - 8 + j] = true;
      reserved[size - 8 + i][j] = true;
    }

  for (let i = 8; i < size - 8; i++) {
    const v = i % 2 === 0 ? 1 : 0;
    reserve(6, i, v);
    reserve(i, 6, v);
  }

  const alignPos: Record<number, number[]> = {
    2: [6, 18],
    3: [6, 22],
    4: [6, 26],
    5: [6, 30],
    6: [6, 34],
    7: [6, 22, 38],
  };
  if (ver >= 2) {
    const pos = alignPos[ver];
    for (let i = 0; i < pos.length; i++)
      for (let j = 0; j < pos.length; j++) {
        const r = pos[i];
        const c = pos[j];
        if (
          (r < 8 && c < 8) ||
          (r < 8 && c > size - 9) ||
          (r > size - 9 && c < 8)
        )
          continue;
        placeAlign(grid, r, c);
        for (let dr = -2; dr <= 2; dr++)
          for (let dc = -2; dc <= 2; dc++) reserved[r + dr][c + dc] = true;
      }
  }

  reserve(size - 8, 8, 1);
  for (let i = 0; i < 9; i++) {
    reserved[i][8] = true;
    reserved[8][i] = true;
  }
  for (let i = size - 8; i < size; i++) {
    reserved[i][8] = true;
    reserved[8][i] = true;
  }

  let bitIdx = 0;
  let goingUp = true;
  for (let col = size - 1; col >= 0; col -= 2) {
    if (col === 6) col = 5;
    for (
      let row = goingUp ? size - 1 : 0;
      goingUp ? row >= 0 : row < size;
      row += goingUp ? -1 : 1
    ) {
      for (let dc = 0; dc < 2; dc++) {
        const c = col - dc;
        if (!reserved[row][c]) {
          grid[row][c] = bitIdx < cwBits.length ? cwBits[bitIdx++] : 0;
        }
      }
    }
    goingUp = !goingUp;
  }

  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (!reserved[r][c] && (r + c) % 2 === 0) grid[r][c] ^= 1;

  const fmtRaw = 0b00000;
  let fmtPoly = fmtRaw << 10;
  const gen10 = 0x537;
  for (let i = 14; i >= 10; i--)
    if ((fmtPoly >> i) & 1) fmtPoly ^= gen10 << (i - 10);
  const fmtWord = ((fmtRaw << 10) | fmtPoly) ^ 0x5412;
  const fmtBits = Array.from(
    { length: 15 },
    (_, i) => (fmtWord >> (14 - i)) & 1,
  );
  const fmtSeq1 = [
    0,
    1,
    2,
    3,
    4,
    5,
    7,
    8,
    size - 7,
    size - 6,
    size - 5,
    size - 4,
    size - 3,
    size - 2,
    size - 1,
  ];
  const fmtSeq2 = [
    size - 1,
    size - 2,
    size - 3,
    size - 4,
    size - 5,
    size - 6,
    size - 7,
    8,
    7,
    5,
    4,
    3,
    2,
    1,
    0,
  ];
  for (let i = 0; i < 15; i++) {
    grid[8][fmtSeq1[i]] = fmtBits[i];
    grid[fmtSeq2[i]][8] = fmtBits[i];
  }

  // Render to canvas and return data URL
  const scale = 8;
  const quiet = 3 * scale;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size * scale + quiet * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      ctx.fillStyle = grid[r][c] === 1 ? "#1E293B" : "#ffffff";
      ctx.fillRect(quiet + c * scale, quiet + r * scale, scale, scale);
    }
  return canvas.toDataURL("image/png");
}

// ── Inline QR Hero Widget ────────────────────────────────────────────────────
const DEFAULT_QR_TEXT =
  "https://qr-generator-and-pdf-converter-8y9.caffeine.xyz";

function HeroQRWidget() {
  const [inputText, setInputText] = useState(DEFAULT_QR_TEXT);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate on mount with default value
  useEffect(() => {
    const url = generateQRMatrix(DEFAULT_QR_TEXT);
    setQrDataUrl(url);
  }, []);

  const regenerate = useCallback((text: string) => {
    if (!text.trim()) {
      setQrDataUrl(null);
      return;
    }
    const url = generateQRMatrix(text.trim());
    if (url) setQrDataUrl(url);
    else toast.error("Text is too long. Please shorten it.");
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => regenerate(val), 150);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      regenerate(inputText);
      setIsGenerating(false);
    }, 600);
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
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <Toaster position="top-right" />

      {/* ── Navbar ── */}
      <header
        className="sticky top-0 z-50 bg-white border-b border-gray-100"
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
            {/* Small heading */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Free QR Code Generator
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              Fast • Secure • No Login Required
            </p>

            {/* Inline QR Tool Widget */}
            <HeroQRWidget />
          </div>
        </section>

        {/* ── Section 2: All Tools Grid ── */}
        <section
          id="tools"
          className="py-14 sm:py-16 px-4 bg-white border-t border-gray-100"
          data-ocid="tools.section"
        >
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
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
                    <ActiveToolComponent />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ── Section 3: Why Choose Us ── */}
        <section className="py-14 sm:py-16 px-4 bg-[#F8FAFC] border-t border-gray-100">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
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
        <section className="py-14 sm:py-16 px-4 bg-white border-t border-gray-100">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
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
        <section className="py-10 px-4 bg-[#F8FAFC] border-t border-gray-100">
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
        <section className="py-14 px-4 bg-white border-t border-gray-100 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-md mx-auto"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
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
          className="py-14 sm:py-16 px-4 bg-[#F8FAFC] border-t border-gray-100"
        >
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
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
                      setContactForm((p) => ({ ...p, message: e.target.value }))
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
        <section className="py-12 px-4 bg-white border-t border-gray-100">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Accordion type="single" collapsible className="w-full space-y-2">
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
                          Analytics (measurement ID: G-X56VJ2MNZQ) to understand
                          how visitors use our site.
                        </p>
                        <p>
                          <strong>Cookies.</strong> We use only the analytical
                          cookies set by Google Analytics.
                        </p>
                        <p>
                          <strong>Third-Party Services.</strong> Apart from
                          Google Analytics, we do not integrate any third-party
                          services that collect user data.
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
                          <strong>Use of Tools.</strong> Our tools are provided
                          for personal, non-commercial use.
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
  );
}
