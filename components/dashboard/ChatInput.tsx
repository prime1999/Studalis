"use client";

import { useRef, useState } from "react";
import { Plus, ArrowUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const ChatInput = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    key: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
  } | null>(null);

  const handleClick = () => {
    console.log("clicked");
    console.log(fileInputRef.current);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("file1");
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      console.log("file2");
      // Optional validation
      if (file.type !== "application/pdf") {
        throw new Error("Only PDF files are allowed");
      }
      console.log("file3");
      // Get presigned URL
      const res = await fetch("/api/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
        }),
      });
      console.log("file4");
      if (!res.ok) {
        throw new Error("Failed to get upload URL");
      }
      console.log("file5");
      const { uploadUrl, key } = await res.json();
      console.log("file6");
      // Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });
      console.log("file7");
      if (!uploadRes.ok) {
        console.error("Error uploading file:");
        throw new Error("Failed to upload file");
      }

      console.log("Upload successful");
      console.log("S3 Key:", key);
      setUploadedFile({
        key,
        fileName: file.name,
        fileType: file.type,
        fileUrl: uploadUrl,
      });

      // Later:
      // await fetch("/api/process-pdf", {
      //   method: "POST",
      //   body: JSON.stringify({ key }),
      // });
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      // Allows uploading the same file again
      e.target.value = "";
    }
  };
  return (
    <main className="absolute bottom-10 w-full rounded-lg">
      <textarea
        placeholder="Let's start learning..."
        className="w-full h-24 p-4 font-normal text-sm text-black/90 border rounded-lg focus:outline-none"
      />
      {/* dropdown menu */}
      <div className="flex justify-between items-center mt-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                className="flex items-center gap-1 h-8 p-2 rounded-full cursor-pointer"
              >
                <Plus className="h-4 w-4" />{" "}
                <p className="text-xs">Add content</p>
              </Button>
            }
          />
          <DropdownMenuContent className="w-40" align="start">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Files</DropdownMenuLabel>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  handleClick();
                }}
              >
                PDF files
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer">
                Video files
                <DropdownMenuShortcut>⇧⌘V</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Audio files
                <DropdownMenuShortcut>⇧⌘A</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Image files
                <DropdownMenuShortcut>⇧⌘I</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        <button className="bg-blue-500 text-white rounded-full p-2 cursor-pointer duration-500 transition hover:bg-blue-600">
          <ArrowUp size={20} color="white" />
        </button>
      </div>
    </main>
  );
};

export default ChatInput;
