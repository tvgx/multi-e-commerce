"use client"

import React from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Lock } from "lucide-react";
import { useBuilderStore } from "../../store/builder-store";
import { AddSectionDropdown } from "./add-section-dropdown";
import { BlockTreeItem } from "./block-tree-item";

export function SidebarSections() {
    const globalComponents = useBuilderStore(s => s.globalComponents);
    const pages = useBuilderStore(s => s.pages);
    const activePage = useBuilderStore(s => s.activePage);
    const reorderPageSections = useBuilderStore(s => s.reorderPageSections);
    const activeComponentId = useBuilderStore(s => s.activeComponentId);
    const setActiveComponent = useBuilderStore(s => s.setActiveComponent);
    const removePageSection = useBuilderStore(s => s.removePageSection);

    const sections = pages[activePage] || [];

    // Separate Header and Footer from globalComponents
    const headerComponent = globalComponents.find(c => c.componentId === 'Header') || { id: 'header-placeholder', componentId: 'Header', props: {} };
    const footerComponent = globalComponents.find(c => c.componentId === 'Footer') || { id: 'footer-placeholder', componentId: 'Footer', props: {} };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const { source, destination, type } = result;

        if (source.droppableId === destination.droppableId) {
            if (source.droppableId === "builder-sections") {
                reorderPageSections(activePage, source.index, destination.index);
            } else {
                // Nested block reordering
                const { reorderBlocks } = useBuilderStore.getState();
                reorderBlocks(source.droppableId, source.index, destination.index);
            }
        }
    };

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Template Sections</h3>
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{sections.length + 2}</span>
            </div>

            <div className="space-y-1">
                {/* Locked Header */}
                <div
                    onClick={() => setActiveComponent(headerComponent.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border group cursor-pointer transition-colors
                        ${activeComponentId === headerComponent.id
                            ? "bg-zinc-800 border-emerald-500/50"
                            : "bg-zinc-900 border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700"
                        }
                    `}
                >
                    <div className="flex items-center gap-3">
                        <div className="text-zinc-600 p-1 -ml-1 rounded">
                            <Lock className="h-4 w-4" />
                        </div>
                        <span className={`text-sm font-medium ${activeComponentId === headerComponent.id ? "text-white" : "text-zinc-300"}`}>
                            Header
                        </span>
                    </div>
                </div>

                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="builder-sections" type="section">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-1 min-h-[50px] py-1"
                            >
                                {sections.map((section, index) => (
                                    <BlockTreeItem
                                        key={section.id}
                                        component={section}
                                        index={index}
                                        depth={0}
                                    />
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                <div className="pb-1">
                    <AddSectionDropdown />
                </div>

                {/* Locked Footer */}
                <div
                    onClick={() => setActiveComponent(footerComponent.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border group cursor-pointer transition-colors
                        ${activeComponentId === footerComponent.id
                            ? "bg-zinc-800 border-emerald-500/50"
                            : "bg-zinc-900 border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700"
                        }
                    `}
                >
                    <div className="flex items-center gap-3">
                        <div className="text-zinc-600 p-1 -ml-1 rounded">
                            <Lock className="h-4 w-4" />
                        </div>
                        <span className={`text-sm font-medium ${activeComponentId === footerComponent.id ? "text-white" : "text-zinc-300"}`}>
                            Footer
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
