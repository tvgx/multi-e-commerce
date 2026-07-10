'use client';

import React, { useState } from 'react';
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
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Layers, Lock, Box, Plus, ChevronDown, ChevronRight, Eye, EyeOff, Copy, Pencil } from 'lucide-react';
import { useTranslations } from '@ecommerce/i18n/src/react';

// -----------------------------------------------------------------------
// AddBlockInline – shows allowed blocks for a given parent section
// -----------------------------------------------------------------------
function AddBlockInline({ parentId, parentComponentId }: { parentId: string; parentComponentId: string }) {
    const t = useTranslations('admin');
    const [isOpen, setIsOpen] = useState(false);
    const addBlock = useBuilderStore(s => s.addBlock);

    const schema = schemaRegistry[parentComponentId];
    const allowedBlocks: string[] = schema?.allowedBlocks || [];

    if (allowedBlocks.length === 0) return null;

    return (
        <div className="mt-1">
            <button
                onClick={() => setIsOpen(v => !v)}
                className={`w-full flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors border
                    ${isOpen
                        ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                        : 'text-indigo-400/70 border-dashed border-border hover:border-indigo-500/30 hover:bg-indigo-500/5'
                    }`}
            >
                <Plus size={11} className={`transition-transform ${isOpen ? 'rotate-45' : ''}`} />
                {t('builderTool.addBlock')}
            </button>
            {isOpen && (
                <div className="mt-1 rounded-lg border border-border bg-popover overflow-hidden shadow-lg">
                    {allowedBlocks.map((blockId: string) => {
                        const bs = schemaRegistry[blockId];
                        return (
                            <button
                                key={blockId}
                                onClick={() => { addBlock(parentId, blockId); setIsOpen(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-500/10 transition-colors text-left border-b border-border last:border-b-0 group"
                            >
                                <Box size={11} className="text-muted-foreground/60 group-hover:text-indigo-400 shrink-0 transition-colors" />
                                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{bs?.title || blockId}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// -----------------------------------------------------------------------
// BlockTree – recursive block tree renderer (kéo-thả block trong cùng parent)
// -----------------------------------------------------------------------
function BlockTree({ blocks, parentId, level = 0 }: { blocks: any[], parentId: string, level?: number }) {
    const reorderBlocks = useBuilderStore(s => s.reorderBlocks);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    if (!blocks || blocks.length === 0) return null;

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = blocks.findIndex(b => b.id === active.id);
            const newIndex = blocks.findIndex(b => b.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) reorderBlocks(parentId, oldIndex, newIndex);
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col space-y-0.5 mt-0.5">
                    {blocks.map(block => (
                        <BlockItem key={block.id} block={block} level={level} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

function BlockItem({ block, level }: { block: any, level: number }) {
    const t = useTranslations('admin');
    const activeBlockId = useBuilderStore(s => s.activeBlockId);
    const setActiveBlock = useBuilderStore(s => s.setActiveBlock);
    const removeBlock = useBuilderStore(s => s.removeBlock);
    const toggleBlockVisibility = useBuilderStore(s => s.toggleBlockVisibility);
    const duplicateBlock = useBuilderStore(s => s.duplicateBlock);
    const renameNode = useBuilderStore(s => s.renameNode);

    // Rename inline: double-click tên (hoặc icon bút) → input; Enter/blur lưu, Esc huỷ.
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState('');

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    const isActive = activeBlockId === block.id;
    const schema = schemaRegistry[block.componentId];
    const title = block.name || schema?.title || block.componentId;
    const isHidden = !!block.isHidden;

    const startRename = (e: React.SyntheticEvent) => {
        e.stopPropagation();
        setDraft(block.name || '');
        setIsEditing(true);
    };
    const commitRename = () => {
        renameNode(block.id, draft);
        setIsEditing(false);
    };

    const actionBtn = 'p-0.5 rounded transition-opacity text-muted-foreground/60 opacity-0 group-hover/block:opacity-100';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex flex-col w-full group/block ${isDragging ? 'z-50 opacity-50' : ''}`}
        >
            <div
                onClick={(e) => { e.stopPropagation(); setActiveBlock(block.id); }}
                className={`flex items-center gap-1.5 py-1.5 pr-2 rounded-lg cursor-pointer transition-colors ${isActive
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                    : 'hover:bg-accent text-muted-foreground border border-transparent hover:text-foreground'
                    } ${isHidden ? 'opacity-50' : ''}`}
                style={{ paddingLeft: `${(level + 1) * 14}px` }}
            >
                <button
                    {...attributes}
                    {...listeners}
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground p-0.5 shrink-0 opacity-0 group-hover/block:opacity-100 transition-opacity"
                >
                    <GripVertical size={10} />
                </button>
                <Box size={11} className={isActive ? 'text-indigo-400 shrink-0' : 'text-muted-foreground/50 shrink-0'} />

                {isEditing ? (
                    <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename();
                            if (e.key === 'Escape') setIsEditing(false);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder={schema?.title || block.componentId}
                        className="flex-1 min-w-0 text-xs bg-secondary border border-border rounded px-1.5 py-0.5 text-foreground focus:outline-none focus:border-indigo-500/50"
                    />
                ) : (
                    <span className="flex-1 text-xs truncate" onDoubleClick={startRename} title={title}>
                        {title}
                    </span>
                )}

                {/* Rename */}
                <button onClick={startRename} className={`${actionBtn} hover:text-foreground`} title={t('builderTool.rename')}>
                    <Pencil size={10} />
                </button>
                {/* Duplicate */}
                <button
                    onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}
                    className={`${actionBtn} hover:text-foreground`}
                    title={t('builderTool.duplicate')}
                >
                    <Copy size={10} />
                </button>
                {/* Hide/show — luôn hiện khi block đang ẩn */}
                <button
                    onClick={(e) => { e.stopPropagation(); toggleBlockVisibility(block.id); }}
                    className={`p-0.5 rounded transition-opacity text-muted-foreground/60 hover:text-foreground ${isHidden ? 'opacity-100' : 'opacity-0 group-hover/block:opacity-100'}`}
                    title={isHidden ? t('builderTool.showBlock') : t('builderTool.hideBlock')}
                >
                    {isHidden ? <EyeOff size={11} /> : <Eye size={11} />}
                </button>
                {/* Delete */}
                <button
                    onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                    className={`${actionBtn} hover:text-red-400`}
                    title={t('builderTool.deleteBlock')}
                >
                    <Trash2 size={11} />
                </button>
            </div>
            {block.blocks && <BlockTree blocks={block.blocks} parentId={block.id} level={level + 1} />}
        </div>
    );
}

// -----------------------------------------------------------------------
// GlobalSectionItem – Header or Footer zone (collapsed by default)
// -----------------------------------------------------------------------
function GlobalSectionItem({ componentId }: { componentId: string }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const globalComponents = useBuilderStore(s => s.globalComponents);
    const activeComponentId = useBuilderStore(s => s.activeComponentId);
    const activeBlockId = useBuilderStore(s => s.activeBlockId);
    const setActiveComponent = useBuilderStore(s => s.setActiveComponent);
    const section = globalComponents.find(c => c.componentId === componentId);
    if (!section) return null;

    const isActive = activeComponentId === section.id && !activeBlockId;
    const schema = schemaRegistry[section.componentId];
    const title = schema?.title || section.componentId;
    const zoneLabel = componentId === 'Header' ? 'Header Zone' : 'Footer Zone';

    return (
        <div className="flex flex-col mb-4">
            {/* Zone label */}
            <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-1 px-1 flex items-center justify-between">
                {zoneLabel}
                <Lock size={9} className="text-muted-foreground/50" />
            </div>

            {/* Section header row */}
            <div
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border cursor-pointer transition-colors ${isActive
                    ? 'bg-indigo-500/10 border-indigo-500/60 text-indigo-400'
                    : 'bg-card border-border text-muted-foreground hover:bg-accent hover:border-border'
                    }`}
            >
                {/* Expand/collapse */}
                <button
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(v => !v); }}
                    className="p-0.5 text-muted-foreground/60 hover:text-foreground transition-colors shrink-0 rounded"
                >
                    {isExpanded
                        ? <ChevronDown size={12} />
                        : <ChevronRight size={12} />
                    }
                </button>

                {/* Click to select section */}
                <div className="flex-1 flex items-center gap-2 min-w-0" onClick={() => setActiveComponent(section.id)}>
                    <Layers size={13} className="text-muted-foreground/60 shrink-0" />
                    <span className="font-medium text-sm truncate">{title}</span>
                </div>
            </div>

            {/* Expanded: block tree + add block */}
            {isExpanded && (
                <div className="pl-3 mt-0.5 border-l border-border ml-4">
                    {section.blocks && section.blocks.length > 0 && (
                        <BlockTree blocks={section.blocks} parentId={section.id} level={0} />
                    )}
                    <AddBlockInline parentId={section.id} parentComponentId={section.componentId} />
                </div>
            )}
        </div>
    );
}

// -----------------------------------------------------------------------
// SortableItem – a draggable page section (collapsible with blocks)
// -----------------------------------------------------------------------
function SortableItem({ id, section }: { id: string, section: any }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const {
        attributes, listeners, setNodeRef, transform, transition, isDragging,
    } = useSortable({ id });
    const activeComponentId = useBuilderStore(s => s.activeComponentId);
    const activeBlockId = useBuilderStore(s => s.activeBlockId);
    const setActiveComponent = useBuilderStore(s => s.setActiveComponent);
    const removePageSection = useBuilderStore(s => s.removePageSection);
    const activePage = useBuilderStore(s => s.activePage);
    const isActive = activeComponentId === id && !activeBlockId;

    const style = { transform: CSS.Transform.toString(transform), transition };
    const schema = schemaRegistry[section.componentId];
    const title = schema?.title || section.componentId;
    const hasBlocks = section.blocks && section.blocks.length > 0;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group/section flex flex-col ${isDragging ? 'z-50 opacity-50' : ''}`}
        >
            {/* Section row */}
            <div
                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${isActive
                    ? 'bg-indigo-500/10 border-indigo-500/60 text-indigo-400 shadow-lg shadow-indigo-500/5'
                    : 'bg-accent/40 border-border text-muted-foreground hover:bg-accent/70 hover:border-border'
                    }`}
            >
                {/* Expand toggle (if has blocks) */}
                {hasBlocks && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(v => !v); }}
                        className="text-muted-foreground/60 hover:text-foreground transition-colors p-0.5 shrink-0"
                    >
                        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                )}
                {!hasBlocks && <div className="w-3 shrink-0" />}

                {/* Click to select + drag handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing p-0.5 transition-colors shrink-0"
                    onClick={e => e.stopPropagation()}
                >
                    <GripVertical size={14} />
                </button>

                <div
                    className="flex-1 font-medium text-sm truncate"
                    onClick={() => setActiveComponent(id)}
                >
                    {title}
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); removePageSection(activePage, id); }}
                    className="p-1 text-muted-foreground/50 hover:text-red-400 rounded opacity-0 group-hover/section:opacity-100 transition-all shrink-0"
                >
                    <Trash2 size={13} />
                </button>
            </div>

            {/* Expanded: block tree + add block */}
            {isExpanded && hasBlocks && (
                <div className="pl-3 mt-0.5 border-l border-border ml-4">
                    <BlockTree blocks={section.blocks} parentId={id} level={0} />
                    <AddBlockInline parentId={id} parentComponentId={section.componentId} />
                </div>
            )}

            {/* Add block – when section is selected but not expanded (or when no blocks yet) */}
            {isActive && !isExpanded && (
                <div className="ml-4 mt-0.5">
                    <AddBlockInline parentId={id} parentComponentId={section.componentId} />
                </div>
            )}
        </div>
    );
}

// -----------------------------------------------------------------------
// SectionList – main left-panel component
// -----------------------------------------------------------------------
export function SectionList() {
    const t = useTranslations('admin');
    const pages = useBuilderStore(s => s.pages);
    const activePage = useBuilderStore(s => s.activePage);
    const reorderPageSections = useBuilderStore(s => s.reorderPageSections);
    const sections = pages[activePage] || [];

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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
        <div className="flex flex-col h-full bg-card">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center gap-2 text-foreground font-bold shrink-0">
                <Layers size={16} className="text-indigo-500" />
                <span className="text-sm">Structure</span>
            </div>

            <div className="p-3 flex-1 overflow-y-auto space-y-2">
                {/* HEADER ZONE */}
                <GlobalSectionItem componentId="Header" />

                {/* TEMPLATE ZONE */}
                <div className="flex flex-col">
                    <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-2 px-1 flex items-center justify-between">
                        Template Zone
                        <span className="text-[9px] bg-indigo-500/20 text-indigo-500 px-1.5 py-0.5 rounded-full font-bold">{sections.length}</span>
                    </div>

                    {sections.length === 0 ? (
                        <div className="text-center text-muted-foreground/50 text-xs py-6 border border-dashed border-border rounded-xl mb-2">
                            {t('builderTool.noSections')}
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
                                <div className="space-y-2 mb-2">
                                    {sections.map(section => (
                                        <SortableItem key={section.id} id={section.id} section={section} />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}

                    {/* Add section button */}
                    <AddSectionDropdown />
                </div>

                {/* FOOTER ZONE */}
                <GlobalSectionItem componentId="Footer" />
            </div>
        </div>
    );
}
