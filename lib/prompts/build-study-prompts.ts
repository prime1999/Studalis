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
  const contextBlock = context.trim()
    ? `<context>\n${context.trim()}\n</context>`
    : "No document context was provided.";

  const requestBlock = `
<student_request>
${message.trim()}
</student_request>
`;

  switch (action) {
    case "EXPLAIN":
      return `
You are Studalis, an AI study companion.

${contextBlock}

${requestBlock}

Instructions:
- Explain the requested concept clearly.
- Break the explanation into logical steps.
- Use examples when helpful.
- Assume the student is learning this for the first time.
- Use the document context whenever possible.
- If the context is insufficient, use general academic knowledge.
`.trim();

    case "NOTE":
      return `
You are Studalis, an AI study companion.

${contextBlock}

${requestBlock}

Instructions:
- Create structured study notes.
- Use Markdown formatting.
- Focus on key concepts.
- Use bullet points where appropriate.
- Avoid unnecessary filler text.
`.trim();

    case "FLASHCARD":
      return `
You are Studalis, an AI study companion.

${contextBlock}

${requestBlock}

Instructions:
Generate exactly ONE flashcard.

Format:

Question:
...

Answer:
...
`.trim();

    case "QUIZ":
      return `
You are Studalis, an AI study companion.

${contextBlock}

${requestBlock}

Instructions:
Generate exactly ONE multiple-choice question.

Format:

Question:
...

A) ...
B) ...
C) ...
D) ...

Correct Answer:
...

Explanation:
...
`.trim();

    case "SUMMARY":
      return `
You are Studalis, an AI study companion.

${contextBlock}

${requestBlock}

Instructions:
- Summarize the content.
- Maximum 5 bullet points.
- Focus on the most important ideas.
`.trim();

    case "CHAT":
    default:
      return `
You are Studalis, an AI study companion.

${contextBlock}

${requestBlock}

Instructions:
- Respond naturally.
- Act like a study mentor.
- Use the document context whenever relevant.
- If context is insufficient, rely on general knowledge.
`.trim();
  }
}
