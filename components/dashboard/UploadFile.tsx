"use client";

import { useRef, useState } from "react";
//import { Plus, ArrowUp } from "lucide-react";
import { ArrowUp, CircleX, File, Upload } from "lucide-react";
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
import PdfViewer from "./PdfViewer";

const UploadFile = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    key: string;
    fileName: string;
    fileType: string;
    fileUrl: string;
  } | null>(null);
  const [createdDocument, setCreatedDocument] = useState<any>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      // Optional validation
      if (file.type !== "application/pdf") {
        throw new Error("Only PDF files are allowed");
      }

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

      if (!res.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, key, document } = await res.json();

      setCreatedDocument(document);

      // Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) {
        console.error("Error uploading file:");
        throw new Error("Failed to upload file");
      }

      const viewRes = await fetch("/api/files/view", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key }),
      });

      const { fileUrl } = await viewRes.json();

      console.log({ fileUrl });

      console.log("Upload successful");
      console.log("S3 Key:", key);
      setUploadedFile({
        key,
        fileName: file.name,
        fileType: file.type,
        fileUrl,
      });

      // call the process api route
      await fetch("/api/files/process", {
        method: "POST",
        body: JSON.stringify({
          documentId: document.id,
          key,
        }),
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

  const cancelFile = () => {
    setUploadedFile(null);
  };

  if (uploadedFile && uploadedFile.fileUrl) {
    return (
      <PdfViewer
        file={{
          id: createdDocument.id,
          key: uploadedFile.key,
          fileName: uploadedFile.fileName,
          fileUrl: uploadedFile.fileUrl,
        }}
      />
    );
  }

  return (
    <main className="flex h-full min-h-0 w-full flex-1 items-center justify-center">
      {/* <textarea
        placeholder="Let's start learning..."
        className="w-full h-24 p-4 font-normal text-sm text-black/90 border rounded-lg focus:outline-none"
      /> */}
      {/* dropdown menu */}
      <div className="flex flex-col justify-between items-center mt-2">
        <h3 className="text-sm text-black/80 mb-2">
          Upload your file here to start learning with{" "}
          <span className="font-voegies text-xl tracking-widest">Studalis</span>
        </h3>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                className="flex items-center gap-1 h-8 p-2 rounded-full cursor-pointer"
              >
                <Upload className="h-4 w-4" />{" "}
                <p className="text-xs">Upload content</p>
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
        {/* <button className="mb-6 rounded-full bg-black p-4 text-white duration-500 transition hover:bg-black/80">
          {" "}
          <Upload size={30} />
        </button> */}
        {uploadedFile && (
          <div className="w-full mt-4 flex items-center justify-between">
            <div className="relative">
              <File size={25} />
              <button
                onClick={() => cancelFile()}
                className="absolute -top-2 -right-1"
              >
                <CircleX size={10} />
              </button>
              <p className="text-sm font-semibold">{uploadedFile.fileName}</p>
            </div>
            <button className="mt-2 bg-blue-500 text-white rounded-full p-2 cursor-pointer duration-500 transition hover:bg-blue-600">
              <ArrowUp size={20} color="white" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default UploadFile;
