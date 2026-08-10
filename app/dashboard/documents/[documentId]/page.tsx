"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useDocument, useDocumentUrl } from "@/lib/ReactQueries/getDocument";
import { useSession } from "@/lib/ReactQueries/useSession";
import { useDocumentStore } from "@/store/document-store";

const PdfViewer = dynamic(() => import("@/components/dashboard/PdfViewer"), {
  ssr: false,
});

export default function Page() {
  const { setDocumentId } = useDocumentStore();
  const params = useParams();

  const documentId = params.documentId as string;

  const { data: document, isPending: loadingDocument } = useDocument(
    documentId as string,
  );

  const { data: pdfUrl, isPending: loadingPdf } = useDocumentUrl(
    documentId as string,
  );

  const { data: session } = useSession(documentId);

  console.log(session);

  useEffect(() => {
    if (document?.id) {
      setDocumentId(document.id);
    }
  }, [document?.id, setDocumentId]);

  if (loadingDocument || loadingPdf) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <main className="col-span-2 flex h-full min-h-0 flex-col">
      <PdfViewer
        file={{
          id: document.id,
          key: document.pdfKey,
          fileName: document.title,
          fileUrl: pdfUrl.url,
        }}
      />
    </main>
  );
}
