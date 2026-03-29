"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useBuilder } from "./builder-provider";
import { Loader2, LayoutTemplate, Link as LinkIcon } from "lucide-react";

export function SaveModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domain = searchParams?.get("domain") || "my-shop";
  const currentPage = searchParams?.get("page") || "homepage";
  const { nodes } = useBuilder();
  const [loading, setLoading] = useState(false);

  const pages = ["homepage", "product", "collection", "cart", "checkout"];
  const currentIndex = pages.indexOf(currentPage);
  const nextPage = pages[currentIndex + 1];

  const handleContinue = async () => {
    setLoading(true);
    // Mock Saving the current layout state using Zod Schema BuilderState to minio
    console.log(`[API Mock] Saved Layout for ${currentPage}:`, nodes);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    
    // Move to next page in the builder
    router.push(`/create-shop/design?domain=${domain}&shopName=${searchParams?.get("shopName")}&page=${nextPage}`);
    onClose();
  };

  const handleFinish = async () => {
    setLoading(true);
    console.log(`[API Mock] Finalizing Master Template Sync for ${domain} with base colors configured on ${currentPage}.`);
    console.log(`[API Mock] Layout Delta Data:`, nodes);
    // Sync with api-core endpoint 
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);

    // Redirect to Storefront
    window.location.href = `http://${domain}.localhost:5201`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl scale-in-center">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6">
            <LayoutTemplate className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Đã lưu trang {currentPage.toUpperCase()}!
          </h2>
          {nextPage ? (
            <p className="text-slate-400 mb-8 leading-relaxed">
              Bạn có muốn tiếp tục áp dụng thiết kế kéo thả này cho trang{" "}
              <strong className="text-indigo-300">{nextPage.toUpperCase()}</strong> không? Nếu Không, hệ thống sẽ tự động dùng theme hiện tại áp dụng cho các trang còn lại theo Master Template.
            </p>
          ) : (
            <p className="text-slate-400 mb-8 leading-relaxed">
              Bạn đã thiết kế xong toàn bộ luồng trang chính. Chúc mừng!
            </p>
          )}

          <div className="flex flex-col gap-3 w-full">
            {nextPage && (
              <button
                disabled={loading}
                onClick={handleContinue}
                className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Có, tiếp tục thiết kế"}
              </button>
            )}
            
            <button
              disabled={loading}
              onClick={handleFinish}
              className="w-full py-3.5 px-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-semibold transition-all transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && !nextPage ? <Loader2 className="w-5 h-5 animate-spin" /> : "Không, hoàn tất & Xem trang"}
              <LinkIcon className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
