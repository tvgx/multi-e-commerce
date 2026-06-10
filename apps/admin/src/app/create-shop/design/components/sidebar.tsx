"use client";

import React, { useState } from "react";
import { useBuilderStore } from "@ecommerce/ui-registry/src/store/builder-store";
import { GripVertical, Trash2, Plus, ChevronUp, ChevronDown, Lock, ChevronRight } from "lucide-react";
import { AddSectionModal } from "./add-section-modal";
import { UIComponentRef } from "@ecommerce/schema";
import { ComponentSchemas } from "@ecommerce/ui-registry/src/component-schemas";

export function Sidebar() {
  const globalComponents = useBuilderStore(s => s.globalComponents);
  const pages = useBuilderStore(s => s.pages);
  const activePage = useBuilderStore(s => s.activePage);
  const activeComponentId = useBuilderStore(s => s.activeComponentId);
  const activeBlockId = useBuilderStore(s => s.activeBlockId);
  const setActiveComponent = useBuilderStore(s => s.setActiveComponent);
  const setActiveBlock = useBuilderStore(s => s.setActiveBlock);
  const removePageSection = useBuilderStore(s => s.removePageSection);
  const reorderPageSections = useBuilderStore(s => s.reorderPageSections);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | undefined>();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const pageComponents = pages[activePage] || [];
  const headerComp = globalComponents.find(c => c.id === "global-header");
  const footerComp = globalComponents.find(c => c.id === "global-footer");

  const handleComponentClick = (id: string) => {
    setActiveComponent(id);
  };

  const handleBlockClick = (sectionId: string, blockId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveComponent(sectionId);
    setActiveBlock(blockId);
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
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

  const renderComponentTree = (comp: UIComponentRef, idx?: number, isGlobal = false) => {
    const isExpanded = expandedSections[comp.id];
    const hasBlocks = comp.blocks && comp.blocks.length > 0;
    const isActive = activeComponentId === comp.id && !activeBlockId;

    return (
      <div key={comp.id} className="space-y-1">
        <div 
          onClick={() => handleComponentClick(comp.id)}
          className={`w-full flex items-center justify-between px-2 py-2 rounded-lg transition-colors text-sm cursor-pointer group ${isActive ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-zinc-900 text-zinc-300'}`}
        >
          <div className="flex items-center gap-1 overflow-hidden">
            {hasBlocks ? (
                <button 
                  onClick={(e) => toggleExpand(comp.id, e)} 
                  className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                >
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
            ) : (
                <div className="w-5.5 h-5.5" /> // Spacer
            )}
            
            {isGlobal ? (
                <Lock className="w-3.5 h-3.5 text-zinc-600 shrink-0 ml-1" />
            ) : (
                <GripVertical className="w-3.5 h-3.5 text-zinc-600 shrink-0 cursor-grab" />
            )}
            
            <span className="truncate">{comp.componentId}</span>
          </div>
          
          {!isGlobal && idx !== undefined && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => moveUp(idx, e)} className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"><ChevronUp className="w-3 h-3" /></button>
              <button onClick={(e) => moveDown(idx, e)} className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"><ChevronDown className="w-3 h-3" /></button>
              <button onClick={(e) => remove(comp.id, e)} className="p-1 hover:bg-red-500/20 rounded text-zinc-400 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
            </div>
          )}
        </div>

        {/* Blocks rendering */}
        {hasBlocks && isExpanded && (
           <div className="pl-6 pr-2 space-y-1">
             {comp.blocks!.map((block, blockIdx) => {
                 const isBlockActive = activeBlockId === block.id;
                 const blockSchema = ComponentSchemas[block.componentId];
                 const blockTitle = (block.props?.title as string) || (block.props?.label as string) || blockSchema?.title || `Block ${blockIdx + 1}`;
                 
                 return (
                    <div 
                      key={block.id}
                      onClick={(e) => handleBlockClick(comp.id, block.id, e)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-xs cursor-pointer ${isBlockActive ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-zinc-900 text-zinc-400'}`}
                    >
                      <span className="w-1 h-1 rounded-full bg-zinc-600 shrink-0"></span>
                      <span className="truncate">{blockTitle}</span>
                    </div>
                 );
             })}
           </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="w-[260px] bg-zinc-950 border-r border-zinc-800 flex flex-col shrink-0 overflow-y-auto custom-scrollbar h-full text-zinc-300">
        
        {/* HEADER GROUP */}
        <div className="pt-4 pb-2 px-3">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">Header</h3>
          <div className="space-y-1">
            {headerComp && renderComponentTree(headerComp, undefined, true)}
          </div>
        </div>

        {/* TEMPLATE GROUP */}
        <div className="py-2 px-3 border-t border-zinc-800/50">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">Template</h3>
          
          <div className="space-y-1">
            {pageComponents.map((comp, idx) => renderComponentTree(comp, idx, false))}
            
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
            {footerComp && renderComponentTree(footerComp, undefined, true)}
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
