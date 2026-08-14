import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";

import { prisma } from "@/lib/prisma";
import { getOrCreateSession } from "@/lib/sessions/get-or-create-session";
import { searchSimilarChunks } from "@/lib/retrieval/search-similar-chunks";
import {
  buildStudyPrompt,
  StudyAction,
} from "@/lib/prompts/build-study-prompts";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      documentId,
      message,
      action = "CHAT",
    }: {
      documentId: string;
      message: string;
      action: StudyAction;
    } = await req.json();

    if (!documentId || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    const session = await getOrCreateSession({
      userId,
      documentId,
      title: document.title,
    });

    // get recent Messages
    const recentMessages = await prisma.chatMessage.findMany({
      where: {
        sessionId: session.id,
      },

      orderBy: {
        createdAt: "asc",
      },

      take: 10,
    });

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "user",
        content: message,
      },
    });

    const conversationContext = recentMessages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    // Retrieve relevant chunks
    const chunks: any = await searchSimilarChunks(message, documentId, 5);

    const context = chunks.map((chunk: any) => chunk.content).join("\n\n");
    const prompt = `
Previous Conversation:

${conversationContext}

${buildStudyPrompt({
  action,
  context,
  message,
})}
`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const answer = result.text ?? "I couldn't generate a response.";

    // Save assistant message
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "assistant",
        content: answer,
      },
    });

    // Save study interaction
    if (action !== "CHAT") {
      await prisma.learningInteraction.create({
        data: {
          sessionId: session.id,
          documentId,
          sourceText: message,
          interactionType: action,
          content: {
            answer,
            chunksUsed: chunks.length,
          },
        },
      });
    }

    // Update session activity
    await prisma.studySession.update({
      where: {
        id: session.id,
      },
      data: {
        lastOpenedAt: new Date(),
      },
    });

    return NextResponse.json({
      answer,
      action,
      chunksUsed: chunks.length,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("CHAT ERROR:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
