import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from '@ecommerce/ui-registry/src/store/toast-store';
import { useTranslations } from '@ecommerce/i18n/src/react';

export interface CreateShopInput {
  shopName: string;
  domain: string;
}

/**
 * Logic tạo shop: tạo metadata shop rồi seed các trang mặc định (header/footer +
 * Home/Listing/Detail) để storefront không bị trắng / "Layout not found". Bước
 * seed là non-fatal. Trang chỉ giữ wizard step + form + điều hướng.
 */
export function useCreateShop() {
  const t = useTranslations('admin');
  const [loading, setLoading] = useState(false);

  /** Trả về shopId mới nếu tạo thành công, ngược lại null (đã toast lỗi). */
  const createShop = async ({ shopName, domain }: CreateShopInput): Promise<string | null> => {
    setLoading(true);
    try {
      // 1. Create the shop metadata
      const res = await apiClient.post<any>('/api/shops', {
        name: shopName,
        domain,
        productsPerPage: 30,
      });

      const shopId = res.data.id;

      // 2. Seed working default pages so the new storefront is never blank.
      try {
        await apiClient.post<any>(`/api/layouts/${shopId}/seed`, { shopName });
      } catch (seedErr) {
        // Non-fatal: the builder also seeds client-side defaults on first load.
        console.warn('Layout seed failed, falling back to builder defaults', seedErr);
      }

      return shopId;
    } catch (err: any) {
      toast.error(`${t('hooks.createShopErrorPrefix')}: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createShop, loading };
}
