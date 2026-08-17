import { auth } from "@clerk/nextjs/server";
import StudyChatUI from "@/components/chat/StudyChatUI";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  // protect routes
  await auth.protect();

  return (
    <>
      {/* 3-Column Grid Container */}
      <div className="grid flex-1 w-full min-h-0 grid-cols-1 gap-2 md:grid-cols-3">
        {/* Main Content Area (Spans 2 columns on desktop) */}
        <div className="md:col-span-2 flex flex-col min-h-0 h-full">
          {children}
        </div>

        {/* Chat Sidebar Area (Takes 1 column on desktop) */}
        <div className="md:col-span-1 flex flex-col min-h-0 h-full">
          <StudyChatUI />
        </div>
      </div>
    </>
  );
};

export default Layout;
