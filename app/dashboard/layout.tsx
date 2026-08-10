import { auth } from "@clerk/nextjs/server";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import StudyChatUI from "@/components/chat/StudyChatUI";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  // protect routes
  await auth.protect();
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="mx-auto p-2 flex min-h-svh w-full flex-1 flex-col md:w-10/12 lg:w-9/12">
        <SidebarTrigger />
        <div className="grid flex-1 min-h-0 grid-cols-1 gap-2 md:grid-cols-3">
          {children}
          <StudyChatUI />
        </div>
      </main>
    </SidebarProvider>
  );
};

export default Layout;
