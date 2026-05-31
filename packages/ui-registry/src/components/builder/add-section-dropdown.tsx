"use client"

import React, { useState } from "react";
import { Plus, X, LayoutTemplate, ImageIcon, Megaphone, Type, MousePointerClick, Grid, Box } from "lucide-react";
import { useBuilderStore } from "../../store/builder-store";
import { schemaRegistry } from "../../registry";

// Build a dynamic list of addable items from the schema registry
const getAddableItems = () => {
    const items = Object.entries(schemaRegistry).map(([componentId, schema]) => ({
        componentId,
        category: schema.category || 'Other',
        name: schema.name || componentId,
    }));
    
    // Group by category
    const grouped = items.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, typeof items>);
    
    return grouped;
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
    'Banners': ImageIcon,
    'Collections': Grid,
    'Products': Box,
    'Atomic Blocks': Type,
    'Other': LayoutTemplate
};

export function AddSectionDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const { addPageSection, addBlock, activePage, activeComponentId } = useBuilderStore();
    
    const groupedItems = getAddableItems();

    const handleAdd = (componentId: string, category: string) => {
        if (category === 'Atomic Blocks') {
            if (!activeComponentId) {
                alert("Vui lòng chọn một Section để thêm Block vào.");
                return;
            }
            addBlock(activeComponentId, componentId);
        } else {
            addPageSection(activePage, componentId);
        }
        setIsOpen(false);
    };

    return (
        <div className="w-full mt-3">
            <button
                onClick={() => setIsOpen(true)}
                className="w-full py-2 flex items-center justify-center gap-2 text-sm text-emerald-400 font-medium hover:bg-zinc-800 rounded-lg transition-colors border border-dashed border-zinc-700 hover:border-emerald-500/50"
            >
                <Plus className="h-4 w-4" /> Thêm thành phần
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
                    <div 
                        className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col max-h-[80vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                            <h2 className="text-lg font-semibold text-white">Thêm thành phần</h2>
                            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
                            {Object.entries(groupedItems).map(([category, items]) => {
                                const CatIcon = CATEGORY_ICONS[category] || LayoutTemplate;
                                return (
                                    <div key={category}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <CatIcon className="w-4 h-4 text-emerald-500" />
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">{category}</h3>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {items.map(item => (
                                                <button
                                                    key={item.componentId}
                                                    onClick={() => handleAdd(item.componentId, category)}
                                                    className="flex flex-col items-start p-3 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-emerald-500/50 hover:bg-zinc-800/50 transition-all text-left group"
                                                >
                                                    <span className="text-sm font-medium text-zinc-200 group-hover:text-emerald-400 transition-colors">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-xs text-zinc-600 mt-1">
                                                        {category === 'Atomic Blocks' ? 'Thêm vào Section đang chọn' : 'Thêm Section mới'}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
