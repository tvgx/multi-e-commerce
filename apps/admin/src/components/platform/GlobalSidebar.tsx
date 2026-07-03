"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { UserAvatar } from "@/components/UserAvatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslations } from "@ecommerce/i18n/src/react";
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

export function GlobalSidebar() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const t = useTranslations("admin");
  const user = session?.user;
  const displayName = user?.name || user?.email || t("header.accountFallback");

  const soon = t("nav.soon");
  interface NavItem {
    icon: React.ReactNode;
    label: string;
    href: string;
    badge?: string;
  }
  const PLATFORM_ITEMS: NavItem[] = [
    { icon: <Store size={20} />, label: t("nav.myShops"), href: "/dashboard/shops" },
    { icon: <BarChart3 size={20} />, label: t("nav.analytics"), href: "/dashboard/analytics" },
    { icon: <Package size={20} />, label: t("nav.catalog"), href: "/dashboard/catalog" },
    { icon: <Palette size={20} />, label: t("nav.themes"), href: "/dashboard/themes" },
  ];

  const ACCOUNT_ITEMS: NavItem[] = [
    { icon: <CreditCard size={20} />, label: t("nav.billing"), href: "/dashboard/billing" },
    { icon: <Code2 size={20} />, label: t("nav.developer"), href: "/dashboard/developer", badge: soon },
    { icon: <Settings size={20} />, label: t("nav.settings"), href: "/dashboard/settings" },
  ];

  return (
    <aside className="w-[240px] bg-card border-r border-border flex flex-col overflow-y-auto">
      <div className="p-4">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
            pathname === "/dashboard" 
              ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/50" 
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <LayoutDashboard size={20} className={pathname === "/dashboard" ? "text-indigo-400" : "text-muted-foreground/70"} />
          <span className="text-sm font-medium">{t("nav.overview")}</span>
        </Link>
      </div>

      <div className="px-4 py-2">
        <h3 className="px-3 text-xs font-semibold text-muted-foreground tracking-wider mb-2 uppercase">{t("nav.platform")}</h3>
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
                    : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={isActive ? "text-indigo-400" : "text-muted-foreground/70 group-hover:text-muted-foreground transition-colors"}>
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
        <h3 className="px-3 text-xs font-semibold text-muted-foreground tracking-wider mb-2 uppercase">{t("nav.account")}</h3>
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
                    : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={isActive ? "text-indigo-400" : "text-muted-foreground/70 group-hover:text-muted-foreground transition-colors"}>
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
      
      <div className="mt-auto p-4 border-t border-border bg-background/50">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-border">
            <UserAvatar name={user?.name} email={user?.email} image={user?.image} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || t("nav.freePlan")}</p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
