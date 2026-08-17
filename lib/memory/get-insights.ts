import { prisma } from "@/lib/prisma";

export interface TopicInsight {
  topic: string;
  studyCount: number;
  accuracy: number | null;
  status: "STRONG" | "NEEDS_REVIEW" | "NEUTRAL";
  explainRequests: number;
  lastStudiedAt: Date;
}

export async function getUserLearningInsights(userId: string) {
  const memoryRecords = await prisma.topicMemory.findMany({
    where: { userId },
    orderBy: { lastStudiedAt: "desc" },
  });

  const processed: TopicInsight[] = memoryRecords.map((item) => {
    const totalQuizzes = item.quizCorrect + item.quizWrong;
    const accuracy =
      totalQuizzes > 0
        ? Math.round((item.quizCorrect / totalQuizzes) * 100)
        : null;

    let status: "STRONG" | "NEEDS_REVIEW" | "NEUTRAL" = "NEUTRAL";

    if (accuracy !== null) {
      if (accuracy >= 75) status = "STRONG";
      else if (accuracy < 60) status = "NEEDS_REVIEW";
    } else if (item.explainRequests >= 4) {
      status = "NEEDS_REVIEW";
    }

    return {
      topic: item.topic,
      studyCount: item.studyCount,
      accuracy,
      status,
      explainRequests: item.explainRequests,
      lastStudiedAt: item.lastStudiedAt,
    };
  });

  return {
    totalTopicsTracked: processed.length,
    strongTopics: processed.filter((t) => t.status === "STRONG"),
    needsReview: processed.filter((t) => t.status === "NEEDS_REVIEW"),
    mostStudied: [...processed]
      .sort((a, b) => b.studyCount - a.studyCount)
      .slice(0, 5),
    recentActivity: processed.slice(0, 6),
  };
}
