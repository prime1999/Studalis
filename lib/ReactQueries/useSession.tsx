import { useQuery, useMutation } from "@tanstack/react-query";

// ---------------------- HELPER FUNCTIONS ---------------------- //
const getSession = async (documentId: string) => {
  const res = await fetch(`/api/sessions/${documentId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch session");
  }

  return res.json();
};

const createSession = async (documentId: string) => {
  const res = await fetch("/api/sessions/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      documentId,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to create session");
  }

  return res.json();
};

const updateCurrentPage = async ({
  sessionId,
  currentPage,
}: {
  sessionId: string;
  currentPage: number;
}) => {
  const res = await fetch(`/api/sessions/${sessionId}/page`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      currentPage,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to update page");
  }

  return res.json();
};

//-------------------------------- HOOKS -------------------------//
export function useSession(documentId: string) {
  return useQuery({
    queryKey: ["session", documentId],
    queryFn: () => getSession(documentId),
    enabled: !!documentId,
  });
}

export function useCreateSession() {
  return useMutation({
    mutationFn: createSession,
  });
}

export function useUpdateCurrentPage() {
  return useMutation({
    mutationFn: updateCurrentPage,
  });
}
