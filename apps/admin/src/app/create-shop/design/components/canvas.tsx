"use client";

import React, { useMemo } from "react";
import { useBuilder } from "./builder-provider";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { registry } from "@ecommerce/ui-registry";
import { Trash2, GripVertical } from "lucide-react";

function SortableBlock({
  id,
  componentId,
  selected,
  onSelect,
  onRemove,
}: {
  id: string;
  componentId: string;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const Component = registry[componentId];

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`relative group rounded-xl bg-white/[0.03] backdrop-blur transition-all ${
        selected ? "ring-2 ring-indigo-500 bg-white/[0.05]" : "border border-white/5 hover:border-slate-600"
      }`}
    >
      <div 
        {...attributes}
        {...listeners}
        className="absolute -left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 cursor-grab text-slate-500 hover:text-white transition-opacity"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="absolute right-4 top-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 pointer-events-none">
        {Component ? (
          <div className="scale-[0.9] origin-top opacity-80 border-2 border-dashed border-white/10 rounded-xl p-4 min-h-[100px] flex items-center justify-center bg-black/50">
            {/* The actual UI component is dynamically resolved from @ecommerce/ui-registry */}
            <span className="text-white text-lg font-bold font-mono">[{componentId}] Component Block</span>
          </div>
        ) : (
          <div className="h-32 bg-slate-800/50 rounded-lg border border-red-500/20 flex items-center justify-center text-red-400 font-mono text-sm">
            Component '{componentId}' not found
          </div>
        )}
      </div>

      {selected && (
        <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-500 text-white text-[10px] font-bold rounded-tr-xl rounded-bl-xl shadow-lg">
          SELECTED
        </div>
      )}
    </div>
  );
}

export function Canvas() {
  const { nodes, setNodes, selectedNodeId, setSelectedNodeId, removeNode } = useBuilder();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setNodes((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        return newOrder.map((n, i) => ({ ...n, order: i }));
      });
    }
  };

  const itemIds = useMemo(() => nodes.map((n) => n.id), [nodes]);

  return (
    <div 
      className="w-full h-full max-w-5xl mx-auto rounded-2xl shadow-2xl relative flex flex-col items-center pt-10 pb-20 overflow-y-auto"
      onClick={() => setSelectedNodeId(null)}
    >
      <div className="w-full px-4 mb-4 text-center">
        <h2 className="text-white font-serif text-sm opacity-50 mb-8 border-b border-white/5 pb-2">
          {"--- Start of Page ---"}
        </h2>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="w-full space-y-4 px-4 pb-32">
            {nodes.length === 0 ? (
              <div className="h-[40vh] border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-slate-500 gap-4">
                <span className="text-lg">Trang của bạn đang trống!</span>
                <span className="text-sm border bg-white/5 rounded-full px-4 py-1">Click component bên trái để thêm vào đây</span>
              </div>
            ) : (
              nodes.map((node) => (
                <SortableBlock
                  key={node.id}
                  id={node.id}
                  componentId={node.componentId}
                  selected={selectedNodeId === node.id}
                  onSelect={() => setSelectedNodeId(node.id)}
                  onRemove={() => removeNode(node.id)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
