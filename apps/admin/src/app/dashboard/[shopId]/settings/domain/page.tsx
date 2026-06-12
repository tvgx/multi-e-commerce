"use client";

import React, { use, useState } from "react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  RefreshCcw,
  ExternalLink,
  ArrowLeft,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { toast } from '@ecommerce/ui-registry/src/store/toast-store';

export default function DomainSettings({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = React.use(params);
  const { status, completeStep, refresh } = useOnboarding(shopId);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const verificationRecord = `shopVolo-verification=${shopId}`;
  const shopDomain = status?.steps?.step8?.label || "mystore.omnicommerce.com";

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);
    setSuccess(false);
    try {
      await completeStep(8);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "DNS verification failed. Please check your records and try again.");
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép vào clipboard");
  };

  const isVerified = status?.steps?.step8?.status === "COMPLETED";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
         <Link 
           href={`/dashboard/${shopId}`}
           className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
         >
           <ArrowLeft size={16} /> Back to Dashboard
         </Link>
         <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-indigo-400 border border-indigo-500/20">
           Step 8: Domain Verification
         </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-white">Xác thực Tên miền</h1>
        <p className="text-slate-400">Kết nối domain của riêng bạn để tạo dựng thương hiệu chuyên nghiệp.</p>
      </div>

      {isVerified ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-10 text-center space-y-6">
           <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="text-white w-10 h-10" />
           </div>
           <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Tên miền đã được xác thực!</h2>
              <p className="text-emerald-400/60">Cửa hàng của bạn hiện đang trực tuyến tại <span className="text-white font-mono">{shopDomain}</span></p>
           </div>
           <div className="pt-4">
              <a 
                href={`http://${shopDomain}`}
                target="_blank"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold transition-all"
              >
                 Truy cập Cửa hàng <ExternalLink size={18} />
              </a>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {/* Instructions Card */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
                   <Globe size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-white">Hướng dẫn thiết lập DNS</h3>
                   <p className="text-slate-500 text-sm">Vui lòng thêm bản ghi sau vào quản lý DNS của nhà cung cấp tên miền của bạn.</p>
                </div>
             </div>

             <div className="space-y-4 pt-4">
                <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-3">
                   <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span>Loại bản ghi (Type)</span>
                      <span className="text-indigo-400">TXT</span>
                   </div>
                   <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span>Tên (Host / Name)</span>
                      <span className="text-white font-mono">@</span>
                   </div>
                   <div className="pt-2 border-t border-white/5 space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Giá trị (Value / Content)</span>
                      <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                         <code className="text-indigo-300 font-mono text-sm">{verificationRecord}</code>
                         <button 
                           onClick={() => copyToClipboard(verificationRecord)}
                           className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-400"
                         >
                            <Copy size={16} />
                         </button>
                      </div>
                   </div>
                </div>
             </div>

             <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                <p className="text-amber-200/60 text-xs leading-relaxed">
                   <strong>Lưu ý:</strong> Thay đổi DNS có thể mất tới 24-48 giờ để cập nhật hoàn toàn trên toàn cầu. Đối với môi trường development (`.localhost`), bước này sẽ được tự động bỏ qua.
                </p>
             </div>

             <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleVerify}
                  disabled={verifying}
                  className="flex-1 bg-white text-black font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                   {verifying ? (
                     <><Loader2 className="w-5 h-5 animate-spin" /> Đang xác thực...</>
                   ) : (
                     "Xác nhận đã cấu hình"
                   )}
                </button>
                <button 
                  onClick={() => refresh()}
                  className="px-6 py-4 bg-white/5 text-white font-bold rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                   <RefreshCcw size={18} /> Làm mới
                </button>
             </div>

             {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm animate-shake">
                   <AlertCircle size={18} /> {error}
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
