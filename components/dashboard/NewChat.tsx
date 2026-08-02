import ChatInput from "./ChatInput";

const NewChat = () => {
  return (
    <main className="w-full h-screen flex items-center justify-center">
      <div className="w-full h-full text-2xl font-bold flex justify-center">
        <div className="relative w-11/12 mx-auto">
          {" "}
          NewChat
          <div></div>
          <ChatInput />
        </div>
      </div>
    </main>
  );
};

export default NewChat;
