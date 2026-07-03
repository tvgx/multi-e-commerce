import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

// Platform billing (owner SaaS subscription) — KHÔNG nhầm với useBillingShipping
// (bước thiết lập vận chuyển/thanh toán per-shop của wizard tạo shop).

export interface Plan {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  priceMonthly: number;
  currency: string;
  interval: string;
  maxShops: number;
  maxProductsPerShop: number;
  features?: Record<string, unknown> | null;
  sortOrder: number;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: Plan;
}

export interface Invoice {
  id: string;
  number: string;
  planId?: string | null;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'VOID';
  periodStart: string;
  periodEnd: string;
  issuedAt: string;
  paidAt?: string | null;
  description?: string | null;
}

export interface SubscribeResult {
  subscription: Subscription | null;
  invoice: Invoice | null;
  token?: string;
  confirmUrl?: string | null;
  qrCodeUrl?: string | null;
  expiresAt?: string;
}

export function usePlatformBilling() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [plansRes, subRes, invoicesRes] = await Promise.all([
          apiClient.get<Plan[]>('/api/billing/plans'),
          apiClient.get<Subscription | null>('/api/billing/subscription'),
          apiClient.get<{ data: Invoice[]; meta: unknown }>('/api/billing/invoices?limit=50'),
        ]);
        if (isMounted) {
          setPlans(plansRes.data ?? []);
          setSubscription(subRes.data ?? null);
          setInvoices(invoicesRes.data?.data ?? []);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAll();
    return () => { isMounted = false; };
  }, [refreshKey]);

  const subscribe = useCallback(async (planKey: string): Promise<SubscribeResult> => {
    const res = await apiClient.post<SubscribeResult>('/api/billing/subscribe', { planKey });
    return res.data;
  }, []);

  const cancel = useCallback(async () => {
    await apiClient.post('/api/billing/cancel', {});
  }, []);

  return { plans, subscription, invoices, loading, error, refresh, subscribe, cancel };
}
