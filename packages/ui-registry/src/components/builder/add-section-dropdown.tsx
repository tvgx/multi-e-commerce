"use client"

import React, { useState, useRef, useMemo } from "react";
import { Plus, ChevronDown, ChevronRight, LayoutTemplate, Image as ImageIcon, Type, Grid, Box, BookOpen, MessageSquare, Star, Columns, X, Search } from "lucide-react";
import { useBuilderStore } from "../../store/builder-store";

// Preview images served from Next.js admin public folder
const PREVIEW_MAP: Record<string, string> = {
    Hero: '/section-previews/banners/hero/media__1780241741556.png',
    HeroBottomAligned: '/section-previews/banners/header_bottom_aligned/media__1780242455808.png',
    HeroMarquee: '/section-previews/banners/hero_marquee/media__1780242500657.png',
    LargeLogo: '/section-previews/banners/large_logo/media__1780242605027.png',
    LayeredSlideshow: '/section-previews/banners/layered_slideshow/media__1780242704303.png',
    SlideshowFullFrame: '/section-previews/banners/slideshow_full_frame/media__1780243337620.png',
    SlideshowInset: '/section-previews/banners/slideshow_inset/media__1780243401235.png',
    SplitShowcase: '/section-previews/banners/spilt_showcase/media__1780243767084.png',
    CollectionLinksSpotlight: '/section-previews/collections/spotlight/media__1780243921637.png',
    CollectionLinksText: '/section-previews/collections/collection_links_text/media__1780243988798.png',
    CollectionListsBento: '/section-previews/collections/collection_list_bento/media__1780244009660.png',
    CollectionListsCarousel: '/section-previews/collections/collection_list_carousel/media__1780244076381.png',
    CollectionListsEditorial: '/section-previews/collections/collection_list_editorial/media__1780244182514.png',
    CollectionListsGrid: '/section-previews/collections/collection_list_grid/media__1780244223854.png',
    FeaturedCollectionCarousel: '/section-previews/collections/featured_collection_carousel/media__1780244610965.png',
    FeaturedCollectionEditorial: '/section-previews/collections/featured_collection_editorial/media__1780244720003.png',
    FeaturedCollectionGrid: '/section-previews/collections/featured_collection_grid/media__1780244766344.png',
    FeaturedProducts: '/section-previews/products/featured_product/media__1780244789282.png',
    ProductHighlight: '/section-previews/products/product_highlight/media__1780244827534.png',
    ProductHotspot: '/section-previews/products/product_hotspot/media__1780244931591.png',
    RecommendedProducts: '/section-previews/products/recommended_products/media__1780244951786.png',
};

type CatalogEntry = { componentId: string; label: string; category: string; pages?: string[] };

