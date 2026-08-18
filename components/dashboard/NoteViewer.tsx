"use client";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface NoteViewerProps {
  note: string;
}

export default function NoteViewer({ note }: NoteViewerProps) {
  //   const [numPages, setNumPages] = useState<number>(0);
  //   const [pageNumber, setPageNumber] = useState(1);
  //   const [scale, setScale] = useState(1.0);

  return (
    <article className="w-1/2 mx-auto prose max-w-none">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {note}
      </ReactMarkdown>
    </article>
  );
}
