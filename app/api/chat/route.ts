// app/api/chat/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";

import { prisma } from "@/lib/prisma";
import { searchSimilarChunks } from "@/lib/retrieval/search-similar-chunks";
import { getOrCreateSession } from "@/lib/sessions/get-or-create-session";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId, message } = await req.json();

    if (!documentId || !message) {
      return NextResponse.json(
        {
          error: "Missing required fields",
        },
        { status: 400 },
      );
    }

    const session = await getOrCreateSession({
      userId,
      documentId,
    });

    if (!session) {
      return NextResponse.json(
        {
          error: "Session not found",
        },
        { status: 404 },
      );
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "user",
        content: message,
      },
    });

    // Retrieve document chunks
    const chunks: any = await searchSimilarChunks(message, documentId);

    const context = chunks.map((chunk: any) => chunk.content).join("\n\n");

    const prompt = `
You are Studalis, an AI study companion.

Use the document context below when answering.

Document Context:
${context}

Student Message:
${message}

Instructions:
- Be educational.
- Explain clearly.
- Use the document context whenever relevant.
- If context is insufficient, use general knowledge.
- Keep answers concise unless more detail is needed.
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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

    return NextResponse.json({
      answer,
      chunksUsed: chunks.length,
    });
  } catch (error) {
    console.error("CHAT ERROR:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      },
    );
  }
}
