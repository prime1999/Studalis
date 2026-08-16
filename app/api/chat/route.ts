import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Content } from "@google/genai";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { toolDefinitions } from "@/lib/ai/tools/tool-definitions";
import { buildToolHandlers } from "@/lib/ai/tools";
import {
  buildStudyPrompt,
  StudyAction,
} from "@/lib/prompts/build-study-prompts";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MAX_TOOL_CALLS = 10;

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
        {
          error: "Missing message, documentId, or sessionId",
        },
        { status: 400 },
      );
    }

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    /**
     * Get latest conversation history
     */
    const recentMessages = await prisma.chatMessage.findMany({
      where: {
        sessionId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    recentMessages.reverse();

    /**
     * Build study prompt
     */
    const formattedUserPrompt = buildStudyPrompt({
      action,
      context,
      message,
    });

    /**
     * Build conversation contents
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
     * Save raw user message
     */
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: "user",
        content: message,
      },
    });

    /**
     * Tool handlers
     */
    const handlers = buildToolHandlers({
      userId,
      documentId,
    });

    /**
     * System instruction
     */
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

2. After every tool execution:
   - Analyze the result
   - Explain what you found
   - Explain what was created or retrieved

3. Note Creation & Navigation Links:
   - When calling 'createNote', if the result returns status "CREATED" or "ALREADY_EXISTS" with a "link" or "noteId" property, you MUST include a Markdown link so the user can navigate to it directly.
   - Format link explicitly as: [View Note](LINK_PROPERTY_VALUE)
   - Example when created: "I have created your note **'Photosynthesis'**. You can access it here: [View Note](/notes/clx123456)."
   - Example when already exists: "The note **'Photosynthesis'** already exists in your library. You can view it here: [View Note](/notes/clx123456)."

4. Never stop after calling a tool.

5. Never return only raw tool output.

6. Always provide a helpful response to the student.

7. Combine results from multiple tools into one coherent answer.

8. Follow formatting requirements from the current study action.

9. Prioritize document information when available.

10. If document information is insufficient, use general academic knowledge.

11. Be educational, supportive, and concise.
`;
    /**
     * Initial model call
     */
    let response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents,
      config: {
        systemInstruction,
        tools: [
          {
            functionDeclarations: toolDefinitions,
          },
        ],
      },
    });

    const executedTools: Array<{
      name: string;
      output: unknown;
    }> = [];

    let toolCallCount = 0;

    /**
     * Tool execution loop
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

        if (!toolName) {
          throw new Error("Function call missing tool name");
        }

        const handler = (handlers as Record<string, Function>)[toolName];

        if (!handler) {
          throw new Error(`No handler found for tool: ${toolName}`);
        }

        const toolOutput = await handler(call.args ?? {});

        executedTools.push({
          name: toolName,
          output: toolOutput,
        });

        functionResponseParts.push({
          functionResponse: {
            name: toolName,
            response: {
              success: true,
              data: toolOutput,
            },
          },
        });
      }

      contents.push({
        role: "user",
        parts: functionResponseParts,
      });

      /**
       * Force explanation after tool execution
       */
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
          tools: [
            {
              functionDeclarations: toolDefinitions,
            },
          ],
        },
      });
    }

    if (toolCallCount >= MAX_TOOL_CALLS) {
      throw new Error("Maximum tool call limit exceeded");
    }

    /**
     * Final response text
     */
    let replyText = response.text?.trim();

    /**
     * Fallback response
     */
    if (!replyText) {
      const toolMessages = executedTools
        .map((tool: any) => tool.output?.message)
        .filter(Boolean);

      if (toolMessages.length > 0) {
        replyText = toolMessages.join("\n");
      } else if (executedTools.length > 0) {
        replyText = "I completed the requested study action successfully.";
      } else {
        replyText = "I processed your request, but no response was generated.";
      }
    }

    /**
     * Save assistant message
     */
    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: "assistant",
        content: replyText,
      },
    });

    return NextResponse.json({
      reply: replyText,
    });
  } catch (error: any) {
    console.error("[chat-route] POST error", error);

    return NextResponse.json(
      {
        error: error?.message ?? "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}
