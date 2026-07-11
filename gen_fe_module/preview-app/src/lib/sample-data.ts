/**
 * Dữ liệu mẫu để render các "mega section" ăn dữ liệu thật (product listing/detail...) — copy
 * đúng ý tưởng của packages/ui-registry/src/components/builder/canvas-renderer.tsx (preview
 * trong admin builder khi shop chưa có sản phẩm thật), để không phải phụ thuộc DB/API thật.
 */
const SAMPLE_NAMES = [
  "Tai nghe không dây Pro", "Đồng hồ thông minh", "Loa di động mini",
  "Bàn phím cơ RGB", "Sạc nhanh GaN 65W", "Chuột không dây yên tĩnh",
];

export const SAMPLE_PRODUCTS = SAMPLE_NAMES.map((name, i) => ({
  id: `sample-${i + 1}`,
  name,
  description: "Sản phẩm minh hoạ để xem trước giao diện.",
  basePrice: 199000 + i * 150000,
  category: "Sản phẩm nổi bật",
  images: [`https://picsum.photos/seed/gfm-preview-${i + 1}/600/600`],
  variants: [] as unknown[],
}));

const PAGE_CONTEXT_COMPONENT_IDS = new Set([
  "StandardCategoryPage",
  "StandardProductDetail",
  "StandardCheckout",
  "StandardProfile",
  "FeaturedProducts",
  "RecommendedProducts",
  "FeaturedCollectionCarousel",
  "FeaturedCollectionEditorial",
  "FeaturedCollectionGrid",
]);

/** Trả về pageContext (products/product) cần merge vào props nếu componentId cần dữ liệu sản phẩm. */
export function pageContextFor(componentId: string): Record<string, unknown> {
  if (!PAGE_CONTEXT_COMPONENT_IDS.has(componentId)) return {};
  if (componentId === "StandardProductDetail") {
    return { product: SAMPLE_PRODUCTS[0], relatedProducts: SAMPLE_PRODUCTS.slice(1, 5) };
  }
  return { products: SAMPLE_PRODUCTS, totalProducts: SAMPLE_PRODUCTS.length };
}
