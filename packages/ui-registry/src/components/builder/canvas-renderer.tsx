"use client"

import React, { useEffect } from "react";
import { useBuilderStore } from "../../store/builder-store";
import { UIComponentRef } from "@ecommerce/schema";
import { registry } from "../../registry";

// Styled sample catalog so data-driven sections (product listing / detail /
// featured) render a realistic, populated preview even before the owner adds
// any products — same idea as the Haravan demo theme. Used only as a fallback
// when the shop has no real products yet (see `previewProducts` below).
const SAMPLE_NAMES = [
    'Tai nghe không dây Pro', 'Đồng hồ thông minh', 'Loa di động mini',
    'Bàn phím cơ RGB', 'Sạc nhanh GaN 65W', 'Chuột không dây yên tĩnh',
];
const SAMPLE_PRODUCTS = SAMPLE_NAMES.map((name, i) => ({
    id: `sample-${i + 1}`,
    name,
    description: 'Sản phẩm minh hoạ để xem trước giao diện. Thêm sản phẩm thật để hiển thị ở đây.',
    basePrice: 199000 + i * 150000,
    category: 'Sản phẩm nổi bật',
    images: [`https://picsum.photos/seed/omni-demo-${i + 1}/600/600`],
    variants: [] as any[],
}));

// sectionsTODO 2: các section rất cao (hero 600px, slideshow 100vh, mega page
// min-h-screen) chiếm trọn canvas làm khó thao tác. Khi KHÔNG được chọn, thu
// gọn về maxHeight dưới đây (kèm fade); click chọn section → bung đầy đủ.
const CANVAS_COLLAPSED_MAX_HEIGHT: Record<string, number> = {
    Hero: 420,
    HeroBottomAligned: 420,
    HeroMarquee: 420,
    LargeLogo: 320,
    LayeredSlideshow: 460,
    SlideshowFullFrame: 460,
    SlideshowInset: 460,
    SplitShowcase: 460,
    FeaturedCollectionEditorial: 560,
    FeaturedProducts: 560,
    StandardProductDetail: 720,
    StandardCategoryPage: 720,
};

function previewContextForPage(activePage: string, products: any[]): Record<string, any> {
    if (activePage === 'product_listing') return { products, totalProducts: products.length };
    if (activePage === 'product_detail') return { product: products[0], relatedProducts: products.slice(1, 5) };
    // Home (and any other page): expose products too so featured/recommended
    // sections that read a `products` prop stay populated.
    return { products, totalProducts: products.length };
}

export function CanvasRenderer({ previewProducts }: { previewProducts?: any[] } = {}) {
    // Narrow selectors: subscribing to the whole store re-rendered the entire
    // canvas on every store change (including history pushes).
    const globalComponents = useBuilderStore((s) => s.globalComponents);
    const pages = useBuilderStore((s) => s.pages);
    const activePage = useBuilderStore((s) => s.activePage);
    const activeComponentId = useBuilderStore((s) => s.activeComponentId);
    const activeBlockId = useBuilderStore((s) => s.activeBlockId);
    const setActiveComponent = useBuilderStore((s) => s.setActiveComponent);
    const theme = useBuilderStore((s) => s.theme) as Record<string, any>;

    // Mirror the storefront layout: expose the merchant theme as CSS variables so
    // `brand`/`button` utilities (and section backgrounds/fonts) resolve to the
    // chosen colors right inside the builder preview. Defaults match the
    // storefront fallbacks so an un-themed shop looks identical to production.
    const bodyFont = theme.bodyFont || theme.fontFamily;
    const themeStyle = {
        '--theme-primary': theme.primaryColor || '#059669',
        '--theme-bg': theme.backgroundColor || '#ffffff',
        '--theme-text': theme.textColor || '#111111',
        '--theme-button': theme.buttonColor || theme.primaryColor || '#059669',
        '--theme-button-text': theme.buttonTextColor || '#ffffff',
        '--theme-heading-font': theme.headingFont || bodyFont,
        '--theme-body-font': bodyFont,
        backgroundColor: theme.backgroundColor || '#ffffff',
        color: theme.textColor || undefined,
        fontFamily: bodyFont || undefined,
    } as React.CSSProperties;

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

    // Prefer the shop's real products; fall back to the styled sample catalog so
    // a brand-new (empty) shop still previews as a populated store.
    const hasRealProducts = !!(previewProducts && previewProducts.length);
    const previewProductData = hasRealProducts ? previewProducts! : SAMPLE_PRODUCTS;
    const previewContext = previewContextForPage(activePage, previewProductData);

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
            className="w-full min-h-[600px] flex flex-col relative"
            style={themeStyle}
            onClickCapture={suppressNavigation}
            onAuxClickCapture={suppressNavigation}
        >
            {/* Demo-data hint: shown while the shop has no real products yet, so the
                owner understands the products on screen are placeholders. */}
            {!hasRealProducts && (
                <div className="pointer-events-none absolute top-2 left-2 z-30 rounded-full bg-slate-900/80 text-white text-[10px] font-semibold px-2.5 py-1 shadow-sm backdrop-blur-sm">
                    Dữ liệu minh hoạ — thêm sản phẩm để hiển thị hàng thật
                </div>
            )}

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
                    <div className="flex-1 min-h-[320px] flex items-center justify-center p-12 text-zinc-400 border border-dashed border-zinc-200 bg-zinc-50 m-4 rounded-xl">
                        <div className="text-center max-w-sm">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-2xl" aria-hidden="true">🧩</div>
                            <p className="text-sm font-semibold text-zinc-600">Trang này chưa có nội dung</p>
                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                Thêm section đầu tiên bằng nút <span className="font-medium text-zinc-600">“Thêm section”</span> ở cột bên trái —
                                ví dụ banner, danh sách sản phẩm hay bộ sưu tập.
                            </p>
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

            {(() => {
                const collapsedMax = CANVAS_COLLAPSED_MAX_HEIGHT[component.componentId];
                const collapsed = !!collapsedMax && !isActive && !isBlockSelected;
                return (
                    <div
                        className={`${isActive ? '' : 'pointer-events-none'} ${collapsed ? 'relative overflow-hidden' : ''}`}
                        style={collapsed ? { maxHeight: collapsedMax } : undefined}
                    >
                        <Component {...(previewContext || {})} {...(component.props || {})} previewMode blocks={(component.blocks || []).filter((b) => !b.isHidden)} />
                        {collapsed && (
                            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/90 to-transparent flex items-end justify-center pb-1">
                                <span className="text-[10px] font-medium text-slate-500 bg-white/80 rounded-full px-2 py-0.5 shadow-sm">
                                    Đã thu gọn — bấm để xem đầy đủ
                                </span>
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
});
