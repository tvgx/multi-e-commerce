import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast, confirmDialog } from '@ecommerce/ui-registry/src/store/toast-store';
import { useTranslations } from '@ecommerce/i18n/src/react';

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string | null;
  baseFee: number;
  freeThreshold?: number | null;
  estimatedDays?: string | null;
  active: boolean;
  position: number;
}

export interface MethodFormValues {
  name: string;
  description: string;
  baseFee: string;
  freeThreshold: string;
  estimatedDays: string;
  active: boolean;
}

export interface WarehouseData {
  id?: string;
  name?: string | null;
  phone?: string | null;
  addressLine?: string | null;
  provinceCode?: string | null;
  wardCode?: string | null;
  note?: string | null;
}

export interface WarehouseInput {
  addressLine: string;
  provinceCode: string;
  wardCode: string;
  phone: string;
}

/**
 * Logic dữ liệu cho trang cài đặt vận chuyển: CRUD phương thức + địa chỉ kho.
 * Trang chỉ giữ state form/modal + thành phần geo (useGeo) + điều hướng onboarding.
 */
export function useShippingSettings(shopId: string) {
  const t = useTranslations('admin');

  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [warehouse, setWarehouse] = useState<WarehouseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingMethod, setSavingMethod] = useState(false);
  const [savingWarehouse, setSavingWarehouse] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const [methodsRes, warehouseRes] = await Promise.all([
        apiClient.get<{ data: ShippingMethod[] }>(`/api/shipping/methods/all`, { shopId }),
        apiClient.get<WarehouseData | null>(`/api/shops/${shopId}/warehouse`, { shopId }),
      ]);
      setMethods((methodsRes.data as any).data ?? (methodsRes.data as any));
      setWarehouse((warehouseRes.data as WarehouseData | null) ?? null);
    } catch (err) {
      console.error('Failed to fetch shipping data', err);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  // Nạp dữ liệu khi mount / đổi shop. (Bị mất trong lần "code refractor" tách
  // logic ra hook — trước đó page tự gọi fetchData trong useEffect.)
  useEffect(() => {
    refetch();
  }, [refetch]);

  /** Tạo/cập nhật phương thức. Trả về true nếu lưu thành công. */
  const saveMethod = useCallback(async (
    form: MethodFormValues,
    editingId: string | null,
  ): Promise<boolean> => {
    if (!form.name.trim() || form.baseFee === '') {
      toast.error(t('shipping.requireNameFee'));
      return false;
    }
    setSavingMethod(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        baseFee: Number(form.baseFee),
        freeThreshold: form.freeThreshold !== '' ? Number(form.freeThreshold) : null,
        estimatedDays: form.estimatedDays.trim() || undefined,
        active: form.active,
      };
      if (editingId) {
        await apiClient.patch(`/api/shipping/methods/${editingId}`, payload, { shopId });
      } else {
        await apiClient.post(`/api/shipping/methods`, payload, { shopId });
      }
      await refetch();
      return true;
    } catch (err: any) {
      toast.error(`${t('shipping.errorPrefix')}: ${err.message}`);
      return false;
    } finally {
      setSavingMethod(false);
    }
  }, [shopId, t, refetch]);

  const deleteMethod = useCallback(async (m: ShippingMethod) => {
    if (
      !(await confirmDialog({
        title: t('shipping.deleteTitle'),
        message: t('shipping.deleteMessage', { name: m.name }),
        confirmText: t('shipping.deleteConfirm'),
        danger: true,
      }))
    )
      return;
    try {
      await apiClient.delete(`/api/shipping/methods/${m.id}`, { shopId });
      await refetch();
    } catch (err: any) {
      toast.error(`${t('shipping.errorPrefix')}: ${err.message}`);
    }
  }, [shopId, t, refetch]);

  const toggleMethod = useCallback(async (m: ShippingMethod) => {
    try {
      await apiClient.patch(`/api/shipping/methods/${m.id}`, { active: !m.active }, { shopId });
      setMethods(prev => prev.map(x => x.id === m.id ? { ...x, active: !m.active } : x));
    } catch (err: any) {
      toast.error(`${t('shipping.errorPrefix')}: ${err.message}`);
    }
  }, [shopId, t]);

  /** Lưu địa chỉ kho mặc định. Trả về true nếu thành công (trang quyết định nav/toast). */
  const saveWarehouse = useCallback(async (input: WarehouseInput): Promise<boolean> => {
    if (!input.addressLine.trim() || !input.provinceCode || !input.wardCode) {
      toast.error('Vui lòng nhập đầy đủ địa chỉ kho hàng');
      return false;
    }
    setSavingWarehouse(true);
    try {
      await apiClient.patch(
        `/api/shops/${shopId}/warehouse`,
        {
          addressLine: input.addressLine,
          provinceCode: input.provinceCode,
          wardCode: input.wardCode,
          phone: input.phone,
          note: 'Kho hàng — nơi shipper đến lấy hàng',
        },
        { shopId },
      );
      return true;
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra, vui lòng thử lại');
      return false;
    } finally {
      setSavingWarehouse(false);
    }
  }, [shopId]);

  return {
    methods,
    warehouse,
    loading,
    savingMethod,
    savingWarehouse,
    refetch,
    saveMethod,
    deleteMethod,
    toggleMethod,
    saveWarehouse,
  };
}
