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
     * 2. Fetch student memory context & flag high-repetition topics
     */
    const recentMemory = await prisma.topicMemory.findMany({
      where: { userId },
      select: {
        topic: true,
        lastInteractionType: true,
        studyCount: true,
      },
      orderBy: { lastStudiedAt: "desc" },
      take: 15,
    });

    const memoryBlock =
      recentMemory.length > 0
        ? `<student_learning_journey>\nLearner's Historic Context:\n${recentMemory
            .map((m) => {
              const count = m.studyCount || 1;
              const isStruggling = count >= 3;
              return `- Concept: "${m.topic}" | Times Encountered: ${count}${
                isStruggling ? " [HIGH REPETITION / POTENTIAL STRUGGLE]" : ""
              } | Last Event: ${m.lastInteractionType || "EXPLAIN"}`;
            })
            .join("\n")}\n</student_learning_journey>\n\n`
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
You are Studalis, an AI study companion designed around the learner's ongoing journey—not isolated, single-use interactions.

Your goal is to help students build deep conceptual understanding over time by acting as an intelligent partner that studies WITH them.

System Directives:
1. Review <student_learning_journey> to understand the user's ongoing context.
2. Bridge concepts naturally: If the user asks about a new concept that relates to or depends on a prerequisite topic in <student_learning_journey> (e.g., studying Trees after studying Recursion), connect the two explicitly.
3. Adapt tone to familiarity: If a user is revisiting a topic studied multiple times, build on prior knowledge rather than explaining basic definitions from scratch.
4. Do NOT explicitly list raw database metrics (e.g., avoid saying "According to my logs you studied this 3 times"). Weave memory smoothly into your teaching.
5. Be supportive, direct, encouraging, and pedagogically structured.

Proactive Support & Struggle Detection Rules:
- DETECTING CONFUSION: Look for signs that the student is having trouble (e.g., asking about the same concept multiple times in recent messages, expressing confusion, or if the concept in <student_learning_journey> is marked as [HIGH REPETITION / POTENTIAL STRUGGLE]).
- SUGGESTING NOTES: When confusion or repeated questions on a concept are detected, answer their question first, then proactively suggest creating a structured note for them.
  Example tone: "Since we've covered [Topic] from a couple of angles today, would you like me to generate a summary note breaking down the key points so you can review it easily later?"
- You may either ask them if they'd like a note created, or call the 'createNote' tool directly if it flows naturally in the conversation.

Tool Usage Rules:
1. Use tools whenever necessary to pull accurate content, create notes, or generate quizzes/flashcards.
2. After tool execution, synthesize and explain the results directly to the user.
3. Include Markdown links whenever notes are generated.
4. Never return unformatted raw tool responses.
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
Analyze the results and provide a helpful, connected educational response to the student.
Do not return raw tool output.
Only call another tool if strictly necessary.
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
