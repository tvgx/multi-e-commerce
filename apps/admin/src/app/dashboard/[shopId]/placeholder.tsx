"use client";

import React, { use } from "react";
import { ArrowLeft, Construction } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "@ecommerce/i18n/src/react";

export default function PlaceholderPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = React.use(params);
  const t = useTranslations("admin");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-in fade-in duration-700">
      <div className="w-24 h-24 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center text-indigo-400">
        <Construction size={48} />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">{t("placeholder.title")}</h1>
        <p className="text-slate-500">{t("placeholder.desc")}</p>
      </div>

      <Link
        href={`/dashboard/${shopId}`}
        className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-xl font-bold transition-all hover:bg-slate-200"
      >
        <ArrowLeft size={18} /> {t("placeholder.back")}
      </Link>
    </div>
  );
}
