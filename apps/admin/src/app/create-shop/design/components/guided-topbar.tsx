"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useBuilderStore,
  EDITABLE_PAGE_KEYS,
} from "@ecommerce/ui-registry/src/store/builder-store";
import { useTranslations } from "@ecommerce/i18n/src/react";
import { toast } from "@ecommerce/ui-registry/src/store/toast-store";
import {
  Loader2,
  ArrowRight,
  Check,
  RotateCcw,
  RotateCw,
  Monitor,
  Smartphone,
} from "lucide-react";

/**
 * Topbar for the guided onboarding wizard. Unlike the free dashboard builder there
 * is no page switcher: the owner designs one page at a time in a fixed sequence and
 * the primary action publishes the current page (in the background) and advances to
 * the next one. After the last page it routes to the navigation editor.
 */
export function GuidedTopbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopId = searchParams?.get("shopId") || "";
  const t = useTranslations("admin");

  const activePage = useBuilderStore((s) => s.activePage);
  const advanceGuided = useBuilderStore((s) => s.advanceGuided);
  const undo = useBuilderStore((s) => s.undo);
  const redo = useBuilderStore((s) => s.redo);
  const history = useBuilderStore((s) => s.history);
  const deviceMode = useBuilderStore((s) => s.deviceMode);
  const setDeviceMode = useBuilderStore((s) => s.setDeviceMode);

  const [busy, setBusy] = useState(false);

  const idx = Math.max(0, EDITABLE_PAGE_KEYS.indexOf(activePage));
  const total = EDITABLE_PAGE_KEYS.length;
  const isLast = idx === total - 1;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const handleAdvance = async () => {
    setBusy(true);
    try {
      const { done } = await advanceGuided(shopId);
      if (done) {
        router.push(`/create-shop/design/navigation?shopId=${shopId}`);
      } else {
        toast.success(t("builder.guided.pagePublished"));
      }
    } catch {
      toast.error(t("builder.guided.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-14 shrink-0 border-b border-white/5 bg-[#0a0a0f] px-4 flex items-center justify-between gap-4 text-white">
      {/* Left: progress */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5">
          {EDITABLE_PAGE_KEYS.map((key, i) => (
            <span
              key={key}
              className={`h-1.5 rounded-full transition-all ${
                i < idx
                  ? "w-6 bg-emerald-500"
                  : i === idx
                    ? "w-8 bg-indigo-500"
                    : "w-6 bg-white/10"
              }`}
            />
          ))}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">
            {t(`builder.page.${activePage}`)}
          </div>
          <div className="text-[11px] text-slate-400">
            {t("builder.guided.progress", { current: idx + 1, total })}
          </div>
        </div>
      </div>

      {/* Center: device + undo/redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={`p-1.5 rounded-md transition-colors ${canUndo ? "text-slate-300 hover:bg-white/10 hover:text-white" : "text-slate-700 cursor-not-allowed"}`}
        >
          <RotateCcw size={15} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className={`p-1.5 rounded-md transition-colors ${canRedo ? "text-slate-300 hover:bg-white/10 hover:text-white" : "text-slate-700 cursor-not-allowed"}`}
        >
          <RotateCw size={15} />
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <div className="flex bg-slate-800 rounded-md p-0.5">
          <button
            onClick={() => setDeviceMode("desktop")}
            title="Desktop"
            className={`p-1.5 rounded transition-colors ${deviceMode === "desktop" ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white"}`}
          >
            <Monitor size={14} />
          </button>
          <button
            onClick={() => setDeviceMode("mobile")}
            title="Mobile"
            className={`p-1.5 rounded transition-colors ${deviceMode === "mobile" ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white"}`}
          >
            <Smartphone size={14} />
          </button>
        </div>
      </div>

      {/* Right: hint + primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="hidden md:inline text-[11px] text-slate-500 max-w-[220px] truncate">
          {t("builder.guided.stepHint")}
        </span>
        <button
          onClick={handleAdvance}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-wait"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isLast ? (
            <Check className="w-4 h-4" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
          {busy
            ? t("builder.guided.publishing")
            : isLast
              ? t("builder.guided.finish")
              : t("builder.guided.publishContinue")}
        </button>
      </div>
    </div>
  );
}
