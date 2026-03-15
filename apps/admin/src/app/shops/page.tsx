"use client";

import React, { useState, useEffect } from 'react';
import { Store, Settings, ExternalLink, Download, ChevronDown, ChevronUp, BarChart2, Loader2, AlertCircle } from 'lucide-react';
import { ShopAnalyticsChart } from '@/components/ShopAnalyticsChart';

export default function ShopsManagementPage() {
    const [shops, setShops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedShopId, setExpandedShopId] = useState<string | null>(null);
    const [shopAnalytics, setShopAnalytics] = useState<any>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    useEffect(() => {
        const fetchShops = async () => {
            try {
                setLoading(true);
                const res = await fetch('http://localhost:3001/api/shops/system/all-shops');
                const data = await res.json();
                if (data.code === 200) {
                    setShops(data.data);
                } else {
                    throw new Error(data.message || 'Failed to fetch shops');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Something went wrong');
            } finally {
                setLoading(false);
            }
        };
        fetchShops();
    }, []);

    const fetchAnalytics = async (shopId: string) => {
        if (expandedShopId === shopId) {
            setExpandedShopId(null);
            return;
        }

        try {
            setAnalyticsLoading(true);
            setExpandedShopId(shopId);
            const [sumRes, chartRes] = await Promise.all([
                fetch(`http://localhost:3001/analytics/shop/${shopId}/summary`),
                fetch(`http://localhost:3001/analytics/shop/${shopId}/charts`)
            ]);
            const summary = await sumRes.json();
            const charts = await chartRes.json();
            setShopAnalytics({ summary, charts });
        } catch (err) {
            console.error('Failed to fetch analytics', err);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 text-slate-100 bg-slate-950 min-h-screen">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Store className="text-emerald-500" /> Tenant Management
                </h1>
                <div className="text-sm font-medium px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg">
                    Total Tenants: <span className="text-emerald-400">{shops.length}</span>
                </div>
            </div>

            {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-500 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" /> {error}
                </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                    <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-5 font-semibold">Shop & Owner</th>
                            <th className="p-5 font-semibold">Domain</th>
                            <th className="p-5 font-semibold">Status</th>
                            <th className="p-5 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {shops.map((shop) => (
                            <React.Fragment key={shop.id}>
                                <tr className={`group transition-colors hover:bg-slate-800/30 ${expandedShopId === shop.id ? 'bg-slate-800/50' : ''}`}>
                                    <td className="p-5">
                                        <div>
                                            <p className="font-bold text-white group-hover:text-emerald-400 transition-colors">{shop.name}</p>
                                            <p className="text-xs text-slate-500 mt-1">{shop.owner?.email || 'No email'}</p>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className="text-emerald-400 font-mono text-xs bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">
                                            {shop.domain || 'no-domain'}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight ${shop.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'}`}>
                                            {shop.status}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => fetchAnalytics(shop.id)}
                                                className={`p-2 rounded-lg transition-all ${expandedShopId === shop.id ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                            >
                                                <BarChart2 className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all border border-slate-700/50">
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {expandedShopId === shop.id && (
                                    <tr>
                                        <td colSpan={4} className="p-8 bg-slate-900/40 border-t border-slate-800">
                                            {analyticsLoading ? (
                                                <div className="flex flex-col items-center justify-center p-12 gap-4">
                                                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                                                    <p className="text-xs text-slate-500 font-medium italic">Tiến hành thu thập dữ liệu shop...</p>
                                                </div>
                                            ) : shopAnalytics && (
                                                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                                    {/* Quick Stats */}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        {[
                                                            { label: 'Total Sales', value: `${shopAnalytics.summary.totalRevenue.toLocaleString('vi-VN')}đ` },
                                                            { label: 'Orders', value: shopAnalytics.summary.totalOrders },
                                                            { label: 'AOV', value: `${shopAnalytics.summary.aov.toLocaleString('vi-VN')}đ` },
                                                            { label: 'Conversion', value: `${shopAnalytics.summary.conversionRate}%` },
                                                        ].map((stat) => (
                                                            <div key={stat.label} className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                                                                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{stat.label}</p>
                                                                <p className="text-xl font-black text-white mt-1">{stat.value}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Visualizations */}
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                        <ShopAnalyticsChart 
                                                            type="line" 
                                                            title="Xu hướng doanh thu (7 ngày)" 
                                                            data={shopAnalytics.charts.lineChart} 
                                                        />
                                                        <ShopAnalyticsChart 
                                                            type="pie" 
                                                            title="Phân bố đơn hàng theo trạng thái" 
                                                            data={shopAnalytics.charts.pieChart} 
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-indigo-900/10 border border-indigo-500/20 p-5 rounded-2xl text-indigo-300 text-sm backdrop-blur-sm">
                <div className="flex items-start gap-4">
                   <div className="p-2 bg-indigo-500/20 rounded-lg">
                      <Settings className="w-5 h-5 text-indigo-400" />
                   </div>
                   <div>
                     <p className="font-bold text-indigo-200">System Administrator Control</p>
                     <p className="mt-1 opacity-80 leading-relaxed italic">
                       Dữ liệu hiển thị dựa trên giao dịch thực tế của từng tenant. Bạn có thể sử dụng các lệnh local để debug sâu hơn 
                       bằng cách click chuột phải vào hàng của shop hoặc chọn Eject codebase.
                     </p>
                   </div>
                </div>
            </div>
        </div>
    );
}
