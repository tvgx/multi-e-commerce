import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { AnalyticsPeriod, RevenuePoint } from './useAnalytics';

export interface PlatformKpis {
  revenue: number;
  orderCount: number;
  aov: number;
  newCustomers: number;
  activeShops: number;
  uniqueBuyers: number;
  visitors: number;
  conversionRate: number;
  canceledOrders: number;
  cancelRate: number;
}

export interface PlatformSummary {
  period: AnalyticsPeriod;
  totalShops: number;
  totalCustomers: number;
  current: PlatformKpis;
  previous: PlatformKpis;
  change: {
    revenue: number | null;
    orderCount: number | null;
    aov: number | null;
    newCustomers: number | null;
    visitors: number | null;
    conversionRate: number | null;
    cancelRate: number | null;
  };
}

export interface TopShop {
  shopId: string;
  name: string;
  status: string | null;
  orderCount: number;
  revenue: number;
  revenueShare: number;
}

export interface ShopComparisonRow {
  shopId: string;
  name: string;
  status: string | null;
  revenue: number;
  orderCount: number;
  aov: number;
  cancelRate: number;
  newCustomers: number;
  visitors: number;
  buyers: number;
  conversionRate: number;
  avgRating: number | null;
  reviewCount: number;
}

export interface RevenueByShop {
  shops: { shopId: string; name: string }[];
  // mỗi điểm: { date, [shopId]: doanh thu }
  series: Array<Record<string, number | string> & { date: string }>;
}

export interface NewCustomerPoint {
  date: string;
  count: number;
}

export interface PlatformDashboardData {
  summary: PlatformSummary;
  revenueSeries: RevenuePoint[];
  topShops: TopShop[];
  ordersByState: Record<string, number>;
  shopComparison: ShopComparisonRow[];
  revenueByShop: RevenueByShop;
  newCustomersSeries: NewCustomerPoint[];
}

export function usePlatformAnalytics(period: AnalyticsPeriod = '30d') {
  const [data, setData] = useState<PlatformDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let isMounted = true;
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<PlatformDashboardData>(
          `/api/analytics/platform/dashboard?period=${period}`
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
  }, [period, refreshKey]);

  return { data, loading, error, refresh };
}
