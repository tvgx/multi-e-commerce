/**
 * storefront.api.ts
 *
 * Centralized fetch functions for the Next.js Storefront (BFF layer).
 * All fetches run on the SERVER (React Server Components) — never exposed to the browser.
 *
 * Cache strategy:
 *  - Layout: revalidate every 60s, tagged by shopId so we can purge on-demand
 *  - Products: revalidate every 30s (stock/pricing changes more often)
 *  - Shop info: revalidate every 300s (rarely changes)
 */

const API_BASE_URL = process.env.API_CORE_URL ?? 'http://localhost:3001';

// ─────────────────────────────────────────
// Types (lightweight — full types live in @ecommerce/schema)
// ─────────────────────────────────────────

export interface ShopInfo {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    primaryColor?: string;
    navLinks?: { label: string; href: string }[];
    owner?: { fullName: string; email: string };
    productsPerPage?: number;
}

export interface ProductCard {
    _id: string;
    name: string;
    title?: string;
    basePrice: number;
    images: string[];
    category?: string;
    variants?: { stock: number }[];
}

export interface ShopProductsResult {
    products: ProductCard[];
    hasMore: boolean;
}

// ─────────────────────────────────────────
// Shop Info
// ─────────────────────────────────────────

/**
 * Fetches shop metadata (name, logo, primary color, nav) by shopId.
 * The shopSlug from the URL is treated as the shopId here.
 * Returns null if shop is not found (caller should render 404).
 */
export async function getShopInfo(shopId: string): Promise<ShopInfo | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/api/shops/${encodeURIComponent(shopId)}`, {
            next: {
                tags: [`shop-${shopId}`],
                revalidate: 300, // 5 minutes
            },
        });

        if (!res.ok) return null;

        const data = await res.json();
        return data?.metadata ?? null;
    } catch (err) {
        console.error(`[storefront.api] getShopInfo failed for shopId=${shopId}`, err);
        return null;
    }
}

// ─────────────────────────────────────────
// Layout
// ─────────────────────────────────────────

/**
 * Fetches and returns the compiled (Master + Tenant merged) Layout JSON for a shop.
 * When the CLI syncs a new layout, NestJS calls Next.js revalidateTag(`layout-${shopId}`)
 * so this cached data is invalidated immediately.
 *
 * Returns null if no layout is configured yet (caller should render fallback).
 */
export async function getShopLayout(shopId: string) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/layouts/${encodeURIComponent(shopId)}`, {
            next: {
                tags: [`layout-${shopId}`],
                revalidate: 60, // 1 minute fallback TTL
            },
        });

        if (!res.ok) return null;

        const body = await res.json();
        if (!body.success) return null;

        return body.data ?? null;
    } catch (err) {
        console.error(`[storefront.api] getShopLayout failed for shopId=${shopId}`, err);
        return null;
    }
}

// ─────────────────────────────────────────
// Products
// ─────────────────────────────────────────

/**
 * Fetches a paginated list of products for a shop with filtering.
 *
 * @param shopId  - the shop's ID (slug)
 * @param options - filtering and pagination options
 */
export async function getShopProducts(
    shopId: string,
    options?: {
        limit?: number;
        lastId?: string;
        search?: string;
        categoryId?: string;
        minPrice?: number;
        maxPrice?: number;
    }
): Promise<ShopProductsResult> {
    try {
        const limit = options?.limit ?? 20;
        const params = new URLSearchParams({ limit: String(limit) });
        if (options?.lastId) params.set('lastId', options.lastId);
        if (options?.search) params.set('search', options.search);
        if (options?.categoryId) params.set('categoryId', options.categoryId);
        if (options?.minPrice !== undefined) params.set('minPrice', String(options.minPrice));
        if (options?.maxPrice !== undefined) params.set('maxPrice', String(options.maxPrice));

        const res = await fetch(
            `${API_BASE_URL}/api/products/shop/${encodeURIComponent(shopId)}?${params}`,
            {
                next: {
                    tags: [`products-${shopId}`],
                    revalidate: 30,
                },
            },
        );

        if (!res.ok) return { products: [], hasMore: false };

        const body = await res.json();
        const products: ProductCard[] = body.data || body || [];

        return {
            products,
            hasMore: products.length === limit,
        };
    } catch (err) {
        console.error(`[storefront.api] getShopProducts failed for shopId=${shopId}`, err);
        return { products: [], hasMore: false };
    }
}

/**
 * Fetches details for a single product by ID.
 *
 * @param shopId  - the shop's ID (slug)
 * @param productId - the product's ID
 */
export async function getShopProductDetails(shopId: string, productId: string) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/products/${encodeURIComponent(productId)}`, {
            next: {
                tags: [`product-${productId}`],
                revalidate: 30,
            },
        });

        if (!res.ok) return null;

        const body = await res.json();
        if (!body.success) return { product: null };

        return { product: body.data };
    } catch (err) {
        console.error(`[storefront.api] getShopProductDetails failed for productId=${productId}`, err);
        return { product: null };
    }
}

/**
 * Fetches order history for a customer by email.
 *
 * @param shopId - the shop's ID (slug)
 * @param email - customer's email
 */
export async function getCustomerOrders(shopId: string, email: string) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/orders/shop/${encodeURIComponent(shopId)}/customer/${encodeURIComponent(email)}`, {
            cache: 'no-store' // Orders should always be fresh
        });

        if (!res.ok) return [];

        const body = await res.json();
        return body.data || [];
    } catch (err) {
        console.error(`[storefront.api] getCustomerOrders failed for email=${email}`, err);
        return [];
    }
}