const SECTION_CATALOG: CatalogEntry[] = [
    // Page-level sections — only offered on the matching page so owners can't
    // drop a product-detail layout onto the home page.
    { componentId: 'StandardCategoryPage', label: 'Danh sách sản phẩm', category: 'Trang sản phẩm', pages: ['product_listing'] },
    { componentId: 'StandardProductDetail', label: 'Chi tiết sản phẩm', category: 'Trang sản phẩm', pages: ['product_detail'] },
    { componentId: 'Hero', label: 'Image Banner', category: 'Banners' },
    { componentId: 'HeroBottomAligned', label: 'Hero: Căn dưới', category: 'Banners' },
    { componentId: 'HeroMarquee', label: 'Hero: Chữ chạy', category: 'Banners' },
    { componentId: 'LargeLogo', label: 'Logo lớn', category: 'Banners' },
    { componentId: 'LayeredSlideshow', label: 'Slideshow xếp lớp', category: 'Banners' },
    { componentId: 'SlideshowFullFrame', label: 'Slideshow toàn màn hình', category: 'Banners' },
    { componentId: 'SlideshowInset', label: 'Slideshow thu nhỏ', category: 'Banners' },
    { componentId: 'SplitShowcase', label: 'Showcase chia đôi', category: 'Banners' },
    { componentId: 'CollectionLinksSpotlight', label: 'Danh mục: Spotlight', category: 'Collections' },
    { componentId: 'CollectionLinksText', label: 'Danh mục: Text', category: 'Collections' },
    { componentId: 'CollectionListsBento', label: 'Danh mục: Bento Grid', category: 'Collections' },
    { componentId: 'CollectionListsCarousel', label: 'Danh mục: Carousel', category: 'Collections' },
    { componentId: 'CollectionListsEditorial', label: 'Danh mục: Editorial', category: 'Collections' },
    { componentId: 'CollectionListsGrid', label: 'Danh mục: Grid', category: 'Collections' },
    { componentId: 'FeaturedCollectionCarousel', label: 'Featured Collection Carousel', category: 'Products' },
    { componentId: 'FeaturedCollectionEditorial', label: 'Featured Collection Editorial', category: 'Products' },
    { componentId: 'FeaturedCollectionGrid', label: 'Featured Collection Grid', category: 'Products' },
    { componentId: 'FeaturedProducts', label: 'Sản phẩm nổi bật', category: 'Products' },
    { componentId: 'ProductHighlight', label: 'Product Highlight', category: 'Products' },
    { componentId: 'ProductHotspot', label: 'Product Hotspot', category: 'Products' },
    { componentId: 'RecommendedProducts', label: 'Sản phẩm gợi ý', category: 'Products' },
    { componentId: 'BlogPostCarousel', label: 'Bài viết (Carousel)', category: 'Storytelling' },
    { componentId: 'BlogPostEditorial', label: 'Bài viết (Editorial)', category: 'Storytelling' },
    { componentId: 'BlogPostGrid', label: 'Bài viết (Grid)', category: 'Storytelling' },
    { componentId: 'Carousel', label: 'Carousel Cơ bản', category: 'Storytelling' },
    { componentId: 'Editorial', label: 'Editorial', category: 'Storytelling' },
    { componentId: 'EditorialJumboText', label: 'Editorial (Chữ lớn)', category: 'Storytelling' },
    { componentId: 'ImageCompare', label: 'So sánh ảnh (Trước/Sau)', category: 'Storytelling' },
    { componentId: 'ImageWithText', label: 'Ảnh kèm Chữ', category: 'Storytelling' },
    { componentId: 'FAQ', label: 'Hỏi đáp (FAQ)', category: 'Text' },
    { componentId: 'IconsWithText', label: 'Icon kèm Chữ', category: 'Text' },
    { componentId: 'Marquee', label: 'Chữ chạy (Marquee)', category: 'Text' },
    { componentId: 'Multicolumn', label: 'Nhiều cột', category: 'Text' },
    { componentId: 'PullQuote', label: 'Trích dẫn', category: 'Text' },
    { componentId: 'RichText', label: 'Đoạn văn bản', category: 'Text' },
    { componentId: 'AnnouncementBar', label: 'Thanh thông báo', category: 'Text' },
];

const CATEGORY_ICON: Record<string, React.ElementType> = {
    'Trang sản phẩm': LayoutTemplate,
    Banners: ImageIcon,
    Collections: Grid,
    Products: Star,
    Storytelling: BookOpen,
    Text: Type,
    Forms: MessageSquare,
    Other: LayoutTemplate,
};

interface AddSectionDropdownProps {
    insertIndex?: number;
}

