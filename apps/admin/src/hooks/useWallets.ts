import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast, confirmDialog } from '@ecommerce/ui-registry/src/store/toast-store';
import { useTranslations } from '@ecommerce/i18n/src/react';

export interface CustomerLite {
  id: string;
  name?: string | null;
  email?: string | null;
}

export interface WalletRow {
  id: string;
  customerId: string;
  balance: number;
  active: boolean;
  updatedAt: string;
  customer?: CustomerLite;
}

export interface TopupRow {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  expiresAt: string;
  customer?: CustomerLite | null;
}

export interface WalletTxRow {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note?: string | null;
  createdBy: string;
  createdAt: string;
}

export interface WalletSummary {
  walletCount: number;
  totalBalance: number;
  pendingTopupCount: number;
  pendingTopupAmount: number;
}

// API trả { data: [...] } trực tiếp (không có wrapper BaseResponse toàn cục)
function unwrapList<T>(res: any): T[] {
  const items = res?.data;
  if (Array.isArray(items)) return items;
  return items?.data ?? [];
}

/**
 * Toàn bộ logic dữ liệu/nghiệp vụ của trang Wallets admin.
 * Component chỉ giữ state trình bày (modal, ô tìm kiếm) và phần render.
 */
export function useWallets(shopId: string) {
  const tr = useTranslations('admin');

  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [topups, setTopups] = useState<TopupRow[]>([]);
  const [walletPaymentActive, setWalletPaymentActive] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  const fetchAll = useCallback(async (searchTerm = '') => {
    setLoading(true);
    try {
      const [walletsRes, topupsRes, pmRes, summaryRes] = await Promise.all([
        apiClient.get<any>(`/api/wallet/admin/wallets?search=${encodeURIComponent(searchTerm)}`, { shopId }),
        apiClient.get<any>(`/api/wallet/admin/topups?status=pending`, { shopId }),
        apiClient.get<any>(`/api/wallet/admin/payment-method`, { shopId }),
        apiClient.get<any>(`/api/wallet/admin/summary`, { shopId }),
      ]);
      setWallets(unwrapList<WalletRow>(walletsRes));
      setTopups(unwrapList<TopupRow>(topupsRes));
      const pm: any = pmRes.data;
      setWalletPaymentActive(pm ? !!pm.active : false);
      setSummary((summaryRes.data ?? summaryRes) as WalletSummary);
    } catch (err) {
      console.error('Failed to fetch wallets', err);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  const toggleWalletPayment = useCallback(async () => {
    const next = !walletPaymentActive;
    try {
      await apiClient.post(`/api/wallet/admin/payment-method`, { active: next }, { shopId });
      setWalletPaymentActive(next);
    } catch (err: any) {
      toast.error(`${tr('wallets.errorPrefix')}: ${err.message}`);
    }
  }, [walletPaymentActive, shopId, tr]);

  const resolveTopup = useCallback(async (id: string, action: 'confirm' | 'reject', searchTerm = '') => {
    if (
      action === 'confirm' &&
      !(await confirmDialog({
        title: tr('wallets.confirmTopupTitle'),
        message: tr('wallets.confirmTopupMessage'),
        confirmText: tr('wallets.confirmTopupConfirm'),
      }))
    )
      return;
    setResolving(id);
    try {
      await apiClient.post(`/api/wallet/admin/topups/${id}/resolve`, { action }, { shopId });
      await fetchAll(searchTerm);
    } catch (err: any) {
      toast.error(`${tr('wallets.errorPrefix')}: ${err.message}`);
    } finally {
      setResolving(null);
    }
  }, [shopId, tr, fetchAll]);

  /** amount đã có dấu: dương = cộng, âm = trừ. Trả về true nếu thành công. */
  const adjustBalance = useCallback(async (
    customerId: string,
    amount: number,
    note?: string,
    searchTerm = '',
  ): Promise<boolean> => {
    if (!amount || amount === 0) {
      toast.error(tr('wallets.invalidAmount'));
      return false;
    }
    try {
      await apiClient.post(`/api/wallet/admin/adjust`, {
        customerId,
        amount,
        note: note?.trim() || undefined,
      }, { shopId });
      await fetchAll(searchTerm);
      return true;
    } catch (err: any) {
      toast.error(`${tr('wallets.errorPrefix')}: ${err.message}`);
      return false;
    }
  }, [shopId, tr, fetchAll]);

  const loadTransactions = useCallback(async (walletId: string): Promise<WalletTxRow[]> => {
    const res = await apiClient.get<any>(`/api/wallet/admin/wallets/${walletId}/transactions?limit=50`, { shopId });
    return unwrapList<WalletTxRow>(res);
  }, [shopId]);

  return {
    loading,
    wallets,
    topups,
    walletPaymentActive,
    summary,
    resolving,
    fetchAll,
    toggleWalletPayment,
    resolveTopup,
    adjustBalance,
    loadTransactions,
  };
}
