import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useTranslations } from '@ecommerce/i18n/src/react';

export interface Shop {
  id: string;
  name: string;
  domain?: string | null;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
}

/**
 * Logic dữ liệu cho trang danh sách cửa hàng của owner: tải my-shops + sắp xếp
 * theo lần cập nhật gần nhất. Trang chỉ render + điều hướng.
 */
export function useShopsList() {
  const t = useTranslations('admin');
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<Shop[]>('/api/shops/my-shops');
        setShops(res.data || []);
        setError(null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : t('shops.fetchError');
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, [t]);

  const sortedShops = useMemo(() => {
    return [...shops].sort((a, b) => {
      const left = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const right = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return right - left;
    });
  }, [shops]);

  return { sortedShops, loading, error };
}
