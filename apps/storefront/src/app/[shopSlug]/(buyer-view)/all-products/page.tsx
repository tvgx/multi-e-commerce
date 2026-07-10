import { getShopProducts, getShopInfo, getShopCategories, recordSearchHistory } from '@/lib/api/storefront.api';
import { cookies } from 'next/headers';
import React from 'react';
import { FiltersSidebar } from '@ecommerce/ui-registry/src/components/products/FiltersSidebar';
import { SmartImage } from '@ecommerce/ui-registry/src/components/blocks/SmartImage';
import { formatPrice } from '@ecommerce/ui-registry/src/lib/format';
import { getT } from '@/lib/i18n';
import { shopUrl } from '@/lib/seo';
import type { Metadata } from 'next';

interface Props {
    params: Promise<{ shopSlug: string }>;
    searchParams?: Promise<{
        q?: string;
        search?: string;
        category?: string;
        minPrice?: string;
        maxPrice?: string;
    }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const { shopSlug } = await params;
    const sp = searchParams ? await searchParams : {};
    const filtered = !!(sp.q || sp.search || sp.category || sp.minPrice || sp.maxPrice);
    return {
        title: 'Tất cả sản phẩm',
        description: 'Khám phá toàn bộ sản phẩm của cửa hàng.',
        // Filtered / search views are near-duplicates → don't index them, but
        // canonicalise back to the clean listing so link equity consolidates.
        alternates: { canonical: shopUrl(shopSlug, '/all-products') },
        ...(filtered ? { robots: { index: false, follow: true } } : {}),
    };
}

/**
 * All Products Page — React Server Component (RSC)
 *
 * Fetches real product list from the NestJS backend.
 * Products are cached server-side (30s TTL) and tagged for on-demand invalidation.
 */
export default async function AllProductsPage({ params, searchParams }: Props) {
    const { shopSlug } = await params;
    
    // Resolve search params
    const resolvedParams = searchParams ? await searchParams : {};
    const { q, search, category, minPrice, maxPrice } = resolvedParams;
    const finalSearch = q || search;

    // Fetch products and shop info in parallel
    // We first need the shop info to know the products per page
    const shopInfo = await getShopInfo(shopSlug);
    const limit = shopInfo?.productsPerPage || 30;

    const [{ products }, categoryOptions] = await Promise.all([
        getShopProducts(shopSlug, {
            limit,
            search: finalSearch,
            categoryId: category,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
        }),
        getShopCategories(shopSlug),
    ]);

    // Khách đăng nhập + có từ khoá → lưu lịch sử tìm kiếm (fire-and-forget)
    if (finalSearch) {
        const token = (await cookies()).get(`shop_session_${shopSlug}`)?.value;
        if (token) void recordSearchHistory(shopSlug, token, finalSearch);
    }

    const shopName = shopInfo?.name || shopSlug.toUpperCase();
    const t = await getT('shop');

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {finalSearch ? t('products.searchResults', { query: finalSearch }) : t('products.allProducts')}
            </h1>
            <p className="text-slate-500 mb-8">
                {products.length > 0
                    ? t('products.countFound', { count: products.length })
                    : finalSearch
                        ? t('products.noResultsFor', { query: finalSearch })
                        : t('products.noneInShop', { shop: shopName })}
            </p>

            <div className="flex flex-col md:flex-row gap-8">
                {/* ── Filters Sidebar ── */}
                <FiltersSidebar
                    categories={categoryOptions}
                />

                {/* ── Product Grid ── */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
                    {products.length === 0 ? (
                        <div className="col-span-full h-64 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-3">
                            <span className="text-4xl" aria-hidden="true">📦</span>
                            <p>{t('products.noneAvailable')}</p>
                        </div>
                    ) : (
                        products.map((product) => {
                            const thumbnail = product.images?.[0] ?? null;
                            const totalStock = product.variants?.reduce(
                                (sum, v) => sum + (v.stock ?? 0),
                                0,
                            );
                            const inStock = !totalStock || totalStock > 0;

                            return (
                                <a
                                    key={product._id}
                                    href={`/${shopSlug}/products/${product._id}`}
                                    className="group bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow duration-200"
                                >
                                    {/* Product Image */}
                                    <div className="relative h-52 bg-slate-50 overflow-hidden">
                                        {thumbnail ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <SmartImage
                                                src={thumbnail}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                sizes="(min-width: 768px) 25vw, 50vw"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300 text-4xl" role="img" aria-label={t('products.noImageAria')}>
                                                <span aria-hidden="true">🖼️</span>
                                            </div>
                                        )}
                                        {!inStock && (
                                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                                <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full">
                                                    {t('products.outOfStock')}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-4">
                                        <p className="text-xs text-slate-400 mb-1">{product.category}</p>
                                        <h2 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-brand transition-colors">
                                            {product.name || product.title}
                                        </h2>
                                        <p className="font-bold text-brand">
                                            {formatPrice(product.basePrice)}
                                        </p>
                                    </div>
                                </a>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
