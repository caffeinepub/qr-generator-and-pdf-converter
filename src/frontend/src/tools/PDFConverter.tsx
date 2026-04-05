import ReviewModal from "@/components/ReviewModal";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

// jsPDF is loaded via CDN script tag in index.html (window.jspdf.jsPDF)
function getJsPDF() {
  // jsPDF CDN exposes window.jspdf.jsPDF or window.jsPDF
  const Cls =
    (window as any).jspdf?.jsPDF ??
    (window as any).jsPDF ??
    (window as any).jspdf;
  if (!Cls)
    throw new Error("jsPDF library not loaded. Please refresh and try again.");
  return Cls as new (options?: {
    orientation?: string;
    unit?: string;
    format?: string | number[];
  }) => {
    addImage(
      imageData: string,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number,
    ): void;
    addPage(): void;
    setFont(name: string, style?: string): void;
    setFontSize(size: number): void;
    text(text: string | string[], x: number, y: number): void;
    splitTextToSize(text: string, maxWidth: number): string[];
    output(type: "blob"): Blob;
    internal: { pageSize: { getWidth(): number; getHeight(): number } };
  };
}

interface FileEntry {
  id: string;
  file: File;
}

export default function PDFConverter() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const entries: FileEntry[] = Array.from(newFiles).map((f) => ({
      id: `${f.name}-${f.lastModified}`,
      file: f,
    }));
    setFiles(entries);
    setPdfUrl("");
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((e) => e.id !== id));
  };

  const convert = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one file.");
      return;
    }
    setLoading(true);
    try {
      const JsPDF = getJsPDF();
      const pdf = new JsPDF();
      let first = true;
      for (const entry of files) {
        if (!first) pdf.addPage();
        first = false;
        if (entry.file.type.startsWith("image/")) {
          const dataUrl = await readAsDataURL(entry.file);
          const img = await loadImage(dataUrl);
          const pageW = pdf.internal.pageSize.getWidth();
          const pageH = pdf.internal.pageSize.getHeight();
          const ratio = Math.min(pageW / img.width, pageH / img.height);
          const w = img.width * ratio;
          const h = img.height * ratio;
          const x = (pageW - w) / 2;
          const y = (pageH - h) / 2;
          const ext = entry.file.type === "image/png" ? "PNG" : "JPEG";
          pdf.addImage(dataUrl, ext, x, y, w, h);
        } else {
          const text = await entry.file.text();
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(11);
          const lines = pdf.splitTextToSize(text, 180);
          pdf.text(lines, 15, 20);
        }
      }
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      toast.success("PDF created successfully!");
    } catch (err: any) {
      console.error("PDF Converter error:", err);
      toast.error(
        err?.message?.includes("not loaded")
          ? err.message
          : "Conversion failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "converted.pdf";
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg">PDF Converter</h3>
          <p className="text-sm text-muted-foreground">
            Convert images and text files to PDF
          </p>
        </div>
      </div>

      <div
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && inputRef.current?.click()
        }
        data-ocid="pdfconverter.dropzone"
      >
        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="font-medium">Drop files here or click to upload</p>
        <p className="text-sm text-muted-foreground mt-1">
          Images (JPG, PNG) or text files (TXT)
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.txt"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((entry, i) => (
            <li
              key={entry.id}
              className="flex items-center justify-between bg-muted rounded-lg px-3 py-2 text-sm"
              data-ocid={`pdfconverter.item.${i + 1}` as never}
            >
              <span className="truncate max-w-[80%]">{entry.file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(entry.id)}
                className="text-muted-foreground hover:text-destructive"
                data-ocid={`pdfconverter.delete_button.${i + 1}` as never}
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button
        onClick={convert}
        disabled={loading || files.length === 0}
        className="rounded-full w-full"
        data-ocid="pdfconverter.primary_button"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        {loading ? "Converting..." : "Convert to PDF"}
      </Button>

      {loading && (
        <div
          data-ocid="pdfconverter.loading_state"
          className="text-center text-sm text-muted-foreground"
        >
          Processing files...
        </div>
      )}

      {pdfUrl && !loading && (
        <div
          className="flex justify-center"
          data-ocid="pdfconverter.success_state"
        >
          <Button
            onClick={download}
            variant="outline"
            className="rounded-full gap-2"
            data-ocid="pdfconverter.secondary_button"
          >
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </div>
      )}

      <Button
        variant="outline"
        onClick={() => setReviewOpen(true)}
        className="w-full rounded-full gap-2 border-primary/30 text-primary"
        data-ocid="pdfconverter.open_modal_button"
      >
        &#9733; Leave a Review
      </Button>

      <ReviewModal
        toolId="pdf-converter"
        toolName="PDF Converter"
        open={reviewOpen}
        onOpenChange={setReviewOpen}
      />
    </div>
  );
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
