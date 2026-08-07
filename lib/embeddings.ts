import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

export async function createEmbedding(text: string): Promise<any> {
  const result = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });

  // embedContent returns result.embedding or result.embeddings[0]
  const embedding = result.embeddings ?? result.embeddings?.[0];

  return embedding?.[0]?.values ?? [];
}
