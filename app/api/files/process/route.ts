import { s3 } from "@/lib/s3";
import { extractPdfText } from "@/lib/s3-extract";
import { getPdfBuffer } from "@/lib/get-pdf-buttfer";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { key } = await req.json();
  const jsonKey = key
    .replace("uploads/", "processed/")
    .replace(".pdf", ".json");

  // 1. Download PDF from S3
  const pdfBuffer = await getPdfBuffer(key);

  // 2. Extract text
  const pdfText = await extractPdfText(pdfBuffer);

  console.log("Extracted PDF Text:", pdfText);

  // 3. Save JSON to S3
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: jsonKey,
    Body: JSON.stringify(pdfText),
    ContentType: "application/json",
  });

  await s3.send(command);

  return Response.json({
    jsonKey,
    success: true,
  });
}
