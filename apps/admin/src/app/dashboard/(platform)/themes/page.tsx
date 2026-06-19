"use client";

import { useState } from "react";
import { Palette, Loader2, Check, X, ImageOff, RefreshCw } from "lucide-react";
import { useThemeReview, type ThemeReviewTab } from "@/hooks/useThemeReview";

export default function PlatformThemesPage() {
  const [tab, setTab] = useState<ThemeReviewTab>("pending");
  const { themes, loading, busy, reload, approve, reject } = useThemeReview(tab);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white">
            <Palette size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Theme Market</h1>
            <p className="text-sm text-zinc-400">
              Duyệt theme do người bán gửi và quản lý theme đang xuất bản.
            </p>
          </div>
        </div>
        <button
          onClick={reload}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300 hover:border-indigo-500/50"
        >
          <RefreshCw size={15} /> Làm mới
        </button>
      </div>

      <div className="flex gap-2">
        {(["pending", "published"] as ThemeReviewTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-indigo-600 text-white"
                : "bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:text-white"
            }`}
          >
            {t === "pending" ? "Chờ duyệt" : "Đang xuất bản"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : themes.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-16 text-center text-zinc-500">
          {tab === "pending"
            ? "Không có theme nào đang chờ duyệt."
            : "Chưa có theme nào được xuất bản."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => (
            <div
              key={theme.themeId}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] bg-zinc-950 relative overflow-hidden">
                {theme.previewImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={theme.previewImageUrl}
                    alt={theme.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700">
                    <ImageOff size={28} />
                  </div>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1 gap-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-white">{theme.title}</h3>
                  {theme.category && (
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 border border-zinc-700 rounded-full px-2 py-0.5">
                      {theme.category}
                    </span>
                  )}
                </div>
                {theme.description && (
                  <p className="text-sm text-zinc-400 line-clamp-2">{theme.description}</p>
                )}
                {theme.ownerShopId && (
                  <p className="text-xs text-zinc-600">Shop: {theme.ownerShopId}</p>
                )}
                {tab === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => approve(theme.themeId)}
                      disabled={busy !== null}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {busy === theme.themeId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check size={15} />
                      )}
                      Duyệt
                    </button>
                    <button
                      onClick={() => reject(theme.themeId)}
                      disabled={busy !== null}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/40 px-3 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10 disabled:opacity-50"
                    >
                      <X size={15} /> Từ chối
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
