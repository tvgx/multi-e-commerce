"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight, 
  Info,
  Building2,
  User,
  CreditCard,
  Loader2,
  ChevronRight
} from "lucide-react";

export default function PaymentConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get("id");
  
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<any>(null);
  const [countdown, setCountdown] = useState(25);
  const [status, setStatus] = useState<"pending" | "success" | "failed">("pending");
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const handleConfirm = useCallback(async (action: "ACCEPT" | "REJECT") => {
    if (!paymentId) return;
    try {
      const res = await fetch(`${API_URL}/api/payments/${paymentId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus(action === "ACCEPT" ? "success" : "failed");
      } else {
        setError(data.message || "Failed to process payment");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  }, [paymentId, API_URL]);

  useEffect(() => {
    if (!paymentId) {
      setError("Mã thanh toán không hợp lệ.");
      setLoading(false);
      return;
    }

    const fetchPayment = async () => {
      try {
        const res = await fetch(`${API_URL}/api/payments/${paymentId}`);
        const data = await res.json();
        if (data.success) {
          setPayment(data.data);
        } else {
          setError(data.message || "Không tìm thấy thông tin thanh toán.");
        }
      } catch (err) {
        setError("Lỗi kết nối máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [paymentId, API_URL]);

  useEffect(() => {
    if (status !== "pending" || !payment) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleConfirm("REJECT");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, payment, handleConfirm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 max-w-md w-full text-center space-y-4">
          <XCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-white">Đã có lỗi xảy ra</h1>
          <p className="text-slate-400">{error}</p>
          <button 
            onClick={() => router.back()}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
         <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] p-10 max-w-md w-full text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Thanh toán thành công!</h1>
            <p className="text-slate-400">Cảm ơn bạn đã mua hàng. Đơn hàng đang được xử lý.</p>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="w-full py-4 bg-white text-black font-black rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Về Trang Chủ <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
         <div className="bg-red-500/10 border border-red-500/20 rounded-[2.5rem] p-10 max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-red-500/40">
            <XCircle className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Đã từ chối</h1>
            <p className="text-slate-400">Thanh toán đã bị hủy hoặc hết thời gian chờ.</p>
          </div>
          <button 
            onClick={() => router.back()}
            className="w-full py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all"
          >
            Quay lại trang thanh toán
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-violet-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 py-12 md:py-20 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
            <Clock className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span className="text-sm font-bold tracking-wider">HẾT HẠN TRONG <span className="text-indigo-400">{countdown}s</span></span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
            Xác nhận <br /> <span className="text-indigo-500 underline decoration-indigo-500/30 underline-offset-8">Giao dịch</span>
          </h1>
        </div>

        {/* Info Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-2xl shadow-2xl">
          <div className="p-8 space-y-6">
             <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm font-medium uppercase tracking-widest">Số tiền</span>
                <span className="text-3xl font-black text-white tabular-nums">
                  {payment.amount.toLocaleString('vi-VN')} <span className="text-lg text-indigo-400 ml-1">VND</span>
                </span>
             </div>

             <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

             <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Người gửi</p>
                    <p className="font-bold text-white uppercase">{payment.order?.customerName || 'KHÁCH HÀNG'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Người nhận</p>
                    <p className="font-bold text-white uppercase italic">{payment.order?.shop?.name || 'CỬA HÀNG'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                    <Info size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">Nội dung</p>
                    <p className="font-medium text-slate-300">Thanh toán đơn hàng #{payment.order?.id.slice(-8).toUpperCase()}</p>
                  </div>
                </div>
             </div>
          </div>

          <div className="bg-white/5 p-4 flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center border border-white/10">
                <CreditCard size={18} className="text-slate-400" />
             </div>
             <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Phương thức</p>
                <p className="text-xs font-bold text-slate-300">CHUYỂN KHOẢN SMART QR</p>
             </div>
             <div className="ml-auto">
                <div className="px-2 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded text-[10px] font-bold text-indigo-400 uppercase">Secure</div>
             </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
           <button 
            onClick={() => handleConfirm("REJECT")}
            className="py-5 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-500/20 hover:border-red-500/30 transition-all group"
           >
             Từ chối
           </button>
           <button 
            onClick={() => handleConfirm("ACCEPT")}
            className="py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-2 group"
           >
             Đồng ý <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
           </button>
        </div>

        <p className="text-[10px] text-center text-slate-500 font-medium uppercase tracking-[0.2em]">
          Giao dịch được mã hóa bởi 256-bit SSL
        </p>
      </div>
    </div>
  );
}
