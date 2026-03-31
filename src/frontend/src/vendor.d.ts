// Ambient type declarations for tool libraries loaded at runtime
declare module "jspdf" {
  export class jsPDF {
    constructor(options?: {
      orientation?: string;
      unit?: string;
      format?: string | number[];
      compress?: boolean;
    });
    addImage(
      imageData: string | HTMLImageElement | HTMLCanvasElement,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number,
    ): jsPDF;
    addPage(format?: string | number[], orientation?: string): jsPDF;
    save(filename: string): void;
    setFont(fontName: string, fontStyle?: string): jsPDF;
    setFontSize(size: number): jsPDF;
    text(
      text: string | string[],
      x: number,
      y: number,
      options?: { maxWidth?: number; align?: string },
    ): jsPDF;
    splitTextToSize(text: string, maxWidth: number): string[];
    output(type: "blob"): Blob;
    output(type: "datauristring"): string;
    output(type: string): unknown;
    internal: {
      pageSize: { getWidth(): number; getHeight(): number };
    };
    getNumberOfPages(): number;
  }
}

declare module "qrcode" {
  const QRCode: {
    toDataURL(
      text: string,
      options?: {
        width?: number;
        margin?: number;
        color?: { dark?: string; light?: string };
      },
    ): Promise<string>;
    toCanvas(
      canvas: HTMLCanvasElement,
      text: string,
      options?: object,
    ): Promise<void>;
  };
  export default QRCode;
}

declare module "pdfjs-dist" {
  const pdfjsLib: {
    version: string;
    GlobalWorkerOptions: { workerSrc: string };
    getDocument(src: {
      data: ArrayBuffer;
    }): { promise: Promise<PDFDocumentProxy> };
  };
  export = pdfjsLib;

  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }
  export interface PDFPageProxy {
    getViewport(options: { scale: number }): PDFPageViewport;
    render(params: {
      canvas?: HTMLCanvasElement;
      canvasContext: CanvasRenderingContext2D;
      viewport: PDFPageViewport;
    }): { promise: Promise<void> };
  }
  export interface PDFPageViewport {
    width: number;
    height: number;
  }
}
