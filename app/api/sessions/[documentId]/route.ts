import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET({
  params,
}: {
  params: Promise<{
    documentId: string;
  }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;

  const sessions = await prisma.studySession.findMany({
    where: {
      userId,
      documentId,
    },
    orderBy: {
      lastOpenedAt: "desc",
    },
  });

  return NextResponse.json(sessions);
}
