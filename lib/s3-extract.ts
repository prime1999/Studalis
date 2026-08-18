// lib/s3-extract.ts
import DOMMatrix from "dommatrix";

// Polyfill DOMMatrix
if (typeof globalThis.DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = DOMMatrix;
}

export async function extractPdfText(buffer: Buffer) {
  // Dynamically import PDF.js
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Disable worker threads in production Node.js execution
  pdfjsLib.GlobalWorkerOptions.workerSrc = "";

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
    //isEvalSupported: false,
    useWorkerFetch: false,
  });

  const pdf = await loadingTask.promise;
  const pages = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(" ");
    const cleanedText = text
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim();

    pages.push({
      page: pageNum,
      cleanedText,
    });
  }

  return {
    totalPages: pdf.numPages,
    pages,
  };
}
