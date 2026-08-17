import { auth } from "@clerk/nextjs/server";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  // protect routes
  await auth.protect();

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="mx-auto p-2 flex min-h-svh w-full flex-1 flex-col md:w-10/12 lg:w-9/12">
        <SidebarTrigger />

        {/* 3-Column Grid Container */}
        <div className="flex-1 w-full min-h-0">
          {/* Main Content Area (Spans 2 columns on desktop) */}
          <div className="md:col-span-2 flex flex-col min-h-0 h-full">
            {children}
          </div>
        </div>
      </main>
    </SidebarProvider>
  );
};

export default Layout;
