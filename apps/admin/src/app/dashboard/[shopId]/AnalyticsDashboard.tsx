"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useAnalytics, AnalyticsPeriod } from '@/hooks/useAnalytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, ShoppingBag, Receipt, UserPlus, ArrowRight } from 'lucide-react';
import {
  formatVND, formatCompactVND, PeriodSelect, KpiCard, BreakdownList, useAnalyticsLabels,
} from '@/components/analytics/AnalyticsWidgets';
import { useTranslations } from '@ecommerce/i18n/src/react';

const formatDateTick = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

export function AnalyticsDashboard({ shopId }: { shopId: string }) {
  const t = useTranslations('admin');
  const { orderStateLabels } = useAnalyticsLabels();
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const { data, loading, error } = useAnalytics(shopId, period);

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center h-64 bg-slate-900/50 rounded-3xl border border-white/5">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-3xl">
        {t('analytics.errorLoad')}: {error}
      </div>
    );
  }

  if (!data) return null;

  const { summary, revenueSeries, ordersByState } = data;
  const { current, change } = summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-white">{t('analytics.perfOverview')}</h2>
        <div className="flex items-center gap-3">
          <PeriodSelect value={period} onChange={setPeriod} />
          <Link
            href={`/dashboard/${shopId}/analytics`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30 rounded-xl text-sm font-bold transition-colors"
          >
            {t('analytics.detailedReport')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          icon={<TrendingUp size={24} />}
          label={t('analytics.kpiRevenue')}
          value={formatVND(current.revenue)}
          change={change.revenue}
          accent="indigo"
        />
        <KpiCard
          icon={<ShoppingBag size={24} />}
          label={t('analytics.kpiOrdersNew')}
          value={String(current.orderCount)}
          change={change.orderCount}
          accent="emerald"
        />
        <KpiCard
          icon={<Receipt size={24} />}
          label={t('analytics.kpiAovPlain')}
          value={formatVND(current.aov)}
          change={change.aov}
          accent="amber"
        />
        <KpiCard
          icon={<UserPlus size={24} />}
          label={t('analytics.kpiNewCustomers')}
          value={String(current.newCustomers)}
          change={change.newCustomers}
          accent="violet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6">{t('analytics.revChartTitle')}</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueSeries} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickMargin={10} tickFormatter={formatDateTick} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={(val: number) => formatCompactVND(val)} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#818cf8' }}
                  labelFormatter={(label) => `${t('analytics.dayPrefix')} ${formatDateTick(String(label))}`}
                  formatter={(value: any) => [formatVND(Number(value)), t('analytics.seriesRevenue')]}
                />
                <Line type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <BreakdownList
          title={t('analytics.orderStatusShort')}
          data={ordersByState}
          labels={orderStateLabels}
          emptyText={t('analytics.orderEmptyShort')}
        />
      </div>
    </div>
  );
}
