"use client";

import { useEffect, useRef } from "react";

const ChatScrollArea = ({ children }: { children: React.ReactNode }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {children}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatScrollArea;
