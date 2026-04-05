import ReviewModal from "@/components/ReviewModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Download, Link, Loader2, QrCode, Share2, Type } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Pure-JS QR Code encoder (no CDN needed) ────────────────────────────────
// Reed-Solomon + QR matrix encoder, supports byte mode for all text/URLs.

// GF(256) arithmetic
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

// QR version 3 (29×29), ECC level M – handles up to ~47 bytes
// We use version 2 (25×25) for short text, version 3 for longer
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
    if (byteCount <= info.data - 2) return { ver: Number(ver), info }; // -2 for mode+length indicator overhead
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
  // Mode: byte = 0100
  push(4, 4);
  // Char count (8 bits for byte mode, versions 1-9)
  push(data.length, 8);
  // Data
  for (const b of data) push(b, 8);
  // Terminator
  for (let i = 0; i < 4 && bits.length < totalDataBytes * 8; i++) bits.push(0);
  // Byte align
  while (bits.length % 8 !== 0) bits.push(0);
  // Padding bytes
  const padBytes = [0xec, 0x11];
  let pi = 0;
  while (bits.length < totalDataBytes * 8) push(padBytes[pi++ % 2], 8);
  // Convert to bytes
  const out: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] ?? 0);
    out.push(byte);
  }
  return out;
}

// Place finder pattern
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

// Place alignment pattern (version >= 2)
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

function generateQR(text: string): HTMLCanvasElement | null {
  const raw = encodeBytes(text);
  const versionInfo = pickVersion(raw.length);
  if (!versionInfo) return null;
  const { ver, info } = versionInfo;
  const size = info.size;

  const dataBytes = buildBitstream(raw, info.data);
  const eccBytes = rsEncode(dataBytes, info.ecc);
  const codewords = [...dataBytes, ...eccBytes];

  // Build codeword bits
  const cwBits: number[] = [];
  for (const cw of codewords)
    for (let i = 7; i >= 0; i--) cwBits.push((cw >> i) & 1);
  // Remainder bits
  for (let i = 0; i < info.remBits; i++) cwBits.push(0);

  // ─ 1. Reserve grid (-1 = unreserved) ─
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

  // ─ 2. Finder patterns ─
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
    // top-right
    reserved[0][size - 8 + i] =
      reserved[6][size - 8 + i] =
      reserved[i][size - 8] =
      reserved[i][size - 1] =
        true;
  }
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 8; j++) {
      reserved[i][j] = true; // top-left
      reserved[i][size - 8 + j] = true; // top-right
      reserved[size - 8 + i][j] = true; // bottom-left
    }

  // ─ 3. Timing strips ─
  for (let i = 8; i < size - 8; i++) {
    const v = i % 2 === 0 ? 1 : 0;
    reserve(6, i, v);
    reserve(i, 6, v);
  }

  // ─ 4. Alignment pattern (ver >= 2) ─
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
        // Skip if overlap with finder
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

  // ─ 5. Dark module & format info area ─
  reserve(size - 8, 8, 1);
  // Format info columns (placeholder)
  for (let i = 0; i < 9; i++) {
    reserved[i][8] = true;
    reserved[8][i] = true;
  }
  for (let i = size - 8; i < size; i++) {
    reserved[i][8] = true;
    reserved[8][i] = true;
  }

  // ─ 6. Place data ─
  let bitIdx = 0;
  let goingUp = true;
  for (let col = size - 1; col >= 0; col -= 2) {
    if (col === 6) col = 5; // skip timing col
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

  // ─ 7. Apply mask 0 (checkerboard) ─
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (!reserved[r][c] && (r + c) % 2 === 0) grid[r][c] ^= 1;

  // ─ 8. Write format information (ECC level M = 00, mask 0 = 000) ─
  //   Format: 00 000 → raw = 0b00000 = 0, ECC poly 0x537, masked with 0x5412
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
  // Place format bits
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

  // ─ 9. Render to canvas ─
  const scale = 10;
  const quiet = 4 * scale;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size * scale + quiet * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      ctx.fillStyle = grid[r][c] === 1 ? "#111827" : "#ffffff";
      ctx.fillRect(quiet + c * scale, quiet + r * scale, scale, scale);
    }
  return canvas;
}

export default function QRCodeMaker() {
  const [inputText, setInputText] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  // Live preview as user types
  useEffect(() => {
    if (!inputText.trim()) {
      setQrUrl("");
      return;
    }
    const canvas = generateQR(inputText.trim());
    if (canvas) setQrUrl(canvas.toDataURL("image/png"));
  }, [inputText]);

  const generate = () => {
    if (!inputText.trim()) {
      toast.error("Please enter a URL or text.");
      return;
    }
    setLoading(true);
    try {
      const canvas = generateQR(inputText.trim());
      if (!canvas) {
        toast.error("Text is too long for QR code. Please shorten it.");
        return;
      }
      setQrUrl(canvas.toDataURL("image/png"));
      toast.success("QR code generated!");
    } catch (err) {
      console.error("QR error:", err);
      toast.error("Failed to generate QR code. Please try again.");
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
