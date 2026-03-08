import dynamic from 'next/dynamic';
import React from 'react';
import { CustomerLayout, UIComponentRef } from '@ecommerce/schema';

// 1. Component Registry Map
// This maps the string 'componentId' from the JSON database to actual React Components.
// We use next/dynamic to ensure chunks are only loaded if they exist in the user's layout.

const ComponentRegistry: Record<string, React.ComponentType<any>> = {
    // Banners
    Hero: dynamic(() => import('@/components/sections/banners/Hero')),
    HeroBottomAligned: dynamic(() => import('@/components/sections/banners/HeroBottomAligned')),
    HeroMarquee: dynamic(() => import('@/components/sections/banners/HeroMarquee')),
    LargeLogo: dynamic(() => import('@/components/sections/banners/LargeLogo')),
    LayeredSlideshow: dynamic(() => import('@/components/sections/banners/LayeredSlideshow')),
    SlideshowFullFrame: dynamic(() => import('@/components/sections/banners/SlideshowFullFrame')),
    SlideshowInset: dynamic(() => import('@/components/sections/banners/SlideshowInset')),
    SplitShowcase: dynamic(() => import('@/components/sections/banners/SplitShowcase')),

    // Collections
    CollectionLinksSpotlight: dynamic(() => import('@/components/sections/collections/CollectionLinksSpotlight')),
    CollectionLinksText: dynamic(() => import('@/components/sections/collections/CollectionLinksText')),
    CollectionListsBento: dynamic(() => import('@/components/sections/collections/CollectionListsBento')),
    CollectionListsCarousel: dynamic(() => import('@/components/sections/collections/CollectionListsCarousel')),
    CollectionListsEditorial: dynamic(() => import('@/components/sections/collections/CollectionListsEditorial')),
    CollectionListsGrid: dynamic(() => import('@/components/sections/collections/CollectionListsGrid')),

    // Products
    FeaturedCollectionCarousel: dynamic(() => import('@/components/sections/products/FeaturedCollectionCarousel')),
    FeaturedCollectionEditorial: dynamic(() => import('@/components/sections/products/FeaturedCollectionEditorial')),
    FeaturedCollectionGrid: dynamic(() => import('@/components/sections/products/FeaturedCollectionGrid')),
    FeaturedProducts: dynamic(() => import('@/components/sections/products/FeaturedProducts')),
    ProductHighlight: dynamic(() => import('@/components/sections/products/ProductHighlight')),
    ProductHotspot: dynamic(() => import('@/components/sections/products/ProductHotspot')),
    RecommendedProducts: dynamic(() => import('@/components/sections/products/RecommendedProducts')),
    // Note: AllProductsGrid is mocked below since it hasn't been implemented in the components library yet.
    AllProductsGrid: dynamic(() => Promise.resolve(() => <div className="p-10 border bg-gray-50 text-center">All Products Grid Placeholder</div>)),

    // Storytelling
    BlogPostCarousel: dynamic(() => import('@/components/sections/storytelling/BlogPostCarousel')),
    BlogPostEditorial: dynamic(() => import('@/components/sections/storytelling/BlogPostEditorial')),
    BlogPostGrid: dynamic(() => import('@/components/sections/storytelling/BlogPostGrid')),
    Carousel: dynamic(() => import('@/components/sections/storytelling/Carousel')),
    Editorial: dynamic(() => import('@/components/sections/storytelling/Editorial')),
    EditorialJumboText: dynamic(() => import('@/components/sections/storytelling/EditorialJumboText')),
    ImageCompare: dynamic(() => import('@/components/sections/storytelling/ImageCompare')),
    ImageWithText: dynamic(() => import('@/components/sections/storytelling/ImageWithText')),

    // Text
    FAQ: dynamic(() => import('@/components/sections/text/FAQ')),
    IconsWithText: dynamic(() => import('@/components/sections/text/IconsWithText')),
    Marquee: dynamic(() => import('@/components/sections/text/Marquee')),
    Multicolumn: dynamic(() => import('@/components/sections/text/Multicolumn')),
    PullQuote: dynamic(() => import('@/components/sections/text/PullQuote')),
    RichText: dynamic(() => import('@/components/sections/text/RichText')),

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
    layout: CustomerLayout;
    pageKey: string; // e.g. 'home', 'catalog', 'productDetail'
}

/**
 * Renders an entire Page wrapped in the Global Layout (Header/Footer)
 */
export function LayoutRenderer({ layout, pageKey }: LayoutRendererProps) {
    const pageComponents = layout.pages?.[pageKey] || [];

    return (
        <div
            className="storefront-layout-wrapper flex flex-col min-h-screen"
            style={{
                '--theme-primary': layout.metadata?.primaryColor || '#000',
                fontFamily: layout.metadata?.fontFamily || 'Inter, sans-serif'
            } as React.CSSProperties}
        >
            {/* Global Header */}
            <DynamicRenderer components={layout.global?.header} />

            {/* Main Page Content */}
            <main className="flex-grow">
                <DynamicRenderer components={pageComponents} />
            </main>

            {/* Global Footer */}
            <DynamicRenderer components={layout.global?.footer} />
        </div>
    );
}
