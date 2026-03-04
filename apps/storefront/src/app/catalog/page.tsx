import { ProductCard } from "@ecommerce/ui-registry";

export default function Catalog() {
    const products = Array.from({ length: 12 }).map((_, i) => ({
        id: `cat-p${i}`,
        name: `Product Name ${i + 1}`,
        price: parseFloat((Math.random() * 100 + 20).toFixed(2)),
        imageUrl: `https://images.unsplash.com/photo-${1500000000000 + i * 1000}?auto=format&fit=crop&w=500&q=60`, // placeholder
        slug: `product-${i + 1}`
    }));

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
