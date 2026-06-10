"use client";

import React, { useState } from 'react';
import { useAnalytics, AnalyticsPeriod } from '@/hooks/useAnalytics';
import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Loader2, TrendingUp, ShoppingBag, Receipt, Users, UserPlus, XCircle, RefreshCw, Package, Crown,
} from 'lucide-react';
import {
  formatVND, formatCompactVND, PeriodSelect, KpiCard, BreakdownList,
  ORDER_STATE_LABELS, PAYMENT_STATE_LABELS,
} from '@/components/analytics/AnalyticsWidgets';

const formatDateTick = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

export default function AnalyticsPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = React.use(params);
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  const { data, loading, error, refresh } = useAnalytics(shopId, period);

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-3xl">
        Không tải được dữ liệu phân tích: {error}
      </div>
    );
  }

  if (!data) return null;

  const { summary, revenueSeries, ordersByState, paymentsByState, topProducts, customers } = data;
  const { current, change } = summary;
  const buyerTotal = customers.newBuyers + customers.returningBuyers;
  const returningPercent = buyerTotal > 0 ? (customers.returningBuyers / buyerTotal) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Phân tích bán hàng</h1>
          <p className="text-slate-400 mt-1">Theo dõi hiệu suất cửa hàng và hành vi khách hàng của bạn.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            title="Làm mới dữ liệu"
            className="p-2.5 bg-slate-800 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <PeriodSelect value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard
          icon={<TrendingUp size={24} />}
          label="Doanh thu"
          value={formatVND(current.revenue)}
          change={change.revenue}
          accent="indigo"
        />
        <KpiCard
          icon={<ShoppingBag size={24} />}
          label="Đơn hàng"
          value={String(current.orderCount)}
          change={change.orderCount}
          accent="emerald"
        />
        <KpiCard
          icon={<Receipt size={24} />}
          label="Giá trị trung bình / đơn (AOV)"
          value={formatVND(current.aov)}
          change={change.aov}
          accent="amber"
        />
        <KpiCard
          icon={<UserPlus size={24} />}
          label="Khách hàng mới"
          value={String(current.newCustomers)}
          change={change.newCustomers}
          accent="violet"
        />
        <KpiCard
          icon={<Users size={24} />}
          label="Khách đã mua hàng"
          value={String(current.uniqueBuyers)}
          accent="sky"
        />
        <KpiCard
          icon={<XCircle size={24} />}
          label="Tỷ lệ hủy đơn"
          value={`${current.cancelRate.toFixed(1)}%`}
          change={change.cancelRate}
          invertChange
          accent="rose"
        />
      </div>

      {/* Revenue + Orders Chart */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-6">Doanh thu & đơn hàng theo ngày</h3>
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={revenueSeries} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.4)"
                fontSize={12}
                tickMargin={10}
                tickFormatter={formatDateTick}
              />
              <YAxis
                yAxisId="revenue"
                stroke="rgba(255,255,255,0.4)"
                fontSize={12}
                tickFormatter={(val: number) => formatCompactVND(val)}
              />
              <YAxis
                yAxisId="orders"
                orientation="right"
                allowDecimals={false}
                stroke="rgba(255,255,255,0.4)"
                fontSize={12}
              />
              <RechartsTooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                labelFormatter={(label) => `Ngày ${formatDateTick(String(label))}`}
                formatter={(value: any, name: any) =>
                  name === 'Doanh thu' ? [formatVND(Number(value)), name] : [value, name]
                }
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar yAxisId="orders" dataKey="orders" name="Đơn hàng" fill="#34d399" opacity={0.5} radius={[4, 4, 0, 0]} barSize={14} />
              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                name="Doanh thu"
                stroke="#818cf8"
                strokeWidth={3}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Order & Payment status breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BreakdownList
          title="Trạng thái đơn hàng"
          data={ordersByState}
          labels={ORDER_STATE_LABELS}
          emptyText="Chưa có đơn hàng nào trong kỳ này."
        />
        <BreakdownList
          title="Trạng thái thanh toán"
          data={paymentsByState}
          labels={PAYMENT_STATE_LABELS}
          emptyText="Chưa có giao dịch nào trong kỳ này."
        />
      </div>

      {/* Top products + Top customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400"><Package size={20} /></div>
            <h3 className="text-lg font-bold text-white">Sản phẩm bán chạy</h3>
          </div>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={product.variantId} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="w-7 h-7 flex items-center justify-center bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate" title={product.name}>{product.name}</p>
                  {product.sku && <p className="text-slate-500 text-xs">SKU: {product.sku}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white text-sm font-bold">{formatVND(product.revenue)}</p>
                  <p className="text-slate-500 text-xs">Đã bán {product.quantity}</p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-slate-500 text-center py-8">Chưa có sản phẩm nào được bán trong kỳ này.</p>
            )}
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400"><Crown size={20} /></div>
            <h3 className="text-lg font-bold text-white">Khách hàng thân thiết</h3>
          </div>
          <div className="space-y-3">
            {customers.topCustomers.map((customer, index) => (
              <div key={customer.customerId} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="w-7 h-7 flex items-center justify-center bg-amber-500/20 text-amber-400 text-xs font-bold rounded-lg shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate" title={customer.name}>{customer.name}</p>
                  {customer.email && <p className="text-slate-500 text-xs truncate">{customer.email}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white text-sm font-bold">{formatVND(customer.totalSpent)}</p>
                  <p className="text-slate-500 text-xs">{customer.orderCount} đơn</p>
                </div>
              </div>
            ))}
            {customers.topCustomers.length === 0 && (
              <p className="text-slate-500 text-center py-8">Chưa có khách hàng nào mua trong kỳ này.</p>
            )}
          </div>

          {/* New vs returning buyers */}
          {buyerTotal > 0 && (
            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-violet-400 font-medium">Khách mới: {customers.newBuyers}</span>
                <span className="text-emerald-400 font-medium">Khách quay lại: {customers.returningBuyers}</span>
              </div>
              <div className="h-2.5 bg-violet-500/40 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500 ml-auto rounded-full" style={{ width: `${returningPercent}%` }} />
              </div>
              <p className="text-slate-500 text-xs mt-2">
                {returningPercent.toFixed(0)}% khách mua trong kỳ là khách quay lại.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
