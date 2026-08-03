import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/s3";

export async function getPdfBuffer(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
  });

  const response = await s3.send(command);

  const chunks: Uint8Array[] = [];

  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}
