"use client";
import React, { useState } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Loader2, TrendingUp, ShoppingBag, Package } from 'lucide-react';

export function AnalyticsDashboard({ shopId }: { shopId: string }) {
  const [period, setPeriod] = useState<'7d' | '30d'>('30d');
  const { data, loading, error } = useAnalytics(shopId, period);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-slate-900/50 rounded-3xl border border-white/5">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-3xl">
        Failed to load analytics: {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Tổng quan hiệu suất</h2>
        <select 
          value={period} 
          onChange={(e) => setPeriod(e.target.value as any)}
          className="bg-slate-800 text-white border border-white/10 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        >
          <option value="7d">7 ngày qua</option>
          <option value="30d">30 ngày qua</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-4 bg-indigo-500/20 rounded-2xl text-indigo-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Doanh thu</p>
              <h3 className="text-2xl font-bold text-white">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.revenue)}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-4 bg-emerald-500/20 rounded-2xl text-emerald-400">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Đơn hàng mới</p>
              <h3 className="text-2xl font-bold text-white">{data.orderCount}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6">Biểu đồ doanh thu</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickMargin={10} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={(val) => `₫${(val/1000).toFixed(0)}k`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#818cf8' }}
                  formatter={(value: any) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))}
                />
                <Line type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={3} dot={{ r: 4, fill: '#818cf8', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6">Trạng thái đơn</h3>
          <div className="space-y-4">
            {Object.entries(data.ordersByState).map(([state, count]: any) => (
              <div key={state} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-slate-300 capitalize">{state}</span>
                <span className="text-white font-bold px-3 py-1 bg-white/10 rounded-lg">{count}</span>
              </div>
            ))}
            {Object.keys(data.ordersByState).length === 0 && (
              <p className="text-slate-500 text-center py-4">Chưa có đơn hàng nào.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
