// // import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// // export async function extractPdfText(buffer: Buffer) {
// //   const pdf = await pdfjsLib.getDocument({
// //     data: new Uint8Array(buffer),
// //   }).promise;

// //   const pages = [];

// //   for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
// //     const page = await pdf.getPage(pageNum);

// //     const content = await page.getTextContent();

// //     const text = content.items.map((item: any) => item.str).join(" ");

// //     pages.push({
// //       page: pageNum,
// //       text,
// //     });
// //   }

// //   return {
// //     totalPages: pdf.numPages,
// //     pages,
// //   };
// // }

// // lib/extract-pdf-text.ts

// import pdf from "pdf-parse";

// export async function extractPdfText(buffer: Buffer) {
//   const data = await pdf(buffer);

//   return {
//     totalPages: data.numpages,
//     text: data.text,
//   };
// }

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import path from "path";
import { pathToFileURL } from "url";

// Point GlobalWorkerOptions directly to the node_modules worker file
const workerPath = path.resolve(
  process.cwd(),
  "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
);
pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).toString();

export async function extractPdfText(buffer: Buffer) {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true, // Prevents canvas dependency issues on Node
    isEvalSupported: false, // Prevents fake worker dynamic import crash
  });

  const pdf = await loadingTask.promise;
  const pages = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join("");
    const cleanedText = text
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim();

    console.log(`Page ${pageNum} cleaned text:`, cleanedText);

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
