"use client";

import React, { use } from "react";
import { ArrowLeft, Construction } from "lucide-react";
import Link from "next/link";

export default function PlaceholderPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = React.use(params);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-in fade-in duration-700">
      <div className="w-24 h-24 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center text-indigo-400">
        <Construction size={48} />
      </div>
      
      <div className="space-y-2">
         <h1 className="text-3xl font-bold text-white">Tính năng đang phát triển</h1>
         <p className="text-slate-500">Module này đang được xây dựng trong giai đoạn tiếp theo của DATN.</p>
      </div>

      <Link 
        href={`/dashboard/${shopId}`}
        className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-xl font-bold transition-all hover:bg-slate-200"
      >
        <ArrowLeft size={18} /> Quay lại Dashboard
      </Link>
    </div>
  );
}
