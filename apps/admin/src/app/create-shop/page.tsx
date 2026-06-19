"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Rocket, CheckCircle2, ChevronRight, Store, Link as LinkIcon, Loader2 } from "lucide-react";
import { useCreateShop } from "@/hooks/useCreateShop";

export default function CreateShopPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    shopName: "",
    domain: "",
  });
  const { createShop, loading } = useCreateShop();

  const handleNext = () => setStep((s) => Math.min(s + 1, 2));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    const shopId = await createShop({ shopName: formData.shopName, domain: formData.domain });
    // Step 1 (Create Store) is auto-completed; dashboard guides the remaining steps.
    if (shopId) router.push(`/dashboard/${shopId}`);
  };

  return (
    <div className="min-h-screen bg-[#030014] text-slate-200 font-sans selection:bg-indigo-500/30 flex flex-col">
      <nav className="h-20 border-b border-white/5 bg-black/20 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Trở lại trang chủ</span>
        </Link>
        <div className="flex gap-2 items-center text-sm font-semibold tracking-wider text-indigo-400">
          <Rocket className="w-5 h-5" /> Khởi tạo Cửa hàng
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-2xl h-[50%] bg-indigo-600/20 blur-[120px] rounded-full -z-10 mix-blend-screen" />

        <div className="w-full max-w-2xl">
          {/* Progress Bar */}
          <div className="mb-8 relative flex items-center justify-between before:absolute before:top-1/2 before:left-0 before:h-0.5 before:w-full before:-translate-y-1/2 before:bg-white/10 before:-z-10">
            <div
              className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-indigo-500 transition-all duration-500 -z-10"
              style={{ width: `${(step - 1) * 100}%` }}
            />
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${s < step ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]" : s === step ? "bg-indigo-600 text-white ring-4 ring-indigo-500/30" : "bg-slate-900 border border-white/10 text-slate-500"
                  }`}
              >
                {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-8 sm:p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                    Tên cửa hàng của bạn là gì?
                  </h2>
                  <p className="text-slate-400">Tên này sẽ hiển thị ở tiêu đề trang web OmniCommerce.</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                      <Store className="w-4 h-4 text-indigo-400" /> Tên cửa hàng
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="VD: Sneaker Head Store"
                      value={formData.shopName}
                      onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-10 flex justify-end">
                  <button
                    onClick={handleNext}
                    disabled={!formData.shopName.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-black transition-all hover:bg-slate-200 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Tiếp tục <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                    Thiết lập tên miền
                  </h2>
                  <p className="text-slate-400">Khách hàng sẽ truy cập cửa hàng của bạn qua địa chỉ này.</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-emerald-400" /> Domain tùy chỉnh
                    </label>
                    <div className="flex bg-black/50 rounded-xl border border-white/10 group focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                      <input
                        type="text"
                        className="flex-1 bg-transparent px-5 py-3 text-white placeholder:text-slate-600 focus:outline-none"
                        placeholder="my-shop"
                        value={formData.domain}
                        onChange={(e) => setFormData({ ...formData, domain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                      />
                      <div className="flex items-center px-4 border-l border-white/10 text-slate-500 font-mono text-sm bg-black/30 rounded-r-xl">
                        .omnicommerce.com
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-indigo-400">
                      Bạn có thể kết nối domain riêng của mình sau trong trang Admin.
                    </p>
                  </div>
                </div>

                <div className="mt-10 flex justify-between items-center">
                  <button
                    onClick={handlePrev}
                    disabled={loading}
                    className="inline-flex items-center px-6 py-3 font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !formData.domain.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Đang khởi tạo...</>
                    ) : (
                      "Hoàn tất tạo Shop"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
