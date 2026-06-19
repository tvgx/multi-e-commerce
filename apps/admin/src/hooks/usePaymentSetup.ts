import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from '@ecommerce/ui-registry/src/store/toast-store';

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch: string;
}

const EMPTY: BankAccount = { bankName: '', accountNumber: '', accountHolder: '', branch: '' };

/**
 * Logic dữ liệu cho trang thiết lập thanh toán: nạp thông tin ngân hàng của shop
 * và lưu (cập nhật bank-account + bật COD/chuyển khoản). Trang giữ phần form + điều hướng.
 */
export function usePaymentSetup(shopId: string) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialBankAccount, setInitialBankAccount] = useState<BankAccount | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<any>(`/api/shops/${shopId}`, { shopId });
        if (!active) return;
        const ba = res.data?.bankAccount;
        if (ba && typeof ba === 'object' && Object.keys(ba).length > 0) {
          setInitialBankAccount({
            bankName: ba.bankName || '',
            accountNumber: ba.accountNumber || '',
            accountHolder: ba.accountHolder || '',
            branch: ba.branch || '',
          });
        } else {
          setInitialBankAccount(EMPTY);
        }
      } catch (err) {
        console.error('Failed to fetch shop', err);
        if (active) setInitialBankAccount(EMPTY);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [shopId]);

  /** Lưu thông tin ngân hàng + kích hoạt COD/chuyển khoản. Trả về true nếu thành công. */
  const save = useCallback(async (bankAccount: BankAccount): Promise<boolean> => {
    setSaving(true);
    try {
      await apiClient.patch(`/api/shops/bank-account`, {
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
        accountHolder: bankAccount.accountHolder,
      }, { shopId });

      await apiClient.patch(`/api/shops/${shopId}/payment-methods`, {
        cod: true,
        bankTransfer: true,
      }, { shopId });

      return true;
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [shopId]);

  return { loading, saving, initialBankAccount, save };
}
