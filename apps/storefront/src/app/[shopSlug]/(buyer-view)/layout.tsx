import { getShopInfo, getNavigationMenu } from '@/lib/api/storefront.api';
import React from 'react';
import { CartInitializer } from '@ecommerce/ui-registry/src/components/cart/CartInitializer';
import { CartSidebar } from '@ecommerce/ui-registry/src/components/cart/CartSidebar';
import { CartTrigger } from '@ecommerce/ui-registry/src/components/cart/CartTrigger';
import { SearchBar } from '@ecommerce/ui-registry/src/components/products/SearchBar';

interface Props {
    children: React.ReactNode;
    params: Promise<{ shopSlug: string }>;
}

export default async function BuyerLayout({ children, params }: Props) {
    const { shopSlug } = await params;

    // Parallel fetch for shop info and menus
    const [shopInfo, mainMenu, footerMenu] = await Promise.all([
        getShopInfo(shopSlug),
        getNavigationMenu(shopSlug, 'main-menu'),
        getNavigationMenu(shopSlug, 'footer-menu'),
    ]);

    const shopName = shopInfo?.name || shopSlug.toUpperCase();

    return (
        <div className="flex flex-col min-h-screen">
            {shopInfo?.id && <CartInitializer shopId={shopInfo.id} />}
            <CartSidebar />
            
            {/* ── Header ── */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <a href={`/${shopSlug}`} className="flex items-center gap-2 font-bold text-xl text-slate-800 hover:opacity-80 transition-opacity">
                        {shopInfo?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={shopInfo.logoUrl} alt={shopName} className="h-8 w-auto object-contain" />
                        ) : (
                            <span>{shopName}</span>
                        )}
                    </a>

                    <SearchBar />

                    <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
                        {mainMenu?.items?.map((item: any, idx: number) => (
                            <a key={idx} href={`/${shopSlug}${item.url}`} className="hover:text-emerald-500 transition-colors">
                                {item.title}
                            </a>
                        ))}
                        {!mainMenu && (
                            <a href={`/${shopSlug}/all-products`} className="hover:text-emerald-500 transition-colors">
                                All Products
                            </a>
                        )}
                        <CartTrigger />
                    </nav>
                </div>
            </header>

            {/* ── Main Content ── */}
            <main className="flex-1">{children}</main>

            {/* ── Footer ── */}
            <footer className="border-t border-slate-200 py-12 mt-20">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap justify-between gap-8 mb-8">
                        <div className="max-w-xs">
                            <h3 className="font-bold text-slate-800 mb-4">{shopName}</h3>
                            <p className="text-slate-500 text-sm">Powered by ShopVolo E-commerce Engine.</p>
                        </div>
                        <div className="flex gap-12">
                            {footerMenu?.items && (
                                <div>
                                    <h4 className="text-xs font-bold uppercase text-slate-400 mb-4">Links</h4>
                                    <ul className="space-y-2">
                                        {footerMenu.items.map((item: any, idx: number) => (
                                            <li key={idx}>
                                                <a href={`/${shopSlug}${item.url}`} className="text-sm text-slate-600 hover:text-emerald-500">
                                                    {item.title}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="pt-8 border-t border-slate-100 text-center text-slate-500 text-xs">
                        &copy; {new Date().getFullYear()} {shopName}. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
