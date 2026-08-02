import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/lib/s3";

export async function POST(req: NextRequest) {
  const { key } = await req.json();

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
  });

  const fileUrl = await getSignedUrl(s3, command, {
    expiresIn: 60 * 60,
  });

  return NextResponse.json({
    fileUrl,
  });
}
