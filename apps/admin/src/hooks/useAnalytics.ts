import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export type AnalyticsPeriod = '7d' | '30d' | '90d';

export interface AnalyticsKpis {
  revenue: number;
  orderCount: number;
  aov: number;
  newCustomers: number;
  uniqueBuyers: number;
  canceledOrders: number;
  cancelRate: number;
}

export interface AnalyticsSummary {
  period: AnalyticsPeriod;
  current: AnalyticsKpis;
  previous: AnalyticsKpis;
  // % thay đổi so với kỳ trước; null = kỳ trước bằng 0, không so sánh được
  change: {
    revenue: number | null;
    orderCount: number | null;
    aov: number | null;
    newCustomers: number | null;
    cancelRate: number | null;
  };
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  variantId: string;
  productId: string | null;
  name: string;
  sku: string | null;
  quantity: number;
  revenue: number;
}

export interface TopCustomer {
  customerId: string;
  name: string;
  email: string | null;
  orderCount: number;
  totalSpent: number;
}

export interface CustomerInsights {
  totalCustomers: number;
  newCustomers: number;
  uniqueBuyers: number;
  newBuyers: number;
  returningBuyers: number;
  topCustomers: TopCustomer[];
}

export interface AnalyticsDashboardData {
  summary: AnalyticsSummary;
  revenueSeries: RevenuePoint[];
  ordersByState: Record<string, number>;
  paymentsByState: Record<string, number>;
  topProducts: TopProduct[];
  customers: CustomerInsights;
}

export function useAnalytics(shopId: string, period: AnalyticsPeriod = '30d') {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!shopId) return;

    let isMounted = true;
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<AnalyticsDashboardData>(
          `/api/analytics/dashboard?period=${period}`,
          { shopId }
        );

        if (isMounted) {
          setData(res.data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnalytics();

    return () => { isMounted = false; };
  }, [shopId, period, refreshKey]);

  return { data, loading, error, refresh };
}
