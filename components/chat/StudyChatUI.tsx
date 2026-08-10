"use client";

import { useState } from "react";
import MessageList from "./MessageList";
import ChatScrollArea from "./ChatScrollArea";
import { useChatStore } from "@/store/chat-store";
import { useDocumentStore } from "@/store/document-store";
import { useSessionMessages } from "@/lib/ReactQueries/useSessionMessages";
import { useSessionStore } from "@/store/session-store";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const StudyChatUI = () => {
  const { documentId } = useDocumentStore();
  const { input, action, setInput, clear } = useChatStore();
  const { sessionId } = useSessionStore();
  const { data: sessionMessages } = useSessionMessages(sessionId ?? undefined);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isPending, setIsPending] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);

    setIsPending(true);

    try {
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

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      clear();
    } catch (error) {
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h2 className="font-semibold">Studalis</h2>
      </div>

      <ChatScrollArea>
        <MessageList messages={sessionMessages?.messages ?? []} />
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
            {isPending ? "Thinking..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudyChatUI;
