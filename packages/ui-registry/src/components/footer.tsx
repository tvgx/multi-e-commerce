import React from 'react';
import Link from 'next/link';

export interface FooterProps {
    brandName?: string;
    description?: string;
    utilities?: {
        label: string;
        href: string;
    }[];
}

export const Footer: React.FC<FooterProps> = ({
    brandName = 'STOREFRONT',
    description = 'Making styling easy.',
    utilities = [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Shipping Info', href: '/shipping' },
        { label: 'Returns', href: '/returns' }
    ]
}) => {
    return (
        <footer className="bg-background border-t">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="xl:grid xl:grid-cols-3 xl:gap-8">
                    <div className="space-y-8 xl:col-span-1">
                        <Link href="/" className="text-xl font-bold tracking-tighter">
                            {brandName}
                        </Link>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            {description}
                        </p>
                        <div className="flex space-x-6">
                            {/* Social icons could go here */}
                        </div>
                    </div>
                    <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
                        <div className="md:grid md:grid-cols-2 md:gap-8">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">
                                    Utilities
                                </h3>
                                <ul role="list" className="mt-4 space-y-4">
                                    {utilities.map((item) => (
                                        <li key={item.label}>
                                            <Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                                {item.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-12 border-t border-muted pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} {brandName}, Inc. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};
