"use client";

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useTranslations } from '@ecommerce/i18n/src/react';
import type { AnalyticsPeriod } from '@/hooks/useAnalytics';

export const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

export const formatCompactVND = (value: number) => {
  if (Math.abs(value) >= 1_000_000_000) return `₫${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `₫${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `₫${(value / 1_000).toFixed(0)}k`;
  return `₫${value}`;
};

export const PERIOD_OPTION_KEYS: { value: AnalyticsPeriod; labelKey: string }[] = [
  { value: '7d', labelKey: 'analytics.period7d' },
  { value: '30d', labelKey: 'analytics.period30d' },
  { value: '90d', labelKey: 'analytics.period90d' },
];

const ORDER_STATE_KEYS: Record<string, string> = {
  checkout: 'analytics.orderState.checkout',
  confirmed: 'analytics.orderState.confirmed',
  processing: 'analytics.orderState.processing',
  shipped: 'analytics.orderState.shipped',
  delivered: 'analytics.orderState.delivered',
  completed: 'analytics.orderState.completed',
  returned: 'analytics.orderState.returned',
  canceled: 'analytics.orderState.canceled',
};

const PAYMENT_STATE_KEYS: Record<string, string> = {
  balance_due: 'analytics.payState.balance_due',
  paid: 'analytics.payState.paid',
  credit_owed: 'analytics.payState.credit_owed',
  refunded: 'analytics.payState.refunded',
  void: 'analytics.payState.void',
};

// ISODOW: 1 = Thứ 2 … 7 = Chủ nhật
const DOW_KEYS = [
  'analytics.dow.mon', 'analytics.dow.tue', 'analytics.dow.wed', 'analytics.dow.thu',
  'analytics.dow.fri', 'analytics.dow.sat', 'analytics.dow.sun',
];

/**
 * Dịch các bản đồ nhãn trạng thái (const module-scope không gọi được hook,
 * nên gom vào một hook để trang truyền `labels` đã dịch cho DonutCard/chart).
 */
export function useAnalyticsLabels() {
  const t = useTranslations('admin');
  const mapLabels = (keys: Record<string, string>) =>
    Object.fromEntries(Object.entries(keys).map(([k, key]) => [k, t(key)]));
  return {
    orderStateLabels: mapLabels(ORDER_STATE_KEYS),
    paymentStateLabels: mapLabels(PAYMENT_STATE_KEYS),
    dowLabels: DOW_KEYS.map((k) => t(k)),
  };
}

export const CHART_COLORS = [
  '#818cf8', // indigo
  '#34d399', // emerald
  '#fbbf24', // amber
  '#f472b6', // pink
  '#38bdf8', // sky
  '#a78bfa', // violet
  '#fb923c', // orange
  '#2dd4bf', // teal
];

export const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: '#1e293b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
};

export function PeriodSelect({
  value,
  onChange,
}: {
  value: AnalyticsPeriod;
  onChange: (period: AnalyticsPeriod) => void;
}) {
  const t = useTranslations('admin');
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as AnalyticsPeriod)}
      className="bg-slate-800 text-white border border-white/10 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
    >
      {PERIOD_OPTION_KEYS.map((opt) => (
        <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
      ))}
    </select>
  );
}

