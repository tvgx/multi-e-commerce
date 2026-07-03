"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Store, BarChart3, Package, Palette, CreditCard, Code2, Settings, ArrowRight, Activity, Zap, ShoppingCart, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";

export default function PlatformOverviewPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalShops: 0,
    totalProducts: 0,
    totalOrders: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get<any>("/api/analytics/platform/dashboard");
        if (res.data) {
          setStats({
            totalShops: res.data.totalShops || 0,
            totalProducts: res.data.totalProducts || 0,
            totalOrders: res.data.totalOrders || 0,
            revenue: res.data.totalRevenue || 0,
          });
        }
      } catch (err) {
        console.error("Failed to fetch platform stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-6 md:p-10 text-zinc-100 min-h-full">
      <div className="mx-auto max-w-5xl space-y-10">
        
        {/* Welcome Section */}
        <section className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back, {session?.user?.name || 'Administrator'} 👋</h1>
            <p className="text-zinc-400 mt-2">Here is what is happening across your platform today.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
              <div className="flex items-center gap-3 text-zinc-400 mb-2">
                <Store size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Total Shops</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-zinc-500" /> : stats.totalShops}
              </div>
            </div>
            
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
              <div className="flex items-center gap-3 text-zinc-400 mb-2">
                <Package size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Products</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-zinc-500" /> : stats.totalProducts}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
              <div className="flex items-center gap-3 text-zinc-400 mb-2">
                <ShoppingCart size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Orders Today</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-zinc-500" /> : stats.totalOrders}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
              <div className="flex items-center gap-3 text-zinc-400 mb-2">
                <Zap size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Revenue</span>
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-500" /> : `$${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
            </div>
          </div>
        </section>

        {/* Services Grid Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            Platform Services
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* My Shops (Active) */}
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/80 p-5 shadow-sm hover:border-indigo-500/50 transition-all group flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Store size={20} />
                </div>
              </div>
              <h3 className="text-base font-bold text-white mb-2">My Shops</h3>
              <p className="text-sm text-zinc-400 mb-6 flex-1">Create and manage your individual storefronts. Design, publish, and sell.</p>
              <Link href="/dashboard/shops" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 group-hover:text-indigo-300">
                Manage Shops <ArrowRight size={16} />
              </Link>
            </div>

            {/* Analytics (Active) */}
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/80 p-5 shadow-sm hover:border-blue-500/50 transition-all group flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <BarChart3 size={20} />
                </div>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Analytics Hub</h3>
              <p className="text-sm text-zinc-400 mb-6 flex-1">Aggregated insights across all your storefronts. Track revenue, orders, and top shops.</p>
              <Link href="/dashboard/analytics" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 group-hover:text-blue-300">
                View Analytics <ArrowRight size={16} />
              </Link>
            </div>

            {/* Catalog (Active) */}
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/80 p-5 shadow-sm hover:border-emerald-500/50 transition-all group flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Package size={20} />
                </div>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Product Catalog</h3>
              <p className="text-sm text-zinc-400 mb-6 flex-1">Quản lý sản phẩm trên mọi cửa hàng và phân phối một sản phẩm sang nhiều shop.</p>
              <Link href="/dashboard/catalog" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 group-hover:text-emerald-300">
                Mở Catalog <ArrowRight size={16} />
              </Link>
            </div>

            {/* Themes (Active) */}
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/80 p-5 shadow-sm hover:border-pink-500/50 transition-all group flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center">
                  <Palette size={20} />
                </div>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Theme Market</h3>
              <p className="text-sm text-zinc-400 mb-6 flex-1">Review and approve storefront themes submitted by shop owners across the platform.</p>
              <Link href="/dashboard/themes" className="inline-flex items-center gap-2 text-sm font-semibold text-pink-400 group-hover:text-pink-300">
                Open Theme Market <ArrowRight size={16} />
              </Link>
            </div>

            {/* Billing (Active) */}
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/80 p-5 shadow-sm hover:border-indigo-500/50 transition-all group flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Billing & Plans</h3>
              <p className="text-sm text-zinc-400 mb-6 flex-1">Quản lý gói dịch vụ nền tảng, nâng cấp và xem lịch sử hoá đơn.</p>
              <Link href="/dashboard/billing" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 group-hover:text-indigo-300">
                Mở Billing <ArrowRight size={16} />
              </Link>
            </div>

            {/* Dev API (Soon) */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 flex flex-col h-full relative overflow-hidden opacity-80">
              <div className="absolute top-4 right-4 px-2 py-1 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                Coming Soon
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center">
                  <Code2 size={20} />
                </div>
              </div>
              <h3 className="text-base font-bold text-zinc-300 mb-2">Developer API</h3>
              <p className="text-sm text-zinc-500 mb-6 flex-1">API keys, webhooks, and documentation for custom integrations.</p>
              <Link href="/dashboard/developer" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white">
                Learn More <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Recent Activity
          </h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
            <div className="divide-y divide-zinc-800">
              {[
                { time: "2 hours ago", text: "New order #1029 placed on 'My First Shop'", type: "order" },
                { time: "Yesterday", text: "Product 'Wireless Headphones' updated", type: "product" },
                { time: "Yesterday", text: "Storefront design published", type: "design" },
                { time: "May 25", text: "Shop 'Tech Gadgets' created", type: "shop" }
              ].map((item, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-zinc-800/50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <p className="text-sm text-zinc-300 flex-1">{item.text}</p>
                  <span className="text-xs text-zinc-500">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
