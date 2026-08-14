export type StudyAction =
  | "CHAT"
  | "EXPLAIN"
  | "NOTE"
  | "FLASHCARD"
  | "QUIZ"
  | "SUMMARY";

interface BuildPromptProps {
  action: StudyAction;
  context?: string;
  message: string;
}

export function buildStudyPrompt({
  action,
  context = "",
  message,
}: BuildPromptProps): string {
  const hasContext = Boolean(context.trim());

  const contextBlock = hasContext
    ? `<context>\n${context.trim()}\n</context>`
    : "No document context was provided.";

  const requestBlock = `
<student_request>
${message.trim()}
</student_request>
`.trim();

  // Common Persona & Base Context
  const systemHeader = ` You are Studalis, an empathetic and highly effective AI study companion.`;

  switch (action) {
    case "EXPLAIN":
      return `
${systemHeader}

${contextBlock}

${requestBlock}

### Instructions:
- Explain the requested concept clearly and breaking it down into logical steps.
- Use real-world examples or analogies where helpful.
- Assume the student is learning this for the first time.
- Base your explanation primarily on the document context. If context is insufficient or absent, draw from general academic knowledge.
`.trim();

    case "NOTE":
      return `
${systemHeader}

${contextBlock}

${requestBlock}

### Instructions:
- Create structured, highly readable study notes based on the request/context.
- Use clean Markdown headers (##, ###), bullet points, and bold text for key terms.
- Avoid conversational filler; deliver purely educational content.
`.trim();

    case "FLASHCARD":
      return `
${systemHeader}

${contextBlock}

${requestBlock}

### Instructions:
Generate exactly ONE flashcard based on the request or context.
Do NOT include conversational preamble like "Here is your flashcard:".

Output strictly in this format:

Front:
[Clear, specific question or concept]

Back:
[Concise, accurate answer or explanation]
`.trim();

    case "QUIZ":
      return `
${systemHeader}

${contextBlock}

${requestBlock}

### Instructions:
Generate exactly ONE multiple-choice question based on the request or context.
Do NOT include conversational intro text.

Output strictly in this format:

Question:
[Question text]

A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

Correct Answer: [Letter]

Explanation:
[Brief explanation of why the correct answer is right]
`.trim();

    case "SUMMARY":
      return `
${systemHeader}

${contextBlock}

${requestBlock}

### Instructions:
- Summarize the main points from the document context or topic requested.
- Provide a maximum of 5 bullet points.
- Focus strictly on high-impact core ideas and key takeaways.
`.trim();

    case "CHAT":
    default:
      return `
${systemHeader}

${contextBlock}

${requestBlock}

### Instructions:
- Respond naturally, supportively, and concisely like an expert tutor.
- Use the document context whenever relevant.
- If the student asks something outside the provided document context, answer using general academic knowledge.
`.trim();
  }
}
