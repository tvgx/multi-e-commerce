import React from 'react';

// The Search Header for the Buyer View
export default function BuyerLayout({ children, params }: { children: React.ReactNode, params: Promise<{ shopSlug: string }> }) {
    const { shopSlug } = React.use(params);
    return (
        <div className="flex flex-col min-h-screen">
            {/* Header with Search */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="font-bold text-xl text-slate-800">
                        {shopSlug.toUpperCase()}
                    </div>

                    <div className="flex-1 max-w-xl px-8">
                        {/* Auto-fitting Search Logic would go here (Fetch all products into Zustand and filter on typings) */}
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full bg-slate-100 border-none rounded-full px-6 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>

                    <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
                        <a href={`/${shopSlug}/all-products`} className="hover:text-emerald-500 transition-colors">All Products</a>
                        <a href={`/${shopSlug}/cart`} className="hover:text-emerald-500 transition-colors">Cart</a>
                        <a href={`/${shopSlug}/profile`} className="hover:text-emerald-500 transition-colors">Profile</a>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 py-12 mt-20">
                <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
                    &copy; {new Date().getFullYear()} {shopSlug}. Powered by E-commerce OS.
                </div>
            </footer>
        </div>
    );
}
