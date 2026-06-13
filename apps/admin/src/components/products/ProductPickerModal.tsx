"use client";

import React, { useState, useEffect } from "react";
import { Search, X, Loader2, Image as ImageIcon } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "@ecommerce/ui-registry/src/store/toast-store";

interface ProductPickerModalProps {
  shopId: string;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (productIds: string[]) => void;
  existingProductIds?: string[];
}

export function ProductPickerModal({ shopId, isOpen, onClose, onAdd, existingProductIds = [] }: ProductPickerModalProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    
    // Reset selection when opened
    setSelectedIds(new Set());
    
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          shopId,
          limit: "50",
        });
        if (search) query.append("search", search);
        
        const res = await apiClient.get<any>(`/api/catalog/products?${query.toString()}`);
        setProducts(res.data.data || []);
      } catch (err) {
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    // Simple debounce
    const timeout = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeout);
  }, [isOpen, shopId, search]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleAdd = () => {
    onAdd(Array.from(selectedIds));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-white">Add Products to Collection</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/5 bg-zinc-900/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text"
              placeholder="Search by product name, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <p>No products found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((product) => {
                const isAlreadyAdded = existingProductIds.includes(product.id);
                const isSelected = selectedIds.has(product.id);
                
                return (
                  <label 
                    key={product.id}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer ${
                      isAlreadyAdded 
                        ? 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed' 
                        : isSelected
                          ? 'border-indigo-500/50 bg-indigo-500/10'
                          : 'border-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className="flex-shrink-0 pt-1">
                      <input 
                        type="checkbox"
                        checked={isSelected || isAlreadyAdded}
                        disabled={isAlreadyAdded}
                        onChange={() => toggleSelect(product.id)}
                        className="w-5 h-5 rounded border-white/20 bg-black/50 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-black"
                      />
                    </div>
                    
                    <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 flex flex-shrink-0 items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-hidden">
                      <div className="font-medium text-white truncate">{product.name}</div>
                      <div className="text-sm text-slate-500 truncate mt-0.5">
                        {product.variants?.[0]?.sku || 'No SKU'} 
                        {isAlreadyAdded && <span className="ml-2 text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">Already added</span>}
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="text-white font-medium">
                        {product.variants?.[0]?.price?.toLocaleString() || 0} {product.variants?.[0]?.currency || 'VND'}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex items-center justify-between bg-zinc-900/50">
          <div className="text-sm text-slate-400">
            {selectedIds.size} product(s) selected
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleAdd}
              disabled={selectedIds.size === 0}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-indigo-500/25 disabled:opacity-50 disabled:pointer-events-none"
            >
              Add {selectedIds.size > 0 && selectedIds.size} Products
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
