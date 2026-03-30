import ReviewModal from "@/components/ReviewModal";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import {
  Download,
  GripVertical,
  Images,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface PreviewEntry {
  id: string;
  file: File;
  url: string;
}

export default function ImageToPDF() {
  const [entries, setEntries] = useState<PreviewEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (newFiles: FileList | null) => {
    if (!newFiles) return;
    const arr = Array.from(newFiles).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) {
      toast.error("Please select image files.");
      return;
    }
    const newEntries: PreviewEntry[] = await Promise.all(
      arr.map(async (f) => ({
        id: `${f.name}-${f.lastModified}-${Math.random()}`,
        file: f,
        url: await readAsDataURL(f),
      })),
    );
    setEntries((prev) => [...prev, ...newEntries]);
    setPdfUrl("");
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const convert = async () => {
    if (entries.length === 0) {
      toast.error("Please add at least one image.");
      return;
    }
    setLoading(true);
    try {
      const pdf = new jsPDF();
      let first = true;
      for (const entry of entries) {
        if (!first) pdf.addPage();
        first = false;
        const img = await loadImage(entry.url);
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const ratio = Math.min(pageW / img.width, (pageH - 10) / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        const x = (pageW - w) / 2;
        const y = (pageH - h) / 2;
        const ext = entry.file.type === "image/png" ? "PNG" : "JPEG";
        pdf.addImage(entry.url, ext, x, y, w, h);
      }
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      toast.success("PDF created successfully!");
    } catch {
      toast.error("Failed to create PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = "images.pdf";
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Images className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg">Image to PDF</h3>
          <p className="text-sm text-muted-foreground">
            Merge multiple images into a single PDF
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
        data-ocid="imagetopdf.dropzone"
      >
        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="font-medium">Drop images here or click to upload</p>
        <p className="text-sm text-muted-foreground mt-1">
          JPG, PNG, WebP supported
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        data-ocid="imagetopdf.upload_button"
      />

      {entries.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className="relative group rounded-xl overflow-hidden shadow-card"
              data-ocid={`imagetopdf.item.${i + 1}` as never}
            >
              <img
                src={entry.url}
                alt={`Uploaded file ${i + 1}`}
                className="w-full h-24 object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="bg-destructive text-white rounded-full p-1"
                  data-ocid={`imagetopdf.delete_button.${i + 1}` as never}
                >
                  <X className="w-3 h-3" />
                </button>
                <GripVertical className="w-4 h-4 text-white" />
              </div>
              <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={convert}
        disabled={loading || entries.length === 0}
        className="rounded-full w-full"
        data-ocid="imagetopdf.primary_button"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Images className="mr-2 h-4 w-4" />
        )}
        {loading
          ? "Creating PDF..."
          : `Merge ${entries.length > 0 ? entries.length : ""} ${entries.length !== 1 ? "Files" : "File"} into PDF`}
      </Button>

      {loading && (
        <div
          data-ocid="imagetopdf.loading_state"
          className="text-center text-sm text-muted-foreground"
        >
          Merging images...
        </div>
      )}

      {pdfUrl && !loading && (
        <div
          className="flex justify-center"
          data-ocid="imagetopdf.success_state"
        >
          <Button
            onClick={download}
            variant="outline"
            className="rounded-full gap-2"
            data-ocid="imagetopdf.secondary_button"
          >
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </div>
      )}

      <Button
        variant="outline"
        onClick={() => setReviewOpen(true)}
        className="w-full rounded-full gap-2 border-primary/30 text-primary"
        data-ocid="imagetopdf.open_modal_button"
      >
        &#9733; Leave a Review
      </Button>

      <ReviewModal
        toolId="image-to-pdf"
        toolName="Image to PDF"
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
