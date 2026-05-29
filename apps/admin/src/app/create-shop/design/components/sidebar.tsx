"use client";

import React, { useState } from "react";
import { useBuilderStore } from "@ecommerce/ui-registry/src/store/builder-store";
import { GripVertical, Trash2, Plus, ChevronUp, ChevronDown, Lock } from "lucide-react";
import { AddSectionModal } from "./add-section-modal";

export function Sidebar() {
  const { 
    globalComponents, 
    pages, 
    activePage, 
    activeComponentId,
    setActiveComponent,
    removePageSection,
    reorderPageSections,
    openSectionEditor
  } = useBuilderStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | undefined>();

  const pageComponents = pages[activePage] || [];
  const headerComp = globalComponents.find(c => c.id === "global-header");
  const footerComp = globalComponents.find(c => c.id === "global-footer");

  const handleComponentClick = (id: string) => {
    setActiveComponent(id);
    openSectionEditor(id);
  };

  const handleAddSection = (index?: number) => {
    setInsertIndex(index);
    setIsAddModalOpen(true);
  };

  const moveUp = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index > 0) reorderPageSections(activePage, index, index - 1);
  };

  const moveDown = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index < pageComponents.length - 1) reorderPageSections(activePage, index, index + 1);
  };

  const remove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removePageSection(activePage, id);
  };

  return (
    <>
      <div className="w-[260px] bg-zinc-950 border-r border-zinc-800 flex flex-col shrink-0 overflow-y-auto custom-scrollbar h-full text-zinc-300">
        
        {/* HEADER GROUP */}
        <div className="pt-4 pb-2 px-3">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">Header</h3>
          <div className="space-y-1">
            {headerComp && (
              <button 
                onClick={() => handleComponentClick(headerComp.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${activeComponentId === headerComp.id ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-zinc-900 text-zinc-300'}`}
              >
                <Lock className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <span className="truncate">{headerComp.componentId}</span>
              </button>
            )}
          </div>
        </div>

        {/* TEMPLATE GROUP */}
        <div className="py-2 px-3 border-t border-zinc-800/50">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">Template</h3>
          
          <div className="space-y-1">
            {pageComponents.map((comp, idx) => (
              <div 
                key={comp.id}
                onClick={() => handleComponentClick(comp.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm cursor-pointer group ${activeComponentId === comp.id ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-zinc-900 text-zinc-300'}`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <GripVertical className="w-3.5 h-3.5 text-zinc-600 shrink-0 cursor-grab" />
                  <span className="truncate">{comp.componentId}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => moveUp(idx, e)} className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"><ChevronUp className="w-3 h-3" /></button>
                  <button onClick={(e) => moveDown(idx, e)} className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"><ChevronDown className="w-3 h-3" /></button>
                  <button onClick={(e) => remove(comp.id, e)} className="p-1 hover:bg-red-500/20 rounded text-zinc-400 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
            
            <button 
              onClick={() => handleAddSection()}
              className="w-full flex items-center gap-2 px-3 py-2 mt-2 rounded-lg hover:bg-zinc-900 text-sm text-indigo-400 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add section
            </button>
          </div>
        </div>

        {/* FOOTER GROUP */}
        <div className="py-2 px-3 border-t border-zinc-800/50">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">Footer</h3>
          <div className="space-y-1">
            {footerComp && (
              <button 
                onClick={() => handleComponentClick(footerComp.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${activeComponentId === footerComp.id ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-zinc-900 text-zinc-300'}`}
              >
                <Lock className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <span className="truncate">{footerComp.componentId}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <AddSectionModal 
          onClose={() => setIsAddModalOpen(false)} 
          insertIndex={insertIndex} 
        />
      )}
    </>
  );
}
