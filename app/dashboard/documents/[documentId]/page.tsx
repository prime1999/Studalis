"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useDocument } from "@/lib/ReactQueries/getDocument";
import { useDocumentUrl } from "@/lib/ReactQueries/getDocument";
//import PdfViewer from "@/components/dashboard/PdfViewer";

const PdfViewer = dynamic(() => import("@/components/dashboard/PdfViewer"), {
  ssr: false,
});

export default function Page() {
  const params = useParams();

  const documentId = params.documentId as string;

  const { data: document, isPending: loadingDocument } = useDocument(
    documentId as string,
  );

  const { data: pdfUrl, isPending: loadingPdf } = useDocumentUrl(
    documentId as string,
  );

  if (loadingDocument || loadingPdf) {
    return <div>Loading...</div>;
  }

  return (
    <main>
      <PdfViewer
        file={{
          key: document.pdfKey,
          fileName: document.title,
          fileUrl: pdfUrl.url,
        }}
      />
    </main>
  );
}
