"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Activity,
  MousePointer2,
  Clock,
  RefreshCcw,
  UserPlus,
  ArrowUpRight,
  BarChart3,
  Loader2,
} from "lucide-react";

const getIcon = (title: string) => {
  switch (title) {
    case "Tỷ lệ chuyển đổi (CR)": return TrendingUp;
    case "Giá trị đơn hàng (AOV)": return DollarSign;
    case "Chi phí thu hút (CAC)": return UserPlus;
    case "Tỷ lệ hoàn trả": return RefreshCcw;
    case "Lưu lượng truy cập": return Users;
    case "Tỷ lệ thoát": return MousePointer2;
    case "Bỏ giỏ hàng": return ShoppingCart;
    case "Tốc độ tải trang": return Clock;
    case "Tỷ lệ quay lại": return Activity;
    case "Giá trị trọn đời (CLV)": return BarChart3;
    default: return Activity;
  }
};

export default function MasterDashboard() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sumRes, chartRes] = await Promise.all([
          fetch("http://localhost:3001/analytics/master-summary"),
          fetch("http://localhost:3001/analytics/master-charts"),
        ]);

        if (!sumRes.ok || !chartRes.ok) throw new Error("Failed to fetch data");

        const summary = await sumRes.json();
        const charts = await chartRes.json();

        setMetrics(summary);
        setChartData(charts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] dark:bg-[#020617]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-sm font-medium text-slate-500">Đang tải dữ liệu master...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] dark:bg-[#020617]">
        <div className="rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
           <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10">
              <Activity className="h-8 w-8 text-rose-500" />
           </div>
           <h2 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">Lỗi tải dữ liệu</h2>
           <p className="mt-2 text-slate-500">{error}</p>
           <button 
             onClick={() => window.location.reload()}
             className="mt-6 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-500"
            >
              Thử lại
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 dark:bg-[#020617] lg:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Master Dashboard
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Tổng quan toàn bộ chỉ số kinh doanh & hiệu quả nền tảng.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              Last 30 Days
            </div>
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-500 active:scale-95">
              Export Report
            </button>
          </div>
        </div>

        {/* Categories Tabs (Visual only) */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {["All Metrics", "Business", "Marketing", "UX & Tech", "Customer"].map(
            (tab, i) => (
              <button
                key={tab}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  i === 0
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                } shadow-sm ring-1 ring-slate-200 dark:ring-slate-800`}
              >
                {tab}
              </button>
            )
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {metrics.map((metric) => {
            const Icon = getIcon(metric.title);
            return (
              <div
                key={metric.title}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-xl hover:-translate-y-1 dark:bg-slate-900 dark:ring-slate-800"
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/50">
                    <Icon className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs font-bold ${
                      metric.isPositive ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {metric.change}
                    <ArrowUpRight
                      className={`h-3 w-3 ${
                        metric.isPositive ? "" : "rotate-90"
                      }`}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {metric.title}
                  </p>
                  <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {metric.value}
                  </h3>
                </div>

                {/* Decorative mini graph placeholder */}
                <div className="mt-4 h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-1000 group-hover:bg-indigo-400"
                    style={{ width: `${Math.random() * 40 + 40}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Large Charts Integration */}
        {chartData && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Traffic Chart */}
            <div className="col-span-1 overflow-hidden rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Tăng trưởng doanh thu & Traffic
                  </h2>
                  <p className="text-sm text-slate-500">So sánh dữ liệu theo tháng</p>
                </div>
                <BarChart3 className="h-6 w-6 text-slate-300" />
              </div>
              
              <div className="mt-8 flex h-64 items-end gap-2 lg:gap-4">
                 {chartData.revenueGrowth.map((h: number, i: number) => (
                   <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <div 
                        className="w-full bg-indigo-500/10 dark:bg-indigo-500/5 rounded-t-lg relative flex items-end overflow-hidden"
                        style={{ height: '100%' }}
                      >
                        <div 
                          className="w-full bg-indigo-500 transition-all duration-700 delay-100 group-hover:bg-indigo-400 rounded-t-lg"
                          style={{ height: `${h}%` }}
                        >
                          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent to-white/20" />
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 uppercase">T{i+1}</span>
                   </div>
                 ))}
              </div>
            </div>

            {/* Funnel/Conversion Card */}
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white shadow-lg">
               <div className="flex items-center justify-between">
                 <h2 className="text-lg font-bold">Phễu chuyển đổi</h2>
                 <TrendingUp className="h-5 w-5 opacity-50" />
               </div>
               
               <div className="mt-8 space-y-6">
                  {chartData.funnel.map((step: any, i: number) => (
                    <div key={step.label} className="space-y-2" style={{ transform: `translateX(${i * 16}px)`, paddingRight: `${i * 16}px` }}>
                      <div className="flex justify-between text-sm font-medium">
                        <span>{step.label}</span>
                        <span>{step.value}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-white/20">
                        <div 
                          className="h-full rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" 
                          style={{ width: `${step.percent}%`, opacity: 1 - i * 0.2 }} 
                        />
                      </div>
                    </div>
                  ))}
               </div>

               <div className="mt-8 rounded-2xl bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-xs font-medium text-indigo-100 italic">
                    "Dữ liệu được tổng hợp thời gian thực từ hệ thống. Tỷ lệ chuyển đổi đang ổn định ở mức 3.2%."
                  </p>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
