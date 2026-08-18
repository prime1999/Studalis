// export async function extractPdfText(buffer: Buffer) {
//   // 1. Polyfill DOMMatrix
//   if (typeof globalThis.DOMMatrix === "undefined") {
//     const domMatrixModule = await import("dommatrix");
//     const DOMMatrixCtor = domMatrixModule.default || domMatrixModule;

//     (globalThis as any).DOMMatrix = DOMMatrixCtor;
//     (globalThis as any).DOMMatrixReadOnly = DOMMatrixCtor;
//   }

//   // 2. Import pdfjs legacy build
//   const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

//   // 3. Configure legacy fake worker for Node.js
//   // @ts-ignore
//   const pdfjsWorker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
//   pdfjsLib.GlobalWorkerOptions.workerPort = pdfjsWorker;

//   const loadingTask = pdfjsLib.getDocument({
//     data: new Uint8Array(buffer),
//     useSystemFonts: true,
//     disableFontFace: true,
//     //isEvalSupported: false,
//   });

//   const pdf = await loadingTask.promise;
//   const pages = [];

//   for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
//     const page = await pdf.getPage(pageNum);
//     const content = await page.getTextContent();

//     const text = content.items.map((item: any) => item.str || "").join(" ");

//     const cleanedText = text
//       .replace(/([a-z])([A-Z])/g, "$1 $2")
//       .replace(/\s+/g, " ")
//       .trim();

//     pages.push({
//       page: pageNum,
//       cleanedText,
//     });
//   }

//   return {
//     totalPages: pdf.numPages,
//     pages,
//   };
// }

import pdfParse from "pdf-parse";

export async function extractPdfText(buffer: Buffer) {
  // pdf-parse provides a custom pagerender hook to split pages precisely
  const pageTexts: string[] = [];

  function customPageRender(pageData: any) {
    return pageData.getTextContent().then((textContent: any) => {
      let lastY,
        text = "";
      for (const item of textContent.items) {
        if (lastY == item.transform[5] || !lastY) {
          text += item.str;
        } else {
          text += "\n" + item.str;
        }
        lastY = item.transform[5];
      }
      pageTexts.push(text);
      return text;
    });
  }

  const data = await pdfParse(buffer, {
    pagerender: customPageRender,
  });

  const pages = pageTexts.map((cleanedText, index) => ({
    page: index + 1,
    cleanedText: cleanedText.replace(/\s+/g, " ").trim(),
  }));

  console.log({ totalPages: data.numpages, pages });

  return {
    totalPages: data.numpages,
    pages,
  };
}
