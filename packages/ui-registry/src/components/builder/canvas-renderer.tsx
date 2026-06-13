"use client"

import React, { useEffect } from "react";
import { useBuilderStore } from "../../store/builder-store";
import { UIComponentRef } from "@ecommerce/schema";
import { registry } from "../../registry";

// Sample data so data-driven page sections (product listing / detail) render a
// realistic preview in the builder instead of "no products" / "not found".
const SAMPLE_PRODUCTS = Array.from({ length: 6 }).map((_, i) => ({
    id: `sample-${i + 1}`,
    name: `Sản phẩm mẫu ${i + 1}`,
    description: 'Đây là mô tả sản phẩm mẫu dùng để xem trước giao diện.',
    basePrice: 19.99 + i * 10,
    images: [] as string[],
    variants: [] as any[],
}));

function previewContextForPage(activePage: string): Record<string, any> {
    if (activePage === 'product_listing') return { products: SAMPLE_PRODUCTS, totalProducts: SAMPLE_PRODUCTS.length };
    if (activePage === 'product_detail') return { product: SAMPLE_PRODUCTS[0], relatedProducts: SAMPLE_PRODUCTS.slice(1, 5) };
    return {};
}

export function CanvasRenderer() {
    // Narrow selectors: subscribing to the whole store re-rendered the entire
    // canvas on every store change (including history pushes).
    const globalComponents = useBuilderStore((s) => s.globalComponents);
    const pages = useBuilderStore((s) => s.pages);
    const activePage = useBuilderStore((s) => s.activePage);
    const activeComponentId = useBuilderStore((s) => s.activeComponentId);
    const activeBlockId = useBuilderStore((s) => s.activeBlockId);
    const setActiveComponent = useBuilderStore((s) => s.setActiveComponent);

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

    const previewContext = previewContextForPage(activePage);

    // The builder is an editor, not a live storefront: clicking a section makes it
    // "active", which restores pointer-events so its child blocks can be selected.
    // But that also lets the section's real links/buttons (Hero CTA, header menu,
    // language/cart, footer links) navigate and kick the owner out of the builder.
    // We cancel the default action in the capture phase so navigation never happens
    // — Next.js <Link> bails when `defaultPrevented`, so SPA nav is blocked too —
    // while still letting the click bubble up to select the section/block.
    const suppressNavigation = (e: React.MouseEvent) => {
        const el = (e.target as HTMLElement)?.closest?.('a, button');
        if (el) e.preventDefault();
    };

    return (
        <div
            className="w-full min-h-[600px] flex flex-col bg-white relative"
            onClickCapture={suppressNavigation}
            onAuxClickCapture={suppressNavigation}
        >
            {/* Header */}
            <CanvasBlock
                component={headerComponent as UIComponentRef}
                isActive={getIsActive(headerComponent.id)}
                isBlockSelected={getIsBlockActive(headerComponent.id)}
                onSelect={setActiveComponent}
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
                            onSelect={setActiveComponent}
                            previewContext={previewContext}
                        />
                    ))
                )}
            </div>

            {/* Footer */}
            <CanvasBlock
                component={footerComponent as UIComponentRef}
                isActive={getIsActive(footerComponent.id)}
                isBlockSelected={getIsBlockActive(footerComponent.id)}
                onSelect={setActiveComponent}
                isLocked={true}
            />
        </div>
    );
}

// Memoized with a stable onSelect so editing one section's props only
// re-renders that section, not the whole canvas.
const CanvasBlock = React.memo(function CanvasBlock({
    component,
    isActive,
    isBlockSelected,
    onSelect,
    isLocked = false,
    previewContext,
}: {
    component: UIComponentRef;
    isActive: boolean;
    isBlockSelected?: boolean;
    onSelect: (id: string) => void;
    isLocked?: boolean;
    previewContext?: Record<string, any>;
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
            onClick={(e) => { e.stopPropagation(); onSelect(component.id); }}
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
                <Component {...(previewContext || {})} {...(component.props || {})} previewMode blocks={component.blocks || []} />
            </div>
        </div>
    );
});
