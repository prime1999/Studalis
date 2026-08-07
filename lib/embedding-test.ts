import { loadEnvConfig } from "@next/env";

// 1. Tell Next.js to load your .env / .env.local files FIRST
const projectDir = process.cwd();
loadEnvConfig(projectDir);

// 2. Dynamically import your embedding function AFTER env variables are loaded
async function main() {
  console.log("API KEY LOADED:", process.env.GEMINI_API_KEY ? "YES" : "NO");

  const { createEmbedding } = await import("@/lib/embeddings");

  try {
    const embedding = await createEmbedding(
      "Process Scheduling is a technique used by operating systems.",
    );
    console.log("Vector dimensions:", embedding.length);
    console.log(
      "First 100 characters of the embedding:",
      JSON.stringify(embedding).slice(0, 100),
    );
  } catch (err) {
    console.error("Error generating embedding:", err);
  }
}

main();
