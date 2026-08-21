import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "AI Career OS",
  description: "AI-powered student career and placement platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full", "font-sans")}>
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}