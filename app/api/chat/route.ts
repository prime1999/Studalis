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
const MAX_MESSAGE_CHARACTERS = 3000;

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
     * 1. Fetch latest conversation history
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
     * 2. Fetch recent TopicMemory including exact study counts
     */
    const recentMemory = await prisma.topicMemory.findMany({
      where: { userId },
      select: {
        topic: true,
        lastInteractionType: true,
        studyCount: true,
      },
      orderBy: { lastStudiedAt: "desc" },
      take: 5,
    });

    const memoryBlock =
      recentMemory.length > 0
        ? `<student_memory>\nStudent Study History:\n${recentMemory
            .map(
              (m) =>
                `- Topic: "${m.topic}" | Times studied: ${m.studyCount || 1} | Last event: ${m.lastInteractionType || "EXPLAIN"}`,
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
1. Check the <student_memory> block provided in the user prompt.
2. STRICT RULE: ONLY acknowledge past study sessions if the SPECIFIC topic the student is CURRENTLY asking about exists in <student_memory> AND has a "Times studied" count of 2 or more.
3. If the current question is about a new topic, or a topic with fewer than 2 study events, respond directly to the question WITHOUT mentioning past questions or previous study history.
4. DO NOT make generic comments like "I notice you've been asking about general concepts". Be direct and focus strictly on the specific topic requested.
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

        const toolArgs = (call.args as Record<string, any>) ?? {};
        const toolOutput = await handler(toolArgs);

        executedTools.push({
          name: toolName,
          output: toolOutput,
        });

        let toolEventType: MemoryEventType | null = null;
        if (toolName === "createNote") toolEventType = "NOTE_CREATED";
        if (toolName === "generateFlashcards")
          toolEventType = "FLASHCARD_CREATED";
        if (toolName === "generateQuiz") toolEventType = "QUIZ_GENERATED";

        if (toolEventType) {
          const extractedSubject =
            toolArgs.topic ||
            toolArgs.title ||
            toolArgs.subject ||
            context ||
            safeMessage;

          waitUntil(
            recordTopicEvent({
              userId,
              documentId,
              rawQuery: extractedSubject,
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
