"use client"

import React, { useState, useRef, useEffect } from "react";
import { UIComponentRef } from "@ecommerce/schema";
import { GripVertical, Eye, EyeOff, Trash2, LayoutTemplate, Type, Image as ImageIcon, MousePointerClick, ChevronRight, ChevronDown, Lock } from "lucide-react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { useBuilderStore } from "../../store/builder-store";
import { schemaRegistry } from "../../registry";

interface BlockTreeItemProps {
    component: UIComponentRef;
    index: number;
    depth?: number;
    parentId?: string | null;
}

const getIcon = (id: string, isLocked: boolean) => {
    if (isLocked) return Lock;
    if (id === 'Hero') return ImageIcon;
    if (id === 'Text') return Type;
    if (id === 'Heading') return Type;
    if (id === 'Button') return MousePointerClick;
    if (id === 'Media') return ImageIcon;
    return LayoutTemplate;
};

export function BlockTreeItem({ component, index, depth = 0, parentId = null }: BlockTreeItemProps) {
    const { 
        activeComponentId, 
        activeBlockId, 
        setActiveComponent, 
        setActiveBlock,
        removeBlock,
        toggleBlockVisibility
    } = useBuilderStore();

    const [isHovered, setIsHovered] = useState(false);
    const [showDragHandle, setShowDragHandle] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const isActive = (depth === 0 ? activeComponentId === component.id : activeBlockId === component.id);
    const schema = schemaRegistry[component.componentId];
    const displayName = schema?.name || component.componentId;
    const isLocked = component.isLocked || false;

    useEffect(() => {
        if (isHovered && !isLocked) {
            hoverTimeoutRef.current = setTimeout(() => {
                setShowDragHandle(true);
            }, 2000); // 2 seconds to show drag handle
        } else {
            setShowDragHandle(false);
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        }
        return () => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        };
    }, [isHovered, isLocked]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (depth === 0) {
            setActiveComponent(component.id);
        } else {
            setActiveBlock(component.id);
        }
    };

    const handleToggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isLocked) {
            // Note: need the parentId to remove. Store recursive remove handles it by block id usually.
            // For now assume removeBlock is implemented to search and destroy by ID.
            removeBlock(component.id);
        }
    };

    const handleVisibility = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleBlockVisibility(component.id);
    };

    const Icon = showDragHandle ? GripVertical : getIcon(component.componentId, isLocked);

    return (
        <Draggable draggableId={component.id} index={index} isDragDisabled={isLocked}>
            {(provided, snapshot) => (
                <div 
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="mb-1"
                >
                    <div
                        onClick={handleClick}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        className={`flex items-center justify-between p-2 rounded-lg border group cursor-pointer transition-all
                            ${isActive 
                                ? "bg-zinc-800 border-l-4 border-l-emerald-500 border-zinc-700/50" 
                                : "bg-zinc-900 border-l-4 border-l-transparent border-zinc-800/50 hover:bg-zinc-800/80 hover:border-zinc-700"
                            }
                            ${snapshot.isDragging ? "shadow-xl ring-1 ring-emerald-500/30 rotate-1 z-50 opacity-90" : ""}
                            ${component.isHidden ? "opacity-50 grayscale" : ""}
                        `}
                        style={{ marginLeft: `${depth * 12}px` }}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            {component.blocks && component.blocks.length > 0 ? (
                                <button onClick={handleToggleExpand} className="text-zinc-500 hover:text-white p-0.5 -ml-1">
                                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                </button>
                            ) : (
                                <div className="w-4" /> // Spacing for leaf nodes
                            )}

                            <div 
                                {...provided.dragHandleProps} 
                                className={`p-1 -ml-1 rounded transition-colors ${showDragHandle ? "text-white bg-zinc-700" : "text-zinc-500"}`}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                            </div>
                            
                            <span className={`text-sm font-medium truncate ${isActive ? "text-white" : "text-zinc-300"}`}>
                                {displayName}
                            </span>
                        </div>

                        {/* Actions that appear on hover */}
                        <div className={`flex items-center gap-1 transition-opacity ${isHovered || isActive ? "opacity-100" : "opacity-0"}`}>
                            <button 
                                onClick={handleVisibility}
                                className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                            >
                                {component.isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            
                            {!isLocked && (
                                <button 
                                    onClick={handleRemove}
                                    className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-700 rounded transition-colors"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Render children (nested blocks) */}
                    {isExpanded && component.blocks && component.blocks.length > 0 && (
                        <Droppable droppableId={component.id} type="block">
                            {(provided) => (
                                <div 
                                    ref={provided.innerRef} 
                                    {...provided.droppableProps}
                                    className="mt-1"
                                >
                                    {component.blocks!.map((child, i) => (
                                        <BlockTreeItem 
                                            key={child.id} 
                                            component={child} 
                                            index={i} 
                                            depth={depth + 1} 
                                            parentId={component.id} 
                                        />
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    )}
                </div>
            )}
        </Draggable>
    );
}
