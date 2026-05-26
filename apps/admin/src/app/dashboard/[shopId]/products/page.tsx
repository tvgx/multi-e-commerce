"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { Plus, Search, Filter, MoreHorizontal, PackageOpen, Loader2, Image as ImageIcon } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";

export default function ProductsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params);
  const { products, loading, fetchProducts } = useProducts(shopId);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Products</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your product catalog and variants</p>
        </div>
        <Link 
          href={`/dashboard/${shopId}/products/new`}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-indigo-500/25 hover:-translate-y-0.5"
        >
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-sm hover:bg-white/5 transition-colors">
            <Filter size={16} />
            Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-white/5 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Categories</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Inventory</th>
                <th className="px-6 py-4 font-medium">Base Price</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                    <p>Loading products...</p>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <PackageOpen className="w-8 h-8 text-slate-500" />
                    </div>
                    <p className="text-slate-300 font-medium mb-1">No products found</p>
                    <p className="text-xs text-slate-500">Add your first product to get started.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white group-hover:text-indigo-400 transition-colors">
                            {product.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{product.variants?.length || 1} variants</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {product.collections && product.collections.length > 0 ? (
                          product.collections.map((pc: any) => (
                            <span key={pc.collection.id} className="bg-indigo-500/10 text-indigo-400 text-[10px] px-2 py-0.5 rounded-md border border-indigo-500/20">
                              {pc.collection.title}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        product.status === 'PUBLISHED' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {product.status || 'DRAFT'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-300">
                        {product.variants?.reduce((total: number, v: any) => {
                          const stock = v.stockItems?.reduce((acc: number, item: any) => acc + item.countOnHand, 0) || 0;
                          return total + stock;
                        }, 0) || 0} in stock
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.basePrice || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 rounded-lg hover:bg-white/10 text-slate-400 transition-colors inline-flex">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
