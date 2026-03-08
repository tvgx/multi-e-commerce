import { getShopInfo } from '@/lib/api/storefront.api';
import React from 'react';

interface Props {
    children: React.ReactNode;
    params: Promise<{ shopSlug: string }>;
}

/**
 * Buyer Layout — React Server Component (RSC)
 *
 * Fetches real shop info (name, logo, primaryColor) from the API.
 * Falls back gracefully to the shopSlug if the API is down.
 */
export default async function BuyerLayout({ children, params }: Props) {
    const { shopSlug } = await params;

    // Server-side fetch — cached 5 minutes, invalidated via revalidateTag(`shop-${shopSlug}`)
    const shopInfo = await getShopInfo(shopSlug);

    const shopName = shopInfo?.name || shopSlug.toUpperCase();
    const primaryColor = shopInfo?.primaryColor || '#10b981'; // emerald-500 default

    return (
        <div className="flex flex-col min-h-screen">
            {/* ── Header ── */}
            <header
                className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm"
            >
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    {/* Shop Logo / Name */}
                    <a
                        href={`/${shopSlug}`}
                        className="flex items-center gap-2 font-bold text-xl text-slate-800 hover:opacity-80 transition-opacity"
                    >
                        {shopInfo?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={shopInfo.logoUrl}
                                alt={shopName}
                                className="h-8 w-auto object-contain"
                            />
                        ) : (
                            <span>{shopName}</span>
                        )}
                    </a>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-xl px-8">
                        <input
                            type="text"
                            placeholder={`Search in ${shopName}...`}
                            className="w-full bg-slate-100 border-none rounded-full px-6 py-2 text-sm focus:ring-2 outline-none transition-shadow"
                            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                        />
                    </div>

                    {/* Nav Links */}
                    <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
                        <a
                            href={`/${shopSlug}/all-products`}
                            className="hover:text-emerald-500 transition-colors"
                        >
                            All Products
                        </a>
                        <a
                            href={`/${shopSlug}/cart`}
                            className="hover:text-emerald-500 transition-colors"
                        >
                            Cart
                        </a>
                        <a
                            href={`/${shopSlug}/profile`}
                            className="hover:text-emerald-500 transition-colors"
                        >
                            Profile
                        </a>
                    </nav>
                </div>
            </header>

            {/* ── Main Content ── */}
            <main className="flex-1">{children}</main>

            {/* ── Footer ── */}
            <footer className="border-t border-slate-200 py-12 mt-20">
                <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
                    &copy; {new Date().getFullYear()}{' '}
                    <span className="font-medium text-slate-700">{shopName}</span>
                    {'. '}Powered by E-commerce OS.
                </div>
            </footer>
        </div>
    );
}
