"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    Monitor, Smartphone, Save, Undo, Redo, LayoutTemplate,
    Settings, Type, ChevronLeft, GripVertical
} from "lucide-react";
import { Header, Footer } from "@ecommerce/ui-registry";
import { SidebarSections } from '@ecommerce/ui-registry/src/components/builder/sidebar-sections';
import { CanvasRenderer } from '@ecommerce/ui-registry/src/components/builder/canvas-renderer';
import { PropertiesEditor } from '@ecommerce/ui-registry/src/components/builder/properties-editor';
import { useBuilderStore } from "@/store/builder-store";

export default function ShopBuilder() {
    const { deviceMode, setDeviceMode, activeSectionId, loadTemplate, saveTemplate } = useBuilderStore();
    const [activeTab, setActiveTab] = useState<"sections" | "theme" | "settings">("sections");
    const shopId = "demo-shop-123";

    useEffect(() => {
        loadTemplate(shopId);
    }, [loadTemplate]);

    return (
        <div className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-300 font-sans overflow-hidden">
            {/* Top Navigation Bar */}
            <header className="h-14 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <div className="h-4 w-px bg-zinc-700"></div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">Duck&apos;s Apparel Theme</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">Draft</span>
                    </div>
                </div>

                {/* Center Canvas Controls */}
                <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                    <button
                        onClick={() => setDeviceMode("desktop")}
                        className={`p-1.5 rounded-md transition-colors ${deviceMode === "desktop" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                        title="Desktop view"
                    >
                        <Monitor className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setDeviceMode("mobile")}
                        className={`p-1.5 rounded-md transition-colors ${deviceMode === "mobile" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                        title="Mobile view"
                    >
                        <Smartphone className="h-4 w-4" />
                    </button>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 mr-2 text-zinc-500">
                        <button className="p-1.5 hover:text-zinc-300 transition-colors"><Undo className="h-4 w-4" /></button>
                        <button className="p-1.5 hover:text-zinc-300 transition-colors opacity-50"><Redo className="h-4 w-4" /></button>
                    </div>
                    <button className="text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 px-4 py-1.5 md:py-2 rounded-md transition-colors border border-zinc-700">
                        Preview
                    </button>
                    <button
                        onClick={() => saveTemplate(shopId)}
                        className="text-sm font-medium text-black bg-emerald-400 hover:bg-emerald-500 px-4 py-1.5 md:py-2 rounded-md transition-colors flex items-center gap-2 shadow-sm">
                        <Save className="h-4 w-4" />
                        <span className="hidden sm:inline">Save</span>
                    </button>
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left Sidebar - Theme Editor */}
                <aside className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 flex-1 sm:flex-none relative z-10 shadow-xl overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="flex border-b border-zinc-800 text-sm">
                        <button
                            onClick={() => setActiveTab("sections")}
                            className={`flex-1 py-3 font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === "sections" ? "border-emerald-400 text-emerald-400" : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"}`}
                        >
                            <LayoutTemplate className="h-4 w-4" /> Sections
                        </button>
                        <button
                            onClick={() => setActiveTab("theme")}
                            className={`flex-1 py-3 font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === "theme" ? "border-emerald-400 text-emerald-400" : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"}`}
                        >
                            <Type className="h-4 w-4" /> Theme
                        </button>
                        <button
                            onClick={() => setActiveTab("settings")}
                            className={`flex-1 py-3 font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === "settings" ? "border-emerald-400 text-emerald-400" : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"}`}
                        >
                            <Settings className="h-4 w-4" /> Apps
                        </button>
                    </div>

                    {/* Sidebar Content */}
                    <div className="flex-1 overflow-y-auto">
                        {activeTab === "sections" && (
                            activeSectionId ? <PropertiesEditor /> : <SidebarSections />
                        )}

                        {activeTab === "theme" && (
                            <div className="p-4 flex flex-col items-center justify-center h-full text-center space-y-4">
                                <Settings className="h-10 w-10 text-zinc-600" />
                                <div>
                                    <p className="text-zinc-300 font-medium">Theme Settings</p>
                                    <p className="text-sm text-zinc-500 mt-1">Colors, Typography, Layout spacing.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Right Canvas - Live Preview */}
                <main className="flex-1 bg-zinc-950 p-4 relative overflow-y-auto flex justify-center items-start">
                    <div
                        className={`transition-all duration-300 ease-in-out bg-white rounded-md shadow-2xl overflow-hidden ring-1 ring-zinc-800/50
              ${deviceMode === "desktop" ? "w-full max-w-[1200px]" : "w-[400px]"}
            `}
                    >
                        {/* The actual store layout preview inside the canvas */}
                        <div className="w-full h-full text-slate-900 pointer-events-none">
                            <Header />
                            <CanvasRenderer />
                            <Footer />
                        </div>
                    </div>
                </main>

            </div>
        </div>
    );
}
