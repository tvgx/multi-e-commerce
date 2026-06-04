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

const API_BASE_URL =
    process.env.API_CORE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3000';

// ─────────────────────────────────────────
// Types (lightweight — full types live in @ecommerce/schema)
// ─────────────────────────────────────────

export interface ShopInfo {
    id: string;
    name: string;
    slug: string;
    templateType?: string;
    logoUrl?: string;
    primaryColor?: string;
    navLinks?: { label: string; href: string }[];
    owner?: { fullName: string; email: string };
    productsPerPage?: number;
    paymentMethods?: any[];
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

interface ResolvedShop {
    id: string;
    domain?: string | null;
    name?: string;
}

export async function getShopBootstrapData(shopIdentifier: string): Promise<any | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/api/shops/bootstrap/${encodeURIComponent(shopIdentifier)}`, {
            next: {
                tags: [`shop-bootstrap-${shopIdentifier}`],
                revalidate: 60, // 1 minute revalidate
            },
        });

        if (!res.ok) return null;

        const body = await res.json();
        return body?.data ?? null;
    } catch (err) {
        console.error(`[storefront.api] getShopBootstrapData failed for identifier=${shopIdentifier}`, err);
        return null;
    }
}

function getTenantHeaders(shopId: string): HeadersInit {
    return {
        'x-shop-id': shopId,
    };
}

export async function resolveShopContext(shopIdentifier: string): Promise<ResolvedShop | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/api/shops/resolve/${encodeURIComponent(shopIdentifier)}`, {
            next: {
                tags: [`shop-resolve-${shopIdentifier}`],
                revalidate: 120,
            },
        });

        if (!res.ok) return null;

        const body = await res.json();
        return body?.data ?? null;
    } catch (err) {
        console.error(`[storefront.api] resolveShopContext failed for identifier=${shopIdentifier}`, err);
        return null;
    }
}

// ─────────────────────────────────────────
// Shop Info
// ─────────────────────────────────────────

/**
 * Fetches shop metadata (name, logo, primary color, nav) by shopId.
 * The shopSlug from the URL is treated as the shopId here.
 * Returns null if shop is not found (caller should render 404).
 */
export async function getShopInfo(shopIdentifier: string): Promise<ShopInfo | null> {
    try {
        const resolvedShop = await resolveShopContext(shopIdentifier);
        if (!resolvedShop?.id) return null;

        const shopId = resolvedShop.id;
        const res = await fetch(`${API_BASE_URL}/api/shops/${encodeURIComponent(shopId)}`, {
            headers: getTenantHeaders(shopId),
            next: {
                tags: [`shop-${shopId}`],
                revalidate: 300, // 5 minutes
            },
        });

        if (!res.ok) return null;

        const data = await res.json();
        const metadata = data?.data?.metadata;
        if (metadata) {
            metadata.paymentMethods = data?.data?.paymentMethods || [];
        }
        return metadata ?? null;
    } catch (err) {
        console.error(`[storefront.api] getShopInfo failed for shopIdentifier=${shopIdentifier}`, err);
        return null;
    }
}

// ─────────────────────────────────────────
// Layout
// ─────────────────────────────────────────

/**
 * Fetches and returns the compiled Global Layout JSON for a shop.
 * Returns null if no layout is configured yet.
 */
export async function getShopGlobalLayout(shopIdentifier: string) {
    try {
        const resolvedShop = await resolveShopContext(shopIdentifier);
        if (!resolvedShop?.id) return null;

        const shopId = resolvedShop.id;
        const res = await fetch(`${API_BASE_URL}/api/layouts/${encodeURIComponent(shopId)}/global`, {
            headers: getTenantHeaders(shopId),
            next: {
                tags: [`layout-${shopId}-global`],
                revalidate: 60, // 1 minute fallback TTL
            },
        });

        if (!res.ok) return null;

        const body = await res.json();
        if (!body.success) return null;

        return body.data ?? null;
    } catch (err) {
        console.error(`[storefront.api] getShopGlobalLayout failed for shopIdentifier=${shopIdentifier}`, err);
        return null;
    }
}

/**
 * Fetches and returns the compiled Page Layout JSON for a specific page type.
 * Returns null if no layout is configured yet.
 */
export async function getShopPageLayout(shopIdentifier: string, pageType: string, slug?: string) {
    try {
        const resolvedShop = await resolveShopContext(shopIdentifier);
        if (!resolvedShop?.id) return null;

        const shopId = resolvedShop.id;
        let url = `${API_BASE_URL}/api/layouts/${encodeURIComponent(shopId)}/page/${encodeURIComponent(pageType)}`;
        if (slug) {
            url += `?slug=${encodeURIComponent(slug)}`;
        }

        const res = await fetch(url, {
            headers: getTenantHeaders(shopId),
            next: {
                tags: [`layout-${shopId}-page-${pageType}`],
                revalidate: 60,
            },
        });

        if (!res.ok) return null;

        const body = await res.json();
        if (!body.success) return null;

        return body.data ?? null;
    } catch (err) {
        console.error(`[storefront.api] getShopPageLayout failed for shopIdentifier=${shopIdentifier}, pageType=${pageType}`, err);
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
    shopIdentifier: string,
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
        const resolvedShop = await resolveShopContext(shopIdentifier);
        if (!resolvedShop?.id) return { products: [], hasMore: false };

        const shopId = resolvedShop.id;
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
                headers: getTenantHeaders(shopId),
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
        console.error(`[storefront.api] getShopProducts failed for shopIdentifier=${shopIdentifier}`, err);
        return { products: [], hasMore: false };
    }
}

