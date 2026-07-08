/**
 * Chuẩn hoá dữ liệu sản phẩm cho các section hiển thị hàng thật.
 *
 * `products` context tới từ 2 nguồn có shape hơi khác nhau:
 * - Builder canvas: Prisma product thô (`id`) hoặc SAMPLE_PRODUCTS.
 * - Storefront: ProductCard đã map ở storefront.api (`_id`).
 */
export interface SectionProduct {
    id: string;
    name: string;
    basePrice: number;
    image?: string;
    description?: string;
    category?: string;
}

export function normalizeProducts(products?: any[]): SectionProduct[] {
    if (!Array.isArray(products)) return [];
    return products
        .filter((p) => p && (p.id || p._id))
        .map((p) => ({
            id: String(p.id ?? p._id),
            name: p.name || p.title || 'Sản phẩm',
            basePrice:
                typeof p.basePrice === 'number'
                    ? p.basePrice
                    : Math.min(...((p.variants || []).map((v: any) => v.price).filter((x: any) => typeof x === 'number') ?? [0]), Infinity) || 0,
            image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : p.imageUrl || undefined,
            description: p.description,
            category: typeof p.category === 'string' ? p.category : p.category?.name,
        }));
}

/** Link tới trang chi tiết sản phẩm, tôn trọng base path của shop. */
export function productHref(basePath: string | undefined, productId: string): string {
    return `${basePath || ''}/products/${productId}`;
}
