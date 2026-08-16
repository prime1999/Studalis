import { FunctionDeclaration, Type } from "@google/genai";

export const toolDefinitions: FunctionDeclaration[] = [
  // 1. Local Vector Search
  {
    name: "search_document_chunks",
    description:
      "Search vector embeddings from the active document for relevant study material and context.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description:
            "The search query or keywords to look up in the document.",
        },
      },
      required: ["query"],
    },
  },

  // 2. Note Creation (Prisma Write)
  {
    name: "createNote",
    description:
      "Create and save a study note derived from the current document or chat session.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "A short, descriptive title for the note.",
        },
        content: {
          type: Type.STRING,
          description: "The main body content or markdown text of the note.",
        },
      },
      required: ["title", "content"],
    },
  },

  // 3. User Notes Retrieval (Cockroach Cloud MCP Read)
  {
    name: "getUserNotes",
    description:
      "Fetch notes previously saved by the user for the current document.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.NUMBER,
          description: "Maximum number of notes to retrieve (default is 5).",
        },
      },
    },
  },
];
