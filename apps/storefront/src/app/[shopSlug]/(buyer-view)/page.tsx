import { LayoutRenderer } from '@/lib/layout/dynamic-loader';
import { getShopPageLayout, getShopInfo } from '@/lib/api/storefront.api';
import { notFound } from 'next/navigation';
import React from 'react';

interface Props {
    params: Promise<{ shopSlug: string }>;
}

export default async function ShopHomePage({ params }: Props) {
    const { shopSlug } = await params;

    // Fetch layout and shop info in parallel — both are server-side only
    const [pageLayout, shopInfo] = await Promise.all([
        getShopPageLayout(shopSlug, 'home'),
        getShopInfo(shopSlug),
    ]);

    // If no shop exists at all, show Next.js 404 page
    if (!shopInfo) {
        notFound();
    }

    // If shop exists but has no layout configured yet, show a friendly fallback
    if (!pageLayout) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="text-6xl mb-6">🛍️</div>
                <h1 className="text-3xl font-bold text-slate-800 mb-3">
                    {shopInfo.name || shopSlug.toUpperCase()}
                </h1>
                <p className="text-slate-500 max-w-md">
                    This shop is setting up its storefront. Check back soon!
                </p>
                <a
                    href={`/${shopSlug}/all-products`}
                    className="mt-8 bg-emerald-500 text-white px-8 py-3 rounded-full font-medium hover:bg-emerald-600 transition-colors"
                >
                    Browse Products
                </a>
            </div>
        );
    }

    // Full dynamic render driven by the merged Layout JSON from NestJS
    return <LayoutRenderer pageLayout={pageLayout} />;
}

