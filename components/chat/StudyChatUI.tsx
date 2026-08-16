"use client";

import { useState } from "react";
import {
  ArrowUpIcon,
  RotateCwIcon,
  MessageCircleDashedIcon,
} from "lucide-react";

import MessageList from "./MessageList";
import { useChatStore } from "@/store/chat-store";
import { useDocumentStore } from "@/store/document-store";
import { useSessionMessages } from "@/lib/ReactQueries/useSessionMessages";
import { useSessionStore } from "@/store/session-store";
import MessageTurnTimeline from "./MessageTurnTimeline";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const StudyChatUI = () => {
  const { documentId } = useDocumentStore();
  const { input, action, setInput, clear } = useChatStore();
  const { sessionId } = useSessionStore();

  const { data: sessionMessages, isPending: loadingMessages } =
    useSessionMessages(sessionId ?? undefined);

  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isPending, setIsPending] = useState(false);

  const previousMessages: Message[] =
    sessionMessages?.messages?.map((message: any) => ({
      id: message.id,
      role: message.role as "user" | "assistant",
      content: message.content,
    })) ?? [];

  const allMessages = [...previousMessages, ...localMessages];

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isPending) return;

    const messageText = input;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageText,
    };

    setLocalMessages((prev) => [...prev, userMessage]);
    clear();
    setIsPending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          documentId,
          message: messageText,
          action,
        }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const data = await res.json();
      console.log({ data });

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply ?? "I couldn't generate a response.",
      };

      setLocalMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("CHAT ERROR:", error);
    } finally {
      setIsPending(false);
    }
  };

  const handleReset = () => {
    setLocalMessages([]);
    clear();
  };

  return (
    <MessageScrollerProvider>
      <Card className="flex h-full w-full flex-col gap-0 rounded-md border-none shadow-none">
        {/* Header */}
        <CardHeader className="flex-row items-center justify-between border-b px-4 py-3">
          <CardTitle className="text-base font-semibold">Studalis</CardTitle>
          <CardAction>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Reset local chat"
                    onClick={handleReset}
                    disabled={isPending}
                  >
                    <RotateCwIcon className="h-4 w-4" />
                  </Button>
                }
              />
              <TooltipContent>
                <p>Clear Local Chat</p>
              </TooltipContent>
            </Tooltip>
          </CardAction>
        </CardHeader>

        {/* Content Body / Scroll Container */}
        <CardContent className="relative flex-1 overflow-hidden p-0">
          {loadingMessages ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading conversation...
            </div>
          ) : allMessages.length === 0 ? (
            <Empty className="h-full">
              <EmptyHeader>
                <EmptyTitle>Welcome to Studalis!</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <MessageScroller>
              {/* 1. The Timeline Scrub Bar on the right */}
              <MessageTurnTimeline messages={allMessages} />

              {/* 2. The Chat Viewport */}
              <MessageScrollerViewport>
                <MessageScrollerContent aria-busy={isPending} className="p-4">
                  <MessageList messages={allMessages} isPending={isPending} />
                </MessageScrollerContent>
              </MessageScrollerViewport>

              <MessageScrollerButton />
            </MessageScroller>
          )}
        </CardContent>

        {/* Input Footer */}
        <CardFooter className="border-t p-4">
          <form onSubmit={sendMessage} className="w-full">
            <InputGroup>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !isPending) {
                      sendMessage(e);
                    }
                  }
                }}
                placeholder="Ask Studalis..."
                disabled={isPending}
                rows={1}
                className="min-h-[44px] flex-1 resize-none bg-transparent pl-1 pr-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
              />
              <InputGroupAddon align="block-end" className="p-1">
                <InputGroupButton
                  type="submit"
                  variant="default"
                  size="icon-sm"
                  disabled={!input.trim() || isPending}
                  className="ml-auto rounded-full cursor-pointer"
                >
                  <ArrowUpIcon className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </form>
        </CardFooter>
      </Card>
    </MessageScrollerProvider>
  );
};

export default StudyChatUI;
