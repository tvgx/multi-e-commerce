import { LayoutRenderer } from '@/lib/layout/dynamic-loader';
import { getShopPageLayout, getShopInfo, getShopProducts, getShopBootstrapData } from '@/lib/api/storefront.api';
import { notFound } from 'next/navigation';
import { getT, getLocale } from '@/lib/i18n';
import { shopUrl } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import type { Metadata } from 'next';
import React from 'react';

interface Props {
    params: Promise<{ shopSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { shopSlug } = await params;
    // Home canonical points at the shop root (dedupes subdomain/custom-domain).
    return { alternates: { canonical: shopUrl(shopSlug) } };
}

export default async function ShopHomePage({ params }: Props) {
    const { shopSlug } = await params;

    // Fetch layout, shop info and products in parallel — all server-side only.
    // Products đi vào pageContext để các section sản phẩm (FeaturedProducts,
    // RecommendedProducts, FeaturedCollection*) hiển thị hàng THẬT thay vì demo.
    // getShopBootstrapData is deduped with the layout's call (same request).
    const [pageLayout, shopInfo, { products }, bootstrap, locale] = await Promise.all([
        getShopPageLayout(shopSlug, 'home'),
        getShopInfo(shopSlug),
        getShopProducts(shopSlug, { limit: 12 }),
        getShopBootstrapData(shopSlug),
        getLocale(),
    ]);

    // If no shop exists at all, show Next.js 404 page
    if (!shopInfo) {
        notFound();
    }

    // Structured data: Store + WebSite (with a SearchAction so Google can surface
    // a sitelinks search box). Rendered inline on the first HTML response.
    const home = shopUrl(shopSlug);
    const theme = bootstrap?.globalLayout?.theme || {};
    const logo = theme.logoUrl || theme.faviconUrl || undefined;
    const socials = Object.values((theme.social || {}) as Record<string, string>).filter(Boolean);
    const storeJsonLd = <JsonLd data={[
        {
            '@context': 'https://schema.org',
            '@type': 'Store',
            name: shopInfo.name,
            url: home,
            ...(logo ? { logo, image: logo } : {}),
            ...(socials.length ? { sameAs: socials } : {}),
        },
        {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: shopInfo.name,
            url: home,
            potentialAction: {
                '@type': 'SearchAction',
                target: `${shopUrl(shopSlug, '/all-products')}?q={search_term_string}`,
                'query-input': 'required name=search_term_string',
            },
        },
    ]} />;

    // If shop exists but has no layout configured yet, show a friendly fallback
    if (!pageLayout) {
        const t = await getT('shop');
        const tc = await getT('common');

        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                {storeJsonLd}
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
        <>
            {storeJsonLd}
            <LayoutRenderer
                pageLayout={pageLayout}
                pageContext={{
                    products,
                    totalProducts: products.length,
                    basePath: `/${shopSlug}`,
                    locale,
                    shopInfo,
                }}
            />
        </>
    );
}
