import { prisma } from "@/lib/prisma";
import { createEmbedding } from "../embeddings";

export async function searchSimilarChunks(
  question: string,
  documentId: string,
  limit: number,
) {
  const embedding = await createEmbedding(question);

  const vector = `[${embedding.join(",")}]`;

  const chunks = await prisma.$queryRawUnsafe(
    `
    SELECT
      id,
      "documentId",
      "pageNumber",
      "chunkIndex",
      content,
      embedding <=> $1::VECTOR AS distance
    FROM "DocumentChunk"
    WHERE "documentId" = $2
    ORDER BY embedding <=> $1::VECTOR
    LIMIT $3
    `,
    vector,
    documentId,
    limit,
  );

  return chunks;
}
