import { prisma } from "@/lib/prisma";
import { getOrCreateSession } from "@/lib/sessions/get-or-create-session";
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

  const document = await prisma.document.findFirst({
    where: {
      userId,
      id: documentId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!document) {
    return NextResponse.json(
      { error: "Document not found, Please reupload document" },
      { status: 400 },
    );
  }

  const session = await getOrCreateSession({
    userId,
    documentId,
    title: document.title,
  });

  if (!session) {
    return NextResponse.json(
      { error: "Session not created, Please try again" },
      { status: 400 },
    );
  }

  return NextResponse.json(session);
}
