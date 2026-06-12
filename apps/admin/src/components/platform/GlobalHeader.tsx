"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { UserAvatar } from "@/components/UserAvatar";
import { Zap, Bell, Search, Settings, HelpCircle, Moon, ChevronRight, LogOut } from "lucide-react";
import { useTranslations } from "@ecommerce/i18n/src/react";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function GlobalHeader() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const t = useTranslations("admin");
  const user = session?.user;
  const displayName = user?.name || user?.email || t("header.accountFallback");

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
    <header className="h-16 border-b border-zinc-800 bg-zinc-950 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all">
            <Zap className="text-white w-5 h-5 fill-current" />
          </div>
          <span className="font-bold tracking-tight text-white text-lg">OmniCommerce</span>
        </Link>
      </div>

      {/* Middle - Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-1.5 border border-zinc-800 rounded-lg leading-5 bg-zinc-900 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:bg-zinc-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all"
            placeholder={t("header.searchPlaceholder")}
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <kbd className="inline-flex items-center border border-zinc-700 rounded px-2 text-xs font-sans font-medium text-zinc-500">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4 relative">
        <LanguageSwitcher />
        <button className="relative p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-800">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border border-zinc-950"></span>
        </button>

        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-indigo-400 font-bold text-xs hover:border-zinc-500 transition-all active:scale-95 overflow-hidden ring-2 ring-transparent focus:ring-indigo-500"
        >
          <UserAvatar name={user?.name} email={user?.email} image={user?.image} />
        </button>
        
        {isMenuOpen && (
          <div className="absolute right-0 top-12 w-[340px] rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl z-50 p-3 text-zinc-200 font-sans">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 cursor-pointer transition-colors mb-2">
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border border-zinc-700">
                <UserAvatar name={user?.name} email={user?.email} image={user?.image} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold text-[15px] text-white truncate">{displayName}</p>
                {user?.email && <p className="text-xs text-zinc-400 truncate">{user.email}</p>}
              </div>
            </div>
            
            <div className="border-b border-zinc-800 pb-3 mb-2">
              <Link href="/dashboard/settings" className="block w-full py-1.5 text-center bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors text-[14px]">
                {t("header.manageAccount")}
              </Link>
            </div>

            <div className="space-y-1">
              <Link href="/dashboard/settings" className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-zinc-400" />
                  </div>
                  <span className="font-medium text-[15px]">{t("header.settingsPrivacy")}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-500" />
              </Link>
              
              <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-zinc-400" />
                  </div>
                  <span className="font-medium text-[15px]">{t("header.helpSupport")}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-500" />
              </button>

              <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <Moon className="w-5 h-5 text-zinc-400" />
                  </div>
                  <span className="font-medium text-[15px]">{t("header.displayAccessibility")}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-500" />
              </button>

              <button onClick={handleSignOut} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800 transition-colors text-rose-400 hover:text-rose-300">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-rose-400" />
                  </div>
                  <span className="font-medium text-[15px]">{t("header.signOut")}</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
