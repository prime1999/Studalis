import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { searchSimilarChunks } from "@/lib/retrieval/search-similar-chunks";
import { runManagedCockroachMcp } from "@/lib/mcp/cockroach-mcp";

const CreateNoteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(20000),
});

const GetNotesSchema = z.object({
  limit: z.number().min(1).max(20).default(5),
});

export function buildToolHandlers(context: {
  userId: string;
  documentId: string;
}) {
  return {
    // 1. Local Vector Search
    search_document_chunks: async (args: { query: string }) => {
      return await searchSimilarChunks(args.query, context.documentId, 5);
    },

    // 2. Note Creation (Checks for duplicates before write)
    createNote: async (rawArgs: unknown) => {
      const parsed = CreateNoteSchema.parse(rawArgs);

      // Check if note already exists in CockroachDB for this user & document
      const existingNote = await prisma.note.findFirst({
        where: {
          userId: context.userId,
          documentId: context.documentId,
          title: {
            equals: parsed.title,
            mode: "insensitive", // Case-insensitive title match
          },
        },
      });

      // Return ALREADY_EXISTS payload if note is found
      if (existingNote) {
        return {
          status: "ALREADY_EXISTS",
          success: true,
          noteId: existingNote.id,
          title: existingNote.title,
          link: `/notes/${existingNote.id}`,
          message: `The note "${existingNote.title}" already exists in your library.`,
        };
      }

      // Create new note if non-existent
      const note = await prisma.note.create({
        data: {
          userId: context.userId,
          documentId: context.documentId,
          title: parsed.title,
          content: parsed.content,
        },
      });

      return {
        status: "CREATED",
        success: true,
        noteId: note.id,
        title: note.title,
        link: `/notes/${note.id}`,
        message: `Note "${note.title}" created successfully.`,
      };
    },

    // 3. User Notes Retrieval (Cockroach Cloud Managed MCP select_query)
    getUserNotes: async (rawArgs: unknown) => {
      const parsed = GetNotesSchema.parse(rawArgs);

      const safeSql = `
        SELECT id, title, content, "createdAt"
        FROM "Note"
        WHERE "userId" = '${context.userId}'
          AND "documentId" = '${context.documentId}'
        ORDER BY "createdAt" DESC
        LIMIT ${parsed.limit};
      `;

      const mcpResult = await runManagedCockroachMcp("select_query", {
        cluster_id: process.env.COCKROACH_CLUSTER_ID!,
        database: process.env.COCKROACH_DATABASE_NAME || "studalis",
        query: safeSql,
      });

      return mcpResult;
    },
  };
}
