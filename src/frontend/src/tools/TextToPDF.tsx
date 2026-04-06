import ReviewModal from "@/components/ReviewModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { jsPDF } from "jspdf";
import { Download, FileOutput, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function TextToPDF() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);

  const convert = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text.");
      return;
    }
    setLoading(true);
    try {
      const pdf = new jsPDF();
      const pageW = pdf.internal.pageSize.getWidth();
      let y = 20;
      if (title.trim()) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(18);
        pdf.text(title.trim(), 15, y);
        y += 15;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
      } else {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
      }
      const lines = pdf.splitTextToSize(text, pageW - 30);
      pdf.text(lines, 15, y);
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      toast.success("PDF created successfully!");
    } catch (err: unknown) {
      console.error("TextToPDF error:", err);
      toast.error("Failed to convert text. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `${title.trim() || "document"}.pdf`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileOutput className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg">Text to PDF</h3>
          <p className="text-sm text-muted-foreground">
            Convert plain text into a PDF document
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="pdf-title" className="mb-1.5 block">
            Title (optional)
          </Label>
          <Input
            id="pdf-title"
            placeholder="Document title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            data-ocid="texttopdf.input"
          />
        </div>
        <div>
          <Label htmlFor="pdf-content" className="mb-1.5 block">
            Content
          </Label>
          <Textarea
            id="pdf-content"
            placeholder="Paste or type your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="font-mono text-sm"
            data-ocid="texttopdf.textarea"
          />
        </div>
      </div>

      <Button
        onClick={convert}
        disabled={loading || !text.trim()}
        className="rounded-full w-full"
        data-ocid="texttopdf.primary_button"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileOutput className="mr-2 h-4 w-4" />
        )}
        {loading ? "Converting..." : "Convert to PDF"}
      </Button>

      {loading && (
        <div
          data-ocid="texttopdf.loading_state"
          className="text-center text-sm text-muted-foreground"
        >
          Generating PDF...
        </div>
      )}

      {pdfUrl && !loading && (
        <div
          className="flex justify-center"
          data-ocid="texttopdf.success_state"
        >
          <Button
            onClick={download}
            variant="outline"
            className="rounded-full gap-2"
            data-ocid="texttopdf.secondary_button"
          >
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </div>
      )}

      <Button
        variant="outline"
        onClick={() => setReviewOpen(true)}
        className="w-full rounded-full gap-2 border-primary/30 text-primary"
        data-ocid="texttopdf.open_modal_button"
      >
        ⭐ Leave a Review
      </Button>

      <ReviewModal
        toolId="text-to-pdf"
        toolName="Text to PDF"
        open={reviewOpen}
        onOpenChange={setReviewOpen}
      />
    </div>
  );
}
