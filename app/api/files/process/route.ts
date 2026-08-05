import { s3 } from "@/lib/s3";
import { extractPdfText } from "@/lib/s3-extract";
import { getPdfBuffer } from "@/lib/get-pdf-buttfer";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { chunkText } from "@/lib/chunk-text";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { key, documentId } = await req.json();
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const jsonKey = key
    .replace("uploads/", "processed/")
    .replace(".pdf", ".json");

  // 1. Download PDF from S3
  const pdfBuffer = await getPdfBuffer(key);

  // 2. Extract text
  const pdfText = await extractPdfText(pdfBuffer);

  if (!pdfText.pages || pdfText.pages.length === 0) {
    console.error("No pages found in PDF");
    return Response.json({ error: "No pages found in PDF" }, { status: 400 });
  }

  for (const page of pdfText.pages) {
    const chunks = chunkText(page.cleanedText);

    console.log({ page, chunks });
    for (let i = 0; i < chunks.length; i++) {
      await prisma.documentChunk.create({
        data: {
          documentId,

          pageNumber: page.page,

          chunkIndex: i,

          content: chunks[i],
        },
      });
    }
  }

  console.log("Extracted PDF Text:", pdfText);

  // 3. Save JSON to S3
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: jsonKey,
    Body: JSON.stringify(pdfText),
    ContentType: "application/json",
  });

  await s3.send(command);

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      userId,
    },
  });

  console.log("Document found:", document);

  if (!document) {
    return Response.json({ error: "Document not found" }, { status: 404 });
  }

  console.log({ documentId });

  await prisma.document.update({
    where: {
      id: document.id,
    },
    data: {
      processedKey: jsonKey,
      status: "ready",
    },
  });

  return Response.json({
    jsonKey,
    success: true,
  });
}
