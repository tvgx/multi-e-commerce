"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { useCollections } from "@/hooks/useCollections";
import { useProducts, Product } from "@/hooks/useProducts";
import { ImageUploader } from "./ImageUploader";
import { uploadFileToMinIO } from "@/lib/upload-minio";
import { useTranslations } from "@ecommerce/i18n/src/react";
import { NumberInput } from "@ecommerce/ui-registry/src/components/blocks/NumberInput";

interface ProductFormProps {
  mode: "create" | "edit";
  shopId: string;
  productId?: string;
  onSuccess?: () => void;
}

export function ProductForm({ mode, shopId, productId, onSuccess }: ProductFormProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const { collections, fetchCollections } = useCollections(shopId);
  const { fetchProductById, createProduct, updateProduct } = useProducts(shopId);

  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(mode === 'edit');
  const [error, setError] = useState("");
  // Ảnh mới chọn — chỉ upload khi submit, sau khi đã có productId,
  // để MinIO đặt tên file theo dạng <productId>-N
  const [pendingImages, setPendingImages] = useState<{ file: File; preview: string }[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    images: [] as string[],
    newImageUrl: "",
    variants: [
      { sku: "", price: 0, inStock: 0, attributes: {} as Record<string, string>, image: "" }
    ],
    collectionIds: [] as string[],
    status: "PUBLISHED",
  });

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  useEffect(() => {
    if (mode === 'edit' && productId) {
      const loadProduct = async () => {
        try {
          const product = await fetchProductById(productId);
          setFormData({
            name: product.name || "",
            description: product.description || "",
            images: product.images || [],
            newImageUrl: "",
            variants: product.variants?.length ? product.variants.map(v => ({
              sku: v.sku || "",
              price: v.price || 0,
              // Tồn kho thật nằm ở StockItem.countOnHand (variant không có cột
              // inStock) — không cộng từ stockItems thì form luôn hiện 0.
              inStock: v.inStock ?? (v.stockItems?.reduce((acc: number, s: any) => acc + (s.countOnHand || 0), 0) || 0),
              attributes: typeof v.attributes === 'string' ? JSON.parse(v.attributes) : (v.attributes || {}),
              image: v.image || ""
            })) : [
              { sku: "", price: Number(product.basePrice) || 0, inStock: Number(product.inStock) || 0, attributes: {}, image: "" }
            ],
            collectionIds: product.collections?.map((c: any) => c.collection.id) || [],
            status: product.status || "PUBLISHED",
          });
        } catch (err: any) {
          setError(err.message || t("productForm.loadFailed"));
        } finally {
          setInitLoading(false);
        }
      };
      loadProduct();
    }
  }, [mode, productId, fetchProductById]);

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

  const handleFileSelected = (file: File) => {
    setPendingImages(prev => [...prev, { file, preview: URL.createObjectURL(file) }]);
  };

  const removeImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const removePendingImage = (index: number) => {
    setPendingImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const toggleCollection = (collectionId: string) => {
    setFormData(prev => ({
      ...prev,
      collectionIds: prev.collectionIds.includes(collectionId)
        ? prev.collectionIds.filter(id => id !== collectionId)
        : [...prev.collectionIds, collectionId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
      const payload = {
        shopId,
        name: formData.name,
        slug,
        images: formData.images,
        collectionIds: formData.collectionIds,
        variants: formData.variants.map((v, i) => ({
          sku: v.sku || `SKU-${slug}-${i+1}`,
          price: Number(v.price),
          inStock: Number(v.inStock),
          attributes: v.attributes,
          image: v.image
        })),
        description: formData.description,
        status: formData.status,
      };

      if (mode === 'create') {
        const created = await createProduct(payload);
        if (pendingImages.length > 0) {
          if (!created?.id) throw new Error(t("productForm.uploadNoId"));
          const uploaded: string[] = [];
          for (const { file } of pendingImages) {
            uploaded.push(await uploadFileToMinIO(file, 'product', shopId, created.id));
          }
          await updateProduct(created.id, { images: [...formData.images, ...uploaded] });
        }
      } else {
        const uploaded: string[] = [];
        for (const { file } of pendingImages) {
          uploaded.push(await uploadFileToMinIO(file, 'product', shopId, productId!));
        }
        await updateProduct(productId!, { ...payload, images: [...formData.images, ...uploaded] });
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/dashboard/${shopId}/products`);
      }
    } catch (err: any) {
      setError(err.message || (mode === 'create' ? t("productForm.createFailed") : t("productForm.updateFailed")));
      setLoading(false);
    }
  };

  if (initLoading) {
    return (
      <div className="max-w-5xl mx-auto flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {mode === 'create' ? t("productForm.addTitle") : t("productForm.editTitle")}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/${shopId}/products`}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            {t("productForm.discard")}
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.name}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-indigo-500/25 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {mode === 'create' ? t("productForm.saveProduct") : t("productForm.updateProduct")}
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
            <h2 className="text-lg font-bold text-white">{t("productForm.basicInfo")}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">{t("productForm.titleLabel")}</label>
                <input
                  type="text"
                  required
                  placeholder={t("productForm.titlePlaceholder")}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">{t("productForm.descLabel")}</label>
                <textarea
                  rows={4}
                  placeholder={t("productForm.descPlaceholder")}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white">{t("productForm.media")}</h2>
            
            <ImageUploader onFileSelected={handleFileSelected} busy={loading} />

            {(formData.images.length > 0 || pendingImages.length > 0) ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {formData.images.map((url, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl border border-white/10 bg-black/40 overflow-hidden">
                    <img src={url} alt={t("productForm.productImageAlt", { n: i + 1 })} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {pendingImages.map(({ preview }, i) => (
                  <div key={preview} className="relative group aspect-square rounded-xl border border-dashed border-indigo-500/40 bg-black/40 overflow-hidden">
                    <img src={preview} alt={t("productForm.newImageAlt", { n: i + 1 })} className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-indigo-500/80 text-[10px] font-bold text-white">{t("productForm.unsaved")}</span>
                    <button
                      type="button"
                      onClick={() => removePendingImage(i)}
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
                <p className="text-sm">{t("productForm.noImages")}</p>
              </div>
            )}
          </div>

          {/* Variants */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{t("productForm.variantsPricing")}</h2>
              <button
                type="button"
                onClick={addVariant}
                className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus size={16} /> {t("productForm.addVariant")}
              </button>
            </div>

            <div className="space-y-4">
              {formData.variants.map((variant, index) => (
                <div key={index} className="p-4 rounded-xl border border-white/5 bg-black/20 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-300">{t("productForm.variantN", { n: index + 1 })} {index === 0 && t("productForm.master")}</h3>
                    {formData.variants.length > 1 && (
                      <button type="button" onClick={() => removeVariant(index)} className="text-rose-400 hover:text-rose-300">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">{t("productForm.sku")}</label>
                      <input
                        type="text"
                        placeholder={t("productForm.skuPlaceholder")}
                        value={variant.sku}
                        onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">{t("productForm.priceVnd")}</label>
                      <NumberInput
                        min={0}
                        suffix="đ"
                        value={Number(variant.price) || null}
                        onValueChange={(v) => updateVariant(index, 'price', v ?? 0)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">{t("productForm.inventory")}</label>
                      <NumberInput
                        min={0}
                        allowDecimal={false}
                        value={Number(variant.inStock) || null}
                        onValueChange={(v) => updateVariant(index, 'inStock', v ?? 0)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <label className="block text-xs font-medium text-slate-400 mb-2">{t("productForm.attributes")}</label>
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
                        placeholder={t("productForm.attrNamePlaceholder")}
                        id={`attr-name-${index}`}
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                      />
                      <input
                        type="text"
                        placeholder={t("productForm.attrValPlaceholder")}
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
                        {t("productForm.add")}
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
            <h2 className="text-lg font-bold text-white">{t("productForm.status")}</h2>

            <div>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none"
              >
                <option value="PUBLISHED">{t("productForm.statusActive")}</option>
                <option value="DRAFT">{t("productForm.statusDraft")}</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white">{t("productForm.categories")}</h2>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t("productForm.selectCategories")}</label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {collections.length === 0 ? (
                  <div className="text-sm text-slate-500">{t("productForm.noCategories")}</div>
                ) : (
                  collections.map((collection: any) => (
                    <label 
                      key={collection.id} 
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                        formData.collectionIds.includes(collection.id) 
                          ? 'bg-indigo-500/10 border-indigo-500/30 text-white' 
                          : 'bg-black/20 border-white/10 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={formData.collectionIds.includes(collection.id)}
                        onChange={() => toggleCollection(collection.id)}
                        className="rounded border-white/20 bg-black/40 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-black"
                      />
                      <span className="text-sm font-medium">{collection.title}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