export function ChangeBadge({ value, invert = false }: { value: number | null; invert?: boolean }) {
  const t = useTranslations('admin');
  if (value === null) {
    return <span className="text-xs font-medium text-slate-500">{t('analytics.changeNoPrev')}</span>;
  }

  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">
        <Minus size={12} /> 0% {t('analytics.vsPrev')}
      </span>
    );
  }

  const isUp = rounded > 0;
  // invert: chỉ số càng thấp càng tốt (vd: tỷ lệ hủy) — tăng là xấu
  const isGood = invert ? !isUp : isUp;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold ${isGood ? 'text-emerald-400' : 'text-rose-400'}`}>
      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {isUp ? '+' : ''}{rounded}% {t('analytics.vsPrev')}
    </span>
  );
}

const ACCENT_STYLES = {
  indigo: { glow: 'from-indigo-500/10', chip: 'bg-indigo-500/20 text-indigo-400' },
  emerald: { glow: 'from-emerald-500/10', chip: 'bg-emerald-500/20 text-emerald-400' },
  amber: { glow: 'from-amber-500/10', chip: 'bg-amber-500/20 text-amber-400' },
  violet: { glow: 'from-violet-500/10', chip: 'bg-violet-500/20 text-violet-400' },
  rose: { glow: 'from-rose-500/10', chip: 'bg-rose-500/20 text-rose-400' },
  sky: { glow: 'from-sky-500/10', chip: 'bg-sky-500/20 text-sky-400' },
} as const;

export type KpiAccent = keyof typeof ACCENT_STYLES;

export function KpiCard({
  icon,
  label,
  value,
  change,
  invertChange = false,
  accent = 'indigo',
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: number | null;
  invertChange?: boolean;
  accent?: KpiAccent;
  sub?: string;
}) {
  const styles = ACCENT_STYLES[accent];
  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
      <div className={`absolute inset-0 bg-gradient-to-br ${styles.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-4 rounded-2xl ${styles.chip}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-slate-400 text-sm font-medium">{label}</p>
          <h3 className="text-2xl font-bold text-white truncate" title={value}>{value}</h3>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
          {change !== undefined && (
            <div className="mt-1">
              <ChangeBadge value={change} invert={invertChange} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Donut + chú giải có số liệu — phân bố theo nhóm (trạng thái đơn,
 * thanh toán, tỷ trọng doanh thu…). `valueFormatter` cho giá trị tiền.
 */
export function DonutCard({
  title,
  data,
  labels = {},
  emptyText,
  valueFormatter = (v) => String(v),
  className = '',
}: {
  title: string;
  data: Record<string, number>;
  labels?: Record<string, string>;
  emptyText: string;
  valueFormatter?: (value: number) => string;
  className?: string;
}) {
  const entries = Object.entries(data)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((acc, [, value]) => acc + value, 0);
  const chartData = entries.map(([key, value], i) => ({
    name: labels[key] || key,
    value,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className={`bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl ${className}`}>
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-slate-500 text-center py-12">{emptyText}</p>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="h-[180px] w-[180px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(value: any, name: any) => [valueFormatter(Number(value)), name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 w-full space-y-2 min-w-0">
            {chartData.map((entry) => {
              const percent = total > 0 ? (entry.value / total) * 100 : 0;
              return (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                  <span className="text-slate-300 truncate flex-1" title={entry.name}>{entry.name}</span>
                  <span className="text-white font-bold shrink-0">{valueFormatter(entry.value)}</span>
                  <span className="text-slate-500 text-xs shrink-0 w-12 text-right">{percent.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export interface FunnelStep {
  label: string;
  value: number;
  hint?: string;
}

/**
 * Sơ đồ funnel ngang: thanh thu hẹp dần theo % so với bước đầu,
 * kèm tỷ lệ chuyển đổi giữa từng bước.
 */
export function FunnelSteps({ steps }: { steps: FunnelStep[] }) {
  const base = steps[0]?.value ?? 0;
  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const widthPercent = base > 0 ? Math.max((step.value / base) * 100, 2) : 2;
        const prev = index > 0 ? steps[index - 1].value : null;
        const stepRate = prev !== null ? (prev > 0 ? (step.value / prev) * 100 : null) : null;
        return (
          <div key={step.label}>
            <div className="flex justify-between items-baseline mb-1 gap-2">
              <span className="text-slate-300 text-sm">
                {step.label}
                {step.hint && <span className="text-slate-500 text-xs ml-2">{step.hint}</span>}
              </span>
              <span className="text-white text-sm font-bold shrink-0">
                {step.value.toLocaleString('vi-VN')}
                {base > 0 && index > 0 && (
                  <span className="text-slate-500 font-normal text-xs ml-2">
                    {((step.value / base) * 100).toFixed(1)}% tổng
                  </span>
                )}
              </span>
            </div>
            <div className="h-7 bg-white/5 rounded-lg overflow-hidden">
              <div
                className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
                style={{
                  width: `${widthPercent}%`,
                  background: `linear-gradient(90deg, ${CHART_COLORS[index % CHART_COLORS.length]}66, ${CHART_COLORS[index % CHART_COLORS.length]})`,
                }}
              >
                {stepRate !== null && (
                  <span className="text-[11px] font-bold text-white/90 whitespace-nowrap">
                    {stepRate.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BreakdownList({
  title,
  data,
  labels,
  emptyText,
}: {
  title: string;
  data: Record<string, number>;
  labels: Record<string, string>;
  emptyText: string;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((acc, [, count]) => acc + count, 0);

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
      <h3 className="text-lg font-bold text-white mb-6">{title}</h3>
      <div className="space-y-4">
        {entries.map(([state, count]) => {
          const percent = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={state}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-slate-300 text-sm">{labels[state] || state}</span>
                <span className="text-white text-sm font-bold">
                  {count} <span className="text-slate-500 font-normal">({percent.toFixed(0)}%)</span>
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
        {entries.length === 0 && (
          <p className="text-slate-500 text-center py-4">{emptyText}</p>
        )}
      </div>
    </div>
  );
}
