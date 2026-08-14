import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { searchSimilarChunks } from "@/lib/retrieval/search-similar-chunks";
import { GoogleGenAI } from "@google/genai";
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

    const { documentId, question } = await req.json();

    if (!documentId || !question) {
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

    const chunks: any = await searchSimilarChunks(question, documentId);

    const context = chunks.map((chunk: any) => chunk.content).join("\n\n");

    const prompt = `
You are Studalis, an AI study companion.

Use the document context below to explain the highlighted text.

Document Context:
${context}

Highlighted Text:
${question}

Instructions:
- Explain the highlighted text clearly.
- Use the document context whenever possible.
- If the context is insufficient, use your general knowledge.
- Be concise and educational.
- Assume you are teaching a student.
`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    console.log("result", result);

    const answer = result.text;

    await prisma.learningInteraction.create({
      data: {
        sessionId: session.id,
        documentId,

        sourceText: question,

        interactionType: "EXPLAIN",

        content: {
          answer,
        },
      },
    });

    return NextResponse.json({
      answer,
      chunksUsed: chunks.length,
    });
  } catch (error) {
    console.error("EXPLAIN ERROR:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
