"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Rocket, CheckCircle2, ChevronRight, Store, Link as LinkIcon, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function CreateShopPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [formData, setFormData] = useState({
    shopName: "",
    domain: "",
    templateId: "MASTER_FASHION",
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await apiClient.get<any>("/api/templates");
        if (res.data && res.data.length > 0) {
          setTemplates(res.data);
        } else {
          // Fallback if empty
          setTemplates([
            { id: "MASTER_FASHION", displayName: "Thời trang", description: "Layout thời trang, phụ kiện.", icon: "👗", isCustom: false, templateType: "visual" },
            { id: "CUSTOM_DESIGN", displayName: "Tự thiết kế", description: "Tự do trải nghiệm kéo thả layout.", icon: "🎨", isCustom: true, templateType: "standard" },
          ]);
        }
      } catch (err) {
        // Fallback on error
        setTemplates([
          { id: "MASTER_FASHION", displayName: "Thời trang", description: "Layout thời trang, phụ kiện.", icon: "👗", isCustom: false, templateType: "visual" },
          { id: "CUSTOM_DESIGN", displayName: "Tự thiết kế", description: "Tự do trải nghiệm kéo thả layout.", icon: "🎨", isCustom: true, templateType: "standard" },
        ]);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const selectedTemplate = templates.find(t => t.id === formData.templateId) || templates[0];
      
      // 1. Create the shop metadata
      const res = await apiClient.post<any>("/api/shops", {
        name: formData.shopName,
        domain: formData.domain,
        templateType: selectedTemplate.templateType,
        templateKey: formData.templateId,
        productsPerPage: 30,
      });

      const shopId = res.data.id;

      // 2. If custom design, we might want to do extra logic, but for now just redirect to dashboard
      // The dashboard will guide them to the builder in Step 5
      setLoading(false);
      router.push(`/dashboard/${shopId}`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      setLoading(false);
    }
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
          {step < 4 && (
            <div className="mb-8 relative flex items-center justify-between before:absolute before:top-1/2 before:left-0 before:h-0.5 before:w-full before:-translate-y-1/2 before:bg-white/10 before:-z-10">
              <div
                className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-indigo-500 transition-all duration-500 -z-10"
                style={{ width: `${((step - 1) / 2) * 100}%` }}
              />
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${s < step ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]" : s === step ? "bg-indigo-600 text-white ring-4 ring-indigo-500/30" : "bg-slate-900 border border-white/10 text-slate-500"
                    }`}
                >
                  {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
              ))}
            </div>
          )}

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

                <div className="mt-10 flex justify-between">
                  <button
                    onClick={handlePrev}
                    className="inline-flex items-center px-6 py-3 font-medium text-slate-400 hover:text-white transition-colors"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!formData.domain.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-black transition-all hover:bg-slate-200 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Tiếp tục <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                    Chọn Giao diện khởi đầu
                  </h2>
                  <p className="text-slate-400">Master Template chứa sẵn các khối (sections) tối ưu cho ngành hàng của bạn.</p>
                </div>

                <div className="space-y-4">
                  {loadingTemplates ? (
                    <div className="flex justify-center p-5"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
                  ) : (
                    templates.map((tmpl: any) => (
                      <div
                        key={tmpl.id}
                        onClick={() => setFormData({ ...formData, templateId: tmpl.id })}
                        className={`cursor-pointer group flex items-start gap-4 p-5 rounded-2xl border transition-all ${formData.templateId === tmpl.id
                          ? "bg-indigo-500/20 border-indigo-500 ring-1 ring-indigo-500"
                          : "bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/5"
                          }`}
                      >
                        <div className="text-3xl">{tmpl.icon}</div>
                        <div>
                          <h4 className="text-white font-bold mb-1 group-hover:text-indigo-300 transition-colors">{tmpl.displayName}</h4>
                          <p className="text-slate-400 text-sm">{tmpl.description}</p>
                        </div>
                        <div className="ml-auto flex items-center justify-center pt-2">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.templateId === tmpl.id ? 'border-indigo-400' : 'border-slate-700 group-hover:border-slate-500'}`}>
                            {formData.templateId === tmpl.id && <div className="w-3 h-3 rounded-full bg-indigo-400" />}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
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
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50"
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

            {step === 4 && (
              <div className="animate-in zoom-in duration-500 text-center py-10 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-4">
                  Thành công rực rỡ!
                </h2>
                <p className="text-slate-400 max-w-sm mb-10 leading-relaxed">
                  Cửa hàng <strong>{formData.shopName || "Của Bạn"}</strong> đã được khởi tạo hoàn tất trên hệ thống OmniCommerce với kiến trúc Hybrid Database.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                  <a
                    href={`http://${formData.domain || "my-shop"}.localhost:3002`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-black transition-all hover:bg-slate-200"
                  >
                    Xem Storefront
                  </a>
                  <a
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-500/20 border border-indigo-500/50 px-8 py-3 font-semibold text-indigo-300 transition-all hover:bg-indigo-500/30"
                  >
                    Vào trang Admin <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
