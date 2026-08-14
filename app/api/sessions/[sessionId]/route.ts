import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function GET(req: Request, { params }: Params) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  const session = await prisma.studySession.findFirst({
    where: {
      userId,
      id: sessionId,
    },
  });

  return NextResponse.json(session);
}
