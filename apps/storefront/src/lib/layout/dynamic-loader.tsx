import dynamic from 'next/dynamic';
import React from 'react';
import { ShopLayout, UIComponentRef } from '@ecommerce/schema';

// 1. Component Registry Map
// This maps the string 'componentId' from the JSON database to actual React Components.
// We use next/dynamic to ensure chunks are only loaded if they exist in the user's layout.

const ComponentRegistry: Record<string, React.ComponentType<any>> = {
    // Banners
    Hero: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/banners/Hero').then(m => m.Hero)),
    HeroBottomAligned: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/banners/HeroBottomAligned').then(m => m.HeroBottomAligned)),
    HeroMarquee: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/banners/HeroMarquee').then(m => m.HeroMarquee)),
    LargeLogo: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/banners/LargeLogo').then(m => m.LargeLogo)),
    LayeredSlideshow: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/banners/LayeredSlideshow').then(m => m.LayeredSlideshow)),
    SlideshowFullFrame: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/banners/SlideshowFullFrame').then(m => m.SlideshowFullFrame)),
    SlideshowInset: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/banners/SlideshowInset').then(m => m.SlideshowInset)),
    SplitShowcase: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/banners/SplitShowcase').then(m => m.SplitShowcase)),

    // Collections
    CollectionLinksSpotlight: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/collections/CollectionLinksSpotlight').then(m => m.CollectionLinksSpotlight)),
    CollectionLinksText: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/collections/CollectionLinksText').then(m => m.CollectionLinksText)),
    CollectionListsBento: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/collections/CollectionListsBento').then(m => m.CollectionListsBento)),
    CollectionListsCarousel: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/collections/CollectionListsCarousel').then(m => m.CollectionListsCarousel)),
    CollectionListsEditorial: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/collections/CollectionListsEditorial').then(m => m.CollectionListsEditorial)),
    CollectionListsGrid: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/collections/CollectionListsGrid').then(m => m.CollectionListsGrid)),

    // Products
    FeaturedCollectionCarousel: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/products/FeaturedCollectionCarousel').then(m => m.FeaturedCollectionCarousel)),
    FeaturedCollectionEditorial: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/products/FeaturedCollectionEditorial').then(m => m.FeaturedCollectionEditorial)),
    FeaturedCollectionGrid: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/products/FeaturedCollectionGrid').then(m => m.FeaturedCollectionGrid)),
    FeaturedProducts: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/products/FeaturedProducts').then(m => m.FeaturedProducts)),
    ProductHighlight: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/products/ProductHighlight').then(m => m.ProductHighlight)),
    ProductHotspot: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/products/ProductHotspot').then(m => m.ProductHotspot)),
    RecommendedProducts: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/products/RecommendedProducts').then(m => m.RecommendedProducts)),
    // Note: AllProductsGrid is mocked below since it hasn't been implemented in the components library yet.
    AllProductsGrid: dynamic(() => Promise.resolve(() => <div className="p-10 border bg-gray-50 text-center">All Products Grid Placeholder</div>)),

    // Storytelling
    BlogPostCarousel: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/storytelling/BlogPostCarousel').then(m => m.BlogPostCarousel)),
    BlogPostEditorial: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/storytelling/BlogPostEditorial').then(m => m.BlogPostEditorial)),
    BlogPostGrid: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/storytelling/BlogPostGrid').then(m => m.BlogPostGrid)),
    Carousel: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/storytelling/Carousel').then(m => m.Carousel)),
    Editorial: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/storytelling/Editorial').then(m => m.Editorial)),
    EditorialJumboText: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/storytelling/EditorialJumboText').then(m => m.EditorialJumboText)),
    ImageCompare: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/storytelling/ImageCompare').then(m => m.ImageCompare)),
    ImageWithText: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/storytelling/ImageWithText').then(m => m.ImageWithText)),

    // Text
    FAQ: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/text/FAQ').then(m => m.FAQ)),
    IconsWithText: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/text/IconsWithText').then(m => m.IconsWithText)),
    Marquee: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/text/Marquee').then(m => m.Marquee)),
    Multicolumn: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/text/Multicolumn').then(m => m.Multicolumn)),
    PullQuote: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/text/PullQuote').then(m => m.PullQuote)),
    RichText: dynamic(() => import('@ecommerce/ui-registry/src/components/sections/text/RichText').then(m => m.RichText)),

    // Global Elements (Mocked for now)
    StandardHeader: dynamic(() => Promise.resolve(() => <header className="p-4 bg-white border-b shadow-sm"><h1 className="text-xl font-bold">Store Header</h1></header>)),
    StandardFooter: dynamic(() => Promise.resolve(() => <footer className="p-8 bg-black text-white text-center mt-20"><p>© 2026 E-commerce Platform</p></footer>))
};


interface DynamicRendererProps {
    components: UIComponentRef[];
    pageContext?: any;
}

/**
 * Renders an array of UIComponentRef objects.
 */
export function DynamicRenderer({ components, pageContext }: DynamicRendererProps) {
    if (!components || components.length === 0) return null;

    return (
        <>
            {components.map((comp, idx) => {
                const ComponentConstructor = ComponentRegistry[comp.componentId];

                if (!ComponentConstructor) {
                    console.warn(`[DynamicRenderer] Component ${comp.componentId} not found in registry.`);
                    return (
                        <div key={`${comp.componentId}-${idx}`} className="p-4 bg-red-50 text-red-600 border border-red-200 my-4 text-center">
                            Missing Component: {comp.componentId}
                        </div>
                    );
                }

                return (
                    <ComponentConstructor
                        key={`${comp.componentId}-${idx}`}
                        {...comp.props}
                        {...pageContext}
                    />
                );
            })}
        </>
    );
}

interface LayoutRendererProps {
    layout: ShopLayout;
    pageKey: string; // e.g. 'home', 'catalog', 'productDetail'
}

/**
 * Renders an entire Page Content within the shop's styling.
 * Global elements (Header/Footer) are now managed by BuyerLayout.tsx
 */
export function LayoutRenderer({ layout, pageKey }: LayoutRendererProps) {
    const pageComponents = layout.pages?.[pageKey] || [];

    return (
        <div
            className="storefront-layout-wrapper"
            style={{
                '--theme-primary': layout.metadata?.primaryColor || '#000',
                fontFamily: layout.metadata?.fontFamily || 'Inter, sans-serif'
            } as React.CSSProperties}
        >
            {/* Main Page Content */}
            <main className="flex-grow">
                <DynamicRenderer components={pageComponents} />
            </main>
        </div>
    );
}
