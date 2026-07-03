"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  Settings, 
  Store, 
  Globe, 
  BarChart3, 
  CreditCard, 
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
  HelpCircle,
  Moon,
  Wallet,
  Truck
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useCheckAuth } from "@/hooks/useCheckAuth";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserAvatar } from "@/components/UserAvatar";
import { storefrontHost } from "@/lib/urls";
import { ShoppingBag, Box, Tag } from "lucide-react";
import { useTranslations } from "@ecommerce/i18n/src/react";

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ shopId: string }>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { checkAndNavigate } = useCheckAuth();
  const { data: session } = authClient.useSession();
  const t = useTranslations("admin");
  const user = session?.user;
  const displayName = user?.name || user?.email || t("header.accountFallback");
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { shopId } = React.use(params);

  const SIDEBAR_ITEMS = [
    { icon: <LayoutDashboard size={20} />, label: t("shopNav.dashboard"), href: "" },
    { icon: <ShoppingBag size={20} />, label: t("shopNav.orders"), href: "/orders" },
    { icon: <Package size={20} />, label: t("shopNav.products"), href: "/products" },
    { icon: <Box size={20} />, label: t("shopNav.inventory"), href: "/inventory" },
    { icon: <Layers size={20} />, label: t("shopNav.collections"), href: "/collections" },
    { icon: <Store size={20} />, label: t("shopNav.onlineStore"), href: "/online-store" },
    { icon: <Tag size={20} />, label: t("shopNav.promotions"), href: "/promotions" },
    { icon: <BarChart3 size={20} />, label: t("shopNav.analytics"), href: "/analytics" },
    { icon: <CreditCard size={20} />, label: t("shopNav.payments"), href: "/payments" },
    { icon: <Wallet size={20} />, label: t("shopNav.wallets"), href: "/wallets" },
    { icon: <Truck size={20} />, label: t("shopNav.shipping"), href: "/settings/shipping" },
    { icon: <Settings size={20} />, label: t("shopNav.settings"), href: "/settings" },
  ];

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
      },
    });
  };


  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 border-r border-border bg-card/60 backdrop-blur-xl ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex h-20 items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              <Zap className="text-white w-5 h-5 fill-current" />
            </div>
            {!isCollapsed && <span className="font-bold tracking-tight text-foreground">OmniAdmin</span>}
          </Link>
        </div>

        <nav className="p-4 space-y-2">
          {SIDEBAR_ITEMS.map((item) => {
            const fullHref = `/dashboard/${shopId}${item.href}`;
            const isActive = item.href === "" 
              ? pathname === `/dashboard/${shopId}`
              : pathname.startsWith(fullHref);
            
            return (
              <Link
                key={item.label}
                href={fullHref}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive 
                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/50" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <div className={isActive ? "text-indigo-400" : "text-muted-foreground/70 group-hover:text-foreground"}>
                  {item.icon}
                </div>
                {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-0 w-full px-4 space-y-2">
           <button 
             onClick={() => setIsCollapsed(!isCollapsed)}
             className="w-full flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
           >
             {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
             {!isCollapsed && <span className="text-xs uppercase tracking-widest font-bold">{t("shopNav.collapse")}</span>}
           </button>
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all"
            >
              <LogOut size={20} />
              {!isCollapsed && <span className="text-sm font-medium">{t("shopNav.logout")}</span>}
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "pl-20" : "pl-64"
        }`}
      >
        <header className="h-20 border-b border-border bg-card/40 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-foreground">{t("shopNav.shopOverview")}</h2>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-muted-foreground bg-accent/60 px-3 py-1 rounded-full border border-border">
              <Globe size={12} /> {storefrontHost(shopId)}
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative">
             <ThemeToggle />
             <NotificationBell shopId={shopId} />
             <button
               onClick={() => setIsMenuOpen(!isMenuOpen)}
               aria-label={t("header.menuAria")}
               aria-haspopup="true"
               aria-expanded={isMenuOpen}
               className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs hover:bg-indigo-500/20 transition-all active:scale-95 overflow-hidden"
             >
                <UserAvatar name={user?.name} email={user?.email} image={user?.image} />
             </button>
             
             {isMenuOpen && (
               <div className="absolute right-0 top-12 w-[340px] rounded-xl border border-gray-200 bg-white shadow-2xl z-50 p-3 text-gray-900 font-sans">
                 <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors mb-2">
                   <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                      <UserAvatar name={user?.name} email={user?.email} image={user?.image} />
                   </div>
                   <div className="flex-1 overflow-hidden">
                     <p className="font-semibold text-[15px] truncate">{displayName}</p>
                     {user?.email && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
                   </div>
                 </div>
                 
                 <div className="border-b border-gray-200 pb-3 mb-2">
                   <button className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-blue-600 font-medium rounded-lg transition-colors text-[14px]">
                     {t("header.viewAllProfiles")}
                   </button>
                 </div>

                 <div className="space-y-1">
                   <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors">
                     <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                         <Settings className="w-5 h-5 text-gray-700" />
                       </div>
                       <span className="font-medium text-[15px]">{t("header.settingsPrivacy")}</span>
                     </div>
                     <ChevronRight className="w-5 h-5 text-gray-500" />
                   </button>
                   
                   <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors">
                     <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                         <HelpCircle className="w-5 h-5 text-gray-700" />
                       </div>
                       <span className="font-medium text-[15px]">{t("header.helpSupport")}</span>
                     </div>
                     <ChevronRight className="w-5 h-5 text-gray-500" />
                   </button>

                   <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors">
                     <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                         <Moon className="w-5 h-5 text-gray-700" />
                       </div>
                       <span className="font-medium text-[15px]">{t("header.displayAccessibility")}</span>
                     </div>
                     <ChevronRight className="w-5 h-5 text-gray-500" />
                   </button>

                   <button onClick={handleSignOut} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors">
                     <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                         <LogOut className="w-5 h-5 text-gray-700" />
                       </div>
                       <span className="font-medium text-[15px]">{t("header.signOut")}</span>
                     </div>
                   </button>
                 </div>

                 <p className="text-[12px] text-gray-500 mt-3 px-2 leading-tight">
                   {t("header.legalLine")}
                 </p>
               </div>
             )}
          </div>

        </header>

        <div className="p-8">
           {children}
        </div>
      </main>
    </div>
  );
}
