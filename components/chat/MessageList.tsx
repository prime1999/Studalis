import AIMessage from "./AIMessage";
import { MessageAnimated } from "@/components/MessageAnimated";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type MessageListProps = {
  messages: Message[];
  isPending?: boolean;
};

const MessageList = ({ messages, isPending }: MessageListProps) => {
  return (
    <div className="flex flex-col gap-5 pr-6">
      {" "}
      {/* Added right padding so text doesn't overlap timeline */}
      {messages.map((message) => {
        if (message.role === "user") {
          return (
            <div id={`msg-${message.id}`} key={message.id}>
              <MessageAnimated messageId={message.id} scrollAnchor={true}>
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-primary-foreground shadow-sm">
                    {message.content}
                  </div>
                </div>
              </MessageAnimated>
            </div>
          );
        }

        return (
          <div id={`msg-${message.id}`} key={message.id}>
            <MessageAnimated messageId={message.id} scrollAnchor={false}>
              <div className="flex justify-start">
                <div className="max-w-[92%] text-sm">
                  <AIMessage content={message.content} />
                </div>
              </div>
            </MessageAnimated>
          </div>
        );
      })}
      {isPending && (
        <div className="flex justify-start">
          <div className="text-xs italic text-muted-foreground animate-pulse">
            Studalis is thinking...
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
