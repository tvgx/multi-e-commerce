import React from "react";
import { GlobalHeader } from "@/components/platform/GlobalHeader";
import { GlobalSidebar } from "@/components/platform/GlobalSidebar";
import { GlobalFooter } from "@/components/platform/GlobalFooter";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen bg-background font-sans">
      <GlobalHeader />
      <div className="flex flex-1 overflow-hidden">
        <GlobalSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <GlobalFooter />
    </div>
  );
}
