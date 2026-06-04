'use client';

import React from 'react';
import { useBuilderStore } from '@ecommerce/ui-registry/src/store/builder-store';
import { schemaRegistry } from '@ecommerce/ui-registry/src/registry';
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
import { GripVertical, Eye, EyeOff, Trash2, Layers } from 'lucide-react';

function SortableItem({ id, section }: { id: string, section: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const { activeComponentId, setActiveComponent, removePageSection, activePage } = useBuilderStore();
  const isActive = activeComponentId === id;

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
      className={`relative group ${isDragging ? 'z-50 opacity-50' : ''}`}
    >
      <div 
        onClick={() => setActiveComponent(id)}
        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
          isActive 
            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' 
            : 'bg-white/5 border-transparent text-slate-300 hover:bg-white/10'
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

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/5 flex items-center gap-2 text-white font-bold shrink-0">
        <Layers size={18} />
        Sections
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        {sections.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8">
            No sections added yet.<br/>
            (In a full implementation, you would drag sections from a library here)
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
              <div className="space-y-2">
                {sections.map(section => (
                  <SortableItem key={section.id} id={section.id} section={section} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
