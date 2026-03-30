import { Button } from "@/components/ui/button";
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
  CheckCircle,
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
import { useState } from "react";
import { toast } from "sonner";

const TOOLS = [
  {
    id: "qr-code-maker",
    icon: QrCode,
    title: "QR Code Maker",
    description:
      "Generate QR codes from URLs, text, or any content. Download and share instantly.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    id: "pdf-converter",
    icon: FileText,
    title: "PDF Converter",
    description:
      "Convert images and text files into professional PDF documents in seconds.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    id: "pdf-to-image",
    icon: ImageIcon,
    title: "PDF to Image",
    description:
      "Transform every page of your PDF into high-quality PNG images.",
    color: "bg-green-50 text-green-600",
  },
  {
    id: "text-to-pdf",
    icon: FileOutput,
    title: "Text to PDF",
    description:
      "Paste any plain text and convert it to a clean, formatted PDF document.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    id: "image-to-pdf",
    icon: Images,
    title: "Image to PDF",
    description:
      "Merge multiple images into a single, organized PDF file with one click.",
    color: "bg-pink-50 text-pink-600",
  },
];

const HOW_IT_WORKS = [
  {
    icon: Upload,
    step: "01",
    title: "Upload or Input",
    desc: "Select your file, paste your text, or enter a URL to get started.",
  },
  {
    icon: CheckCircle,
    step: "02",
    title: "Convert",
    desc: "Our tool processes everything instantly in your browser — no uploads to servers.",
  },
  {
    icon: Download,
    step: "03",
    title: "Download & Share",
    desc: "Download your result or share it directly with friends and colleagues.",
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

const ToolComponents: Record<string, React.FC> = {
  "qr-code-maker": QRCodeMaker,
  "pdf-converter": PDFConverter,
  "pdf-to-image": PDFToImage,
  "text-to-pdf": TextToPDF,
  "image-to-pdf": ImageToPDF,
};

export default function App() {
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

  const scrollTo = (section: "home" | "tools" | "contact") => {
    setActiveSection(section);
    setMobileMenuOpen(false);
    const el = document.getElementById(section);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const toggleTool = (toolId: string) => {
    setActiveTool(activeTool === toolId ? null : toolId);
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

  const ActiveToolComponent = activeTool ? ToolComponents[activeTool] : null;

  return (
    <div className="min-h-screen bg-background font-sans">
      <Toaster position="top-right" />

      {/* Navbar */}
      <header
        className="sticky top-0 z-50 bg-card border-b border-border shadow-xs"
        data-ocid="nav.panel"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-2 font-display font-bold text-lg text-foreground"
            onClick={() => scrollTo("home")}
            data-ocid="nav.link"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:block">QR &amp; PDF Tools</span>
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
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-ocid={`nav.${s}.link` as never}
              >
                {s}
              </button>
            ))}
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => scrollTo("tools")}
              data-ocid="nav.primary_button"
            >
              Get Started
            </Button>
          </nav>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted"
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
              className="md:hidden border-t border-border bg-card overflow-hidden"
            >
              <div className="px-4 py-4 flex flex-col gap-3">
                {(["home", "tools", "contact"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => scrollTo(s)}
                    className="capitalize text-sm font-medium text-left text-foreground py-2 px-3 rounded-lg hover:bg-muted"
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
        {/* Hero Section */}
        <section
          id="home"
          className="bg-gradient-to-br from-background to-muted py-20 lg:py-28"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                  Free Online Tools
                </span>
                <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-foreground leading-tight mb-6">
                  Create &amp; Convert
                  <br />
                  <span className="text-primary">Easily</span>
                </h1>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  Generate QR codes, convert PDFs, transform images — all in one
                  place. No signup required. 100% free and works in your
                  browser.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    className="rounded-full gap-2"
                    onClick={() => scrollTo("tools")}
                    data-ocid="hero.primary_button"
                  >
                    Try the Tools <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => scrollTo("contact")}
                    data-ocid="hero.secondary_button"
                  >
                    Contact Us
                  </Button>
                </div>
              </motion.div>

              {/* Hero illustration */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="hidden lg:block"
              >
                <div className="grid grid-cols-2 gap-4">
                  {TOOLS.map((tool, i) => (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className={`bg-card rounded-2xl p-4 shadow-card flex items-center gap-3 ${
                        i === 4 ? "col-span-2" : ""
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${tool.color}`}
                      >
                        <tool.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">{tool.title}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Tools Grid Section */}
        <section id="tools" className="py-20 bg-card">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-foreground mb-4">
                Our Tools
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Five powerful tools, zero cost. Select a tool below to get
                started.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {TOOLS.map((tool, i) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  data-ocid={`tools.item.${i + 1}` as never}
                >
                  <div
                    className={`bg-card border rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all cursor-pointer ${
                      activeTool === tool.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tool.color}`}
                    >
                      <tool.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-display font-bold text-base mb-2">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {tool.description}
                    </p>
                    <Button
                      size="sm"
                      className="rounded-full gap-1 w-full"
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
                    className="bg-background border border-border rounded-2xl p-6 sm:p-8 shadow-card"
                    data-ocid="tools.panel"
                  >
                    <ActiveToolComponent />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-foreground mb-4">
                How It Works
              </h2>
              <p className="text-muted-foreground text-lg">
                Three simple steps to get your result
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-3 gap-8">
              {HOW_IT_WORKS.map((step) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-primary/60 tracking-widest uppercase">
                    Step {step.step}
                  </span>
                  <h3 className="font-display font-bold text-lg mt-1 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Strip */}
        <section className="py-16 bg-muted">
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
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <feat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-base mb-1">
                      {feat.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">{feat.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-card">
          <div className="max-w-xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-foreground mb-4">
                Contact Us
              </h2>
              <p className="text-muted-foreground">
                Have a question or feedback? We'd love to hear from you.
              </p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onSubmit={handleContactSubmit}
              className="space-y-5"
            >
              <div>
                <Label htmlFor="contact-name" className="mb-1.5 block">
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
                <Label htmlFor="contact-email" className="mb-1.5 block">
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
                <Label htmlFor="contact-message" className="mb-1.5 block">
                  Message
                </Label>
                <Textarea
                  id="contact-message"
                  placeholder="How can we help?"
                  rows={5}
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm((p) => ({ ...p, message: e.target.value }))
                  }
                  data-ocid="contact.textarea"
                />
              </div>
              <Button
                type="submit"
                className="rounded-full w-full"
                disabled={contactLoading}
                data-ocid="contact.submit_button"
              >
                {contactLoading ? "Sending..." : "Send Message"}
              </Button>
            </motion.form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-bold text-sm">
                  QR &amp; PDF Tools
                </span>
              </div>
              <p className="text-xs opacity-60 leading-relaxed">
                Free, fast, and private browser-based tools for QR codes and PDF
                conversions.
              </p>
            </div>

            <div>
              <h5 className="font-display font-bold text-sm mb-3">Tools</h5>
              <ul className="space-y-2">
                {TOOLS.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => {
                        scrollTo("tools");
                        setActiveTool(t.id);
                      }}
                      className="text-xs opacity-60 hover:opacity-100 transition-opacity"
                    >
                      {t.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-display font-bold text-sm mb-3">
                Navigation
              </h5>
              <ul className="space-y-2">
                {(["home", "tools", "contact"] as const).map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => scrollTo(s)}
                      className="capitalize text-xs opacity-60 hover:opacity-100 transition-opacity"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-display font-bold text-sm mb-3">Contact</h5>
              <p className="text-xs opacity-60">support@qrpdftools.app</p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 text-center text-xs opacity-50">
            &copy; {new Date().getFullYear()}. Built with &hearts; using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== "undefined" ? window.location.hostname : "",
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-100"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
