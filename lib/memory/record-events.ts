import { prisma } from "@/lib/prisma";
import { extractStandardizedTopic } from "./extract-topic";

export type MemoryEventType =
  | "EXPLAIN_REQUEST"
  | "NOTE_CREATED"
  | "FLASHCARD_CREATED"
  | "QUIZ_CORRECT"
  | "QUIZ_WRONG";

export async function recordTopicEvent({
  userId,
  documentId,
  rawQuery,
  event,
}: {
  userId: string;
  documentId?: string;
  rawQuery: string;
  event: MemoryEventType;
}) {
  // 1. Fetch user's existing topics to avoid fragmentation
  const userMemory = await prisma.topicMemory.findMany({
    where: { userId },
    select: { topic: true },
    take: 20,
  });

  const existingTopics = Array.from(new Set(userMemory.map((m) => m.topic)));
  const topic = await extractStandardizedTopic(rawQuery, existingTopics);

  // 2. Prepare increment instructions
  const updateData: Record<string, any> = {
    studyCount: { increment: 1 },
    lastInteractionType: event,
    lastTopicQuestion: rawQuery.slice(0, 250),
    lastStudiedAt: new Date(),
  };

  switch (event) {
    case "EXPLAIN_REQUEST":
      updateData.explainRequests = { increment: 1 };
      break;
    case "NOTE_CREATED":
      updateData.notesCreated = { increment: 1 };
      break;
    case "FLASHCARD_CREATED":
      updateData.flashcardsCreated = { increment: 1 };
      break;
    case "QUIZ_CORRECT":
      updateData.quizzesTaken = { increment: 1 };
      updateData.quizCorrect = { increment: 1 };
      break;
    case "QUIZ_WRONG":
      updateData.quizzesTaken = { increment: 1 };
      updateData.quizWrong = { increment: 1 };
      break;
  }

  // 3. Find existing record by userId & topic without @@unique constraints
  const existingRecord = await prisma.topicMemory.findFirst({
    where: { userId, topic },
  });

  if (existingRecord) {
    return await prisma.topicMemory.update({
      where: { id: existingRecord.id },
      data: updateData,
    });
  }

  // 4. Create new record if topic doesn't exist yet
  return await prisma.topicMemory.create({
    data: {
      userId,
      documentId,
      topic,
      studyCount: 1,
      lastInteractionType: event,
      lastTopicQuestion: rawQuery.slice(0, 250),
      explainRequests: event === "EXPLAIN_REQUEST" ? 1 : 0,
      notesCreated: event === "NOTE_CREATED" ? 1 : 0,
      flashcardsCreated: event === "FLASHCARD_CREATED" ? 1 : 0,
      quizzesTaken: event.startsWith("QUIZ") ? 1 : 0,
      quizCorrect: event === "QUIZ_CORRECT" ? 1 : 0,
      quizWrong: event === "QUIZ_WRONG" ? 1 : 0,
    },
  });
}