export function AddSectionDropdown({ insertIndex }: AddSectionDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<typeof SECTION_CATALOG[number] & { previewImage?: string | null } | null>(null);
    const [previewTop, setPreviewTop] = useState(200);
    const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(['Banners']));
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const addPageSection = useBuilderStore(s => s.addPageSection);
    const activePage = useBuilderStore(s => s.activePage);
    const availableSchemas = useBuilderStore(s => s.availableSchemas);

    const enriched = useMemo(() => {
        const schemaMap = new Map(availableSchemas.map((s: any) => [s.componentId, s]));
        return SECTION_CATALOG
            // Hide sections restricted to other pages (e.g. a product-detail
            // mega-component should not show up on the home page).
            .filter(sec => !sec.pages || sec.pages.includes(activePage))
            .map(sec => ({
                ...sec,
                previewImage: (schemaMap.get(sec.componentId) as any)?.mediaUrl || PREVIEW_MAP[sec.componentId] || null,
            }));
    }, [availableSchemas, activePage]);

    const filtered = useMemo(() => {
        if (!search) return enriched;
        const q = search.toLowerCase();
        return enriched.filter(s => s.label.toLowerCase().includes(q) || s.componentId.toLowerCase().includes(q));
    }, [enriched, search]);

    const grouped = useMemo(() => {
        const map: Record<string, typeof enriched> = {};
        filtered.forEach(s => {
            if (!map[s.category]) map[s.category] = [];
            map[s.category].push(s);
        });
        return map;
    }, [filtered]);

    const handleAdd = (componentId: string) => {
        addPageSection(activePage, componentId, insertIndex);
        setIsOpen(false);
        setHoveredItem(null);
    };

    const handleMouseEnter = (item: typeof enriched[number], e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPreviewTop(rect.top + rect.height / 2);
        setHoveredItem(item);
    };

    const toggleCat = (cat: string) => {
        setExpandedCats(prev => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat); else next.add(cat);
            return next;
        });
    };

    const getSidebarRight = (): number => {
        let el = containerRef.current as HTMLElement | null;
        while (el) {
            if (el.getAttribute('data-builder-panel') === 'left') {
                return el.getBoundingClientRect().right;
            }
            el = el.parentElement;
        }
        return 320;
    };

    const close = () => { setIsOpen(false); setHoveredItem(null); setSearch(''); };

    return (
        <div ref={containerRef} className="w-full">
            <button
                onClick={() => { setIsOpen(v => !v); if (isOpen) close(); }}
                className={`w-full py-2 flex items-center justify-center gap-2 text-sm font-medium rounded-lg transition-all border
                    ${isOpen
                        ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40'
                        : 'text-indigo-400 hover:bg-accent border-dashed border-border hover:border-indigo-500/50'
                    }`}
            >
                <Plus className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`} />
                Thêm section
            </button>

            {isOpen && (
                <div className="mt-1.5 rounded-xl border border-border bg-popover overflow-hidden shadow-xl">
                    {/* Search */}
                    <div className="p-2 border-b border-border flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/60" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Tìm section..."
                                autoFocus
                                className="w-full bg-secondary/60 border border-border rounded-md pl-7 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500/40 transition-colors"
                            />
                        </div>
                        <button onClick={close} className="p-1 text-muted-foreground/60 hover:text-foreground transition-colors rounded">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Section list */}
                    <div className="max-h-[300px] overflow-y-auto">
                        {Object.entries(grouped).length === 0 && (
                            <p className="text-center text-muted-foreground/60 text-xs py-8">Không tìm thấy section</p>
                        )}
                        {Object.entries(grouped).map(([cat, items]) => {
                            const CatIcon = CATEGORY_ICON[cat] || LayoutTemplate;
                            const expanded = expandedCats.has(cat) || !!search;
                            return (
                                <div key={cat}>
                                    <button
                                        onClick={() => toggleCat(cat)}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent transition-colors group"
                                    >
                                        <CatIcon className="w-3 h-3 text-indigo-400/70 shrink-0" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex-1 text-left group-hover:text-foreground/70">{cat}</span>
                                        <span className="text-[9px] text-muted-foreground/50 mr-1">{items.length}</span>
                                        {expanded
                                            ? <ChevronDown className="w-2.5 h-2.5 text-muted-foreground/50" />
                                            : <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/50" />
                                        }
                                    </button>
                                    {expanded && items.map(item => (
                                        <button
                                            key={item.componentId}
                                            onClick={() => handleAdd(item.componentId)}
                                            onMouseEnter={(e) => handleMouseEnter(item, e)}
                                            onMouseLeave={() => setHoveredItem(null)}
                                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-indigo-500/10 transition-colors text-left group/item border-l-2 border-transparent hover:border-indigo-500/40"
                                        >
                                            <CatIcon className="w-3 h-3 text-muted-foreground/60 group-hover/item:text-indigo-400 shrink-0 transition-colors" />
                                            <span className="text-xs text-muted-foreground group-hover/item:text-foreground transition-colors flex-1 truncate">{item.label}</span>
                                            <Plus className="w-3 h-3 text-muted-foreground/50 opacity-0 group-hover/item:opacity-100 group-hover/item:text-indigo-400 transition-all shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Floating preview — positioned to the right of the sidebar */}
            {isOpen && hoveredItem && (
                <div
                    className="fixed z-[200] rounded-xl shadow-2xl border border-zinc-200/80 overflow-hidden pointer-events-none bg-white"
                    style={{
                        left: getSidebarRight() + 12,
                        top: Math.max(60, previewTop - 150),
                        width: 480,
                        maxHeight: 320,
                    }}
                >
                    {hoveredItem.previewImage ? (
                        <img
                            src={hoveredItem.previewImage}
                            alt={hoveredItem.label}
                            className="w-full object-cover object-top"
                            style={{ maxHeight: 280 }}
                        />
                    ) : (
                        <div className="w-full h-48 bg-zinc-50 flex flex-col items-center justify-center gap-3 text-zinc-400">
                            <LayoutTemplate className="w-10 h-10 opacity-20" />
                            <span className="text-sm font-medium text-zinc-500">{hoveredItem.label}</span>
                            <span className="text-xs text-zinc-400">Chưa có ảnh preview</span>
                        </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                        <p className="text-white text-sm font-semibold">{hoveredItem.label}</p>
                        <p className="text-white/60 text-xs">{hoveredItem.category}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
