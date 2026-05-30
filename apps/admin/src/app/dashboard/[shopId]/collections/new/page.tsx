"use client";

import React, { useState, use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Image as ImageIcon } from "lucide-react";
import { useCollections } from "@/hooks/useCollections";
import { apiClient } from "@/lib/api-client";

export default function NewCollectionPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params);
  const router = useRouter();
  const { createCollection } = useCollections(shopId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    imageUrl: "",
    isActive: true
  });

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let finalImageUrl = formData.imageUrl;

      if (selectedFile) {
        const form = new FormData();
        form.append("file", selectedFile);
        // Dùng proxy route (/api/storage/upload) chạy server-side
        // — tự forward cookie session, giải quyết cross-origin 401
        const res = await fetch(`/api/storage/upload?type=collection`, {
          method: 'POST',
          headers: { 'x-shop-id': shopId },
          body: form,
        });
        const resJson = await res.json();
        if (resJson.code === '1000' && resJson.data?.url) {
          finalImageUrl = resJson.data.url;
        } else if (resJson.message) {
          throw new Error(resJson.message);
        }
      }

      await createCollection({ ...formData, imageUrl: finalImageUrl });
      router.push(`/dashboard/${shopId}/collections`);
    } catch (err: any) {
      setError(err.message || "Failed to create category");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href={`/dashboard/${shopId}/collections`}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Category</h1>
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
            disabled={loading || !formData.title || !formData.slug}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-indigo-500/25 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Category
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-white">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Summer Collection 2026"
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
                placeholder="summer-collection-2026"
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <textarea
                rows={4}
                placeholder="Describe this category..."
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
                placeholder="https://example.com/image.png"
                value={formData.imageUrl}
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all mb-4"
              />
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
              {previewUrl || formData.imageUrl ? (
                <div 
                  className="aspect-video rounded-xl border border-white/10 overflow-hidden bg-black/40 cursor-pointer relative group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img src={previewUrl || formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">Click to change image</span>
                  </div>
                </div>
              ) : (
                <div 
                  className="aspect-video rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 bg-black/20 cursor-pointer hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-sm font-medium">Click to upload an image</span>
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
                  <div className="text-sm text-slate-400">Category is visible to customers on the storefront</div>
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
                  <div className="font-medium text-white">Draft (Hidden)</div>
                  <div className="text-sm text-slate-400">Category is hidden from the storefront</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
