"use client";

import { useMessageScrollerVisibility } from "@/components/ui/message-scroller";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Message } from "./StudyChatUI";

interface TurnTimelineProps {
  messages: Message[];
}

export default function TurnTimeline({ messages }: TurnTimelineProps) {
  // Activate visibility observer to track active turns & visible messages
  const { currentAnchorId, visibleMessageIds } = useMessageScrollerVisibility();

  // Filter down to user prompt turns only
  const userMessages = messages.filter((m) => m.role === "user");

  // Don't render the timeline bar if there are fewer than 2 turns
  if (userMessages.length < 2) return null;

  const handleScrollToMessage = (id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <TooltipProvider>
      <aside className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2 rounded-full bg-background/60 p-1.5 backdrop-blur-md border border-border/50 shadow-sm">
        {userMessages.map((msg, index) => {
          // Check if this user turn is currently the active anchor OR visible on screen
          const isAnchored = msg.id === currentAnchorId;
          const isVisible = visibleMessageIds.includes(msg.id);

          return (
            <Tooltip key={msg.id}>
              <TooltipTrigger>
                <button
                  type="button"
                  onClick={() => handleScrollToMessage(msg.id)}
                  aria-label={`Scroll to question ${index + 1}`}
                  className="group relative flex h-5 w-5 items-center justify-center focus:outline-none"
                >
                  {/* The visual dash/pill */}
                  <span
                    className={cn(
                      "h-1 rounded-full transition-all duration-200",
                      isAnchored
                        ? "w-4 bg-primary shadow-sm"
                        : isVisible
                          ? "w-3 bg-primary/70"
                          : "w-2 bg-muted-foreground/30 group-hover:w-3.5 group-hover:bg-foreground/80",
                    )}
                  />
                </button>
              </TooltipTrigger>

              <TooltipContent
                side="left"
                align="center"
                className="max-w-[220px] text-xs font-normal shadow-md"
              >
                <span className="font-semibold text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">
                  Turn {index + 1}
                </span>
                <p className="line-clamp-2">{msg.content}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </aside>
    </TooltipProvider>
  );
}
