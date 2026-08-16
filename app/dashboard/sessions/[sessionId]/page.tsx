"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useDocument, useDocumentUrl } from "@/lib/ReactQueries/getDocument";
import { useSession } from "@/lib/ReactQueries/useSession";
import { useDocumentStore } from "@/store/document-store";
import { useSessionStore } from "@/store/session-store";

const PdfViewer = dynamic(() => import("@/components/dashboard/PdfViewer"), {
  ssr: false,
});

const Page = () => {
  const { setDocumentId } = useDocumentStore();
  const { setSessionId } = useSessionStore();
  const params = useParams();

  const sessionId = params.sessionId as string;
  const { data: session, isPending } = useSession(sessionId);
  const documentId = session?.documentId as string | undefined;

  const { data: document, isPending: loadingDocument } = useDocument(
    documentId ?? "",
  );

  const { data: pdfUrl, isPending: loadingPdf } = useDocumentUrl(
    documentId ?? "",
  );

  useEffect(() => {
    if (document?.id) {
      setDocumentId(document.id);
    }
    if (session?.id) {
      setSessionId(session.id);
    }
  }, [document?.id, session?.id, setDocumentId, setSessionId]);

  if (isPending || loadingDocument || loadingPdf) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!session || !document || !pdfUrl) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center">
        Session not found.
      </div>
    );
  }

  return (
    <PdfViewer
      file={{
        id: document.id,
        key: document.pdfKey,
        fileName: document.title,
        fileUrl: pdfUrl.url,
      }}
    />
  );
};

export default Page;
