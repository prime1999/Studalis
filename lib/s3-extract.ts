if (typeof globalThis.DOMMatrix === "undefined") {
  const domMatrixModule = await import("dommatrix");
  const DOMMatrixCtor = (domMatrixModule as any).default ?? domMatrixModule;

  (globalThis as any).DOMMatrix = DOMMatrixCtor;
  (globalThis as any).DOMMatrixReadOnly = DOMMatrixCtor;
}

export async function extractPdfText(buffer: Buffer) {
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

    const text = content.items.map((item: any) => item.str || "").join("");

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
