import { useQuery, useMutation } from "@tanstack/react-query";

// ---------------------- HELPER FUNCTIONS ---------------------- //
const getSession = async (sessionId: string) => {
  const res = await fetch(`/api/sessions/${sessionId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch session");
  }

  return res.json();
};

const createSession = async ({
  documentId,
  title,
}: {
  documentId: string;
  title?: string;
}) => {
  const res = await fetch("/api/sessions/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      documentId,
      title,
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

const getSessions = async () => {
  const res = await fetch("/api/sessions");

  if (!res.ok) {
    throw new Error("Failed to load sessions");
  }

  return res.json();
};

//-------------------------------- HOOKS -------------------------//
export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => getSession(sessionId),
    enabled: !!sessionId,
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

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: getSessions,
  });
}
