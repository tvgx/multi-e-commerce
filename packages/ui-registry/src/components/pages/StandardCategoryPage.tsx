import React from 'react';
import { Filter, ChevronDown, LayoutGrid, List } from 'lucide-react';
import { ProductCard } from '../product-card';

interface Product {
    id: string;
    name: string;
    basePrice: number;
    images: string[];
    rating?: number;
}

interface StandardCategoryPageProps {
    title?: string;
    description?: string;
    products: Product[];
    totalProducts?: number;
}

export function StandardCategoryPage({ 
    title = 'All Products', 
    description = 'Discover our wide range of products.',
    products = [],
    totalProducts = 0
}: StandardCategoryPageProps) {
    
    return (
        <div className="w-full bg-slate-50 min-h-screen pt-10 pb-20">
            <div className="container mx-auto px-4 max-w-7xl">
                
                {/* Header Section */}
                <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 mb-8 text-center bg-gradient-to-br from-slate-50 to-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
                    
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 relative z-10">{title}</h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto relative z-10">{description}</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* Left: Filters Sidebar */}
                    <div className="w-full lg:w-1/4 flex-shrink-0">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-6">
                            <div className="flex items-center gap-2 font-semibold text-lg text-slate-900 mb-6 pb-4 border-b border-slate-100">
                                <Filter className="w-5 h-5" />
                                Filters
                            </div>
                            
                            {/* Categories */}
                            <div className="mb-8">
                                <h3 className="font-medium text-slate-900 mb-4">Categories</h3>
                                <div className="space-y-3">
                                    {['Headphones', 'Earbuds', 'Speakers', 'Accessories'].map((cat, idx) => (
                                        <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                                            <input type="checkbox" className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary" />
                                            <span className="text-slate-600 group-hover:text-slate-900 transition-colors">{cat}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="mb-8">
                                <h3 className="font-medium text-slate-900 mb-4">Price Range</h3>
                                <div className="space-y-3">
                                    {['All', 'Under $50', '$50 - $100', 'Over $100'].map((price, idx) => (
                                        <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                                            <input type="radio" name="price" className="w-4 h-4 text-primary border-slate-300 focus:ring-primary" />
                                            <span className="text-slate-600 group-hover:text-slate-900 transition-colors">{price}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            <button className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors">
                                Reset Filters
                            </button>
                        </div>
                    </div>

                    {/* Right: Product Grid */}
                    <div className="w-full lg:w-3/4">
                        
                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 gap-4">
                            <div className="text-slate-500 font-medium">
                                Showing <span className="text-slate-900">{products.length}</span> of <span className="text-slate-900">{totalProducts || products.length}</span> products
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                    <button className="p-2 bg-white shadow-sm rounded-md text-slate-700"><LayoutGrid className="w-4 h-4" /></button>
                                    <button className="p-2 text-slate-500 hover:text-slate-700"><List className="w-4 h-4" /></button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">Sort by:</span>
                                    <button className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 transition-colors">
                                        Best Selling <ChevronDown className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {products.length > 0 ? (
                                products.map((product, idx) => (
                                    <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-slate-100 transition-all group flex flex-col">
                                        <div className="aspect-square bg-slate-50 relative overflow-hidden">
                                            {product.images && product.images.length > 0 ? (
                                                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300">📦</div>
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                                        </div>
                                        <div className="p-5 flex flex-col flex-grow">
                                            <h3 className="font-semibold text-slate-900 mb-2 truncate group-hover:text-primary transition-colors">{product.name}</h3>
                                            <div className="text-lg font-bold text-slate-900 mt-auto">${product.basePrice.toFixed(2)}</div>
                                            <a href={`/products/${product.id}`} className="mt-4 block w-full text-center bg-slate-50 hover:bg-primary hover:text-white border border-slate-200 hover:border-primary py-2.5 rounded-xl font-medium text-slate-700 transition-all">
                                                View Details
                                            </a>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                                    <div className="text-6xl mb-4">🔍</div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No products found</h3>
                                    <p className="text-slate-500">Try adjusting your filters or search query.</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {products.length > 0 && (
                            <div className="flex justify-center mt-12">
                                <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                                    <button className="px-4 py-2 text-slate-500 hover:text-slate-900 font-medium disabled:opacity-50" disabled>Prev</button>
                                    <button className="w-10 h-10 rounded-xl bg-primary text-white font-bold shadow-sm flex items-center justify-center">1</button>
                                    <button className="w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-700 font-medium flex items-center justify-center transition-colors">2</button>
                                    <button className="w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-700 font-medium flex items-center justify-center transition-colors">3</button>
                                    <span className="text-slate-400 px-2">...</span>
                                    <button className="px-4 py-2 text-slate-700 hover:text-primary font-medium transition-colors">Next</button>
                                </div>
                            </div>
                        )}
                        
                    </div>
                </div>
            </div>
        </div>
    );
}
