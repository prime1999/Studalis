import { prisma } from "@/lib/prisma";

interface Props {
  userId: string;
  documentId: string;
}

export async function getOrCreateSession({ userId, documentId }: Props) {
  let session = await prisma.studySession.findFirst({
    where: {
      userId,
      documentId,
    },
  });

  if (session) {
    session = await prisma.studySession.update({
      where: {
        id: session.id,
      },
      data: {
        lastOpenedAt: new Date(),
      },
    });

    return session;
  }

  if (!session) {
    session = await prisma.studySession.create({
      data: {
        userId,
        documentId,
      },
    });
  }

  return session;
}
