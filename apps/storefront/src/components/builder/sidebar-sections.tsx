"use client"

import React from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical, Image as ImageIcon, LayoutTemplate, Megaphone, Trash2 } from "lucide-react";
import { useBuilderStore, ComponentType } from "@/store/builder-store";
import { AddSectionDropdown } from "./add-section-dropdown";

const COMPONENT_ICONS: Record<ComponentType, React.ElementType> = {
    Hero: ImageIcon,
    FeaturedCollection: LayoutTemplate,
    AnnouncementBar: Megaphone,
};

export function SidebarSections() {
    const { sections, reorderSections, activeSectionId, setActiveSection, removeSection } = useBuilderStore();

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        reorderSections(result.source.index, result.destination.index);
    };

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Template Sections</h3>
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{sections.length}</span>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="builder-sections">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-1 min-h-[50px]"
                        >
                            {sections.map((section, index) => {
                                const Icon = COMPONENT_ICONS[section.type];
                                const isActive = activeSectionId === section.id;

                                return (
                                    <Draggable key={section.id} draggableId={section.id} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                onClick={() => setActiveSection(section.id)}
                                                className={`flex items-center justify-between p-3 rounded-lg border group cursor-pointer transition-colors
                          ${isActive
                                                        ? "bg-zinc-800 border-emerald-500/50"
                                                        : "bg-zinc-900 border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700"
                                                    }
                          ${snapshot.isDragging ? "shadow-xl ring-1 ring-emerald-500/30 rotate-1 z-50" : ""}
                        `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        {...provided.dragHandleProps}
                                                        className="text-zinc-600 hover:text-white transition-colors p-1 -ml-1 rounded"
                                                        onClick={(e) => e.stopPropagation()} // Prevent setting active when just dragging
                                                    >
                                                        <GripVertical className="h-4 w-4" />
                                                    </div>
                                                    {Icon && <Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-zinc-500"}`} />}
                                                    <span className={`text-sm font-medium ${isActive ? "text-white" : "text-zinc-300"}`}>
                                                        {section.type}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                                                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-700 rounded transition-colors"
                                                        title="Remove section"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}

                            <div className="pt-2">
                                <AddSectionDropdown />
                            </div>
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
}
