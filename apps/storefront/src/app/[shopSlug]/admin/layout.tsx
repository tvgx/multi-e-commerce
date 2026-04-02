import React from 'react';

// Sidebar Layout for the Shop Admin view
export default function ShopAdminLayout({ children, params }: { children: React.ReactNode, params: Promise<{ shopSlug: string }> }) {
    const { shopSlug } = React.use(params);
    return (
        <div className="flex h-screen bg-slate-950 text-slate-100">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-emerald-500">Shop Admin</h2>
                    <p className="text-xs text-slate-400 mt-1">{shopSlug}</p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <a href={`/${shopSlug}/admin/overview`} className="block px-4 py-2 rounded-lg hover:bg-slate-800 text-sm">Overview</a>
                    <a href={`/${shopSlug}/admin/products`} className="block px-4 py-2 rounded-lg hover:bg-slate-800 text-sm">Products</a>
                    <a href={`/${shopSlug}/admin/orders`} className="block px-4 py-2 rounded-lg hover:bg-slate-800 text-sm">Orders</a>
                    <a href={`/${shopSlug}/admin/sales`} className="block px-4 py-2 rounded-lg hover:bg-slate-800 text-sm">Sales Analytics</a>
                    <a href={`/${shopSlug}/admin/builder`} className="block px-4 py-2 rounded-lg hover:bg-slate-800 text-sm text-amber-400">Store Builder</a>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button className="w-full px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg text-left">Sign Out</button>
                    <a href={`/${shopSlug}`} className="block mt-2 text-xs text-slate-500 hover:text-white px-4">View Buy Store &rarr;</a>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto bg-slate-950">
                {children}
            </main>
        </div>
    );
}
