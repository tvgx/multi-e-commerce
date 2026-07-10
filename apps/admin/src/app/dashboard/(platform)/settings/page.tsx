import React from "react";
import { Settings, Shield, Key, Bell, CreditCard, Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { getT } from "@/lib/i18n";

export default async function SettingsPage() {
  const t = await getT("admin");
  return (
    <div className="p-6 md:p-10 text-zinc-100 min-h-full">
      <div className="mx-auto max-w-4xl space-y-8">

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{t("platformSettings.title")}</h1>
          <p className="text-zinc-400 mt-2">{t("platformSettings.subtitle")}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">

          {/* Settings Sidebar */}
          <div className="w-full md:w-64 space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800/80 text-white font-medium transition-colors">
              <Settings size={18} className="text-indigo-400" />
              {t("platformSettings.navGeneral")}
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 font-medium transition-colors">
              <Shield size={18} />
              {t("platformSettings.navSecurity")}
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 font-medium transition-colors">
              <Bell size={18} />
              {t("platformSettings.navNotifications")}
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 font-medium transition-colors">
              <CreditCard size={18} />
              {t("platformSettings.navBilling")}
            </button>
          </div>

          {/* Settings Content */}
          <div className="flex-1 space-y-6">

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
                <h2 className="text-lg font-semibold text-white">{t("platformSettings.profileInfo")}</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-700 bg-zinc-800 flex items-center justify-center text-lg">
                    <UserAvatar />
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium text-sm transition-colors border border-zinc-700">
                      {t("platformSettings.changeAvatar")}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-400">{t("platformSettings.fullName")}</label>
                    <input
                      type="text"
                      placeholder={t("platformSettings.fullNamePlaceholder")}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-400">{t("platformSettings.email")}</label>
                    <input
                      type="email"
                      placeholder={t("platformSettings.emailPlaceholder")}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm">
                    {t("platformSettings.saveChanges")}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center gap-2">
                <Key size={18} className="text-zinc-400" />
                <h2 className="text-lg font-semibold text-white">{t("platformSettings.password")}</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-zinc-400 mb-4">{t("platformSettings.passwordDesc")}</p>
                <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium text-sm transition-colors border border-zinc-700">
                  {t("platformSettings.changePassword")}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-rose-900/30 bg-rose-950/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-rose-900/30 bg-rose-900/10 flex items-center gap-2">
                <Trash2 size={18} className="text-rose-500" />
                <h2 className="text-lg font-semibold text-rose-500">{t("platformSettings.dangerZone")}</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-zinc-400 mb-4">{t("platformSettings.dangerDesc")}</p>
                <button className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-500/30 rounded-lg font-medium text-sm transition-colors">
                  {t("platformSettings.deleteAccount")}
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
