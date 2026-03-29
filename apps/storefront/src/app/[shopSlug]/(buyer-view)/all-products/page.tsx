import { getShopProducts, getShopInfo } from '@/lib/api/storefront.api';
import React from 'react';
import { FiltersSidebar } from '@ecommerce/ui-registry/src/components/products/FiltersSidebar';

interface Props {
    params: Promise<{ shopSlug: string }>;
    searchParams?: Promise<{
        search?: string;
        category?: string;
        minPrice?: string;
        maxPrice?: string;
    }>;
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
    const { search, category, minPrice, maxPrice } = resolvedParams;

    // Fetch products and shop info in parallel
    // We first need the shop info to know the products per page
    const shopInfo = await getShopInfo(shopSlug);
    const limit = shopInfo?.productsPerPage || 30;

    const { products } = await getShopProducts(shopSlug, {
        limit,
        search,
        categoryId: category,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });

    const shopName = shopInfo?.name || shopSlug.toUpperCase();

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">All Products</h1>
            <p className="text-slate-500 mb-8">
                {products.length > 0
                    ? `${products.length} products found`
                    : `No products yet in ${shopName}`}
            </p>

            <div className="flex flex-col md:flex-row gap-8">
                {/* ── Filters Sidebar ── */}
                <FiltersSidebar 
                    categories={[...new Set(products.map((p) => p.category).filter(Boolean))] as string[]}
                />

                {/* ── Product Grid ── */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
                    {products.length === 0 ? (
                        <div className="col-span-full h-64 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-3">
                            <span className="text-4xl">📦</span>
                            <p>No products available yet.</p>
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
                                            <img
                                                src={thumbnail}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300 text-4xl">
                                                🖼️
                                            </div>
                                        )}
                                        {!inStock && (
                                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                                <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full">
                                                    Out of Stock
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-4">
                                        <p className="text-xs text-slate-400 mb-1">{product.category}</p>
                                        <h2 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-emerald-600 transition-colors">
                                            {product.name || product.title}
                                        </h2>
                                        <p className="font-bold text-emerald-600">
                                            {product.basePrice.toLocaleString('vi-VN')}đ
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
