"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import MessageList from "./MessageList";
import ChatScrollArea from "./ChatScrollArea";
import { useChatStore } from "@/store/chat-store";
import { useDocumentStore } from "@/store/document-store";

const StudyChatUI = () => {
  const { documentId } = useDocumentStore();
  const { input, action, setInput, clear } = useChatStore();

  const { messages, status } = useChat();

  const isPending = status === "submitted" || status === "streaming";

  const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("here");
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documentId,
        message: input,
        action,
      }),
    });

    const data = await res.json();

    console.log(data.answer);

    clear();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b p-4">
        <h2 className="font-semibold">Studalis</h2>
      </div>

      <ChatScrollArea>
        <MessageList
          messages={messages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content:
              m.parts
                ?.filter((part) => part.type === "text")
                .map((part) => part.text)
                .join("") ?? "",
          }))}
        />
      </ChatScrollArea>

      <form onSubmit={sendMessage} className="border-t p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Studalis..."
            className="flex-1 rounded-md border px-3 py-2"
          />

          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudyChatUI;
