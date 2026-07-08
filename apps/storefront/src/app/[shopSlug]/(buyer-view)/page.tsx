import { LayoutRenderer } from '@/lib/layout/dynamic-loader';
import { getShopPageLayout, getShopInfo, getShopProducts } from '@/lib/api/storefront.api';
import { notFound } from 'next/navigation';
import { getT } from '@/lib/i18n';
import React from 'react';

interface Props {
    params: Promise<{ shopSlug: string }>;
}

export default async function ShopHomePage({ params }: Props) {
    const { shopSlug } = await params;

    // Fetch layout, shop info and products in parallel — all server-side only.
    // Products đi vào pageContext để các section sản phẩm (FeaturedProducts,
    // RecommendedProducts, FeaturedCollection*) hiển thị hàng THẬT thay vì demo.
    const [pageLayout, shopInfo, { products }] = await Promise.all([
        getShopPageLayout(shopSlug, 'home'),
        getShopInfo(shopSlug),
        getShopProducts(shopSlug, { limit: 12 }),
    ]);

    // If no shop exists at all, show Next.js 404 page
    if (!shopInfo) {
        notFound();
    }

    // If shop exists but has no layout configured yet, show a friendly fallback
    if (!pageLayout) {
        const t = await getT('shop');
        const tc = await getT('common');

        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="text-6xl mb-6">🛍️</div>
                <h1 className="text-3xl font-bold text-slate-800 mb-3">
                    {shopInfo.name || shopSlug.toUpperCase()}
                </h1>
                <p className="text-slate-500 max-w-md">
                    {t('storefront.settingUp')}
                </p>
                <a
                    href={`/${shopSlug}/all-products`}
                    className="mt-8 bg-brand text-white px-8 py-3 rounded-full font-medium hover:bg-brand/90 transition-colors"
                >
                    {tc('buttons.browseProducts')}
                </a>
            </div>
        );
    }

    // Full dynamic render driven by the merged Layout JSON from NestJS
    return (
        <LayoutRenderer
            pageLayout={pageLayout}
            pageContext={{
                products,
                totalProducts: products.length,
                basePath: `/${shopSlug}`,
                shopInfo,
            }}
        />
    );
}
