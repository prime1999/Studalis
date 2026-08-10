import { create } from "zustand";

interface DocumentStore {
  documentId: string | null;
  setDocumentId: (id: string) => void;
}

export const useDocumentStore = create<DocumentStore>((set) => ({
  documentId: null,
  setDocumentId: (id) => set({ documentId: id }),
}));
