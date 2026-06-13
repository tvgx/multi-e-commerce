"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Image as ImageIcon, Trash2 } from "lucide-react";
import { useCollections, Collection } from "@/hooks/useCollections";
import { toast, confirmDialog } from '@ecommerce/ui-registry/src/store/toast-store';
import { ProductPickerModal } from "@/components/products/ProductPickerModal";
import { apiClient } from "@/lib/api-client";

export default function EditCollectionPage({ params }: { params: Promise<{ shopId: string; collectionId: string }> }) {
  const { shopId, collectionId } = use(params);
  const router = useRouter();
  const { updateCollection, removeProductFromCollection, addProductsToCollection } = useCollections(shopId);
  const { collections, fetchCollections } = useCollections(shopId); 
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Collection>>({
    title: "",
    slug: "",
    description: "",
    imageUrl: "",
    isActive: true,
  });

  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    // Instead of full list, we should fetch single collection by ID if we had an endpoint.
    // For now, we can fetch all and find it. Or we need to update the useCollections to fetch by id.
    // Since we don't have getCollectionById in the hook, let's fetch all and filter for now to get details.
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch all collections from the correct API route
        const res = await apiClient.get<any>(`/api/catalog/collections`, { shopId });
        const data = res.data; // apiClient returns { data } or unwraps it depending on implementation. Usually it's the raw axios response. Wait, apiClient unwraps if it's the custom one. Let's just use res.data.
        const collection = Array.isArray(data) ? data.find((c: any) => c.id === collectionId) : data?.data?.find((c: any) => c.id === collectionId);
        
        if (collection) {
          // Now fetch the detailed collection by slug
          const detailRes = await apiClient.get<any>(`/api/catalog/collections/${collection.slug}`, { shopId });
          const detail = detailRes.data?.data || detailRes.data;

          setFormData({
            title: detail.title,
            slug: detail.slug,
            description: detail.description || "",
            imageUrl: detail.imageUrl || "",
            isActive: detail.isActive,
          });
          setProducts(detail.products || []);
        } else {
          setError("Category not found");
        }
      } catch (err: any) {
        setError("Failed to load category");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [shopId, collectionId]);

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await updateCollection(collectionId, formData);
      router.push(`/dashboard/${shopId}/collections`);
    } catch (err: any) {
      setError(err.message || "Failed to update category");
      setSaving(false);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (
      !(await confirmDialog({
        message: "Gỡ sản phẩm này khỏi danh mục?",
        confirmText: "Gỡ",
        danger: true,
      }))
    )
      return;
    try {
      await removeProductFromCollection(collectionId, productId);
      setProducts(products.filter(p => p.productId !== productId));
    } catch (err: any) {
      toast.error("Failed to remove product");
    }
  };

  const handleAddProducts = async (productIds: string[]) => {
    try {
      await addProductsToCollection(collectionId, productIds);
      toast.success("Products added successfully");
      // Reload products list
      const detailRes = await apiClient.get<any>(`/api/catalog/collections/${formData.slug}`, { shopId });
      const detailData = detailRes.data?.data || detailRes.data;
      setProducts(detailData.products || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to add products");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-500 w-8 h-8" /></div>;
  }

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/dashboard/${shopId}/collections`}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">Edit Collection</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/${shopId}/collections`}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Discard
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving || !formData.title || !formData.slug}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-indigo-500/25 disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 space-y-6">
              <h2 className="text-lg font-bold text-white">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleTitleChange}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Slug (URL)</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 space-y-6">
                <h2 className="text-lg font-bold text-white">Cover Image</h2>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all mb-4"
                  />
                  
                  {formData.imageUrl ? (
                    <div className="aspect-video rounded-xl border border-white/10 overflow-hidden bg-black/40">
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 bg-black/20">
                      <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-sm">No Image</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 space-y-6">
                <h2 className="text-lg font-bold text-white">Status</h2>
                
                <div className="space-y-4">
                  <label className="flex items-start gap-3 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 cursor-pointer hover:bg-indigo-500/10 transition-colors">
                    <div className="flex h-6 items-center">
                      <input
                        type="radio"
                        checked={formData.isActive}
                        onChange={() => setFormData({...formData, isActive: true})}
                        className="h-4 w-4 rounded-full border-white/20 bg-transparent text-indigo-500 focus:ring-indigo-500 focus:ring-offset-black"
                      />
                    </div>
                    <div>
                      <div className="font-medium text-white">Active</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-black/20 cursor-pointer hover:bg-white/[0.02] transition-colors">
                    <div className="flex h-6 items-center">
                      <input
                        type="radio"
                        checked={!formData.isActive}
                        onChange={() => setFormData({...formData, isActive: false})}
                        className="h-4 w-4 rounded-full border-white/20 bg-transparent text-indigo-500 focus:ring-indigo-500 focus:ring-offset-black"
                      />
                    </div>
                    <div>
                      <div className="font-medium text-white">Draft</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-white">Products in Collection</h2>
                <span className="bg-indigo-500/20 text-indigo-400 py-0.5 px-2 rounded-full text-xs font-medium">
                  {products.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20"
              >
                + Add Products
              </button>
            </div>
            
            <div className="p-2 space-y-1 max-h-[600px] overflow-y-auto">
              {products.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No products in this category. Assign products from the Products page.
                </div>
              ) : (
                products.map((p) => (
                  <div key={p.productId} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {p.product?.variants?.[0]?.image ? (
                          <img src={p.product.variants[0].image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-medium text-white truncate">{p.product?.name}</div>
                        <div className="text-xs text-slate-500">Order: {p.order}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveProduct(p.productId)}
                      className="p-2 text-rose-500/50 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                      title="Remove product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
            </div>
          </div>
        </div>
      </div>

      <ProductPickerModal
        shopId={shopId}
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onAdd={handleAddProducts}
        existingProductIds={products.map((p) => p.productId)}
      />
    </>
  );
}
