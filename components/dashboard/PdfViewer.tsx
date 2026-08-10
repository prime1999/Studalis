"use client";

import { useEffect, useState } from "react";
import { pdfjs, Document, Page } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { useExplainHighlight } from "@/lib/sessions/interaction";
import { useChatStore } from "@/store/chat-store";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfFile {
  id: string;
  key: string;
  fileName: string;
  fileUrl: string;
}

interface PdfViewerProps {
  file: PdfFile;
  //onPageChange?: (page: number) => void;
}

export default function PdfViewer({ file }: PdfViewerProps) {
  const { setInput, setAction } = useChatStore();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedText, setSelectedText] = useState("");
  const [menuPosition, setMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const explainHighlightMutation = useExplainHighlight();

  //   useEffect(() => {
  //   onPageChange?.(pageNumber);
  // }, [pageNumber, onPageChange]);

  useEffect(() => {
    const handleSelection = () => {
      setTimeout(() => {
        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
          setSelectedText("");
          return;
        }

        const text = selection.toString().trim();

        if (!text) {
          setSelectedText("");
          return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setSelectedText(text);

        setMenuPosition({
          x: rect.left + rect.width / 2,
          y: rect.top,
        });
      }, 0);
    };

    document.addEventListener("mouseup", handleSelection);

    return () => {
      document.removeEventListener("mouseup", handleSelection);
    };
  }, []);

  const handleExplain = () => {
    setAction("EXPLAIN");

    setInput(
      `
Explain this concept:

${selectedText}
  `.trim(),
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setPageNumber((p) => Math.max(p - 1, 1))}
          disabled={pageNumber === 1}
        >
          Previous
        </button>

        <span>
          Page {pageNumber} of {numPages}
        </span>

        <button
          onClick={() => setPageNumber((p) => Math.min(p + 1, numPages))}
          disabled={pageNumber === numPages}
        >
          Next
        </button>
      </div>

      <Document
        file={file.fileUrl}
        loading={<div>Loading PDF...</div>}
        error={<div>Failed to load PDF</div>}
        onLoadSuccess={({ numPages }) => {
          setNumPages(numPages);
          setPageNumber(1);
        }}
      >
        <Page pageNumber={pageNumber} renderTextLayer renderAnnotationLayer />
      </Document>
      {selectedText && (
        <div
          className="fixed z-50 rounded-lg border bg-white shadow-lg"
          style={{
            left: menuPosition.x,
            top: menuPosition.y - 50,
            transform: "translateX(-50%)",
          }}
        >
          <button
            onClick={handleExplain}
            className="px-3 py-1 text-xs cursor-pointer bg-blue-300 rounded-lg duration-500 transition hover:bg-blue-400"
          >
            Explain
          </button>
        </div>
      )}
    </div>
  );
}
