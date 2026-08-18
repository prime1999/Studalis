"use client";

import { useParams } from "next/navigation";
import { useDocumentStore } from "@/store/document-store";
import { useSessionStore } from "@/store/session-store";
import { useNote } from "@/lib/ReactQueries/useNote";
import NoteViewer from "@/components/dashboard/NoteViewer";

const Page = () => {
  const { setDocumentId } = useDocumentStore();
  const { setSessionId } = useSessionStore();
  const params = useParams();

  const noteId = params.noteId as string;
  const { data: notes, isPending } = useNote(noteId);

  if (isPending) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center">
        Loading...
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center">
        Note not found.
      </div>
    );
  }
  console.log({ notes });
  return <NoteViewer note={notes && notes.notes[0].content} />;
};

export default Page;
