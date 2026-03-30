import ReviewModal from "@/components/ReviewModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Download, Link, Loader2, QrCode, Share2, Type } from "lucide-react";
import QRCode from "qrcode";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function QRCodeMaker() {
  const [inputText, setInputText] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generate = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter a URL or text.");
      return;
    }
    setLoading(true);
    try {
      const url = await QRCode.toDataURL(inputText, {
        width: 300,
        margin: 2,
        color: { dark: "#111827", light: "#ffffff" },
      });
      setQrUrl(url);
    } catch {
      toast.error("Failed to generate QR code.");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = "qrcode.png";
    a.click();
    toast.success("QR code downloaded!");
  };

  const share = async () => {
    if (!qrUrl) return;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const file = new File([blob], "qrcode.png", { type: "image/png" });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "QR Code" });
      } else {
        await navigator.clipboard.writeText(inputText);
        toast.success("Link copied to clipboard!");
      }
    } catch {
      toast.error("Share failed.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <QrCode className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg">QR Code Maker</h3>
          <p className="text-sm text-muted-foreground">
            Generate QR codes from URLs or text
          </p>
        </div>
      </div>

      <Tabs defaultValue="url">
        <TabsList className="mb-4" data-ocid="qrcode.tab">
          <TabsTrigger value="url" className="flex gap-2">
            <Link className="w-4 h-4" /> URL
          </TabsTrigger>
          <TabsTrigger value="text" className="flex gap-2">
            <Type className="w-4 h-4" /> Text
          </TabsTrigger>
        </TabsList>
        <TabsContent value="url">
          <Input
            placeholder="https://example.com"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            className="mb-3"
            data-ocid="qrcode.input"
          />
        </TabsContent>
        <TabsContent value="text">
          <Textarea
            placeholder="Enter any text to encode..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={3}
            className="mb-3"
            data-ocid="qrcode.textarea"
          />
        </TabsContent>
      </Tabs>

      <Button
        onClick={generate}
        disabled={loading}
        className="rounded-full w-full"
        data-ocid="qrcode.primary_button"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <QrCode className="mr-2 h-4 w-4" />
        )}
        {loading ? "Generating..." : "Generate QR Code"}
      </Button>

      {loading && (
        <div
          className="flex justify-center py-8"
          data-ocid="qrcode.loading_state"
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {qrUrl && !loading && (
        <div
          className="flex flex-col items-center gap-4 p-6 bg-muted rounded-2xl"
          data-ocid="qrcode.success_state"
        >
          <img
            src={qrUrl}
            alt="QR Code"
            className="w-48 h-48 rounded-xl shadow-card"
          />
          <div className="flex gap-3">
            <Button
              onClick={download}
              variant="outline"
              className="rounded-full gap-2"
              data-ocid="qrcode.secondary_button"
            >
              <Download className="w-4 h-4" /> Download
            </Button>
            <Button
              onClick={share}
              className="rounded-full gap-2"
              data-ocid="qrcode.button"
            >
              <Share2 className="w-4 h-4" /> Share
            </Button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <Button
        variant="outline"
        onClick={() => setReviewOpen(true)}
        className="w-full rounded-full gap-2 border-primary/30 text-primary"
        data-ocid="qrcode.open_modal_button"
      >
        ⭐ Leave a Review
      </Button>

      <ReviewModal
        toolId="qr-code-maker"
        toolName="QR Code Maker"
        open={reviewOpen}
        onOpenChange={setReviewOpen}
      />
    </div>
  );
}
