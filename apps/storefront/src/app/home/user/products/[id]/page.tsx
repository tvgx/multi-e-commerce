import React from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

async function getProductDetails(id: string) {
    try {
        const res = await fetch(`http://localhost:3001/api/products/${id}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return res.json();
    } catch (e) {
        console.error("Failed to fetch product details", e);
        return null;
    }
}

export default async function ProductDetails({ params }: { params: { id: string } }) {
    const product = await getProductDetails(params.id);

    if (!product) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold">Product Not Found</h1>
                <Link href="/catalog" className="text-emerald-500 hover:underline mt-4 inline-block">Back to Catalog</Link>
            </div>
        );
    }

    const price = product.basePrice?.value || 0;
    const currency = product.basePrice?.currency || 'USD';
    const mainImage = product.images?.[0] ? `/${product.images[0]}` : 'https://images.unsplash.com/photo-1572804013427-4d7ca7268217?auto=format&fit=crop&w=800&q=80';

    return (
        <div className="container mx-auto px-4 py-12 md:py-20 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
                {/* Product Image */}
                <div className="aspect-[4/5] sm:aspect-square lg:aspect-[4/5] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                        src={mainImage}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Product Info */}
                <div className="mt-10 px-4 sm:px-0 lg:mt-0">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        {product.name}
                    </h1>
                    <div className="mt-3">
                        <h2 className="sr-only">Product information</h2>
                        <p className="text-3xl tracking-tight text-foreground">{price} {currency}</p>
                    </div>

                    <div className="mt-6">
                        <h3 className="sr-only">Description</h3>
                        <div
                            className="space-y-6 text-base text-muted-foreground"
                            dangerouslySetInnerHTML={{ __html: product.description || 'No description available.' }}
                        />
                    </div>

                    <form className="mt-8">
                        <div className="flex sm:flex-col1">
                            <button
                                type="button"
                                className="max-w-xs flex-1 bg-black border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary sm:w-full transition-colors"
                            >
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                Add to bag
                            </button>
                        </div>
                    </form>

                    {/* Details */}
                    {product.attributes && product.attributes.length > 0 && (
                        <section aria-labelledby="details-heading" className="mt-12 border-t pt-8">
                            <h2 id="details-heading" className="text-sm font-medium text-foreground mb-4">
                                Detailed Features
                            </h2>
                            <ul role="list" className="list-none text-muted-foreground space-y-2">
                                {product.attributes.map((attr: any, idx: number) => (
                                    <li key={idx} className="flex"><span className="font-medium w-32">{attr.name}:</span> {attr.value}</li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
