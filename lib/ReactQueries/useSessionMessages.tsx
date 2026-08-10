"use client";

import { useQuery } from "@tanstack/react-query";

export function useSessionMessages(sessionId?: string) {
  return useQuery({
    queryKey: ["session-messages", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/sessions/${sessionId}/messages`);

      if (!res.ok) {
        throw new Error("Failed to fetch messages");
      }

      return res.json();
    },
    enabled: !!sessionId,
  });
}
