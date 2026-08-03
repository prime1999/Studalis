// import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// export async function extractPdfText(buffer: Buffer) {
//   const pdf = await pdfjsLib.getDocument({
//     data: new Uint8Array(buffer),
//   }).promise;

//   const pages = [];

//   for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
//     const page = await pdf.getPage(pageNum);

//     const content = await page.getTextContent();

//     const text = content.items.map((item: any) => item.str).join(" ");

//     pages.push({
//       page: pageNum,
//       text,
//     });
//   }

//   return {
//     totalPages: pdf.numPages,
//     pages,
//   };
// }

// lib/extract-pdf-text.ts

import pdf from "pdf-parse";

export async function extractPdfText(buffer: Buffer) {
  const data = await pdf(buffer);

  return {
    totalPages: data.numpages,
    text: data.text,
  };
}
