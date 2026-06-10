"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePlatformAnalytics } from '@/hooks/usePlatformAnalytics';
import type { AnalyticsPeriod } from '@/hooks/useAnalytics';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import {
  Loader2, TrendingUp, ShoppingBag, Receipt, UserPlus, Store, XCircle, RefreshCw, BarChart3, Trophy, ArrowRight,
} from 'lucide-react';
import {
  formatVND, formatCompactVND, PeriodSelect, ChangeBadge, ORDER_STATE_LABELS,
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

  const { summary, revenueSeries, topShops, ordersByState } = data;
  const { current, change } = summary;
  const stateEntries = Object.entries(ordersByState).sort((a, b) => b[1] - a[1]);
  const stateTotal = stateEntries.reduce((acc, [, count]) => acc + count, 0);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', color: '#fff' }}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top shops */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Trophy size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Xếp hạng cửa hàng theo doanh thu</h3>
            </div>
            <div className="space-y-4">
              {topShops.map((shop, index) => (
                <div key={shop.shopId}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="w-6 h-6 flex items-center justify-center bg-zinc-800 text-zinc-300 text-xs font-bold rounded-md shrink-0">
                      {index + 1}
                    </span>
                    <Link
                      href={`/dashboard/${shop.shopId}/analytics`}
                      className="flex-1 min-w-0 text-sm font-medium text-white hover:text-indigo-400 transition-colors truncate inline-flex items-center gap-1.5"
                      title={shop.name}
                    >
                      {shop.name} <ArrowRight size={12} className="shrink-0 opacity-50" />
                    </Link>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-white">{formatVND(shop.revenue)}</span>
                      <span className="text-xs text-zinc-500 ml-2">{shop.orderCount} đơn</span>
                    </div>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                      style={{ width: `${shop.revenueShare}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{shop.revenueShare.toFixed(1)}% tổng doanh thu</p>
                </div>
              ))}
              {topShops.length === 0 && (
                <p className="text-zinc-500 text-center py-8">Chưa có doanh thu trong kỳ này.</p>
              )}
            </div>
          </div>

          {/* Orders by state */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-white mb-6">Trạng thái đơn hàng toàn hệ thống</h3>
            <div className="space-y-4">
              {stateEntries.map(([state, count]) => {
                const percent = stateTotal > 0 ? (count / stateTotal) * 100 : 0;
                return (
                  <div key={state}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-zinc-300 text-sm">{ORDER_STATE_LABELS[state] || state}</span>
                      <span className="text-white text-sm font-bold">
                        {count} <span className="text-zinc-500 font-normal">({percent.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {stateEntries.length === 0 && (
                <p className="text-zinc-500 text-center py-8">Chưa có đơn hàng nào trong kỳ này.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
