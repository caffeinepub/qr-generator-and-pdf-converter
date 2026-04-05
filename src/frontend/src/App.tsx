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
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ── Welcome Splash ──────────────────────────────────────────────────────────
function WelcomeSplash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background:
          "linear-gradient(135deg, #3B82F6 0%, #60A5FA 50%, #93C5FD 100%)",
      }}
      data-ocid="welcome.modal"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-center px-6"
      >
        <div className="mb-5 flex justify-center">
          <img
            src="/assets/generated/qrpdf-logo-transparent.dim_320x80.png"
            alt="QR & PDF Tools Logo"
            className="h-12 w-auto object-contain"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </div>
        <h1
          className="font-extrabold text-3xl sm:text-4xl leading-tight mb-2"
          style={{ color: "#FFFFFF" }}
        >
          Welcome to Free QR Tools
        </h1>
        <p
          className="text-base sm:text-lg font-medium"
          style={{ color: "rgba(255,255,255,0.85)" }}
        >
          Fast · Secure · 100% Free
        </p>
      </motion.div>
    </motion.div>
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
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${text}&color=1D4ED8&bgcolor=FFFFFF`,
    );
  }, [qrInput]);

  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
      data-ocid="hero.panel"
    >
      <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3 text-center">
        Live QR Preview
      </p>

      <Input
        value={qrInput}
        onChange={(e) => setQrInput(e.target.value)}
        placeholder="Type anything to see QR update..."
        className="mb-5 text-sm rounded-xl"
        data-ocid="hero.input"
      />

      {qrDataUrl && (
        <div className="flex justify-center mb-5">
          <div className="rounded-2xl overflow-hidden border border-gray-100">
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
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl text-base transition-all duration-200 hover:scale-[1.02] active:scale-95"
        data-ocid="hero.primary_button"
      >
        Generate QR Code
      </button>
    </div>
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
    color: "bg-blue-50 text-blue-600",
    buttonLabel: "Generate QR Now",
    emoji: "📱",
  },
  {
    id: "pdf-converter",
    icon: FileText,
    title: "PDF Converter",
    description:
      "Convert images and text files into professional PDF documents in seconds.",
    color: "bg-purple-50 text-purple-600",
    buttonLabel: "Convert to PDF",
    emoji: "📄",
  },
  {
    id: "pdf-to-image",
    icon: ImageIcon,
    title: "PDF to Image",
    description:
      "Transform every page of your PDF into high-quality PNG images.",
    color: "bg-green-50 text-green-600",
    buttonLabel: "Convert PDF to Image",
    emoji: "🖼️",
  },
  {
    id: "text-to-pdf",
    icon: FileOutput,
    title: "Text to PDF",
    description:
      "Paste any plain text and convert it to a clean, formatted PDF document.",
    color: "bg-orange-50 text-orange-600",
    buttonLabel: "Convert Text to PDF",
    emoji: "📝",
  },
  {
    id: "image-to-pdf",
    icon: Images,
    title: "Image to PDF",
    description:
      "Merge multiple images into a single, organized PDF file with one click.",
    color: "bg-pink-50 text-pink-600",
    buttonLabel: "Convert Image to PDF",
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
    icon: Download,
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
  },
  {
    emoji: "🔒",
    title: "100% Privacy",
    desc: "Your files never leave your device. All processing is local.",
  },
  {
    emoji: "🆓",
    title: "Free Forever",
    desc: "Completely free with no hidden fees, subscriptions, or limits.",
  },
  {
    emoji: "📱",
    title: "Works on Any Device",
    desc: "Fully responsive on desktop, tablet, and mobile browsers.",
  },
];

const FEATURES = [
  {
    icon: Download,
    title: "Instant Download",
    desc: "Get your files immediately with one click. No waiting, no queues.",
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    desc: "Share QR codes and documents directly via the Web Share API or clipboard.",
  },
  {
    icon: Shield,
    title: "100% Private",
    desc: "All processing happens in your browser. Your files never leave your device.",
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
    <div className="min-h-screen font-sans">
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
          transition={{ duration: 0.4 }}
          className="relative min-h-screen"
        >
          {/* Navbar */}
          <header
            className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm"
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
                  className="h-9 w-auto object-contain"
                />
              </button>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-6">
                {(["home", "tools", "contact"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => scrollTo(s)}
                    className={`capitalize text-sm font-medium transition-colors ${
                      activeSection === s
                        ? "text-blue-600"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                    data-ocid={`nav.${s}.link` as never}
                  >
                    {s}
                  </button>
                ))}
                <Button
                  size="sm"
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => scrollTo("tools")}
                  data-ocid="nav.primary_button"
                >
                  Get Started
                </Button>
              </nav>

              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
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
                  className="md:hidden border-t border-gray-100 bg-white overflow-hidden"
                >
                  <div className="px-4 py-4 flex flex-col gap-1">
                    {(["home", "tools", "contact"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => scrollTo(s)}
                        className="capitalize text-sm font-medium text-left text-gray-700 py-2.5 px-3 rounded-lg hover:bg-gray-50"
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
            <section id="home" className="py-20 lg:py-28">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                  {/* Left column */}
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="inline-block bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-blue-100">
                      Free Online Tools
                    </span>

                    <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-gray-900 leading-tight mb-4">
                      Free QR Code Generator &amp; PDF Tools
                    </h1>

                    <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                      Generate QR codes, convert PDFs, transform images — all
                      free. No signup required, works entirely in your browser.
                    </p>

                    {/* Primary CTA */}
                    <button
                      type="button"
                      onClick={handleGenerateQR}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all duration-200 hover:scale-105 active:scale-95"
                      data-ocid="hero.primary_button"
                    >
                      Generate QR Code
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>

                  {/* Right column — Live QR Preview */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                  >
                    <LiveQRPreview onGenerateClick={handleGenerateQR} />
                  </motion.div>
                </div>
              </div>
            </section>

            {/* ── Tools Grid Section ── */}
            <section id="tools" className="py-20 bg-gray-50">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 mb-3">
                    Choose Your Tool
                  </h2>
                  <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                    Five powerful tools, zero cost. Select a tool below to get
                    started instantly.
                  </p>
                </motion.div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                  {TOOLS.map((tool, i) => (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06 }}
                      data-ocid={`tools.item.${i + 1}` as never}
                    >
                      <div
                        className={`h-full flex flex-col rounded-2xl p-6 cursor-pointer transition-all duration-200 ${
                          activeTool === tool.id
                            ? "bg-white border-2 border-blue-300 shadow-md"
                            : "bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        }`}
                      >
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                            tool.color
                          }`}
                        >
                          <tool.icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-display font-semibold text-base mb-2 text-gray-900">
                          {tool.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4 leading-relaxed flex-1">
                          {tool.description}
                        </p>
                        <Button
                          size="sm"
                          variant={
                            activeTool === tool.id ? "default" : "outline"
                          }
                          className="rounded-lg gap-1 w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTool(tool.id);
                          }}
                          data-ocid={`tools.button.${i + 1}` as never}
                        >
                          {activeTool === tool.id ? "Close Tool" : "Open Tool"}
                          {activeTool !== tool.id && (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </motion.div>
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
                        className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm"
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
            <section className="py-20">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 mb-3">
                    Why Choose Us
                  </h2>
                  <p className="text-gray-500 text-lg max-w-2xl mx-auto">
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
                      transition={{ delay: i * 0.06 }}
                      className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                      data-ocid={`why.item.${i + 1}` as never}
                    >
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">{item.emoji}</span>
                      </div>
                      <h3 className="font-display font-semibold text-base mb-2 text-gray-900">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {item.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── How It Works ── */}
            <section className="py-20 bg-gray-50 border-y border-gray-100">
              <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 mb-3">
                    How It Works
                  </h2>
                  <p className="text-gray-500 text-lg">
                    Three simple steps to get your result
                  </p>
                </motion.div>

                <div className="grid sm:grid-cols-3 gap-8">
                  {HOW_IT_WORKS.map((step) => (
                    <motion.div
                      key={step.step}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="text-center"
                    >
                      <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                        <step.icon className="w-6 h-6 text-blue-500" />
                      </div>
                      <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">
                        Step {step.step}
                      </span>
                      <h3 className="font-display font-semibold text-lg mt-1 mb-2 text-gray-900">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {step.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Feature Strip ── */}
            <section className="py-14 bg-white border-b border-gray-100">
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
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <feat.icon className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-display font-semibold text-base mb-1 text-gray-900">
                          {feat.title}
                        </h4>
                        <p className="text-sm text-gray-500">{feat.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Bottom CTA Section ── */}
            <section className="py-20 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-2xl mx-auto px-4"
              >
                <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 mb-4">
                  Start Creating QR Codes Now
                </h2>
                <p className="text-gray-500 text-lg mb-8">
                  Free, fast, and works entirely in your browser.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateQR}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-4 rounded-xl text-lg transition-all duration-200 hover:scale-105 active:scale-95"
                  data-ocid="cta.primary_button"
                >
                  Generate QR Code
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            </section>

            {/* ── Contact Section ── */}
            <section id="contact" className="py-20 bg-gray-50">
              <div className="max-w-xl mx-auto px-4 sm:px-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-10"
                >
                  <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 mb-3">
                    Contact Us
                  </h2>
                  <p className="text-gray-500">
                    Have a question or feedback? We'd love to hear from you.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-8"
                >
                  <form onSubmit={handleContactSubmit} className="space-y-5">
                    <div>
                      <Label htmlFor="contact-name" className="mb-1.5 block">
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
                        data-ocid="contact.input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-email" className="mb-1.5 block">
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
                        data-ocid="contact.input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-message" className="mb-1.5 block">
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
                        data-ocid="contact.textarea"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="rounded-lg w-full bg-blue-600 hover:bg-blue-700"
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
            <section className="py-20 bg-white border-t border-gray-100">
              <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 mb-3">
                    Learn More About Our Tools
                  </h2>
                  <p className="text-gray-500 text-lg">
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
                        className="bg-white border border-gray-100 rounded-xl px-5 shadow-sm data-[state=open]:border-blue-200"
                      >
                        <AccordionTrigger className="font-display font-semibold text-base text-gray-900 hover:no-underline py-4">
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
          <footer className="bg-gray-900 text-white py-12">
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
                  <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                    Free online tools for QR code generation and PDF conversion.
                    Works entirely in your browser with no data collection.
                  </p>
                </div>

                {/* Company */}
                <div>
                  <h5 className="font-display font-semibold text-sm mb-3 text-gray-100">
                    Company
                  </h5>
                  <ul className="space-y-2">
                    <li>
                      <button
                        type="button"
                        onClick={() => scrollTo("contact")}
                        className="text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        About Us
                      </button>
                    </li>
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
                            <DialogTitle className="font-display font-bold">
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
                              files. All processing — including QR code
                              generation and PDF conversion — happens entirely
                              within your browser. Your files never leave your
                              device.
                            </p>
                            <p>
                              <strong>Google Analytics.</strong> We use Google
                              Analytics (measurement ID: G-X56VJ2MNZQ) to
                              understand how visitors use our site. This may set
                              analytical cookies in your browser. Google
                              Analytics data is anonymised and we do not use it
                              to identify individuals.
                            </p>
                            <p>
                              <strong>Cookies.</strong> We use only the
                              analytical cookies set by Google Analytics. We do
                              not use any advertising, tracking, or functional
                              cookies beyond this.
                            </p>
                            <p>
                              <strong>Third-Party Services.</strong> Apart from
                              Google Analytics, we do not integrate any
                              third-party services that collect user data.
                            </p>
                            <p>
                              <strong>Contact.</strong> If you have questions
                              about this Privacy Policy, please use our Contact
                              form.
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
                            <DialogTitle className="font-display font-bold">
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
                              Conditions. If you do not agree, please
                              discontinue use of this website.
                            </p>
                            <p>
                              <strong>Use of Tools.</strong> Our tools are
                              provided for personal, non-commercial use. You may
                              not use them for any unlawful purpose or in any
                              way that could damage, disable, or impair the
                              service.
                            </p>
                            <p>
                              <strong>No Warranty.</strong> The tools are
                              provided "as-is" without warranty of any kind,
                              express or implied. We do not guarantee
                              uninterrupted or error-free operation.
                            </p>
                            <p>
                              <strong>Limitation of Liability.</strong> To the
                              fullest extent permitted by law, we shall not be
                              liable for any indirect, incidental, or
                              consequential damages arising from your use of
                              this service.
                            </p>
                            <p>
                              <strong>Intellectual Property.</strong> All
                              content and code on this website is our
                              intellectual property. You may not reproduce or
                              redistribute it without permission.
                            </p>
                            <p>
                              <strong>Changes.</strong> We reserve the right to
                              update these terms at any time. Continued use of
                              the site after changes constitutes acceptance of
                              the new terms.
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
                    className="hover:text-gray-300 transition-colors"
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
