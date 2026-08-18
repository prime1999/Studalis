export async function extractPdfText(buffer: Buffer) {
  // 1. Polyfill DOMMatrix inside the function call
  if (typeof globalThis.DOMMatrix === "undefined") {
    const domMatrixModule = await import("dommatrix");
    const DOMMatrixCtor = domMatrixModule.default || domMatrixModule;

    (globalThis as any).DOMMatrix = DOMMatrixCtor;
    (globalThis as any).DOMMatrixReadOnly = DOMMatrixCtor;
  }

  // 2. Dynamically load pdfjs after polyfill is established
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;
  const pages = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    // Use space separator so words do not fuse together
    const text = content.items.map((item: any) => item.str || "").join(" ");

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
