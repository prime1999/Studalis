import { create } from "zustand";

interface NoteStore {
  noteId: string | null;

  setNoteId: (noteId: string) => void;

  clearNote: () => void;
}

export const useNoteStore = create<NoteStore>((set) => ({
  noteId: null,

  setNoteId: (noteId) =>
    set({
      noteId,
    }),

  clearNote: () =>
    set({
      noteId: null,
    }),
}));
