import React from 'react';
import Link from 'next/link';
import { ProductCardProps } from './product-card';
import { ProductCard } from './product-card';

export interface FeaturedCollectionProps {
    title?: string;
    description?: string;
    products?: ProductCardProps[];
    viewAllLink?: string;
}

export const FeaturedCollection: React.FC<FeaturedCollectionProps> = ({
    title = 'Featured Collection',
    description = 'Check out our latest arrivals.',
    products = [],
    viewAllLink = '/catalog'
}) => {
    return (
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 space-y-4 md:space-y-0">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                            {title}
                        </h2>
                        {description && (
                            <p className="mt-4 text-lg text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                    {viewAllLink && (
                        <Link
                            href={viewAllLink}
                            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors hidden md:block"
                        >
                            Shop the collection &rarr;
                        </Link>
                    )}
                </div>

                <div className="mt-8 grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
                    {products.map((product) => (
                        <ProductCard key={product.id} {...product} />
                    ))}
                </div>

                {viewAllLink && (
                    <div className="mt-10 md:hidden block">
                        <Link
                            href={viewAllLink}
                            className="w-full flex justify-center items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-muted transition-colors"
                        >
                            Shop the collection
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
};
