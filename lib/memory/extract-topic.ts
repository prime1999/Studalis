import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function extractStandardizedTopic(
  userQuery: string,
  existingTopics: string[] = [],
): Promise<string> {
  const prompt = `
Task: Extract or assign a high-level, standardized study topic for the following student request.

Student Request: "${userQuery}"

Rules:
1. Return ONLY a 1-3 word standardized subject/topic name (e.g., "Computer Networking", "Cell Biology", "Calculus").
2. Do NOT output individual sub-topics or micro-questions unless no broad subject applies.
${
  existingTopics.length > 0
    ? `3. Prefer matching one of these existing student topics if relevant: ${existingTopics.join(", ")}`
    : ""
}
4. Respond ONLY with valid JSON in this exact structure: {"topic": "Extracted Topic Name"}
`.trim();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim();
    if (!text) return "General Knowledge";

    const parsed = JSON.parse(text);
    return parsed.topic || "General Knowledge";
  } catch (error) {
    console.error("[extractStandardizedTopic] Error:", error);
    return "General Knowledge";
  }
}
