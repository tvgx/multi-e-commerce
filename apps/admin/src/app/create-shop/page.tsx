"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Rocket, Link as LinkIcon, Loader2, Sparkles } from "lucide-react";
import { useCreateShop } from "@/hooks/useCreateShop";

export default function CreateShopPage() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const { createShop, loading } = useCreateShop();

  const handleSubmit = async () => {
    // Tên cửa hàng giờ được hỏi ở bước "Thiết lập chung" trong trình thiết kế.
    // Ở đây chỉ cần một tên tạm (suy từ domain) để tạo metadata shop.
    const tempName = domain
      ? domain.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Cửa hàng của tôi";
    const shopId = await createShop({ shopName: tempName, domain });
    // Step 1 (Create Store) is auto-completed; dashboard guides the remaining steps.
    if (shopId) router.push(`/dashboard/${shopId}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-indigo-500/30 flex flex-col">
      <nav className="h-20 border-b border-border bg-card/40 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
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
          <div className="rounded-3xl bg-card/60 border border-border p-8 sm:p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2">
                  Chọn địa chỉ cửa hàng
                </h2>
                <p className="text-muted-foreground">
                  Khách hàng sẽ truy cập qua địa chỉ này. Tên, logo và màu sắc sẽ được thiết lập ngay sau đó trong
                  trình thiết kế.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground/90 mb-2 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-indigo-400" /> Domain tùy chỉnh
                  </label>
                  <div className="flex bg-secondary/60 rounded-xl border border-border group focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                    <input
                      type="text"
                      autoFocus
                      className="flex-1 bg-transparent px-5 py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                      placeholder="my-shop"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      onKeyDown={(e) => { if (e.key === "Enter" && domain.trim() && !loading) handleSubmit(); }}
                    />
                    <div className="flex items-center px-4 border-l border-border text-muted-foreground font-mono text-sm bg-secondary/40 rounded-r-xl">
                      .omnicommerce.com
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-indigo-400">
                    Bạn có thể kết nối domain riêng của mình sau trong trang Admin.
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15 px-4 py-3">
                  <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Bước tiếp theo: <span className="text-slate-200 font-medium">Thiết lập chung</span> — đặt tên cửa
                    hàng, chọn màu sắc, tải logo &amp; favicon, thêm liên kết mạng xã hội trước khi thiết kế giao diện.
                  </p>
                </div>
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={loading || !domain.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang khởi tạo...</>
                  ) : (
                    "Tạo cửa hàng & tiếp tục"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
