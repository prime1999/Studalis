"use client";

import { useEffect, useState } from "react";
import { pdfjs, Document, Page } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { useExplainHighlight } from "@/lib/sessions/interaction";
import { useChatStore } from "@/store/chat-store";
import {
  ChevronUp,
  ChevronDown,
  Square,
  MinusCircle,
  PlusCircle,
  Maximize2,
  MoreHorizontal,
} from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfFile {
  id: string;
  key: string;
  fileName: string;
  fileUrl: string;
}

interface PdfViewerProps {
  file: PdfFile;
}

export default function PdfViewer({ file }: PdfViewerProps) {
  const { setInput, setAction } = useChatStore();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [selectedText, setSelectedText] = useState("");
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const explainHighlightMutation = useExplainHighlight();

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
    setInput(`Explain this concept:\n\n${selectedText}`.trim());
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col items-center justify-start overflow-y-auto">
      {/* PDF Canvas Container */}
      <div className="relative my-auto flex items-center justify-center rounded-md bg-white transition-all duration-200">
        <Document
          file={file.fileUrl}
          loading={
            <div className="p-10 text-sm text-zinc-400">Loading PDF...</div>
          }
          error={
            <div className="p-10 text-sm text-red-400">Failed to load PDF</div>
          }
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages);
            setPageNumber(1);
          }}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer
            renderAnnotationLayer
          />
        </Document>
      </div>

      {/* Text Highlight Floating Menu */}
      {selectedText && (
        <div
          className="fixed z-50 rounded-lg border p-1 shadow-xl"
          style={{
            left: menuPosition.x,
            top: menuPosition.y - 45,
            transform: "translateX(-50%)",
          }}
        >
          <button
            onClick={handleExplain}
            className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-blue-500 cursor-pointer"
          >
            Explain
          </button>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-zinc-800 bg-[#1e1e22]/90 px-4 py-2.5 text-zinc-400 shadow-2xl backdrop-blur-md">
        <button
          className="hover:text-white transition cursor-pointer"
          title="Sidebar / Layout"
        >
          <Square className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-zinc-700/60" />

        <button
          onClick={() => setPageNumber((p) => Math.max(p - 1, 1))}
          disabled={pageNumber <= 1}
          className="hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition cursor-pointer"
          title="Previous Page"
        >
          <ChevronUp className="h-4 w-4" />
        </button>

        <span className="text-xs font-medium text-zinc-200 min-w-[32px] text-center select-none">
          {pageNumber} / {numPages || 1}
        </span>

        <button
          onClick={() => setPageNumber((p) => Math.min(p + 1, numPages))}
          disabled={pageNumber >= numPages}
          className="hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition cursor-pointer"
          title="Next Page"
        >
          <ChevronDown className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-zinc-700/60" />

        <button
          onClick={() => setScale((s) => Math.max(s - 0.1, 0.5))}
          className="hover:text-white transition cursor-pointer"
          title="Zoom Out"
        >
          <MinusCircle className="h-4 w-4" />
        </button>

        <button
          onClick={() => setScale((s) => Math.min(s + 0.1, 2.0))}
          className="hover:text-white transition cursor-pointer"
          title="Zoom In"
        >
          <PlusCircle className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-zinc-700/60" />

        <button
          className="hover:text-white transition cursor-pointer"
          title="Fullscreen"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        <button
          className="hover:text-white transition cursor-pointer"
          title="More Options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
