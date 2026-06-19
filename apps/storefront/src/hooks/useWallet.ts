'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@ecommerce/ui-registry/src/store/toast-store';
import { useTranslations } from '@ecommerce/i18n/src/react';

export interface WalletData {
  id: string;
  balance: number;
  pendingTopups: { id: string; amount: number; status: string; createdAt: string; expiresAt: string }[];
}

export interface WalletTxRow {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note?: string | null;
  createdAt: string;
}

export interface TopupResult {
  id: string;
  amount: number;
  bankAccount?: { bankName?: string; accountHolder?: string; accountNumber?: string } | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const MIN_TOPUP = 1000;

/**
 * Toàn bộ logic ví phía người mua: đọc token từ cookie, gọi API ví/giao dịch/nạp tiền.
 * WalletClient chỉ render — không còn fetch hay xử lý cookie trong component.
 */
export function useWallet(shopId: string, shopSlug: string) {
  const t = useTranslations('shop');

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [txs, setTxs] = useState<WalletTxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [requesting, setRequesting] = useState(false);
  const [topupResult, setTopupResult] = useState<TopupResult | null>(null);

  const authHeaders = useCallback((): Record<string, string> => {
    const token = document.cookie.split(';')
      .find(c => c.trim().startsWith(`shop_session_${shopSlug}=`))
      ?.split('=')[1];
    return {
      'x-shop-id': shopId,
      'Authorization': `Bearer ${token || ''}`,
    };
  }, [shopId, shopSlug]);

  const refetch = useCallback(async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        fetch(`${API_BASE}/api/wallet/me`, { headers: authHeaders() }),
        fetch(`${API_BASE}/api/wallet/me/transactions?limit=30`, { headers: authHeaders() }),
      ]);
      if (!walletRes.ok) {
        const body = await walletRes.json().catch(() => ({}));
        throw new Error(body.message || t('wallet.loadFailed'));
      }
      setWallet(await walletRes.json());

      if (txRes.ok) {
        const txData = await txRes.json();
        setTxs(txData.data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, t]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  /** Tạo yêu cầu nạp tiền. Trả về true nếu tạo thành công (để component clear input). */
  const requestTopup = useCallback(async (amount: number): Promise<boolean> => {
    if (!amount || amount < MIN_TOPUP) {
      toast.error(t('wallet.minAmount'));
      return false;
    }
    setRequesting(true);
    try {
      const res = await fetch(`${API_BASE}/api/wallet/topup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t('wallet.topupFailed'));
      setTopupResult(data);
      await refetch();
      return true;
    } catch (err: any) {
      toast.error(err.message);
      return false;
    } finally {
      setRequesting(false);
    }
  }, [authHeaders, t, refetch]);

  return {
    wallet,
    txs,
    loading,
    error,
    requesting,
    topupResult,
    clearTopupResult: () => setTopupResult(null),
    requestTopup,
    refetch,
  };
}
