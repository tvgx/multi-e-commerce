"use client"

import React, { useEffect } from "react";
import { useBuilderStore } from "../../store/builder-store";
import { UIComponentRef } from "@ecommerce/schema";
import { registry } from "../../registry";

export function CanvasRenderer() {
    const {
        globalComponents, pages, activePage,
        activeComponentId, activeBlockId,
        setActiveComponent, setActiveBlock,
    } = useBuilderStore();

    const headerComponent = globalComponents.find(c => c.componentId === 'Header') || { id: 'header-placeholder', componentId: 'Header', props: {} };
    const footerComponent = globalComponents.find(c => c.componentId === 'Footer') || { id: 'footer-placeholder', componentId: 'Footer', props: {} };
    const pageComponents = pages[activePage] || [];

    // Scroll selected section into view
    useEffect(() => {
        if (activeComponentId) {
            const el = document.querySelector(`[data-canvas-id="${activeComponentId}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
    }, [activeComponentId]);

    // Find which section contains the active block (for highlighting)
    const activeSectionId = React.useMemo(() => {
        if (!activeBlockId) return null;
        const findParent = (components: UIComponentRef[]): string | null => {
            for (const c of components) {
                if (c.blocks?.some(b => b.id === activeBlockId)) return c.id;
                if (c.blocks) {
                    const found = findParent(c.blocks);
                    if (found) return found;
                }
            }
            return null;
        };
        return findParent([...globalComponents, ...pageComponents]);
    }, [activeBlockId, globalComponents, pageComponents]);

    const getIsActive = (id: string) => {
        if (activeBlockId) return activeSectionId === id;
        return activeComponentId === id;
    };

    const getIsBlockActive = (id: string) => activeBlockId !== null && activeSectionId === id;

    return (
        <div className="w-full min-h-[600px] flex flex-col bg-white relative">
            {/* Header */}
            <CanvasBlock
                component={headerComponent as UIComponentRef}
                isActive={getIsActive(headerComponent.id)}
                isBlockSelected={getIsBlockActive(headerComponent.id)}
                onClick={() => {
                    setActiveComponent(headerComponent.id);
                }}
                isLocked={true}
            />

            {/* Page sections */}
            <div className="w-full flex-1 flex flex-col">
                {pageComponents.length === 0 ? (
                    <div className="flex-1 min-h-[300px] flex items-center justify-center p-12 text-zinc-400 border border-dashed border-zinc-200 bg-zinc-50 m-4 rounded-xl">
                        <div className="text-center">
                            <p className="text-sm font-medium text-zinc-500">Trang này chưa có section.</p>
                            <p className="text-xs text-zinc-400 mt-1">Thêm section từ cột bên trái.</p>
                        </div>
                    </div>
                ) : (
                    pageComponents.map((section) => (
                        <CanvasBlock
                            key={section.id}
                            component={section}
                            isActive={getIsActive(section.id)}
                            isBlockSelected={getIsBlockActive(section.id)}
                            onClick={() => setActiveComponent(section.id)}
                        />
                    ))
                )}
            </div>

            {/* Footer */}
            <CanvasBlock
                component={footerComponent as UIComponentRef}
                isActive={getIsActive(footerComponent.id)}
                isBlockSelected={getIsBlockActive(footerComponent.id)}
                onClick={() => setActiveComponent(footerComponent.id)}
                isLocked={true}
            />
        </div>
    );
}

function CanvasBlock({
    component,
    isActive,
    isBlockSelected,
    onClick,
    isLocked = false,
}: {
    component: UIComponentRef;
    isActive: boolean;
    isBlockSelected?: boolean;
    onClick: () => void;
    isLocked?: boolean;
}) {
    const Component = registry[component.componentId];

    if (!Component) {
        return (
            <div className="p-4 bg-red-50 text-red-500 w-full text-center text-sm border border-red-100">
                Unknown component: {component.componentId}
            </div>
        );
    }

    const ringClass = isActive
        ? 'ring-2 ring-emerald-500/80 ring-inset z-10'
        : isBlockSelected
            ? 'ring-2 ring-indigo-400/60 ring-inset z-10'
            : 'hover:ring-2 hover:ring-blue-400/30 hover:ring-inset z-0';

    return (
        <div
            data-canvas-id={component.id}
            className={`relative w-full group transition-all duration-150 cursor-pointer ${ringClass}`}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
            {/* Active indicator badge */}
            {(isActive || isBlockSelected) && (
                <div className={`absolute top-0 right-0 text-white text-[9px] uppercase font-bold px-2 py-0.5 z-20 rounded-bl-md pointer-events-none shadow-sm flex items-center gap-1
                    ${isActive ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                >
                    {isLocked ? '🔒' : isBlockSelected ? 'BLOCK' : component.componentId}
                </div>
            )}

            {/* Hover badge for locked */}
            {!isActive && !isBlockSelected && isLocked && (
                <div className="absolute top-0 right-0 bg-slate-700/80 text-white text-[9px] uppercase font-bold px-2 py-0.5 z-20 rounded-bl-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    🔒
                </div>
            )}

            <div className={isActive ? '' : 'pointer-events-none'}>
                <Component {...(component.props || {})} blocks={component.blocks || []} />
            </div>
        </div>
    );
}
