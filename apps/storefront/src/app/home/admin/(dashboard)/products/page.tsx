"use client";
import React, { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Image as ImageIcon, X } from "lucide-react";

export default function ProductsPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Mock inventory
    const [products] = useState([
        { id: "p1", name: "Classic Duck Tee", price: 29.99, stock: 45, status: "Active", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&q=80" },
        { id: "p2", name: "Premium Yellow Hoodie", price: 59.99, stock: 12, status: "Active", img: "https://images.unsplash.com/photo-1556821840-0a63f95609a7?w=100&q=80" },
        { id: "p3", name: "Limited Edition Cap", price: 24.99, stock: 0, status: "Out of Stock", img: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=100&q=80" }
    ]);

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600">Products</h1>
                    <p className="text-zinc-500 text-sm mt-1">Manage your storefront inventory and pricing.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Add Product
                </button>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-zinc-200 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input type="text" placeholder="Search products..." className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-zinc-200 text-zinc-600 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                </div>

                <table className="w-full text-left text-sm text-zinc-600">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">Product</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Inventory</th>
                            <th className="px-6 py-4">Price</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                        {products.map(product => (
                            <tr key={product.id} className="hover:bg-zinc-50/50 transition-colors">
                                <td className="px-6 py-4 flex items-center gap-4">
                                    <img src={product.img} alt={product.name} className="w-10 h-10 rounded-md object-cover border border-zinc-200" />
                                    <span className="font-medium text-zinc-900">{product.name}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${product.stock > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                        {product.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{product.stock} in stock</td>
                                <td className="px-6 py-4">${product.price}</td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Product Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                            <h2 className="text-xl font-bold text-zinc-900">Add New Product</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="col-span-1 space-y-2">
                                    <label className="text-sm border-2 border-dashed border-zinc-200 rounded-xl h-32 flex flex-col items-center justify-center text-zinc-500 hover:border-emerald-500 hover:text-emerald-500 transition-colors cursor-pointer bg-zinc-50 hover:bg-emerald-50/50">
                                        <ImageIcon className="w-6 h-6 mb-2" />
                                        <span className="text-xs font-medium">Upload Image</span>
                                        <input type="file" className="hidden" />
                                    </label>
                                </div>
                                <div className="col-span-2 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Product Name</label>
                                        <input type="text" placeholder="e.g. Summer T-Shirt" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-1">Price ($)</label>
                                            <input type="number" placeholder="0.00" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-1">Stock</label>
                                            <input type="number" placeholder="0" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-200/50 rounded-lg transition-colors">
                                Cancel
                            </button>
                            <button className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm transition-colors">
                                Save Product
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
