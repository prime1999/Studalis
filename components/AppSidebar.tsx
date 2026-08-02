"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
import {
  BookOpen,
  FolderOpen,
  MessageSquare,
  Settings,
  HelpCircle,
  LogOut,
  ChevronUp,
  Brain,
  CardSim,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";

const mainNavItems = [
  {
    title: "Study",
    url: "/dashboard",
    icon: BookOpen,
  },
  {
    title: "Library",
    url: "/library",
    icon: FolderOpen,
  },
  {
    title: "Cards",
    url: "/cards",
    icon: CardSim,
  },
  {
    title: "Sessions",
    url: "/sessions",
    icon: MessageSquare,
  },
];

const secondaryNavItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Support",
    url: "/support",
    icon: HelpCircle,
  },
];

const AppSidebar = () => {
  const pathname = usePathname();
  const { isLoaded, isSignedIn, user } = useUser();
  console.log("Current User:", user);

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6" color="black" />

          <span className="font-semibold font-voegies text-xl md:text-2xl tracking-widest group-data-[collapsible=icon]:hidden">
            Studalis
          </span>
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Learn
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive =
                  pathname === item.url || pathname.startsWith(`${item.url}/`);

                return (
                  <SidebarMenuItem key={item.title} className="mt-2">
                    <SidebarMenuButton isActive={isActive} tooltip={item.title}>
                      <Link href={item.url} className="flex items-center gap-2">
                        <item.icon />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <hr className="my-2 w-11/12 mx-auto" />
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            System
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => {
                const isActive =
                  pathname === item.url || pathname.startsWith(`${item.url}/`);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton isActive={isActive} tooltip={item.title}>
                      <Link href={item.url} className="flex items-center gap-2">
                        <item.icon />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <Image
                    src={
                      isSignedIn && user?.imageUrl
                        ? user.imageUrl
                        : "/images/avatar.jpg"
                    }
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />

                  <div className="flex flex-1 flex-col text-left text-sm group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">
                      {isSignedIn && user?.fullName}
                    </span>

                    <span className="truncate text-xs text-muted-foreground">
                      {isSignedIn && user?.emailAddresses?.[0]?.emailAddress}
                    </span>
                  </div>

                  <ChevronUp className="ml-auto h-4 w-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                align="start"
                className="min-w-56"
              >
                <DropdownMenuItem>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>

                <DropdownMenuItem className="text-red-500 hover:bg-red-50">
                  <SignOutButton>
                    <button className="flex items-center gap-2 w-full">
                      {" "}
                      <LogOut className="mr-2 h-4 w-4" />
                      Log Out
                    </button>
                  </SignOutButton>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
