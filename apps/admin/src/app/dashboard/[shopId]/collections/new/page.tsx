"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Image as ImageIcon } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function NewCollectionPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
      const payload = {
        shopId,
        title: formData.title,
        slug,
        description: formData.description,
        imageUrl: formData.imageUrl,
        isActive: formData.isActive,
      };

      await apiClient.post(`/api/collections`, payload, { shopId });
      router.push(`/dashboard/${shopId}/collections`);
    } catch (err: any) {
      setError(err.message || "Failed to create collection");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href={`/dashboard/${shopId}/collections`}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Collection</h1>
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
            disabled={loading || !formData.title}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-indigo-500/25 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Collection
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
            <h2 className="text-lg font-bold text-white">Collection Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Collection, Men's Shoes"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe your collection..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white">Cover Image (URL)</h2>
            
            <div>
              <input
                type="url"
                placeholder="https://example.com/collection-cover.png"
                value={formData.imageUrl}
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all mb-4"
              />
              
              {formData.imageUrl ? (
                <div className="relative aspect-video rounded-xl border border-white/10 bg-black/40 overflow-hidden max-w-sm">
                  <img src={formData.imageUrl} alt="Cover preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-video max-w-sm border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-500">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Image preview</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Status */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white">Status</h2>
            
            <div>
              <select 
                value={formData.isActive ? "ACTIVE" : "INACTIVE"}
                onChange={(e) => setFormData({...formData, isActive: e.target.value === "ACTIVE"})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive / Hidden</option>
              </select>
              <p className="text-xs text-slate-400 mt-2">Active collections are visible in the storefront.</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
