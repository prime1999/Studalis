import { create } from "zustand";

interface ChatStore {
  input: string;
  action: "CHAT" | "EXPLAIN" | "NOTE" | "FLASHCARD" | "QUIZ" | "SUMMARY";

  setInput: (value: string) => void;

  setAction: (
    action: "CHAT" | "EXPLAIN" | "NOTE" | "FLASHCARD" | "QUIZ" | "SUMMARY",
  ) => void;

  clear: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  input: "",
  action: "CHAT",

  setInput: (input) => set({ input }),

  setAction: (action) => set({ action }),

  clear: () =>
    set({
      input: "",
      action: "CHAT",
    }),
}));
