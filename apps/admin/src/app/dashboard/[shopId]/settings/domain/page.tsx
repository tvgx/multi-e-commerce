"use client";

import React, { useEffect, useState } from "react";
import { useDomainVerification } from "@/hooks/useDomainVerification";
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCcw,
  ExternalLink,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "@ecommerce/ui-registry/src/store/toast-store";

// Đích A/CNAME người bán cần trỏ tên miền về (host storefront của nền tảng).
const CNAME_TARGET =
  process.env.NEXT_PUBLIC_STOREFRONT_CNAME_TARGET || "storefront.omnicommerce.com";

export default function DomainSettings({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = React.use(params);
  const {
    customDomain,
    domainVerified,
    record,
    loading,
    saving,
    verifying,
    error,
    saveDomain,
    verify,
  } = useDomainVerification(shopId);

  const [domainInput, setDomainInput] = useState("");

  // Đồng bộ ô nhập với tên miền đã lưu khi load xong.
  useEffect(() => {
    if (customDomain) setDomainInput(customDomain);
  }, [customDomain]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép vào clipboard");
  };

  const handleSave = async () => {
    const rec = await saveDomain(domainInput.trim());
    if (rec) {
      toast.success("Đã lưu tên miền. Hãy thêm bản ghi DNS rồi bấm Xác thực.");
    }
  };

  const handleVerify = async () => {
    const ok = await verify();
    if (ok) {
      toast.success("Tên miền đã được xác thực!");
    }
  };

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
          Domain Verification
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-white">Xác thực Tên miền</h1>
        <p className="text-slate-400">
          Kết nối tên miền riêng của bạn để tạo dựng thương hiệu chuyên nghiệp.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-slate-400 py-16 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Đang tải...
        </div>
      ) : domainVerified ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)]">
            <CheckCircle2 className="text-white w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">
              Tên miền đã được xác thực!
            </h2>
            <p className="text-emerald-400/60">
              Cửa hàng của bạn hiện trực tuyến tại{" "}
              <span className="text-white font-mono">{customDomain}</span>
            </p>
          </div>
          <div className="pt-4">
            <a
              href={`https://${customDomain}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold transition-all"
            >
              Truy cập Cửa hàng <ExternalLink size={18} />
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {/* Bước 1: Nhập tên miền */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
                <Globe size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Bước 1 — Nhập tên miền của bạn
                </h3>
                <p className="text-slate-500 text-sm">
                  Ví dụ: store.example.com hoặc www.tencuahang.vn
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="store.example.com"
                className="flex-1 bg-black/40 border border-white/10 rounded-2xl py-3.5 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
              />
              <button
                onClick={handleSave}
                disabled={saving || !domainInput.trim()}
                className="px-8 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...
                  </>
                ) : (
                  "Lưu tên miền"
                )}
              </button>
            </div>
          </div>

          {/* Bước 2: Thêm bản ghi DNS (chỉ hiện khi đã lưu tên miền) */}
          {record && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
                  <Globe size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Bước 2 — Thêm bản ghi vào DNS
                  </h3>
                  <p className="text-slate-500 text-sm">
                    Thêm 2 bản ghi sau tại nhà cung cấp tên miền của bạn.
                  </p>
                </div>
              </div>

              {/* Bản ghi TXT (xác thực sở hữu) */}
              <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <span>Loại (Type)</span>
                  <span className="text-indigo-400">{record.type}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <span>Tên (Host)</span>
                  <span className="text-white font-mono">{record.host}</span>
                </div>
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Giá trị (Value) — xác thực sở hữu
                  </span>
                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                    <code className="text-indigo-300 font-mono text-sm break-all">
                      {record.value}
                    </code>
                    <button
                      onClick={() => copyToClipboard(record.value)}
                      className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-400 shrink-0 ml-2"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bản ghi CNAME (định tuyến lưu lượng) */}
              <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <span>Loại (Type)</span>
                  <span className="text-indigo-400">CNAME</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <span>Tên (Host)</span>
                  <span className="text-white font-mono">@ hoặc www</span>
                </div>
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Trỏ về (Target) — định tuyến lưu lượng
                  </span>
                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                    <code className="text-indigo-300 font-mono text-sm break-all">
                      {CNAME_TARGET}
                    </code>
                    <button
                      onClick={() => copyToClipboard(CNAME_TARGET)}
                      className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-slate-400 shrink-0 ml-2"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                <p className="text-amber-200/60 text-xs leading-relaxed">
                  <strong>Lưu ý:</strong> Thay đổi DNS có thể mất tới 24-48 giờ để
                  cập nhật toàn cầu. Bản ghi <strong>TXT</strong> dùng để xác thực
                  bạn sở hữu tên miền; bản ghi <strong>CNAME</strong> để lưu lượng
                  thực sự đi về cửa hàng.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="flex-1 bg-white text-black font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Đang xác thực...
                    </>
                  ) : (
                    <>
                      <RefreshCcw size={18} /> Xác thực ngay
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm">
              <AlertCircle size={18} /> {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
