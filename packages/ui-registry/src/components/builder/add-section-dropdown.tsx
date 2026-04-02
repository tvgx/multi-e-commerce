"use client"

import React, { useState } from "react";
import { Plus, X, LayoutTemplate, ImageIcon, Megaphone } from "lucide-react";
import { useBuilderStore, ComponentType } from "../../store/builder-store";

const ADDABLE_SECTIONS: { type: ComponentType, icon: React.ComponentType<any>, label: string, desc: string }[] = [
    { type: "Hero", icon: ImageIcon, label: "Image Banner", desc: "Large hero block with text and CTA." },
    { type: "FeaturedCollection", icon: LayoutTemplate, label: "Featured Collection", desc: "Grid of handpicked products." },
    { type: "AnnouncementBar", icon: Megaphone, label: "Announcement Bar", desc: "Thin strip for top-level notices." },
];

export function AddSectionDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const { addSection } = useBuilderStore();

    const handleAdd = (type: ComponentType) => {
        addSection(type);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full mt-3">
            {isOpen ? (
                <div className="absolute bottom-full mb-2 w-full bg-zinc-900 border border-zinc-700/80 shadow-2xl rounded-lg p-2 z-50">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-800">
                        <span className="text-xs font-semibold text-zinc-300">Add Section</span>
                        <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-1 max-h-[300px] overflow-y-auto">
                        {ADDABLE_SECTIONS.map((sec) => (
                            <button
                                key={sec.type}
                                onClick={() => handleAdd(sec.type)}
                                className="w-full text-left p-2 hover:bg-zinc-800 rounded-md group transition-colors flex gap-3 items-start"
                            >
                                <div className="mt-0.5 bg-zinc-800 group-hover:bg-zinc-700 p-1.5 rounded text-zinc-400 group-hover:text-emerald-400 transition-colors">
                                    <sec.icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-zinc-200 group-hover:text-white">{sec.label}</div>
                                    <div className="text-xs text-zinc-500 mt-0.5">{sec.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-2 flex items-center justify-center gap-2 text-sm text-emerald-400 font-medium hover:bg-zinc-800 rounded-lg transition-colors border border-dashed border-zinc-700 hover:border-emerald-500/50"
            >
                <Plus className="h-4 w-4" /> Add section
            </button>
        </div>
    );
}
