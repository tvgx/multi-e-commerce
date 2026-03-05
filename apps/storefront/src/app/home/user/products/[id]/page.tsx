import React from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

export default async function ProductDetails({ params }: { params: { id: string } }) {
    return (
        <div className="container mx-auto px-4 py-12 md:py-20 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
                {/* Product Image */}
                <div className="aspect-[4/5] sm:aspect-square lg:aspect-[4/5] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                        src={`https://images.unsplash.com/photo-1572804013427-4d7ca7268217?auto=format&fit=crop&w=800&q=80`}
                        alt="Product cover"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Product Info */}
                <div className="mt-10 px-4 sm:px-0 lg:mt-0">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Premium Product {params.id}
                    </h1>
                    <div className="mt-3">
                        <h2 className="sr-only">Product information</h2>
                        <p className="text-3xl tracking-tight text-foreground">$129.99</p>
                    </div>

                    <div className="mt-6">
                        <h3 className="sr-only">Description</h3>
                        <div className="space-y-6 text-base text-muted-foreground">
                            <p>This is a highly durable and stylish product perfect for everyday use. It features premium materials and expert craftsmanship designed to last a lifetime.</p>
                        </div>
                    </div>

                    <form className="mt-8">
                        <div className="flex sm:flex-col1">
                            <button
                                type="submit"
                                className="max-w-xs flex-1 bg-primary border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary sm:w-full transition-colors"
                            >
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                Add to bag
                            </button>
                        </div>
                    </form>

                    {/* Details */}
                    <section aria-labelledby="details-heading" className="mt-12 border-t pt-8">
                        <h2 id="details-heading" className="text-sm font-medium text-foreground mb-4">
                            Detailed Features
                        </h2>
                        <ul role="list" className="list-disc leading-7 text-muted-foreground pl-5 space-y-2">
                            <li>High-quality materials</li>
                            <li>Hand-finished details</li>
                            <li>Ethically sourced</li>
                            <li>Lifetime warranty</li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
}
