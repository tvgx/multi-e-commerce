"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  ImageOff,
  Send,
  Trash2,
  Paintbrush,
  CheckCircle2,
  Clock,
  FileEdit,
  Figma,
} from "lucide-react";
import { useMyThemes, type MyTheme } from "@/hooks/useMyThemes";

const STATUS_META: Record<
  MyTheme["status"],
  { label: string; cls: string; icon: React.ReactNode }
> = {
  draft: {
    label: "Bản nháp",
    cls: "text-slate-300 bg-white/5 border-white/10",
    icon: <FileEdit size={12} />,
  },
  pending: {
    label: "Chờ duyệt",
    cls: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    icon: <Clock size={12} />,
  },
  published: {
    label: "Đã xuất bản",
    cls: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    icon: <CheckCircle2 size={12} />,
  },
};

export default function MyThemesPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = React.use(params);
  const router = useRouter();
  const { themes, loading, busy, importing, submit, remove, apply, importFigma } =
    useMyThemes(shopId);

  // Figma import form (presentational state)
  const [figma, setFigma] = useState({ fileKey: "", title: "", category: "" });

  const handleApply = async (themeId: string) => {
    if (await apply(themeId)) {
      router.push(`/dashboard/${shopId}/online-store/builder`);
    }
  };

  const handleImportFigma = async () => {
    if (await importFigma(figma)) {
      setFigma({ fileKey: "", title: "", category: "" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/${shopId}/online-store/themes`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Quay lại Giao diện
        </Link>
      </div>

      <div className="space-y-3">
        <h1 className="text-4xl font-extrabold text-white">Theme của tôi</h1>
        <p className="text-slate-400 max-w-xl">
          Các theme bạn đã tạo. Gửi duyệt để đăng lên chợ giao diện, hoặc áp dụng
          trực tiếp vào shop này.
        </p>
      </div>

      {/* Figma import */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Figma size={18} /> Import từ Figma
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={figma.fileKey}
            onChange={(e) => setFigma({ ...figma, fileKey: e.target.value })}
            placeholder="Figma file key"
            className="rounded-xl bg-slate-950 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 outline-none"
          />
          <input
            value={figma.title}
            onChange={(e) => setFigma({ ...figma, title: e.target.value })}
            placeholder="Tên theme"
            className="rounded-xl bg-slate-950 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 outline-none"
          />
          <input
            value={figma.category}
            onChange={(e) => setFigma({ ...figma, category: e.target.value })}
            placeholder="Danh mục (tuỳ chọn)"
            className="rounded-xl bg-slate-950 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 outline-none"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            {importing
              ? "Đang trích xuất từ Figma — có thể mất vài phút, đừng đóng trang."
              : "File nhiều frame có thể mất vài phút. Chọn nodeIds để import nhanh hơn."}
          </p>
          <button
            onClick={handleImportFigma}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-semibold text-black hover:bg-slate-200 disabled:opacity-50"
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Figma size={16} />}
            Import
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : themes.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-16 text-center text-slate-400">
          Bạn chưa có theme nào. Hãy bấm <strong>“Lưu thành theme”</strong> ở trang
          Giao diện hoặc import từ Figma ở trên.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {themes.map((theme) => {
            const meta = STATUS_META[theme.status];
            return (
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
                  <span
                    className={`absolute top-3 left-3 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${meta.cls}`}
                  >
                    {meta.icon} {meta.label}
                  </span>
                </div>
                <div className="p-6 flex flex-col flex-1 gap-3">
                  <h3 className="text-lg font-bold text-white">{theme.title}</h3>
                  {theme.description && (
                    <p className="text-sm text-slate-400 line-clamp-2 flex-1">
                      {theme.description}
                    </p>
                  )}
                  {theme.status === "draft" && theme.review?.rejectionReason && (
                    <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                      Bị từ chối: {theme.review.rejectionReason}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleApply(theme.themeId)}
                      disabled={busy !== null}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-200 disabled:opacity-50"
                    >
                      {busy === theme.themeId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Paintbrush size={14} />
                      )}
                      Áp dụng
                    </button>
                    {theme.status === "draft" && (
                      <button
                        onClick={() => submit(theme.themeId)}
                        disabled={busy !== null}
                        className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/40 px-4 py-2 text-sm font-medium text-indigo-300 hover:bg-indigo-500/10 disabled:opacity-50"
                      >
                        <Send size={14} /> Gửi duyệt
                      </button>
                    )}
                    <button
                      onClick={() => remove(theme.themeId)}
                      disabled={busy !== null}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-400 hover:text-rose-400 hover:border-rose-500/40 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
