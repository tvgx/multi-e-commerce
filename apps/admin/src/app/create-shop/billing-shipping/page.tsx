"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, CreditCard, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { useGeo } from "@/hooks/useGeo";
import { useBillingShipping } from "@/hooks/useBillingShipping";
import { WizardProgress } from "../components/wizard-progress";

// Danh sách ngân hàng được hỗ trợ (theo yêu cầu): Agribank, VietinBank, Vietcombank, MB.
const BANKS = ["Agribank", "VietinBank", "Vietcombank", "MB"];

function BillingShippingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopId = searchParams?.get("shopId") || "";
  const { provinces, wards, loadWards, loadingWards } = useGeo();
  const { busy, submit } = useBillingShipping(shopId);

  // Shipping
  const [fixedEnabled, setFixedEnabled] = useState(true);
  const [fixedFee, setFixedFee] = useState("30000");
  const [freeshipEnabled, setFreeshipEnabled] = useState(true);
  const [freeThreshold, setFreeThreshold] = useState("500000");

  // Payment
  const [codEnabled, setCodEnabled] = useState(true);
  const [bankEnabled, setBankEnabled] = useState(true);
  const [bankName, setBankName] = useState(BANKS[2]); // Vietcombank
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  // Warehouse
  const [provinceCode, setProvinceCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [phone, setPhone] = useState("");

  const onProvinceChange = (code: string) => {
    setProvinceCode(code);
    setWardCode("");
    loadWards(code);
  };

  const handleFinish = async () => {
    const ok = await submit({
      shipping: { fixedEnabled, fixedFee, freeshipEnabled, freeThreshold },
      payment: { codEnabled, bankEnabled, bankName, accountHolder, accountNumber },
      warehouse: { provinceCode, wardCode, addressLine, phone },
    });
    if (ok) {
      router.push(`/dashboard/${shopId}?finalizing=true`);
    }
  };

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all";
  const sectionCls =
    "rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-7 backdrop-blur-xl space-y-5";

  return (
    <div className="min-h-screen bg-[#050510] text-white p-6 sm:p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <WizardProgress current="billing" />

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thanh toán & Vận chuyển</h1>
          <p className="text-sm text-slate-400 mt-1">
            Thiết lập cấu hình cơ bản trước khi cửa hàng lên sóng.
          </p>
        </div>

        {/* Shipping */}
        <div className={sectionCls}>
          <h2 className="flex items-center gap-2 font-semibold">
            <Package size={18} className="text-indigo-400" /> Phương thức vận chuyển
          </h2>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={fixedEnabled}
              onChange={(e) => setFixedEnabled(e.target.checked)}
              className="mt-1 accent-indigo-500"
            />
            <div className="flex-1">
              <span className="text-sm font-medium">Phí vận chuyển đồng giá (Fixed Rate)</span>
              {fixedEnabled && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-400">Mức phí:</span>
                  <input
                    type="number"
                    value={fixedFee}
                    onChange={(e) => setFixedFee(e.target.value)}
                    className={`${inputCls} max-w-[180px]`}
                  />
                  <span className="text-xs text-slate-400">VNĐ</span>
                </div>
              )}
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={freeshipEnabled}
              onChange={(e) => setFreeshipEnabled(e.target.checked)}
              className="mt-1 accent-indigo-500"
            />
            <div className="flex-1">
              <span className="text-sm font-medium">Miễn phí vận chuyển (Freeship)</span>
              {freeshipEnabled && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-400">Áp dụng cho đơn từ:</span>
                  <input
                    type="number"
                    value={freeThreshold}
                    onChange={(e) => setFreeThreshold(e.target.value)}
                    className={`${inputCls} max-w-[180px]`}
                  />
                  <span className="text-xs text-slate-400">VNĐ</span>
                </div>
              )}
            </div>
          </label>
        </div>

        {/* Payment */}
        <div className={sectionCls}>
          <h2 className="flex items-center gap-2 font-semibold">
            <CreditCard size={18} className="text-emerald-400" /> Phương thức thanh toán
          </h2>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={codEnabled}
              onChange={(e) => setCodEnabled(e.target.checked)}
              className="mt-1 accent-indigo-500"
            />
            <div>
              <span className="text-sm font-medium">Thanh toán khi nhận hàng (COD)</span>
              <p className="text-xs text-slate-500 mt-0.5">
                Cho phép khách hàng kiểm tra hàng trước khi thanh toán.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={bankEnabled}
              onChange={(e) => setBankEnabled(e.target.checked)}
              className="mt-1 accent-indigo-500"
            />
            <span className="text-sm font-medium">Chuyển khoản ngân hàng</span>
          </label>

          {bankEnabled && (
            <div className="ml-7 grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Ngân hàng</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className={inputCls}
                >
                  {BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tên tài khoản</label>
                <input
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="NGUYEN VAN A"
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Số tài khoản</label>
                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="0123456789"
                  className={inputCls}
                />
              </div>
            </div>
          )}
        </div>

        {/* Warehouse */}
        <div className={sectionCls}>
          <h2 className="flex items-center gap-2 font-semibold">
            <MapPin size={18} className="text-amber-400" /> Địa chỉ kho hàng mặc định
          </h2>
          <p className="text-xs text-slate-500 -mt-2">
            Kho hàng là nơi shipper sẽ đến để lấy hàng.
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tỉnh/Thành phố</label>
              <select
                value={provinceCode}
                onChange={(e) => onProvinceChange(e.target.value)}
                className={inputCls}
              >
                <option value="">— Chọn tỉnh/thành —</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Phường/Xã</label>
              <select
                value={wardCode}
                onChange={(e) => setWardCode(e.target.value)}
                disabled={!provinceCode || loadingWards}
                className={`${inputCls} disabled:opacity-50`}
              >
                <option value="">{loadingWards ? "Đang tải..." : "— Chọn phường/xã —"}</option>
                {wards.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Địa chỉ cụ thể</label>
              <input
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="123 Lê Lợi"
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Số điện thoại (tùy chọn)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xxxxxxxx"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleFinish}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-indigo-500/25 disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Lưu và Hoàn tất tạo Shop
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BillingShippingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050510]" />}>
      <BillingShippingForm />
    </Suspense>
  );
}
