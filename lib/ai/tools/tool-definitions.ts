export const toolDefinitions = [
  {
    name: "search_document_chunks",

    description: "Retrieve relevant document chunks for a question.",

    parameters: {
      type: "object",

      properties: {
        documentId: {
          type: "string",
        },

        query: {
          type: "string",
        },
      },

      required: ["documentId", "query"],
    },
  },
];
