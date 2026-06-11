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
import { ShoppingBag, Box, Tag } from "lucide-react";

const SIDEBAR_ITEMS = [
  { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "" },
  { icon: <ShoppingBag size={20} />, label: "Orders", href: "/orders" },
  { icon: <Package size={20} />, label: "Products", href: "/products" },
  { icon: <Box size={20} />, label: "Inventory", href: "/inventory" },
  { icon: <Layers size={20} />, label: "Collections", href: "/collections" },
  { icon: <Store size={20} />, label: "Online Store", href: "/online-store" },
  { icon: <Tag size={20} />, label: "Promotions", href: "/promotions" },
  { icon: <BarChart3 size={20} />, label: "Analytics", href: "/analytics" },
  { icon: <CreditCard size={20} />, label: "Payments", href: "/payments" },
  { icon: <Wallet size={20} />, label: "Wallets", href: "/wallets" },
  { icon: <Truck size={20} />, label: "Shipping", href: "/settings/shipping" },
  { icon: <Settings size={20} />, label: "Settings", href: "/settings" },
];

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
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { shopId } = React.use(params);

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
    <div className="flex min-h-screen bg-[#030014] text-slate-200">
      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 border-r border-white/5 bg-black/40 backdrop-blur-xl ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex h-20 items-center px-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              <Zap className="text-white w-5 h-5 fill-current" />
            </div>
            {!isCollapsed && <span className="font-bold tracking-tight text-white">OmniAdmin</span>}
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
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className={isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-white"}>
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
             className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-white transition-colors"
           >
             {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
             {!isCollapsed && <span className="text-xs uppercase tracking-widest font-bold">Collapse</span>}
           </button>
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all"
            >
              <LogOut size={20} />
              {!isCollapsed && <span className="text-sm font-medium">Log out</span>}
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "pl-20" : "pl-64"
        }`}
      >
        <header className="h-20 border-b border-white/5 bg-black/20 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white">Shop Overview</h2>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
              <Globe size={12} /> {shopId}.localhost:3002
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative">
             <NotificationBell shopId={shopId} />
             <button 
               onClick={() => setIsMenuOpen(!isMenuOpen)}
               title="User Menu"
               className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs hover:bg-indigo-500/20 transition-all active:scale-95 overflow-hidden"
             >
                <img src="https://ui-avatars.com/api/?name=Trịnh+Vi+Giang+Xuân&background=random" alt="Avatar" className="w-full h-full object-cover" />
             </button>
             
             {isMenuOpen && (
               <div className="absolute right-0 top-12 w-[340px] rounded-xl border border-gray-200 bg-white shadow-2xl z-50 p-3 text-gray-900 font-sans">
                 <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors mb-2">
                   <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                      <img src="https://ui-avatars.com/api/?name=Trịnh+Vi+Giang+Xuân&background=random" alt="Avatar" className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1">
                     <p className="font-semibold text-[15px]">Trịnh Vi Giang Xuân</p>
                   </div>
                 </div>
                 
                 <div className="border-b border-gray-200 pb-3 mb-2">
                   <button className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-blue-600 font-medium rounded-lg transition-colors text-[14px]">
                     Xem tất cả trang cá nhân
                   </button>
                 </div>

                 <div className="space-y-1">
                   <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors">
                     <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                         <Settings className="w-5 h-5 text-gray-700" />
                       </div>
                       <span className="font-medium text-[15px]">Cài đặt và quyền riêng tư</span>
                     </div>
                     <ChevronRight className="w-5 h-5 text-gray-500" />
                   </button>
                   
                   <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors">
                     <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                         <HelpCircle className="w-5 h-5 text-gray-700" />
                       </div>
                       <span className="font-medium text-[15px]">Trợ giúp và hỗ trợ</span>
                     </div>
                     <ChevronRight className="w-5 h-5 text-gray-500" />
                   </button>

                   <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors">
                     <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                         <Moon className="w-5 h-5 text-gray-700" />
                       </div>
                       <span className="font-medium text-[15px]">Màn hình và trợ năng</span>
                     </div>
                     <ChevronRight className="w-5 h-5 text-gray-500" />
                   </button>

                   <button onClick={handleSignOut} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors">
                     <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                         <LogOut className="w-5 h-5 text-gray-700" />
                       </div>
                       <span className="font-medium text-[15px]">Đăng xuất</span>
                     </div>
                   </button>
                 </div>
                 
                 <p className="text-[12px] text-gray-500 mt-3 px-2 leading-tight">
                   Quyền riêng tư · Điều khoản · Quảng cáo · Lựa chọn quảng cáo · Cookie · Xem thêm
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
