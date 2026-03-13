import { ProductCard } from "@ecommerce/ui-registry";

async function getProducts() {
    try {
        const res = await fetch('http://localhost:3001/api/products/shop/demo-shop-123', {
            cache: 'no-store' // Always fetch latest for this MVP
        });
        if (!res.ok) return null;
        return res.json();
    } catch (e) {
        console.error("Fetch failed", e);
        return null;
    }
}

export default async function Catalog() {
    const dbProducts = await getProducts();

    let products: { id: string, name: string, price: number, imageUrl?: string, slug: string }[] = [];
    if (dbProducts && (dbProducts as any[]).length > 0) {
        products = (dbProducts as any[]).map((p: Record<string, any>) => ({
            id: p._id,
            name: p.name,
            price: p.basePrice?.value || 0,
            imageUrl: p.images?.[0] ? `/${p.images[0]}` : undefined,
            slug: p._id,
        }));
    } else {
        // Fallback to dummy data if DB empty or backend offline
        products = Array.from({ length: 8 }).map((_, i) => ({
            id: `cat-p${i}`,
            name: `Fallback Product ${i + 1}`,
            price: 59.99, // Removed Math.random() impure function during render
            imageUrl: `https://images.unsplash.com/photo-${1500000000000 + i * 1000}?auto=format&fit=crop&w=500&q=60`,
            slug: `product-${i + 1}`
        }));
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-4xl font-bold mb-8">All Products</h1>
            <div className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
                {products.map((product) => (
                    <ProductCard key={product.id} {...product} />
                ))}
            </div>
        </div>
    );
}
