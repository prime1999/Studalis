import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{
    documentId: string;
  }>;
}

export async function GET(req: Request, { params }: Params) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;

  const session = await prisma.studySession.findFirst({
    where: {
      userId,
      documentId,
    },
  });

  return NextResponse.json(session);
}
