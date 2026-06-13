import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export type AnalyticsPeriod = '7d' | '30d' | '90d';

export interface AnalyticsKpis {
  revenue: number;
  orderCount: number;
  aov: number;
  newCustomers: number;
  uniqueBuyers: number;
  visitors: number;
  conversionRate: number;
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
    visitors: number | null;
    conversionRate: number | null;
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

export interface VisitPoint {
  date: string;
  visits: number;
  visitors: number;
}

export interface TrafficInsights {
  totalVisits: number;
  series: VisitPoint[];
  returningVisitors: number;
  totalVisitors: number;
  // % khách ghé >= 2 phiên trong kỳ — "ở lại sau lần đầu"
  returningVisitorRate: number;
}

export interface ConversionFunnel {
  visitors: number;
  cartCustomers: number;
  buyers: number;
  completedBuyers: number;
}

export interface RepeatPurchase {
  repeatCustomers: number;
  totalPurchasers: number;
  // % khách đã mua quay lại mua >= 2 lần (trọn đời)
  repeatPurchaseRate: number;
}

export interface TimingPoint {
  orders: number;
  revenue: number;
}

export interface OrderTiming {
  byHour: (TimingPoint & { hour: number })[];
  byDow: (TimingPoint & { dow: number })[]; // 1 = Thứ 2 … 7 = Chủ nhật
}

export interface RevenueBreakdown {
  total: number;
  itemTotal: number;
  promoTotal: number;
  taxTotal: number;
  shipmentTotal: number;
}

export interface ReviewStats {
  avgRating: number;
  totalReviews: number;
  newReviews: number;
  distribution: { rating: number; count: number }[];
}

export interface TopSearch {
  query: string;
  count: number;
}

export interface AnalyticsDashboardData {
  summary: AnalyticsSummary;
  revenueSeries: RevenuePoint[];
  ordersByState: Record<string, number>;
  paymentsByState: Record<string, number>;
  topProducts: TopProduct[];
  customers: CustomerInsights;
  traffic: TrafficInsights;
  funnel: ConversionFunnel;
  retention: RepeatPurchase;
  timing: OrderTiming;
  revenueBreakdown: RevenueBreakdown;
  reviews: ReviewStats;
  topSearches: TopSearch[];
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
