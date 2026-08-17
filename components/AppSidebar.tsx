"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { useNotes, useSessions } from "@/lib/ReactQueries/useSession";
import { useSessionStore } from "@/store/session-store";
import {
  BookOpen,
  FolderOpen,
  Settings,
  HelpCircle,
  LogOut,
  ChevronUp,
  Brain,
  CreditCard,
  FileIcon,
  MessageSquare,
  Clock,
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
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { useAllUserDocuments } from "@/lib/ReactQueries/getDocument";
import { useNoteStore } from "@/store/note-store";
import { useDocumentStore } from "@/store/document-store";

// Define interfaces for dynamic data
interface DocumentItem {
  id: string;
  title: string;
}

interface SessionItem {
  id: string;
  title: string;
}

const mainNavItems = [
  {
    title: "Study",
    url: "/dashboard",
    icon: BookOpen,
  },
  {
    title: "Documents",
    url: "/dashboard/documents",
    icon: FolderOpen,
  },
  {
    title: "Insights",
    url: "/insights",
    icon: CreditCard,
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
  const { isSignedIn, user } = useUser();
  const { data: documents } = useAllUserDocuments();
  const { data: sessions, isPending } = useSessions();
  const { data: notes, isPending: loadingNotes } = useNotes(
    useDocumentStore((state) => state.documentId) || "",
  );

  const { setSessionId } = useSessionStore();
  const { setNoteId } = useNoteStore();

  console.log({ notes });

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-black" />
          <span className="font-semibold font-voegies text-xl md:text-2xl tracking-widest group-data-[collapsible=icon]:hidden">
            Studalis
          </span>
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        {/* 1. Learn Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Learn
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive =
                  pathname === item.url || pathname.startsWith(`${item.url}/`);

                // Documents item with dynamic dropdown
                if (item.title === "Documents") {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <SidebarMenuButton
                            isActive={isActive}
                            tooltip={item.title}
                            className="w-full cursor-pointer"
                          >
                            <item.icon />
                            <span className="group-data-[collapsible=icon]:hidden">
                              {item.title}
                            </span>
                            {documents && documents.length > 0 && (
                              <span className="ml-auto w-5 h-5 flex items-center justify-center text-[10px] rounded-full bg-blue-700 text-white group-data-[collapsible=icon]:hidden">
                                {documents.length}
                              </span>
                            )}
                          </SidebarMenuButton>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          side="right"
                          align="start"
                          className="w-52 text-sm"
                        >
                          <DropdownMenuGroup>
                            {documents?.map((document: DocumentItem) => (
                              <DropdownMenuItem key={document.id}>
                                <Link
                                  href={`${item.url}/${document.id}`}
                                  className="flex items-center gap-2 text-xs w-full cursor-pointer"
                                >
                                  <FileIcon className="h-4 w-4 shrink-0" />
                                  <span className="truncate flex-1">
                                    {document.title}
                                  </span>
                                  <DropdownMenuShortcut>
                                    ⌘O
                                  </DropdownMenuShortcut>
                                </Link>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  );
                }

                // Standard navigation items
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

        <hr className="my-1 w-11/12 mx-auto" />

        {/* 2. Sessions Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Sessions
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dynamic Mapped Sessions */}
              {sessions?.map((session: any) => {
                const isSessionActive =
                  pathname === `/dashboard/sessions/${session.id}`;

                return (
                  <SidebarMenuItem key={session.id}>
                    <SidebarMenuButton
                      isActive={isSessionActive}
                      tooltip={session.title}
                      onClick={() => setSessionId(session.id)}
                    >
                      <Link
                        href={`/dashboard/sessions/${session.id}`}
                        className="flex items-center gap-2 text-xs"
                      >
                        <MessageSquare className="h-4 w-4 shrink-0" />
                        <span className="truncate group-data-[collapsible=icon]:hidden">
                          {session.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <hr className="my-1 w-11/12 mx-auto" />
        {/* 3. Notes Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Notes
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dynamic Mapped Sessions */}
              {notes?.notes?.map((note: any) => {
                const isNoteActive =
                  pathname === `/dashboard/sessions/${note.id}`;

                return (
                  <SidebarMenuItem key={note.id}>
                    <SidebarMenuButton
                      isActive={isNoteActive}
                      tooltip={note.title}
                      onClick={() => setNoteId(note.id)}
                    >
                      <Link
                        href={`/dashboard/sessions/${note.id}`}
                        className="flex items-center gap-2 text-xs"
                      >
                        <MessageSquare className="h-4 w-4 shrink-0" />
                        <span className="truncate group-data-[collapsible=icon]:hidden">
                          {note.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <hr className="my-1 w-11/12 mx-auto" />

        {/* 3. System Group */}
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
                      {isSignedIn ? user?.fullName : "Guest"}
                    </span>

                    <span className="truncate text-xs text-muted-foreground">
                      {isSignedIn
                        ? user?.emailAddresses?.[0]?.emailAddress
                        : ""}
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

                <DropdownMenuItem className="text-red-500 focus:bg-red-50 focus:text-red-600 cursor-pointer">
                  <SignOutButton>
                    <div className="flex items-center gap-2 w-full">
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </div>
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
