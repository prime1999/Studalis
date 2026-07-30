import type { Metadata } from "next";
import { Roboto, Geist } from "next/font/google";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-zenix-roboto",
  display: "swap",
  subsets: ["latin"],
});
const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

// Configure custom local font
const voegies = localFont({
  src: [
    {
      path: "./fonts/Voegies.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-voegies",
});

export const metadata: Metadata = {
  title: "Studalis",
  description:
    "An AI study partner that helps you learn faster and retain more information.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        theme: "simple",
        cssLayerName: "clerk",
      }}
    >
      <html
        lang="en"
        className={`${roboto.variable} ${geistSans.variable} ${voegies.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
