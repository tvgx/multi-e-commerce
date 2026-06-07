'use client';

import React from 'react';
import { useBuilderStore } from '@ecommerce/ui-registry/src/store/builder-store';
import { schemaRegistry } from '@ecommerce/ui-registry/src/registry';
import { AddSectionDropdown } from '@ecommerce/ui-registry/src/components/builder/add-section-dropdown';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Layers, Lock, Box } from 'lucide-react';

function BlockTree({ blocks, level = 0 }: { blocks: any[], level?: number }) {
  if (!blocks || blocks.length === 0) return null;
  return (
    <div className="flex flex-col space-y-0.5 mt-1">
      {blocks.map(block => (
        <BlockItem key={block.id} block={block} level={level} />
      ))}
    </div>
  );
}

function BlockItem({ block, level }: { block: any, level: number }) {
  const { activeBlockId, setActiveBlock, removeBlock } = useBuilderStore();
  const isActive = activeBlockId === block.id;
  const schema = schemaRegistry[block.componentId];
  const title = schema?.title || block.componentId;

  return (
    <div className="flex flex-col w-full group/block">
      <div 
        onClick={(e) => { e.stopPropagation(); setActiveBlock(block.id); }}
        className={`flex items-center gap-2 py-2 pr-2 rounded-lg cursor-pointer transition-colors ${
          isActive 
            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' 
            : 'hover:bg-white/5 text-slate-400 border border-transparent'
        }`}
        style={{ paddingLeft: `${(level + 1) * 16}px` }}
      >
        <Box size={12} className={isActive ? 'text-indigo-400' : 'text-slate-600'} />
        <span className="flex-1 text-xs truncate">{title}</span>
        <button 
          onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
          className="p-1 hover:text-red-400 opacity-0 group-hover/block:opacity-100 transition-opacity"
        >
          <Trash2 size={12} />
        </button>
      </div>
      {block.blocks && <BlockTree blocks={block.blocks} level={level + 1} />}
    </div>
  );
}

function SortableItem({ id, section }: { id: string, section: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const { activeComponentId, activeBlockId, setActiveComponent, removePageSection, activePage } = useBuilderStore();
  const isActive = activeComponentId === id && !activeBlockId;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const schema = schemaRegistry[section.componentId];
  const title = schema?.title || section.componentId;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative group/section flex flex-col ${isDragging ? 'z-50 opacity-50' : ''}`}
    >
      <div 
        onClick={() => setActiveComponent(id)}
        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
          isActive 
            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/10' 
            : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
        }`}
      >
        <button 
          {...attributes} 
          {...listeners}
          className="text-slate-500 hover:text-white cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>
        
        <div className="flex-1 font-medium text-sm truncate">
          {title}
        </div>

        <div className="flex gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              removePageSection(activePage, id);
            }}
            className="p-1 text-slate-500 hover:text-red-400 rounded"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {section.blocks && section.blocks.length > 0 && (
        <div className="pl-2 mt-1 border-l border-white/10 ml-5">
           <BlockTree blocks={section.blocks} level={0} />
        </div>
      )}
      {isActive && (
        <div className="mt-2 ml-5">
            <AddSectionDropdown />
        </div>
      )}
    </div>
  );
}

function GlobalSectionItem({ componentId }: { componentId: string }) {
  const { globalComponents, activeComponentId, activeBlockId, setActiveComponent } = useBuilderStore();
  const section = globalComponents.find(c => c.componentId === componentId);
  if (!section) return null;
  
  const isActive = activeComponentId === section.id && !activeBlockId;
  const schema = schemaRegistry[section.componentId];
  const title = schema?.title || section.componentId;

  return (
    <div className="flex flex-col mb-6">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-2 flex items-center justify-between">
         {componentId === 'Header' ? 'Header Zone' : 'Footer Zone'}
         <Lock size={10} className="text-slate-600" />
      </div>
      <div 
        onClick={() => setActiveComponent(section.id)}
        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
          isActive 
            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/10' 
            : 'bg-slate-900 border-white/5 text-slate-300 hover:bg-white/5'
        }`}
      >
        <div className="w-4 flex justify-center"><Layers size={14} className="text-slate-600" /></div>
        <div className="flex-1 font-medium text-sm truncate">{title}</div>
      </div>
      {section.blocks && section.blocks.length > 0 && (
        <div className="pl-2 mt-1 border-l border-white/10 ml-5">
           <BlockTree blocks={section.blocks} level={0} />
        </div>
      )}
      {isActive && (
        <div className="mt-2 ml-5">
            <AddSectionDropdown />
        </div>
      )}
    </div>
  );
}

export function SectionList() {
  const { pages, activePage, reorderPageSections } = useBuilderStore();
  const sections = pages[activePage] || [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);
      
      reorderPageSections(activePage, oldIndex, newIndex);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      <div className="p-4 border-b border-white/5 flex items-center gap-2 text-white font-bold shrink-0">
        <Layers size={18} className="text-indigo-500" />
        Structure
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        {/* HEADER ZONE */}
        <GlobalSectionItem componentId="Header" />

        {/* TEMPLATE ZONE */}
        <div className="flex flex-col">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2 flex items-center justify-between">
             Template Zone
             <div className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-[9px]">{sections.length}</div>
          </div>
          
          {sections.length === 0 ? (
            <div className="text-center text-slate-500 text-xs py-8 border border-dashed border-white/10 rounded-xl">
              No sections added yet.<br/>
            </div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={sections.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {sections.map(section => (
                    <SortableItem key={section.id} id={section.id} section={section} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* FOOTER ZONE */}
        <GlobalSectionItem componentId="Footer" />
      </div>
    </div>
  );
}
