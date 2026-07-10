"use client";

import React, { useState } from "react";
import { Palette, Play, Layout, ArrowLeft, Paintbrush, Zap, Save, FolderHeart, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { toast } from "@ecommerce/ui-registry/src/store/toast-store";
import { useTranslations } from "@ecommerce/i18n/src/react";

export default function ThemesPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = React.use(params);
  const t = useTranslations("admin");
  const router = useRouter();
  const [saveOpen, setSaveOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "" });

  const submitSave = async () => {
    if (!form.title.trim()) {
      toast.error(t("onlineStoreThemes.themeNameRequired"));
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(`/api/themes/from-shop/${shopId}`, form);
      toast.success(t("onlineStoreThemes.savedDraftToast"));
      setSaveOpen(false);
      router.push(`/dashboard/${shopId}/online-store/themes/mine`);
    } catch (err: any) {
      toast.error(`${t("onlineStoreThemes.saveFailed")}: ${err.message}`);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
         <Link
           href={`/dashboard/${shopId}`}
           className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
         >
           <ArrowLeft size={16} /> {t("onlineStoreThemes.backToDashboard")}
         </Link>
         <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-indigo-400 border border-indigo-500/20">
           {t("onlineStoreThemes.step5Badge")}
         </div>
      </div>

      <div className="flex flex-col md:flex-row items-end justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold text-white">{t("onlineStoreThemes.title")}</h1>
          <p className="text-slate-400 max-w-xl">{t("onlineStoreThemes.subtitle1")} <strong>Zero-File Engine</strong> {t("onlineStoreThemes.subtitle2")}</p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            onClick={() => setSaveOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition-all hover:bg-white/10"
          >
            <Save size={18} /> {t("onlineStoreThemes.saveAsTheme")}
          </button>
          <Link
            href={`/dashboard/${shopId}/online-store/themes/mine`}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition-all hover:bg-white/10"
          >
            <FolderHeart size={18} /> {t("onlineStoreThemes.myThemes")}
          </Link>
          <Link
            href={`/dashboard/${shopId}/online-store/themes/market`}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
          >
            <Zap size={18} /> {t("onlineStoreThemes.market")}
          </Link>
        </div>
      </div>

      {saveOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white">{t("onlineStoreThemes.saveModalTitle")}</h2>
              <p className="text-sm text-slate-400 mt-1">
                {t("onlineStoreThemes.saveModalDesc1")} <strong>{t("onlineStoreThemes.saveModalDescStrong")}</strong> {t("onlineStoreThemes.saveModalDesc2")}
              </p>
            </div>
            <div className="space-y-3">
              <input
                autoFocus
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t("onlineStoreThemes.titlePlaceholder")}
                className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 outline-none"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t("onlineStoreThemes.descPlaceholder")}
                rows={3}
                className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 outline-none resize-none"
              />
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder={t("onlineStoreThemes.categoryPlaceholder")}
                className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSaveOpen(false)}
                disabled={saving}
                className="rounded-full px-5 py-2.5 font-medium text-slate-300 hover:text-white disabled:opacity-50"
              >
                {t("onlineStoreThemes.cancel")}
              </button>
              <button
                onClick={submitSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-semibold text-black hover:bg-slate-200 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                {t("onlineStoreThemes.saveTheme")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Current Theme Card */}
        <div className="lg:col-span-2 space-y-6">
           <div className="group relative aspect-[16/10] bg-slate-900 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-10 space-y-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
                    {t("onlineStoreThemes.currentThemeBadge")}
                 </div>
                 <h2 className="text-3xl font-bold text-white">Master Template 2.0</h2>
                 <p className="text-slate-400 max-w-md">{t("onlineStoreThemes.masterTemplateDesc")}</p>
              </div>
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
                 <Link 
                   href={`/dashboard/${shopId}/online-store/builder`}
                   className="px-8 py-4 bg-white text-black font-bold rounded-2xl flex items-center gap-2 shadow-2xl transition-transform active:scale-95"
                 >
                   <Paintbrush size={20} /> {t("onlineStoreThemes.customizeNow")}
                 </Link>
              </div>
           </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
           <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                 <Zap className="text-yellow-400" size={20} /> Zero-File Engine
              </h2>
              <div className="space-y-4 text-sm text-slate-400 leading-relaxed">
                 <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-white text-xs">1</div>
                    <p>{t("onlineStoreThemes.zeroStep1")}</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-white text-xs">2</div>
                    <p>{t("onlineStoreThemes.zeroStep2")}</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-white text-xs">3</div>
                    <p>{t("onlineStoreThemes.zeroStep3")}</p>
                 </div>
              </div>
           </div>

           <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-8 text-center space-y-4">
              <Layout className="w-12 h-12 text-indigo-400 mx-auto" />
              <h3 className="font-bold text-white">{t("onlineStoreThemes.libraryTitle")}</h3>
              <p className="text-slate-500 text-xs italic">{t("onlineStoreThemes.libraryDesc")}</p>
           </div>
        </div>
      </div>
    </div>
  );
}
