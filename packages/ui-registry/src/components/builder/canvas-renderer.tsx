"use client"

import React from "react";
import { useBuilderStore } from "../../store/builder-store";
import { UIComponentRef } from "@ecommerce/schema";
import { registry } from "../../registry";

export function CanvasRenderer() {
    const { globalComponents, pages, activePage, activeComponentId, setActiveComponent } = useBuilderStore();

    // Separate Header and Footer from globalComponents
    const headerComponent = globalComponents.find(c => c.componentId === 'Header') || { id: 'header-placeholder', componentId: 'Header', props: {} };
    const footerComponent = globalComponents.find(c => c.componentId === 'Footer') || { id: 'footer-placeholder', componentId: 'Footer', props: {} };

    const pageComponents = pages[activePage] || [];

    return (
        <div className="w-full min-h-[500px] flex flex-col items-center bg-white overflow-hidden shadow-2xl relative border-t-8 border-indigo-500">
            {/* Locked Header */}
            <CanvasBlock
                component={headerComponent as UIComponentRef}
                isActive={activeComponentId === headerComponent.id}
                onClick={() => setActiveComponent(headerComponent.id)}
                isLocked={true}
            />

            {/* Page Content Area */}
            <div className="w-full flex-1 flex flex-col min-h-[300px]">
                {pageComponents.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-12 text-zinc-400 border border-dashed border-zinc-200 bg-zinc-50 m-4 rounded-lg">
                        Trang này chưa có block nào. Chọn "Add Section" từ menu bên phải.
                    </div>
                ) : (
                    pageComponents.map((section) => (
                        <CanvasBlock
                            key={section.id}
                            component={section}
                            isActive={activeComponentId === section.id}
                            onClick={() => setActiveComponent(section.id)}
                        />
                    ))
                )}
            </div>

            {/* Locked Footer */}
            <CanvasBlock
                component={footerComponent as UIComponentRef}
                isActive={activeComponentId === footerComponent.id}
                onClick={() => setActiveComponent(footerComponent.id)}
                isLocked={true}
            />
        </div>
    );
}

// Inner component to handle styling of "Active" vs "Inactive" states in Builder Mode
function CanvasBlock({
    component,
    isActive,
    onClick,
    isLocked = false
}: {
    component: UIComponentRef;
    isActive: boolean;
    onClick: () => void;
    isLocked?: boolean;
}) {
    const Component = registry[component.componentId];

    if (!Component) {
        return <div className="p-4 bg-red-50 text-red-500 w-full text-center">Unknown component: {component.componentId}</div>;
    }

    return (
        <div
            className={`relative w-full group transition-all duration-200 cursor-pointer
        ${isActive ? 'ring-2 ring-emerald-500/80 ring-inset z-10' : 'hover:ring-2 hover:ring-blue-400/50 hover:ring-inset z-0'}
      `}
            onClick={(e) => {
                e.stopPropagation(); // Prevent bubbling up to un-click
                onClick();
            }}
        >
            {/* Visual Indicator of Active/Edit mode */}
            {isActive && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] uppercase font-bold px-2 py-1 z-20 rounded-bl-lg pointer-events-none shadow-sm flex items-center gap-1">
                    {isLocked ? "🔒 CỐ ĐỊNH" : `CHỈNH SỬA: ${component.componentId}`}
                </div>
            )}
            
            {/* Hover indicator for locked elements */}
            {!isActive && isLocked && (
                 <div className="absolute top-0 right-0 bg-slate-800 text-white text-[10px] uppercase font-bold px-2 py-1 z-20 rounded-bl-lg pointer-events-none shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                 🔒 CỐ ĐỊNH
             </div>
            )}

            {/* To allow clicks inside the canvas to select the component without triggering links, we wrapper it */}
            <div className="pointer-events-none">
                <Component {...(component.props || {})} />
            </div>
        </div>
    );
}
