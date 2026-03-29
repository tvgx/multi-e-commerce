"use client";

import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function Topbar({ onSave }: { onSave: () => void }) {
  const searchParams = useSearchParams();
  const shopName = searchParams?.get("shopName") || "Tự Thiết Kế";

  return (
    <div className="h-16 shrink-0 border-b border-white/10 bg-black/40 px-6 flex items-center justify-between z-10">
      <div className="flex items-center gap-4">
        <Link href="/create-shop" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">OmniCommerce Builder</span>
          <span className="text-xs text-indigo-400">{shopName} - Đang thiết kế</span>
        </div>
      </div>
      <div>
        <button
          onClick={onSave}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all"
        >
          <Save className="w-4 h-4" /> Lưu Thiết Kế
        </button>
      </div>
    </div>
  );
}
