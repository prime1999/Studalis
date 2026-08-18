"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useDocument } from "@/lib/ReactQueries/getDocument";
import { useDocumentStore } from "@/store/document-store";
import { useSessionStore } from "@/store/session-store";
import { useNote } from "@/lib/ReactQueries/useNote";
import NoteViewer from "@/components/dashboard/NoteViewer";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css"; // Standard LaTeX math styling

const Page = () => {
  const { setDocumentId } = useDocumentStore();
  const { setSessionId } = useSessionStore();
  const params = useParams();

  const noteId = params.noteId as string;
  const { data: notes, isPending } = useNote(noteId);
  // const documentId = notes[0]?.documentId as string | undefined;

  //   const { data: document, isPending: loadingDocument } = useDocument(
  //     documentId ?? "",
  //   );

  //   useEffect(() => {
  //     if (document?.id) {
  //       setDocumentId(document.id);
  //     }
  //     if (notes[0]?.sessionId) {
  //       setSessionId(notes[0].sessionId);
  //     }
  //   }, [document?.id, notes[0]?.sessionId, setDocumentId, setSessionId]);

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
