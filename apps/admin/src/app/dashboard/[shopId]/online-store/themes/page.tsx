"use client";

import React, { use } from "react";
import { Palette, Play, Layout, ArrowLeft, Paintbrush, Zap } from "lucide-react";
import Link from "next/link";

export default function ThemesPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = React.use(params);

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
         <Link 
           href={`/dashboard/${shopId}`}
           className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
         >
           <ArrowLeft size={16} /> Back to Dashboard
         </Link>
         <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-indigo-400 border border-indigo-500/20">
           Step 5: Visual Branding
         </div>
      </div>

      <div className="flex flex-col md:flex-row items-end justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold text-white">Giao diện cửa hàng</h1>
          <p className="text-slate-400 max-w-xl">Quản lý và tùy chỉnh giao diện người dùng. OmniCommerce sử dụng <strong>Zero-File Engine</strong> để render giao diện siêu tốc.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Current Theme Card */}
        <div className="lg:col-span-2 space-y-6">
           <div className="group relative aspect-[16/10] bg-slate-900 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-10 space-y-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
                    Current Theme: Standard Vibe
                 </div>
                 <h3 className="text-3xl font-bold text-white">Master Template 2.0</h3>
                 <p className="text-slate-400 max-w-md">Layout đa mục tiêu, tối ưu cho SEO và chuyển đổi. Hỗ trợ đa thiết bị tuyệt đối.</p>
              </div>
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
                 <Link 
                   href={`/dashboard/${shopId}/online-store/builder`}
                   className="px-8 py-4 bg-white text-black font-bold rounded-2xl flex items-center gap-2 shadow-2xl transition-transform active:scale-95"
                 >
                   <Paintbrush size={20} /> Tùy chỉnh ngay
                 </Link>
              </div>
           </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
           <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                 <Zap className="text-yellow-400" size={20} /> Zero-File Engine
              </h3>
              <div className="space-y-4 text-sm text-slate-400 leading-relaxed">
                 <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-white text-xs">1</div>
                    <p>Thiết kế được lưu dưới dạng JSON schema tại MongoDB.</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-white text-xs">2</div>
                    <p>Storefront tự động giải mã và render thành UI Components.</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-white text-xs">3</div>
                    <p>Không cần build-time, thay đổi có hiệu lực ngay lập tức.</p>
                 </div>
              </div>
           </div>

           <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-8 text-center space-y-4">
              <Layout className="w-12 h-12 text-indigo-400 mx-auto" />
              <h4 className="font-bold text-white">Thư viện Giao diện</h4>
              <p className="text-slate-500 text-xs italic">Sắp có thêm 20+ mẫu giao diện mới cho các ngành hàng đặc thù.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
