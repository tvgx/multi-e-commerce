import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from '@ecommerce/ui-registry/src/store/toast-store';
import { useTranslations } from '@ecommerce/i18n/src/react';

export interface BillingShippingInput {
  shipping: {
    fixedEnabled: boolean;
    fixedFee: string;
    freeshipEnabled: boolean;
    freeThreshold: string;
  };
  payment: {
    codEnabled: boolean;
    bankEnabled: boolean;
    bankName: string;
    accountHolder: string;
    accountNumber: string;
  };
  warehouse: {
    provinceCode: string;
    wardCode: string;
    addressLine: string;
    phone: string;
  };
}

/**
 * Logic bước "Thanh toán & Vận chuyển" của wizard tạo shop: validate + 5 lệnh gọi
 * tuần tự (shipping method, payment methods, bank account, warehouse, enqueue build).
 * Trang chỉ giữ các form field + WizardProgress + điều hướng khi thành công.
 */
export function useBillingShipping(shopId: string) {
  const t = useTranslations('admin');
  const [busy, setBusy] = useState(false);

  /** Trả về true nếu lưu thành công (trang điều hướng sang Dashboard finalizing). */
  const submit = async (input: BillingShippingInput): Promise<boolean> => {
    const { shipping, payment, warehouse } = input;

    if (!shopId) {
      toast.error(t('hooks.billingMissingShopId'));
      return false;
    }
    if (!warehouse.addressLine.trim() || !warehouse.provinceCode || !warehouse.wardCode) {
      toast.error(t('hooks.billingRequireWarehouse'));
      return false;
    }
    if (payment.bankEnabled && (!payment.accountHolder.trim() || !payment.accountNumber.trim())) {
      toast.error(t('hooks.billingRequireBank'));
      return false;
    }

    setBusy(true);
    try {
      // 1) Phương thức vận chuyển: gộp Fixed Rate + Freeship vào 1 ShippingMethod.
      if (shipping.fixedEnabled || shipping.freeshipEnabled) {
        await apiClient.post(
          '/api/shipping/methods',
          {
            name: 'Giao hàng tiêu chuẩn',
            baseFee: shipping.fixedEnabled ? Number(shipping.fixedFee) || 0 : 0,
            freeThreshold: shipping.freeshipEnabled ? Number(shipping.freeThreshold) || 0 : undefined,
            active: true,
          },
          { shopId },
        );
      }

      // 2) Phương thức thanh toán (COD / Chuyển khoản)
      await apiClient.patch(
        `/api/shops/${shopId}/payment-methods`,
        { cod: payment.codEnabled, bankTransfer: payment.bankEnabled },
        { shopId },
      );

      // 3) Tài khoản ngân hàng (nếu bật chuyển khoản)
      if (payment.bankEnabled) {
        await apiClient.patch(
          '/api/shops/bank-account',
          {
            bankName: payment.bankName,
            accountNumber: payment.accountNumber,
            accountHolder: payment.accountHolder,
          },
          { shopId },
        );
      }

      // 4) Địa chỉ kho hàng mặc định
      await apiClient.patch(
        `/api/shops/${shopId}/warehouse`,
        {
          addressLine: warehouse.addressLine,
          provinceCode: warehouse.provinceCode,
          wardCode: warehouse.wardCode,
          phone: warehouse.phone,
          note: 'Kho hàng — nơi shipper đến lấy hàng',
        },
        { shopId },
      );

      // 5) Enqueue build nền rồi sang Dashboard ở trạng thái finalizing.
      await apiClient.post(`/api/shops/${shopId}/build`, {}, { shopId });

      return true;
    } catch (err: any) {
      toast.error(err?.message || t('hooks.billingGenericError'));
      setBusy(false);
      return false;
    }
  };

  return { busy, submit };
}
