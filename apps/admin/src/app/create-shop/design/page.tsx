"use client";

import React, { useState, Suspense } from "react";
import { Topbar } from "./components/topbar";
import { Canvas } from "./components/canvas";
import { Sidebar } from "./components/sidebar";
import { SaveModal } from "./components/save-modal";
import { BuilderProvider } from "./components/builder-provider";

export default function DesignPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <BuilderProvider>
      <div className="flex flex-col h-screen bg-[#030014] text-slate-200 overflow-hidden font-sans">
        <Suspense fallback={<div className="h-16 border-b border-white/10 bg-black/40 animate-pulse" />}>
          <Topbar onSave={() => setIsModalOpen(true)} />
        </Suspense>
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-black/60 p-4 lg:p-10 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[50%] bg-indigo-600/10 blur-[100px] rounded-full -z-10 pointer-events-none" />
            <Canvas />
          </main>
        </div>

        {isModalOpen && (
          <SaveModal onClose={() => setIsModalOpen(false)} />
        )}
      </div>
    </BuilderProvider>
  );
}
