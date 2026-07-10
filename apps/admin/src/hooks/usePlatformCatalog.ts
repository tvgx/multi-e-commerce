import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { useTranslations } from "@ecommerce/i18n/src/react";

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  status: string;
  imageUrl: string | null;
  shopId: string;
  shopName: string;
  variantCount: number;
  minPrice: number;
  currency: string;
}

export interface CatalogShop {
  id: string;
  name: string;
}

export interface DistributeResult {
  created: number;
  skipped: number;
  total: number;
  results: { shopId: string; status: string; reason?: string }[];
}

/**
 * Dữ liệu cho trang Product Catalog cấp nền tảng (P1-1): gộp sản phẩm trên mọi
 * shop của owner + phân phối (sao chép) sang shop khác.
 */
export function usePlatformCatalog() {
  const tr = useTranslations("admin");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [shops, setShops] = useState<CatalogShop[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [shopFilter, setShopFilter] = useState<string>("");
  const [distributing, setDistributing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (shopFilter) params.set("shopId", shopFilter);
      const res = await apiClient.get<any>(
        `/api/catalog/platform/products?${params.toString()}`,
      );
      setProducts(res.data?.data ?? []);
      setShops(res.data?.shops ?? []);
      setTotal(res.data?.meta?.total ?? 0);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, shopFilter]);

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce search/filter changes
    return () => clearTimeout(t);
  }, [load]);

  const distribute = async (
    productId: string,
    targetShopIds: string[],
  ): Promise<DistributeResult | null> => {
    setDistributing(true);
    try {
      const res = await apiClient.post<any>(
        `/api/catalog/platform/products/${productId}/distribute`,
        { targetShopIds },
      );
      await load();
      return res.data as DistributeResult;
    } catch (err: any) {
      throw new Error(err.message || tr("hooks.platformDistributeFailed"));
    } finally {
      setDistributing(false);
    }
  };

  return {
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
    reload: load,
  };
}
