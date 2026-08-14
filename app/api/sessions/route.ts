import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await prisma.studySession.findMany({
    where: {
      userId,
    },
    orderBy: {
      lastOpenedAt: "desc",
    },
  });

  return NextResponse.json(sessions);
}
