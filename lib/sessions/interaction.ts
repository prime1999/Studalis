import { useMutation } from "@tanstack/react-query";

// ------------------------------ Helper Functions --------------------------------- //
const explainHighlight = async ({
  documentId,
  question,
}: {
  documentId: string;
  question: string;
}) => {
  const res = await fetch("/api/explain", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      documentId,
      question,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to explain highlight");
  }

  return res.json();
};

// ------------------------------ Hooks --------------------------------- //
export function useExplainHighlight() {
  return useMutation({
    mutationFn: explainHighlight,
  });
}
