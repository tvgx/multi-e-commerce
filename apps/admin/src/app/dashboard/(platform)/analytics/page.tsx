"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePlatformAnalytics } from '@/hooks/usePlatformAnalytics';
import type { AnalyticsPeriod } from '@/hooks/useAnalytics';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Loader2, TrendingUp, ShoppingBag, Receipt, UserPlus, Store, XCircle, RefreshCw,
  BarChart3, ArrowRight, Eye, Target, Star,
} from 'lucide-react';
import {
  formatVND, formatCompactVND, PeriodSelect, ChangeBadge, DonutCard,
  ORDER_STATE_LABELS, CHART_COLORS, CHART_TOOLTIP_STYLE,
} from '@/components/analytics/AnalyticsWidgets';

const formatDateTick = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

function PlatformKpiCard({
  icon,
  label,
  value,
  change,
  invertChange = false,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: number | null;
  invertChange?: boolean;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
      <div className="flex items-center gap-3 text-zinc-400 mb-3">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white truncate" title={value}>{value}</div>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
      {change !== undefined && (
        <div className="mt-2">
          <ChangeBadge value={change} invert={invertChange} />
        </div>
      )}
    </div>
  );
}

export default function PlatformAnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const { data, loading, error, refresh } = usePlatformAnalytics(period);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-10">
        <div className="mx-auto max-w-5xl p-6 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
          Không tải được dữ liệu phân tích: {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    summary, revenueSeries, topShops, ordersByState,
    shopComparison, revenueByShop, newCustomersSeries,
  } = data;
  const { current, change } = summary;

  // Donut tỷ trọng doanh thu: shop ngoài top gộp thành "Khác"
  const revenueShareData: Record<string, number> = {};
  for (const shop of topShops.slice(0, 6)) revenueShareData[shop.name] = shop.revenue;
  const otherRevenue = topShops.slice(6).reduce((acc, s) => acc + s.revenue, 0);
  if (otherRevenue > 0) revenueShareData['Khác'] = otherRevenue;

  return (
    <div className="p-6 md:p-10 text-zinc-100 min-h-full">
      <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-indigo-400" /> Analytics Hub
            </h1>
            <p className="text-zinc-400 mt-2">
              Tổng hợp hiệu suất trên {summary.totalShops} cửa hàng của bạn — {summary.totalCustomers} khách hàng.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              title="Làm mới dữ liệu"
              className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <PeriodSelect value={period} onChange={setPeriod} />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <PlatformKpiCard
            icon={<TrendingUp size={16} />}
            label="Tổng doanh thu"
            value={formatVND(current.revenue)}
            change={change.revenue}
          />
          <PlatformKpiCard
            icon={<ShoppingBag size={16} />}
            label="Đơn hàng"
            value={String(current.orderCount)}
            change={change.orderCount}
          />
          <PlatformKpiCard
            icon={<Receipt size={16} />}
            label="Giá trị TB / đơn (AOV)"
            value={formatVND(current.aov)}
            change={change.aov}
          />
          <PlatformKpiCard
            icon={<Eye size={16} />}
            label="Khách ghé các shop"
            value={current.visitors.toLocaleString('vi-VN')}
            change={change.visitors}
          />
          <PlatformKpiCard
            icon={<Target size={16} />}
            label="Tỷ lệ chuyển đổi"
            value={`${current.conversionRate.toFixed(1)}%`}
            sub={`${current.uniqueBuyers} khách mua / ${current.visitors} khách ghé`}
            change={change.conversionRate}
          />
          <PlatformKpiCard
            icon={<UserPlus size={16} />}
            label="Khách hàng mới"
            value={String(current.newCustomers)}
            change={change.newCustomers}
          />
          <PlatformKpiCard
            icon={<Store size={16} />}
            label="Shop có đơn hàng"
            value={`${current.activeShops}/${summary.totalShops}`}
            sub="Số shop phát sinh đơn trong kỳ"
          />
          <PlatformKpiCard
            icon={<XCircle size={16} />}
            label="Tỷ lệ hủy đơn"
            value={`${current.cancelRate.toFixed(1)}%`}
            change={change.cancelRate}
            invertChange
          />
        </div>

        {/* Revenue chart */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-6">Doanh thu toàn bộ cửa hàng theo ngày</h3>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="platformRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickMargin={10} tickFormatter={formatDateTick} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={(val: number) => formatCompactVND(val)} />
                <RechartsTooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelFormatter={(label) => `Ngày ${formatDateTick(String(label))}`}
                  formatter={(value: any, name: any) =>
                    name === 'Doanh thu' ? [formatVND(Number(value)), name] : [value, 'Đơn hàng']
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="#818cf8"
                  strokeWidth={3}
                  fill="url(#platformRevenueGradient)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by shop (multi-line) */}
        {revenueByShop.shops.length > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-white mb-1">So sánh doanh thu giữa các cửa hàng</h3>
            <p className="text-zinc-500 text-xs mb-5">Top {revenueByShop.shops.length} shop theo doanh thu trong kỳ.</p>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueByShop.series} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickMargin={10} tickFormatter={formatDateTick} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={(val: number) => formatCompactVND(val)} />
                  <RechartsTooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    labelFormatter={(label) => `Ngày ${formatDateTick(String(label))}`}
                    formatter={(value: any, name: any) => [formatVND(Number(value)), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                  {revenueByShop.shops.map((shop, index) => (
                    <Line
                      key={shop.shopId}
                      type="monotone"
                      dataKey={shop.shopId}
                      name={shop.name}
                      stroke={CHART_COLORS[index % CHART_COLORS.length]}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Revenue share + Orders by state donuts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DonutCard
            title="Tỷ trọng doanh thu theo cửa hàng"
            data={revenueShareData}
            emptyText="Chưa có doanh thu trong kỳ này."
            valueFormatter={formatCompactVND}
          />
          <DonutCard
            title="Trạng thái đơn hàng toàn hệ thống"
            data={ordersByState}
            labels={ORDER_STATE_LABELS}
            emptyText="Chưa có đơn hàng nào trong kỳ này."
          />
        </div>

        {/* New customers series */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-6">Khách hàng mới theo ngày (tất cả cửa hàng)</h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={newCustomersSeries} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickMargin={10} tickFormatter={formatDateTick} />
                <YAxis allowDecimals={false} stroke="rgba(255,255,255,0.4)" fontSize={12} />
                <RechartsTooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelFormatter={(label) => `Ngày ${formatDateTick(String(label))}`}
                />
                <Bar dataKey="count" name="Khách mới" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shop comparison table */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-1">Bảng so sánh hiệu quả từng cửa hàng</h3>
          <p className="text-zinc-500 text-xs mb-5">
            Sắp xếp theo doanh thu trong kỳ. Bấm vào tên shop để xem phân tích chi tiết.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
                  <th className="text-left font-semibold py-3 pr-4">#</th>
                  <th className="text-left font-semibold py-3 pr-4">Cửa hàng</th>
                  <th className="text-right font-semibold py-3 px-4">Doanh thu</th>
                  <th className="text-right font-semibold py-3 px-4">Đơn</th>
                  <th className="text-right font-semibold py-3 px-4">AOV</th>
                  <th className="text-right font-semibold py-3 px-4">Khách ghé</th>
                  <th className="text-right font-semibold py-3 px-4">Chuyển đổi</th>
                  <th className="text-right font-semibold py-3 px-4">Khách mới</th>
                  <th className="text-right font-semibold py-3 px-4">Hủy đơn</th>
                  <th className="text-right font-semibold py-3 pl-4">Đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {shopComparison.map((shop, index) => (
                  <tr key={shop.shopId} className="border-b border-zinc-800/60 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pr-4 text-zinc-500 font-bold">{index + 1}</td>
                    <td className="py-3 pr-4 max-w-[220px]">
                      <Link
                        href={`/dashboard/${shop.shopId}/analytics`}
                        className="text-white font-medium hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5 max-w-full"
                        title={shop.name}
                      >
                        <span className="truncate">{shop.name}</span>
                        <ArrowRight size={12} className="shrink-0 opacity-50" />
                      </Link>
                      {shop.status === 'DRAFT' && (
                        <span className="ml-2 text-[10px] font-bold uppercase text-amber-400/80 bg-amber-400/10 px-1.5 py-0.5 rounded">Nháp</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-white font-bold whitespace-nowrap">{formatVND(shop.revenue)}</td>
                    <td className="py-3 px-4 text-right text-zinc-300">{shop.orderCount}</td>
                    <td className="py-3 px-4 text-right text-zinc-300 whitespace-nowrap">{formatCompactVND(shop.aov)}</td>
                    <td className="py-3 px-4 text-right text-zinc-300">{shop.visitors.toLocaleString('vi-VN')}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={shop.conversionRate > 0 ? 'text-emerald-400 font-medium' : 'text-zinc-500'}>
                        {shop.conversionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-300">{shop.newCustomers}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={shop.cancelRate > 10 ? 'text-rose-400 font-medium' : 'text-zinc-300'}>
                        {shop.cancelRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-right whitespace-nowrap">
                      {shop.avgRating !== null ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                          <Star size={12} className="fill-amber-400" /> {shop.avgRating.toFixed(1)}
                          <span className="text-zinc-500 font-normal">({shop.reviewCount})</span>
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {shopComparison.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center text-zinc-500 py-10">Chưa có cửa hàng nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
