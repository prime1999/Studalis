import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Content } from "@google/genai";
import { auth } from "@clerk/nextjs/server";
import { waitUntil } from "@vercel/functions";

import { prisma } from "@/lib/prisma";
import { toolDefinitions } from "@/lib/ai/tools/tool-definitions";
import { buildToolHandlers } from "@/lib/ai/tools";
import {
  buildStudyPrompt,
  StudyAction,
} from "@/lib/prompts/build-study-prompts";
import { recordTopicEvent, MemoryEventType } from "@/lib/memory/record-events";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MAX_TOOL_CALLS = 10;
const MAX_MESSAGE_CHARACTERS = 3000; // Truncates overly large text selections or dumps

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      message,
      documentId,
      sessionId,
      action = "CHAT",
      context = "",
    }: {
      message: string;
      documentId: string;
      sessionId: string;
      action?: StudyAction;
      context?: string;
    } = body;

    const { userId } = await auth();

    if (!message || !documentId || !sessionId) {
      return NextResponse.json(
        { error: "Missing message, documentId, or sessionId" },
        { status: 400 },
      );
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /**
     * 1. Fetch latest conversation history with field selection to minimize payload
     */
    const recentMessages = await prisma.chatMessage.findMany({
      where: { sessionId },
      select: {
        role: true,
        content: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    recentMessages.reverse();

    /**
     * 2. Fetch recent TopicMemory including frequency/times studied
     */
    const recentMemory = await prisma.topicMemory.findMany({
      where: { userId },
      select: {
        topic: true,
        lastInteractionType: true,
        //timesStudied: true,
      },
      orderBy: { lastStudiedAt: "desc" },
      take: 5,
    });

    const memoryBlock =
      recentMemory.length > 0
        ? `<student_memory>\nRecently & Frequently Studied Topics:\n${recentMemory
            .map(
              (m) =>
                `- Topic: "${m.topic}" | Last event: ${m.lastInteractionType || "EXPLAIN"}`,
            )
            .join("\n")}\n</student_memory>\n\n`
        : "";

    /**
     * 3. Truncate user prompt if context exceeds limits
     */
    const safeMessage =
      message.length > MAX_MESSAGE_CHARACTERS
        ? `${message.slice(0, MAX_MESSAGE_CHARACTERS)}... [truncated]`
        : message;

    const formattedUserPrompt = `${memoryBlock}${buildStudyPrompt({
      action,
      context,
      message: safeMessage,
    })}`;

    /**
     * 4. Action-based event classification
     */
    let primaryEventType: MemoryEventType | null = null;
    if (action === "EXPLAIN") {
      primaryEventType = "EXPLAIN_REQUEST";
    }

    if (primaryEventType) {
      waitUntil(
        recordTopicEvent({
          userId,
          documentId,
          rawQuery: safeMessage,
          event: primaryEventType,
        }).catch((err: any) =>
          console.error("[memory-event] Background log failed:", err),
        ),
      );
    }

    /**
     * 5. Build conversation contents
     */
    const contents: Content[] = [
      ...recentMessages.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
      {
        role: "user",
        parts: [{ text: formattedUserPrompt }],
      },
    ];

    /**
     * 6. Save raw user message
     */
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: "user",
        content: safeMessage,
      },
    });

    /**
     * 7. Tool handlers
     */
    const handlers = buildToolHandlers({
      userId,
      documentId,
    });

    const systemInstruction = `
You are Studalis, an AI study companion.

Your goal is to help students understand concepts deeply, study effectively, and make progress in their learning.

You have access to tools that can:
- Search study materials
- Retrieve document content
- Create notes
- Generate flashcards
- Generate quizzes
- Generate summaries
- Access learning information

Tool Rules:
1. Use tools whenever necessary to answer accurately.
2. After every tool execution analyze and explain the results.
3. Include Markdown links for note creation.
4. Never stop after calling a tool or return raw tool output.
5. Prioritize document information when available.
6. Be educational, supportive, and concise.

Proactive Memory & Student Support Rules:
1. Carefully check the <student_memory> block provided in the user prompt.
2. If the user is asking about or explaining a topic that they have reviewed 2 or more times (or if it appears in their memory history as frequently studied):
   - Proactively acknowledge this repetition in a warm, encouraging way (e.g., "I notice you've asked about [Topic] a few times now—let's look at this from a fresh angle!").
   - Offer tailored follow-up options to clarify the concept, such as:
     * Using a real-world analogy or simplified diagram.
     * Generating a quick 2-question quiz or flashcards to test understanding.
     * Breaking the topic down into step-by-step plain language.
`;

    /**
     * 8. Initial model call
     */
    let response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: toolDefinitions }],
      },
    });

    const executedTools: Array<{ name: string; output: unknown }> = [];
    let toolCallCount = 0;

    /**
     * 9. Tool execution loop
     */
    while (response.functionCalls?.length && toolCallCount < MAX_TOOL_CALLS) {
      toolCallCount++;

      const modelContent = response.candidates?.[0]?.content;
      if (modelContent) {
        contents.push(modelContent);
      }

      const functionResponseParts: any[] = [];

      for (const call of response.functionCalls) {
        const toolName = call.name;
        if (!toolName) throw new Error("Function call missing tool name");

        const handler = (handlers as Record<string, Function>)[toolName];
        if (!handler) throw new Error(`No handler found for tool: ${toolName}`);
        console.log("[TOOL CALL]", toolName, call.args);
        const toolOutput = await handler(call.args ?? {});

        executedTools.push({
          name: toolName,
          output: toolOutput,
        });

        let toolEventType: MemoryEventType | null = null;
        if (toolName === "createNote") toolEventType = "NOTE_CREATED";
        if (toolName === "generateFlashcards")
          toolEventType = "FLASHCARD_CREATED";
        if (toolName === "generateQuiz") toolEventType = "QUIZ_WRONG";

        if (toolEventType) {
          waitUntil(
            recordTopicEvent({
              userId,
              documentId,
              rawQuery: safeMessage,
              event: toolEventType,
            }).catch((err: any) =>
              console.error("[tool-memory-event] Failed:", err),
            ),
          );
        }

        functionResponseParts.push({
          functionResponse: {
            name: toolName,
            response: { success: true, data: toolOutput },
          },
        });
      }

      contents.push({
        role: "user",
        parts: functionResponseParts,
      });

      contents.push({
        role: "user",
        parts: [
          {
            text: `
The tool execution has completed.
Analyze the results and provide a helpful response to the student.
Do not return raw tool output.
Only call another tool if absolutely necessary.
`,
          },
        ],
      });

      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: toolDefinitions }],
        },
      });
    }

    if (toolCallCount >= MAX_TOOL_CALLS) {
      throw new Error("Maximum tool call limit exceeded");
    }

    /**
     * 10. Final response fallback & storage
     */
    let replyText = response.text?.trim();

    if (!replyText) {
      const toolMessages = executedTools
        .map((tool: any) => tool.output?.message)
        .filter(Boolean);

      replyText =
        toolMessages.length > 0
          ? toolMessages.join("\n")
          : executedTools.length > 0
            ? "I completed the requested study action successfully."
            : "I processed your request, but no response was generated.";
    }

    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: "assistant",
        content: replyText,
      },
    });

    return NextResponse.json({ reply: replyText });
  } catch (error: any) {
    console.error("[chat-route] POST error", error);
    return NextResponse.json(
      { error: error?.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
