import { loadEnvConfig } from "@next/env";
import { searchSimilarChunks } from "./retrieval/search-similar-chunks";

// 1. Tell Next.js to load your .env / .env.local files FIRST
const projectDir = process.cwd();
loadEnvConfig(projectDir);

// 2. Dynamically import your embedding function AFTER env variables are loaded
async function main() {
  console.log("API KEY LOADED:", process.env.GEMINI_API_KEY ? "YES" : "NO");

  const { createEmbedding } = await import("@/lib/embeddings");

  try {
    const embedding = await createEmbedding(
      "To code and making 10+ commits on GitHub",
    );
    console.log("Vector dimensions:", embedding.length);
    console.log(
      "First 100 characters of the embedding:",
      JSON.stringify(embedding).slice(0, 100),
    );
    const chunks = await searchSimilarChunks(
      "To code and making 10+ commits on GitHub",
      "cmsi8e1kb0000n0vh112xex8m",
    );
    console.log(JSON.stringify(chunks, null, 2));
  } catch (err) {
    console.error("Error generating embedding:", err);
  }
}

main();
