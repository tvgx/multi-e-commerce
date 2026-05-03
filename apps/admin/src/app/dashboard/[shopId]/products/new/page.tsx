"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function NewProductPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    images: [] as string[],
    newImageUrl: "",
    variants: [
      { sku: "", price: 0, inStock: 0, attributes: {} as Record<string, string>, image: "" }
    ],
    // For a simple multi-variant UI, we let users define attributes like Size/Color
    newAttributeName: "",
    newAttributeValue: "",
  });

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { sku: "", price: 0, inStock: 0, attributes: {}, image: "" }]
    });
  };

  const removeVariant = (index: number) => {
    if (formData.variants.length === 1) return;
    const newVariants = [...formData.variants];
    newVariants.splice(index, 1);
    setFormData({ ...formData, variants: newVariants });
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const updateVariantAttribute = (index: number, attrName: string, attrValue: string) => {
    const newVariants = [...formData.variants];
    if (attrValue.trim() === "") {
      delete newVariants[index].attributes[attrName];
    } else {
      newVariants[index].attributes[attrName] = attrValue;
    }
    setFormData({ ...formData, variants: newVariants });
  };

  const addImage = () => {
    if (formData.newImageUrl && !formData.images.includes(formData.newImageUrl)) {
      setFormData({
        ...formData,
        images: [...formData.images, formData.newImageUrl],
        newImageUrl: ""
      });
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Basic slug generation
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
      const payload = {
        shopId,
        name: formData.name,
        slug,
        images: formData.images,
        variants: formData.variants.map((v, i) => ({
          sku: v.sku || `SKU-${slug}-${i+1}`,
          price: Number(v.price),
          inStock: Number(v.inStock),
          attributes: v.attributes,
          image: v.image
        })),
        extraMetadata: { description: formData.description }
      };

      await apiClient.post(`/api/products`, payload, { shopId });
      router.push(`/dashboard/${shopId}/products`);
    } catch (err: any) {
      setError(err.message || "Failed to create product");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href={`/dashboard/${shopId}/products`}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">Add New Product</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/${shopId}/products`}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Discard
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.name}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-indigo-500/25 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Product
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Info */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                <input
                  type="text"
                  required
                  placeholder="Short sleeve t-shirt"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe your product..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white">Media (Image URLs)</h2>
            
            <div className="flex gap-3">
              <input
                type="url"
                placeholder="https://example.com/image.png"
                value={formData.newImageUrl}
                onChange={(e) => setFormData({...formData, newImageUrl: e.target.value})}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={addImage}
                disabled={!formData.newImageUrl}
                className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all disabled:opacity-50"
              >
                Add URL
              </button>
            </div>

            {formData.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {formData.images.map((url, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl border border-white/10 bg-black/40 overflow-hidden">
                    <img src={url} alt={`Product image ${i+1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500">
                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No images added yet</p>
              </div>
            )}
          </div>

          {/* Variants */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Variants & Pricing</h2>
              <button
                type="button"
                onClick={addVariant}
                className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus size={16} /> Add Variant
              </button>
            </div>

            <div className="space-y-4">
              {formData.variants.map((variant, index) => (
                <div key={index} className="p-4 rounded-xl border border-white/5 bg-black/20 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-300">Variant {index + 1} {index === 0 && "(Master)"}</h3>
                    {formData.variants.length > 1 && (
                      <button type="button" onClick={() => removeVariant(index)} className="text-rose-400 hover:text-rose-300">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">SKU</label>
                      <input
                        type="text"
                        placeholder="Auto-generated"
                        value={variant.sku}
                        onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Price (VND)</label>
                      <input
                        type="number"
                        min="0"
                        value={variant.price || ''}
                        onChange={(e) => updateVariant(index, 'price', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Inventory</label>
                      <input
                        type="number"
                        min="0"
                        value={variant.inStock || ''}
                        onChange={(e) => updateVariant(index, 'inStock', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <label className="block text-xs font-medium text-slate-400 mb-2">Attributes (e.g., Color, Size)</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Object.entries(variant.attributes).map(([key, value]) => (
                        <span key={key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-xs font-medium text-slate-200">
                          {key}: {value}
                          <button type="button" onClick={() => updateVariantAttribute(index, key, "")} className="text-slate-400 hover:text-white">×</button>
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Name (e.g. Color)"
                        id={`attr-name-${index}`}
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. Red)"
                        id={`attr-val-${index}`}
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nameInput = document.getElementById(`attr-name-${index}`) as HTMLInputElement;
                          const valInput = document.getElementById(`attr-val-${index}`) as HTMLInputElement;
                          if (nameInput.value && valInput.value) {
                            updateVariantAttribute(index, nameInput.value, valInput.value);
                            nameInput.value = "";
                            valInput.value = "";
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-medium hover:bg-indigo-500/30"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Status & Organization */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white">Status</h2>
            
            <div>
              <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none">
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white">Organization</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
              <input
                type="text"
                placeholder="E.g., T-Shirts"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
