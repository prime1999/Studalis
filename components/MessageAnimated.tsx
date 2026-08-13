import * as React from "react";
import { cn } from "@/lib/utils";

interface MessageAnimatedProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  scrollAnchor?: boolean;
  messageId?: string;
}

export function MessageAnimated({
  children,
  scrollAnchor = false,
  className,
  ...props
}: MessageAnimatedProps) {
  return (
    <div
      data-scroll-anchor={scrollAnchor ? "true" : undefined}
      className={cn(
        "w-full transition-all duration-300 animate-in fade-in slide-in-from-bottom-2",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