/**
 * Fetches details for a single product by ID.
 *
 * @param shopId  - the shop's ID (slug)
 * @param productId - the product's ID
 */
export async function getShopProductDetails(shopIdentifier: string, productId: string) {
    try {
        const resolvedShop = await resolveShopContext(shopIdentifier);
        if (!resolvedShop?.id) return { product: null };

        const shopId = resolvedShop.id;
        const res = await fetch(`${API_BASE_URL}/api/products/${encodeURIComponent(productId)}`, {
            headers: getTenantHeaders(shopId),
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
 * Fetches order history for the authenticated customer.
 *
 * @param shopIdentifier - the shop's ID (slug)
 * @param token - customer's session token
 */
export async function getMyOrders(shopIdentifier: string, token: string) {
    try {
        const resolvedShop = await resolveShopContext(shopIdentifier);
        if (!resolvedShop?.id) return [];

        const shopId = resolvedShop.id;
        const res = await fetch(`${API_BASE_URL}/api/orders/my`, {
            headers: {
                ...getTenantHeaders(shopId),
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store' // Orders should always be fresh
        });

        if (!res.ok) return [];

        const body = await res.json();
        return body.data || [];
    } catch (err) {
        console.error(`[storefront.api] getMyOrders failed`, err);
        return [];
    }
}

/**
 * Fetches profile for the authenticated customer.
 *
 * @param shopIdentifier - the shop's ID (slug)
 * @param token - customer's session token
 */
export async function getMyProfile(shopIdentifier: string, token: string) {
    try {
        const resolvedShop = await resolveShopContext(shopIdentifier);
        if (!resolvedShop?.id) return null;

        const shopId = resolvedShop.id;
        const res = await fetch(`${API_BASE_URL}/api/storefront-auth/me`, {
            headers: {
                ...getTenantHeaders(shopId),
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store'
        });

        if (!res.ok) return null;

        const body = await res.json();
        return body.data || null;
    } catch (err) {
        console.error(`[storefront.api] getMyProfile failed`, err);
        return null;
    }
}

/**
 * Fetches wishlist for the authenticated customer.
 *
 * @param shopIdentifier - the shop's ID (slug)
 * @param token - customer's session token
 */
export async function getWishlist(shopIdentifier: string, token: string) {
    try {
        const resolvedShop = await resolveShopContext(shopIdentifier);
        if (!resolvedShop?.id) return [];

        const shopId = resolvedShop.id;
        const res = await fetch(`${API_BASE_URL}/api/interactions/wishlist`, {
            headers: {
                ...getTenantHeaders(shopId),
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store'
        });

        if (!res.ok) return [];

        const body = await res.json();
        return body.data || [];
    } catch (err) {
        console.error(`[storefront.api] getWishlist failed`, err);
        return [];
    }
}

// ─────────────────────────────────────────
// Navigation, Collections, and Pages
// ─────────────────────────────────────────

export async function getNavigationMenu(shopIdentifier: string, handle: string) {
    try {
        const resolvedShop = await resolveShopContext(shopIdentifier);
        if (!resolvedShop?.id) return null;

        const shopId = resolvedShop.id;
        const res = await fetch(`${API_BASE_URL}/api/navigation/${handle}?shopId=${shopId}`, {
            headers: getTenantHeaders(shopId),
            next: { revalidate: 300, tags: [`nav-${shopId}-${handle}`] }
        });
        if (!res.ok) return null;
        const body = await res.json();
        return body.data || null;
    } catch (err) {
        console.error(`[storefront.api] getNavigationMenu failed`, err);
        return null;
    }
}

export async function getCollectionBySlug(shopIdentifier: string, slug: string) {
    try {
        const resolvedShop = await resolveShopContext(shopIdentifier);
        if (!resolvedShop?.id) return null;

        const shopId = resolvedShop.id;
        const res = await fetch(`${API_BASE_URL}/api/collections/${slug}?shopId=${shopId}`, {
            headers: getTenantHeaders(shopId),
            next: { revalidate: 30, tags: [`collection-${shopId}-${slug}`] }
        });
        if (!res.ok) return null;
        const body = await res.json();
        return body.data || null;
    } catch (err) {
        console.error(`[storefront.api] getCollectionBySlug failed`, err);
        return null;
    }
}

export async function getShopPageBySlug(shopIdentifier: string, slug: string) {
    try {
        const resolvedShop = await resolveShopContext(shopIdentifier);
        if (!resolvedShop?.id) return null;

        const shopId = resolvedShop.id;
        const res = await fetch(`${API_BASE_URL}/api/pages/${slug}?shopId=${shopId}`, {
            headers: getTenantHeaders(shopId),
            next: { revalidate: 60, tags: [`page-${shopId}-${slug}`] }
        });
        if (!res.ok) return null;
        const body = await res.json();
        return body.data || null;
    } catch (err) {
        console.error(`[storefront.api] getShopPageBySlug failed`, err);
        return null;
    }
}
