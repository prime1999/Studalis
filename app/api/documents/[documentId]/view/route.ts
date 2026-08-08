import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/lib/s3";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{
    documentId: string;
  }>;
}

export async function GET(req: Request, { params }: Params) {
  console.log("here1");
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;
  console.log("here2");
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      userId,
    },
  });
  console.log("here3");
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: document.pdfKey,
  });

  const url = await getSignedUrl(s3, command, {
    expiresIn: 60 * 60,
  });

  return NextResponse.json({ url });
}
