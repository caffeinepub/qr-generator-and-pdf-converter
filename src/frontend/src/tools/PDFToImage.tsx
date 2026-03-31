import ReviewModal from "@/components/ReviewModal";
import { Button } from "@/components/ui/button";
import { Download, ImageIcon, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

// pdfjs-dist is loaded via CDN script tag in index.html (window.pdfjsLib)
function getPdfjsLib() {
  const lib = (window as any).pdfjsLib;
  if (!lib) throw new Error("PDF.js library not loaded");
  return lib as {
    version: string;
    GlobalWorkerOptions: { workerSrc: string };
    getDocument(src: { data: ArrayBuffer }): {
      promise: Promise<{
        numPages: number;
        getPage(n: number): Promise<{
          getViewport(opts: { scale: number }): {
            width: number;
            height: number;
          };
          render(params: {
            canvas?: HTMLCanvasElement;
            canvasContext: CanvasRenderingContext2D;
            viewport: { width: number; height: number };
          }): { promise: Promise<void> };
        }>;
      }>;
    };
  };
}

export default function PDFToImage() {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleFile = (file: File | null | undefined) => {
    if (!file || file.type !== "application/pdf") {
      toast.error("Please select a valid PDF file.");
      return;
    }
    setPdfFile(file);
    setFileName(file.name);
    setImages([]);
  };

  const convert = async () => {
    if (!pdfFile) {
      toast.error("Please upload a PDF file.");
      return;
    }
    setLoading(true);
    try {
      const pdfjsLib = getPdfjsLib();
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        pages.push(canvas.toDataURL("image/png"));
      }

      setImages(pages);
      toast.success(
        `Converted ${pages.length} page${pages.length !== 1 ? "s" : ""} to images!`,
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to convert PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (url: string, index: number) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `page-${index + 1}.png`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg">PDF to Image</h3>
          <p className="text-sm text-muted-foreground">
            Convert PDF pages to PNG images
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
          handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && inputRef.current?.click()
        }
        data-ocid="pdftoimage.dropzone"
      >
        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        {fileName ? (
          <p className="font-medium text-primary">{fileName}</p>
        ) : (
          <>
            <p className="font-medium">Drop PDF here or click to upload</p>
            <p className="text-sm text-muted-foreground mt-1">PDF files only</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
        data-ocid="pdftoimage.upload_button"
      />

      <Button
        onClick={convert}
        disabled={loading || !pdfFile}
        className="rounded-full w-full"
        data-ocid="pdftoimage.primary_button"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ImageIcon className="mr-2 h-4 w-4" />
        )}
        {loading ? "Converting..." : "Convert to Images"}
      </Button>

      {loading && (
        <div
          data-ocid="pdftoimage.loading_state"
          className="text-center text-sm text-muted-foreground"
        >
          Rendering PDF pages...
        </div>
      )}

      {images.length > 0 && !loading && (
        <div className="space-y-4" data-ocid="pdftoimage.success_state">
          {images.map((src, i) => (
            <div
              key={src.slice(-20)}
              className="relative group"
              data-ocid={`pdftoimage.item.${i + 1}` as never}
            >
              <img
                src={src}
                alt={`PDF page ${i + 1}`}
                className="w-full rounded-xl border shadow-card"
              />
              <Button
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                onClick={() => downloadImage(src, i)}
                data-ocid="pdftoimage.secondary_button"
              >
                <Download className="w-4 h-4 mr-1" /> Page {i + 1}
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        onClick={() => setReviewOpen(true)}
        className="w-full rounded-full gap-2 border-primary/30 text-primary"
        data-ocid="pdftoimage.open_modal_button"
      >
        &#9733; Leave a Review
      </Button>

      <ReviewModal
        toolId="pdf-to-image"
        toolName="PDF to Image"
        open={reviewOpen}
        onOpenChange={setReviewOpen}
      />
    </div>
  );
}
