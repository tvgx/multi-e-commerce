"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Sparkles, Check, ImageOff } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "@ecommerce/ui-registry/src/store/toast-store";
import { useTranslations } from "@ecommerce/i18n/src/react";

interface ThemeListItem {
  themeId: string;
  title: string;
  description?: string;
  category?: string;
  previewImageUrl?: string;
}

export default function ThemeMarketPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = React.use(params);
  const t = useTranslations("admin");
  const router = useRouter();
  const [themes, setThemes] = useState<ThemeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<ThemeListItem[]>("/api/themes?status=published")
      .then((res) => setThemes(res.data || []))
      .catch((err) => toast.error(`${t("onlineStoreThemes.loadThemeFailed")}: ${err.message}`))
      .finally(() => setLoading(false));
  }, []);

  const applyTheme = async (themeId: string) => {
    setApplying(themeId);
    try {
      await apiClient.post(`/api/themes/${themeId}/apply/${shopId}`, {});
      toast.success(t("onlineStoreThemes.applyThemeToast"));
      router.push(`/dashboard/${shopId}/online-store/builder`);
    } catch (err: any) {
      toast.error(`${t("onlineStoreThemes.applyFailed")}: ${err.message}`);
      setApplying(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/${shopId}/online-store/themes`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> {t("onlineStoreThemes.backToThemes")}
        </Link>
        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-indigo-400 border border-indigo-500/20">
          <Sparkles size={12} /> {t("onlineStoreThemes.marketBadge")}
        </div>
      </div>

      <div className="space-y-3">
        <h1 className="text-4xl font-extrabold text-white">{t("onlineStoreThemes.marketTitle")}</h1>
        <p className="text-slate-400 max-w-xl">
          {t("onlineStoreThemes.marketSubtitle")}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : themes.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-16 text-center text-slate-400">
          {t("onlineStoreThemes.marketEmptyPre")}<code className="text-indigo-400">promote-theme --publish</code>).
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {themes.map((theme) => (
            <div
              key={theme.themeId}
              className="group rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] bg-slate-900 relative overflow-hidden">
                {theme.previewImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={theme.previewImageUrl}
                    alt={theme.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <ImageOff size={32} />
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col flex-1 gap-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-white">{theme.title}</h2>
                  {theme.category && (
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 border border-white/10 rounded-full px-2 py-0.5">
                      {theme.category}
                    </span>
                  )}
                </div>
                {theme.description && (
                  <p className="text-sm text-slate-400 line-clamp-2 flex-1">
                    {theme.description}
                  </p>
                )}
                <button
                  onClick={() => applyTheme(theme.themeId)}
                  disabled={applying !== null}
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 font-semibold text-black transition-all hover:bg-slate-200 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {applying === theme.themeId ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> {t("onlineStoreThemes.applying")}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> {t("onlineStoreThemes.applyTheme")}
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
