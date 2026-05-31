"use client";

import React, { Suspense } from "react";
import { Topbar } from "./components/topbar";
import { Canvas } from "./components/canvas";
import { Sidebar } from "./components/sidebar";
import { BuilderProvider } from "./components/builder-provider";
import { PropertiesSidebar } from "./components/properties-sidebar";

export default function DesignPage() {
  return (
    <BuilderProvider>
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-white text-zinc-900 overflow-hidden font-sans border-t border-zinc-200">
        <Suspense fallback={<div className="h-12 border-b border-zinc-200 bg-gray-50 animate-pulse" />}>
          <Topbar />
        </Suspense>
        
        <div className="flex flex-1 overflow-hidden relative bg-gray-100">
          <Sidebar />
          
          <main className="flex-1 overflow-hidden relative">
            <Canvas />
          </main>

          <PropertiesSidebar />
        </div>
      </div>
    </BuilderProvider>
  );
}

