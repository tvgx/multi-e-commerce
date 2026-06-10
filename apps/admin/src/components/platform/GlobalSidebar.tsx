"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Store, 
  BarChart3, 
  Package, 
  Palette, 
  CreditCard, 
  Code2, 
  Settings 
} from "lucide-react";

const PLATFORM_ITEMS = [
  { icon: <Store size={20} />, label: "My Shops", href: "/dashboard/shops" },
  { icon: <BarChart3 size={20} />, label: "Analytics Hub", href: "/dashboard/analytics" },
  { icon: <Package size={20} />, label: "Product Catalog", href: "/dashboard/catalog", badge: "Soon" },
  { icon: <Palette size={20} />, label: "Theme Market", href: "/dashboard/themes", badge: "Soon" },
];

const ACCOUNT_ITEMS = [
  { icon: <CreditCard size={20} />, label: "Billing & Plans", href: "/dashboard/billing" },
  { icon: <Code2 size={20} />, label: "Developer API", href: "/dashboard/developer", badge: "Soon" },
  { icon: <Settings size={20} />, label: "Account Settings", href: "/dashboard/settings" },
];

export function GlobalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] bg-black border-r border-zinc-800 flex flex-col overflow-y-auto">
      <div className="p-4">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
            pathname === "/dashboard" 
              ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/50" 
              : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
          }`}
        >
          <LayoutDashboard size={20} className={pathname === "/dashboard" ? "text-indigo-400" : "text-zinc-500"} />
          <span className="text-sm font-medium">Overview</span>
        </Link>
      </div>

      <div className="px-4 py-2">
        <h3 className="px-3 text-xs font-semibold text-zinc-500 tracking-wider mb-2">PLATFORM</h3>
        <div className="space-y-1">
          {PLATFORM_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all group ${
                  isActive 
                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/50" 
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-400 transition-colors"}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4">
        <h3 className="px-3 text-xs font-semibold text-zinc-500 tracking-wider mb-2">ACCOUNT</h3>
        <div className="space-y-1">
          {ACCOUNT_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all group ${
                  isActive 
                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/50" 
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-400 transition-colors"}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
      
      <div className="mt-auto p-4 border-t border-zinc-800 bg-zinc-950/50">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-700">
            <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-zinc-200 truncate">Administrator</p>
            <p className="text-xs text-zinc-500 truncate">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
