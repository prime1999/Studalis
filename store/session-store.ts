import { create } from "zustand";

interface SessionStore {
  sessionId: string | null;

  setSessionId: (sessionId: string) => void;

  clearSession: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionId: null,

  setSessionId: (sessionId) =>
    set({
      sessionId,
    }),

  clearSession: () =>
    set({
      sessionId: null,
    }),
}));
