"use client";

import { useState } from "react";
import {
  Package,
  Loader2,
  Search,
  Share2,
  ImageOff,
  RefreshCw,
  Store,
  X,
  Check,
} from "lucide-react";
import { formatPrice } from "@ecommerce/ui-registry/src/lib/format";
import { toast } from "@ecommerce/ui-registry/src/store/toast-store";
import { useTranslations } from "@ecommerce/i18n/src/react";
import {
  usePlatformCatalog,
  type CatalogProduct,
  type CatalogShop,
} from "@/hooks/usePlatformCatalog";

export default function CatalogPage() {
  const t = useTranslations("admin");
  const {
    products,
    shops,
    total,
    loading,
    search,
    setSearch,
    shopFilter,
    setShopFilter,
    distributing,
    distribute,
  } = usePlatformCatalog();

  const [target, setTarget] = useState<CatalogProduct | null>(null);

  const handleDistribute = async (productId: string, shopIds: string[]) => {
    try {
      const res = await distribute(productId, shopIds);
      if (res) {
        const parts: string[] = [];
        if (res.created) parts.push(`${res.created} ${t("catalog.copied")}`);
        if (res.skipped) parts.push(`${res.skipped} ${t("catalog.skipped")}`);
        toast.success(`${t("catalog.distributeDone")} ${parts.join(", ") || t("catalog.noChanges")}`);
      }
      setTarget(null);
    } catch (err: any) {
      toast.error(err.message || t("catalog.distributeFailed"));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
            <Package size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t("catalog.title")}</h1>
            <p className="text-sm text-zinc-400">
              {t("catalog.subtitle")}
            </p>
          </div>
        </div>
        <div className="text-sm text-zinc-500">{total} {t("catalog.countSuffix")}</div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("catalog.searchPlaceholder")}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <select
          value={shopFilter}
          onChange={(e) => setShopFilter(e.target.value)}
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50"
        >
          <option value="">{t("catalog.allShops")}</option>
          {shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : shops.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-16 text-center text-zinc-500">
          {t("catalog.noShops")}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-16 text-center text-zinc-500">
          {search || shopFilter
            ? t("catalog.noResults")
            : t("catalog.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden flex flex-col"
            >
              <div className="aspect-square bg-zinc-950 relative overflow-hidden">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                    <ImageOff size={28} />
                  </div>
                )}
                <span
                  className={`absolute top-2 right-2 text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 ${
                    p.status === "PUBLISHED"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  }`}
                >
                  {p.status === "PUBLISHED" ? t("catalog.statusPublished") : t("catalog.statusDraft")}
                </span>
              </div>
              <div className="p-4 flex flex-col flex-1 gap-2">
                <h2 className="font-semibold text-white text-sm line-clamp-1">
                  {p.name}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Store size={12} /> {p.shopName}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-emerald-400 font-bold text-sm">
                    {formatPrice(p.minPrice)}
                  </span>
                  <span className="text-[11px] text-zinc-600">
                    {p.variantCount} {t("catalog.variants")}
                  </span>
                </div>
                <button
                  onClick={() => setTarget(p)}
                  disabled={shops.length < 2}
                  title={
                    shops.length < 2
                      ? t("catalog.needTwoShops")
                      : undefined
                  }
                  className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-500/40 px-3 py-2 text-xs font-medium text-indigo-400 hover:bg-indigo-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Share2 size={14} /> {t("catalog.distribute")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {target && (
        <DistributeModal
          product={target}
          shops={shops.filter((s) => s.id !== target.shopId)}
          busy={distributing}
          onClose={() => setTarget(null)}
          onConfirm={(shopIds) => handleDistribute(target.id, shopIds)}
        />
      )}
    </div>
  );
}

function DistributeModal({
  product,
  shops,
  busy,
  onClose,
  onConfirm,
}: {
  product: CatalogProduct;
  shops: CatalogShop[];
  busy: boolean;
  onClose: () => void;
  onConfirm: (shopIds: string[]) => void;
}) {
  const t = useTranslations("admin");
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="font-bold text-white">{t("catalog.modalTitle")}</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white"
            aria-label={t("catalog.close")}
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-zinc-400">
            {t("catalog.modalDesc1")} <strong className="text-white">{product.name}</strong> {t("catalog.modalDesc2")}
          </p>
          {shops.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {t("catalog.noTargets")}
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {shops.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2.5 cursor-pointer hover:border-indigo-500/40"
                >
                  <span
                    className={`w-5 h-5 rounded flex items-center justify-center border ${
                      selected.includes(s.id)
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "border-zinc-700"
                    }`}
                  >
                    {selected.includes(s.id) && <Check size={13} />}
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selected.includes(s.id)}
                    onChange={() => toggle(s.id)}
                  />
                  <span className="text-sm text-zinc-200">{s.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3 p-5 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            {t("catalog.cancel")}
          </button>
          <button
            onClick={() => onConfirm(selected)}
            disabled={busy || selected.length === 0}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 size={15} />
            )}
            {t("catalog.distribute")} ({selected.length})
          </button>
        </div>
      </div>
    </div>
  );
}
