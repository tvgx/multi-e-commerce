"use client"

import React, { useState } from "react";
import { Plus, X, LayoutTemplate, ImageIcon, Type, Grid, Box } from "lucide-react";
import { useBuilderStore } from "../../store/builder-store";

const getAddableItems = (availableSchemas: any[]) => {
    const items = availableSchemas.map((schema) => {
        const componentId = schema.componentId;
        let cat = schema.category;
        if (!cat) {
            cat = schema.type === 'block' ? 'Atomic Blocks' : 'Other';
        }
        return {
            componentId,
            category: cat,
            name: schema.title || schema.name || componentId,
            previewImage: schema.mediaUrl || schema.previewImage || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%231e1e24"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="bold" fill="%23a8a29e">${encodeURIComponent(schema.title || schema.name || componentId)}</text></svg>`,
            schema: schema // Pass the whole schema for Live Preview
        };
    });
    
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
    const [hoveredItem, setHoveredItem] = useState<any | null>(null);
    const { addPageSection, addBlock, activePage, activeComponentId, availableSchemas } = useBuilderStore();
    
    const groupedItems = getAddableItems(availableSchemas);

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
        <div className="w-full">
            <button
                onClick={() => setIsOpen(true)}
                className="w-full py-2 flex items-center justify-center gap-2 text-sm text-indigo-400 font-medium hover:bg-white/5 rounded-lg transition-colors border border-dashed border-white/10 hover:border-indigo-500/50"
            >
                <Plus className="h-4 w-4" /> Add Section
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8" onClick={() => setIsOpen(false)}>
                    <div 
                        className="w-[80%] h-[80%] bg-slate-950 border border-slate-800 rounded-xl shadow-2xl flex overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Left Pane - Scrollable List */}
                        <div className="w-1/2 flex flex-col border-r border-slate-800 bg-slate-900/50">
                            <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
                                <h2 className="text-sm font-semibold text-white">Add Section</h2>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700">
                                {Object.entries(groupedItems).map(([category, items]) => {
                                    const CatIcon = CATEGORY_ICONS[category] || LayoutTemplate;
                                    return (
                                        <div key={category} className="mb-4">
                                            <div className="flex items-center gap-2 px-3 py-2">
                                                <CatIcon className="w-3.5 h-3.5 text-indigo-400" />
                                                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{category}</h3>
                                            </div>
                                            <div className="flex flex-col">
                                                {items.map(item => (
                                                    <button
                                                        key={item.componentId}
                                                        onClick={() => handleAdd(item.componentId, category)}
                                                        onMouseEnter={() => setHoveredItem(item)}
                                                        className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-800/50 hover:bg-indigo-500/10 transition-colors text-left group last:border-b-0"
                                                    >
                                                        <span className="text-sm font-medium text-slate-300 group-hover:text-indigo-300 transition-colors">
                                                            {item.name}
                                                        </span>
                                                        <Plus className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Pane - Preview */}
                        <div className="w-1/2 bg-slate-950 flex flex-col relative">
                            <button 
                                onClick={() => setIsOpen(false)} 
                                className="absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors z-10 bg-black/20"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            
                            {hoveredItem ? (
                                <div className="flex-1 flex flex-col p-6 items-center justify-center animate-in fade-in zoom-in-95 duration-200 w-full">
                                    <div className="w-full h-full max-h-[80%] rounded-lg border border-slate-800 overflow-hidden bg-white mb-4 shadow-xl relative flex items-center justify-center">
                                        <LivePreview componentId={hoveredItem.componentId} previewImage={hoveredItem.previewImage} />
                                    </div>
                                    <h4 className="text-lg font-bold text-white mb-1">{hoveredItem.name}</h4>
                                    <p className="text-sm text-slate-500 text-center">
                                        Click item on the left to add this section.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                                    <LayoutTemplate className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="text-sm">Hover over a section to preview</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Live Preview Component
import { registry } from "../../registry";

function LivePreview({ componentId, previewImage }: { componentId: string, previewImage: string }) {
    const Component = registry[componentId];
    
    // Fallback to image if component is not found or fails to render
    if (!Component) {
         return <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />;
    }

    return (
        <div className="w-[1200px] origin-top-left scale-[0.4] absolute top-0 left-0 bg-white">
            <div className="pointer-events-none">
                <Component />
            </div>
        </div>
    );
}
