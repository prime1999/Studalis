import { auth } from "@clerk/nextjs/server";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  // protect routes
  await auth.protect();
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full md:w-10/12 lg:w-9/12 mx-auto h-screen">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
};

export default Layout;
