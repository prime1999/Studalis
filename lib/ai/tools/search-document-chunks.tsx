import { searchSimilarChunks } from "../../retrieval/search-similar-chunks";

export async function searchDocumentChunks(documentId: string, query: string) {
  const chunks = await searchSimilarChunks(query, documentId, 5);

  return chunks;
}
