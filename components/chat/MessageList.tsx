import AIMessage from "./AIMessage";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type MessageListProps = {
  messages: Message[];
};

const MessageList = ({ messages }: MessageListProps) => {
  return (
    <div className="flex flex-col gap-5 p-4">
      {messages.map((message) => {
        if (message.role === "user") {
          return (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-md bg-black px-4 py-3 text-sm text-white">
                {message.content}
              </div>
            </div>
          );
        }

        return (
          <div key={message.id} className="flex justify-start">
            <div className="max-w-[90%] text-sm">
              <AIMessage content={message.content} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;
