import React from 'react';

export default function AllProductsPage({ params }: { params: Promise<{ shopSlug: string }> }) {
    const { shopSlug } = React.use(params);
    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">All Products</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Filters Sidebar */}
                <aside className="w-full md:w-64 space-y-6">
                    <div>
                        <h3 className="font-semibold mb-3">Categories</h3>
                        <div className="space-y-2 text-sm text-slate-600">
                            <label className="flex items-center gap-2"><input type="checkbox" /> Electronics</label>
                            <label className="flex items-center gap-2"><input type="checkbox" /> Apparel</label>
                            <label className="flex items-center gap-2"><input type="checkbox" /> Accessories</label>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-3">Price Range</h3>
                        <input type="range" className="w-full" />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>0đ</span>
                            <span>Max</span>
                        </div>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 font-medium text-emerald-600">
                            <input type="checkbox" className="accent-emerald-500" /> On Sale Only
                        </label>
                    </div>
                </aside>

                {/* Grid (Autofit architecture) */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
                    {/* Product Cards will be rendered here */}
                    <div className="h-64 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">Loading products for {shopSlug}...</div>
                </div>
            </div>
        </div>
    );
}
