"use client";

import React, { useState } from 'react';
import { useAnalytics, AnalyticsPeriod } from '@/hooks/useAnalytics';
import {
  ComposedChart, Area, Bar, Line, BarChart, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Loader2, TrendingUp, ShoppingBag, Receipt, UserPlus, XCircle, RefreshCw,
  Package, Crown, Eye, Target, Repeat, Undo2, Star, Search, Filter, Clock,
} from 'lucide-react';
import {
  formatVND, formatCompactVND, PeriodSelect, KpiCard, DonutCard, FunnelSteps,
  ORDER_STATE_LABELS, PAYMENT_STATE_LABELS, DOW_LABELS, CHART_TOOLTIP_STYLE,
} from '@/components/analytics/AnalyticsWidgets';

const formatDateTick = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;
const formatPercent = (value: number, digits = 1) => `${value.toFixed(digits)}%`;

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

  const {
    summary, revenueSeries, ordersByState, paymentsByState, topProducts,
    customers, traffic, funnel, retention, timing, revenueBreakdown, reviews, topSearches,
  } = data;
  const { current, change } = summary;

  const buyerTotal = customers.newBuyers + customers.returningBuyers;
  const returningPercent = buyerTotal > 0 ? (customers.returningBuyers / buyerTotal) * 100 : 0;

  // Gộp doanh thu + lượt ghé theo ngày để vẽ chung một trục thời gian
  const visitsByDate = new Map(traffic.series.map((p) => [p.date, p]));
  const trafficSeries = revenueSeries.map((p) => ({
    ...p,
    visits: visitsByDate.get(p.date)?.visits ?? 0,
    visitors: visitsByDate.get(p.date)?.visitors ?? 0,
  }));

  const hourData = timing.byHour.map((p) => ({ ...p, label: `${p.hour}h` }));
  const dowData = timing.byDow.map((p) => ({ ...p, label: DOW_LABELS[p.dow - 1] }));
  const maxReviewCount = Math.max(...reviews.distribution.map((d) => d.count), 1);
  const maxSearchCount = Math.max(...topSearches.map((s) => s.count), 1);

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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
          icon={<Eye size={24} />}
          label="Khách ghé shop"
          value={current.visitors.toLocaleString('vi-VN')}
          sub={`${traffic.totalVisits.toLocaleString('vi-VN')} lượt ghé trong kỳ`}
          change={change.visitors}
          accent="sky"
        />
        <KpiCard
          icon={<Target size={24} />}
          label="Tỷ lệ chuyển đổi mua hàng"
          value={formatPercent(current.conversionRate)}
          sub={`${current.uniqueBuyers} khách mua / ${current.visitors} khách ghé`}
          change={change.conversionRate}
          accent="violet"
        />
        <KpiCard
          icon={<Undo2 size={24} />}
          label="Khách ở lại sau lần đầu"
          value={formatPercent(traffic.returningVisitorRate)}
          sub={`${traffic.returningVisitors}/${traffic.totalVisitors} khách ghé lại ≥ 2 lần trong kỳ`}
          accent="sky"
        />
        <KpiCard
          icon={<Repeat size={24} />}
          label="Tỷ lệ mua lại"
          value={formatPercent(retention.repeatPurchaseRate)}
          sub={`${retention.repeatCustomers}/${retention.totalPurchasers} khách mua ≥ 2 đơn (toàn thời gian)`}
          accent="emerald"
        />
        <KpiCard
          icon={<UserPlus size={24} />}
          label="Khách hàng mới"
          value={String(current.newCustomers)}
          change={change.newCustomers}
          accent="violet"
        />
        <KpiCard
          icon={<XCircle size={24} />}
          label="Tỷ lệ hủy đơn"
          value={formatPercent(current.cancelRate)}
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
                contentStyle={CHART_TOOLTIP_STYLE}
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

      {/* Traffic chart + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-1">Lưu lượng ghé shop theo ngày</h3>
          <p className="text-slate-500 text-xs mb-5">
            Khách ghé là số người riêng biệt; lượt ghé tính mỗi phiên 30 phút.
          </p>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trafficSeries} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickMargin={10} tickFormatter={formatDateTick} />
                <YAxis allowDecimals={false} stroke="rgba(255,255,255,0.4)" fontSize={12} />
                <RechartsTooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelFormatter={(label) => `Ngày ${formatDateTick(String(label))}`}
                />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <Bar dataKey="visits" name="Lượt ghé" fill="#38bdf8" opacity={0.4} radius={[4, 4, 0, 0]} barSize={14} />
                <Line type="monotone" dataKey="visitors" name="Khách ghé" stroke="#38bdf8" strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-violet-500/20 rounded-xl text-violet-400"><Filter size={20} /></div>
            <h3 className="text-lg font-bold text-white">Hành trình mua hàng (funnel)</h3>
          </div>
          <p className="text-slate-500 text-xs mb-5 mt-1">
            % trên thanh là tỷ lệ chuyển đổi so với bước liền trước.
          </p>
          <FunnelSteps
            steps={[
              { label: 'Ghé shop', value: funnel.visitors, hint: 'khách riêng biệt' },
              { label: 'Có giỏ hàng', value: funnel.cartCustomers },
              { label: 'Đặt hàng', value: funnel.buyers },
              { label: 'Nhận hàng thành công', value: funnel.completedBuyers },
            ]}
          />
          {funnel.visitors === 0 && (
            <p className="text-slate-500 text-xs mt-4">
              Chưa có dữ liệu lượt ghé — số liệu bắt đầu được ghi nhận từ khi bật tính năng theo dõi.
            </p>
          )}
        </div>
      </div>

      {/* Status donuts + revenue composition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DonutCard
          title="Trạng thái đơn hàng"
          data={ordersByState}
          labels={ORDER_STATE_LABELS}
          emptyText="Chưa có đơn hàng nào trong kỳ này."
        />
        <DonutCard
          title="Trạng thái thanh toán"
          data={paymentsByState}
          labels={PAYMENT_STATE_LABELS}
          emptyText="Chưa có giao dịch nào trong kỳ này."
        />
        <div className="flex flex-col">
          <DonutCard
            className="flex-1"
            title="Cơ cấu doanh thu"
            data={{
              itemTotal: revenueBreakdown.itemTotal,
              shipmentTotal: revenueBreakdown.shipmentTotal,
              taxTotal: revenueBreakdown.taxTotal,
            }}
            labels={{ itemTotal: 'Tiền hàng', shipmentTotal: 'Phí vận chuyển', taxTotal: 'Thuế' }}
            emptyText="Chưa có doanh thu trong kỳ này."
            valueFormatter={formatCompactVND}
          />
          {revenueBreakdown.promoTotal > 0 && (
            <p className="text-slate-500 text-xs mt-2 px-2">
              Đã giảm giá {formatVND(revenueBreakdown.promoTotal)} qua khuyến mãi trong kỳ.
            </p>
          )}
        </div>
      </div>

      {/* Order timing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400"><Clock size={20} /></div>
            <h3 className="text-lg font-bold text-white">Đơn hàng theo giờ trong ngày</h3>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={11} interval={2} />
                <YAxis allowDecimals={false} stroke="rgba(255,255,255,0.4)" fontSize={12} />
                <RechartsTooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(value: any, name: any) =>
                    name === 'Doanh thu' ? [formatVND(Number(value)), name] : [value, name]
                  }
                />
                <Bar dataKey="orders" name="Đơn hàng" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-slate-500 text-xs mt-3">Theo giờ Việt Nam — dùng để chọn khung giờ đăng sản phẩm, chạy khuyến mãi.</p>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400"><Clock size={20} /></div>
            <h3 className="text-lg font-bold text-white">Đơn hàng theo thứ trong tuần</h3>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dowData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                <YAxis allowDecimals={false} stroke="rgba(255,255,255,0.4)" fontSize={12} />
                <RechartsTooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(value: any, name: any) =>
                    name === 'Doanh thu' ? [formatVND(Number(value)), name] : [value, name]
                  }
                />
                <Bar dataKey="orders" name="Đơn hàng" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-slate-500 text-xs mt-3">Ngày nào khách mua nhiều nhất — lên lịch nhập hàng và khuyến mãi theo tuần.</p>
        </div>
      </div>

      {/* Reviews + Top searches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400"><Star size={20} /></div>
            <h3 className="text-lg font-bold text-white">Đánh giá sản phẩm</h3>
          </div>
          {reviews.totalReviews === 0 ? (
            <p className="text-slate-500 text-center py-8">Shop chưa có đánh giá nào.</p>
          ) : (
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="text-center shrink-0">
                <div className="text-5xl font-bold text-white">{reviews.avgRating.toFixed(1)}</div>
                <div className="flex justify-center gap-0.5 my-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.round(reviews.avgRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}
                    />
                  ))}
                </div>
                <p className="text-slate-500 text-xs">{reviews.totalReviews} đánh giá</p>
                <p className="text-slate-500 text-xs">{reviews.newReviews} mới trong kỳ</p>
              </div>
              <div className="flex-1 space-y-2">
                {[...reviews.distribution].reverse().map((d) => (
                  <div key={d.rating} className="flex items-center gap-3 text-sm">
                    <span className="text-slate-400 w-8 shrink-0">{d.rating} ★</span>
                    <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-700"
                        style={{ width: `${(d.count / maxReviewCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-medium w-10 text-right shrink-0">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-sky-500/20 rounded-xl text-sky-400"><Search size={20} /></div>
            <h3 className="text-lg font-bold text-white">Khách đang tìm gì trong shop</h3>
          </div>
          <div className="space-y-3">
            {topSearches.map((item, index) => (
              <div key={item.query} className="flex items-center gap-3">
                <span className="w-6 h-6 flex items-center justify-center bg-sky-500/20 text-sky-400 text-xs font-bold rounded-md shrink-0">
                  {index + 1}
                </span>
                <span className="flex-1 min-w-0 text-sm text-white truncate" title={item.query}>{item.query}</span>
                <div className="w-28 h-2 bg-white/5 rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full"
                    style={{ width: `${(item.count / maxSearchCount) * 100}%` }}
                  />
                </div>
                <span className="text-slate-400 text-xs w-12 text-right shrink-0">{item.count} lượt</span>
              </div>
            ))}
            {topSearches.length === 0 && (
              <p className="text-slate-500 text-center py-8">Chưa có lượt tìm kiếm nào trong kỳ này.</p>
            )}
          </div>
          {topSearches.length > 0 && (
            <p className="text-slate-500 text-xs mt-4">
              Từ khóa được tìm nhiều mà shop chưa có hàng là cơ hội nhập sản phẩm mới.
            </p>
          )}
        </div>
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
