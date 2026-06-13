"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Truck,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Save,
  MapPin,
  CheckCircle2
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";
import { formatPrice } from '@ecommerce/ui-registry/src/lib/format';
import { toast, confirmDialog } from '@ecommerce/ui-registry/src/store/toast-store';
import { useTranslations } from '@ecommerce/i18n/src/react';
import { useOnboarding } from "@/hooks/useOnboarding";
import { useGeo } from "@/hooks/useGeo";

interface ShippingMethod {
  id: string;
  name: string;
  description?: string | null;
  baseFee: number;
  freeThreshold?: number | null;
  estimatedDays?: string | null;
  active: boolean;
  position: number;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  baseFee: "",
  freeThreshold: "",
  estimatedDays: "",
  active: true,
};

export default function ShippingSettingsPage() {
  const params = useParams();
  const shopId = params.shopId as string;
  const router = useRouter();
  const t = useTranslations("admin");

  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingWarehouse, setSavingWarehouse] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  
  // Onboarding hooks
  const { status, completeStep } = useOnboarding(shopId);
  const isOnboarding = status && status.steps.step7?.status !== "COMPLETED";

  // Warehouse hooks
  const { provinces, wards, loadWards, loadingWards } = useGeo();
  const [provinceCode, setProvinceCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [phone, setPhone] = useState("");

  const onProvinceChange = (code: string) => {
    setProvinceCode(code);
    setWardCode("");
    loadWards(code);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [methodsRes, shopRes] = await Promise.all([
        apiClient.get<{ data: ShippingMethod[] }>(`/api/shipping/methods/all`, { shopId }),
        apiClient.get<any>(`/api/shops/${shopId}`, { shopId })
      ]);
      setMethods((methodsRes.data as any).data ?? (methodsRes.data as any));
      
      const warehouse = shopRes.data?.stockLocations?.[0];
      if (warehouse) {
        setAddressLine(warehouse.addressLine || "");
        setPhone(warehouse.phone || "");
        if (warehouse.provinceCode) {
          setProvinceCode(warehouse.provinceCode);
          loadWards(warehouse.provinceCode);
        }
        if (warehouse.wardCode) setWardCode(warehouse.wardCode);
      }
    } catch (err) {
      console.error("Failed to fetch shipping data", err);
    } finally {
      setLoading(false);
    }
  }, [shopId, loadWards]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (m: ShippingMethod) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      description: m.description || "",
      baseFee: String(m.baseFee),
      freeThreshold: m.freeThreshold != null ? String(m.freeThreshold) : "",
      estimatedDays: m.estimatedDays || "",
      active: m.active,
    });
    setShowForm(true);
  };

  const handleSaveMethod = async () => {
    if (!form.name.trim() || form.baseFee === "") {
      toast.error(t("shipping.requireNameFee"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        baseFee: Number(form.baseFee),
        freeThreshold: form.freeThreshold !== "" ? Number(form.freeThreshold) : null,
        estimatedDays: form.estimatedDays.trim() || undefined,
        active: form.active,
      };
      if (editingId) {
        await apiClient.patch(`/api/shipping/methods/${editingId}`, payload, { shopId });
      } else {
        await apiClient.post(`/api/shipping/methods`, payload, { shopId });
      }
      setShowForm(false);
      await fetchData();
    } catch (err: any) {
      toast.error(`${t("shipping.errorPrefix")}: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: ShippingMethod) => {
    if (
      !(await confirmDialog({
        title: t("shipping.deleteTitle"),
        message: t("shipping.deleteMessage", { name: m.name }),
        confirmText: t("shipping.deleteConfirm"),
        danger: true,
      }))
    )
      return;
    try {
      await apiClient.delete(`/api/shipping/methods/${m.id}`, { shopId });
      await fetchData();
    } catch (err: any) {
      toast.error(`${t("shipping.errorPrefix")}: ${err.message}`);
    }
  };

  const toggleActive = async (m: ShippingMethod) => {
    try {
      await apiClient.patch(`/api/shipping/methods/${m.id}`, { active: !m.active }, { shopId });
      setMethods(prev => prev.map(x => x.id === m.id ? { ...x, active: !m.active } : x));
    } catch (err: any) {
      toast.error(`${t("shipping.errorPrefix")}: ${err.message}`);
    }
  };

  const handleSaveWarehouse = async () => {
    if (!addressLine.trim() || !provinceCode || !wardCode) {
      toast.error("Vui lòng nhập đầy đủ địa chỉ kho hàng");
      return;
    }
    setSavingWarehouse(true);
    try {
      await apiClient.patch(
        `/api/shops/${shopId}/warehouse`,
        { addressLine, provinceCode, wardCode, phone, note: "Kho hàng — nơi shipper đến lấy hàng" },
        { shopId },
      );
      
      if (isOnboarding) {
        await completeStep(7);
        toast.success("Thiết lập vận chuyển thành công!");
        router.push(`/dashboard/${shopId}`);
      } else {
        toast.success("Đã lưu địa chỉ kho hàng!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSavingWarehouse(false);
    }
  };

  const inputCls =
    "w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all";

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link
        href={`/dashboard/${shopId}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        {t("shipping.backToDashboard")}
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          {isOnboarding && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-500/20">
              Step 7 of 8
            </div>
          )}
          <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Truck className="w-9 h-9 text-indigo-400" /> {t("shipping.title")}
          </h1>
          <p className="text-slate-400 text-lg">
            {t("shipping.subtitle")}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="space-y-12">
          {/* Methods List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Phương thức vận chuyển</h2>
              <button
                onClick={openCreate}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" /> {t("shipping.addMethod")}
              </button>
            </div>
            {methods.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-12 text-center text-slate-400">
                {t("shipping.noMethods")}
              </div>
            ) : (
              <div className="space-y-4">
                {methods.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-white text-lg">{m.name}</h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.active ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"}`}>
                          {m.active ? t("shipping.active") : t("shipping.inactive")}
                        </span>
                      </div>
                      {m.description && <p className="text-sm text-slate-400">{m.description}</p>}
                      <div className="text-sm text-slate-300 flex flex-wrap gap-4 pt-1">
                        <span>{t("shipping.feeLabel")}: <strong className="text-emerald-400">{formatPrice(m.baseFee)}</strong></span>
                        {m.freeThreshold != null && (
                          <span>{t("shipping.freeFrom")}: <strong className="text-amber-400">{formatPrice(m.freeThreshold)}</strong></span>
                        )}
                        {m.estimatedDays && <span>{t("shipping.timeLabel")}: <strong>{m.estimatedDays}</strong></span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleActive(m)}
                        className={`px-3 py-2 rounded-xl text-sm font-bold transition-colors ${m.active ? "bg-slate-500/10 text-slate-300 hover:bg-slate-500/20" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`}
                      >
                        {m.active ? t("shipping.turnOff") : t("shipping.turnOn")}
                      </button>
                      <button
                        onClick={() => openEdit(m)}
                        className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                        title={t("shipping.edit")}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        title={t("shipping.delete")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warehouse */}
          <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
            <h2 className="flex items-center gap-2 font-bold text-xl text-white mb-2">
              <MapPin size={22} className="text-amber-400" /> Địa chỉ kho hàng mặc định
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Kho hàng là nơi shipper sẽ đến để lấy hàng. Bắt buộc phải có để hoàn tất thiết lập vận chuyển.
            </p>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Tỉnh/Thành phố *</label>
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
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Phường/Xã *</label>
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
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Địa chỉ cụ thể *</label>
                <input
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="123 Lê Lợi"
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Số điện thoại (tùy chọn)</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09xxxxxxxx"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSaveWarehouse}
                disabled={savingWarehouse || !addressLine || !provinceCode || !wardCode}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 w-full md:w-auto"
              >
                {savingWarehouse ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...</>
                ) : (
                  <><CheckCircle2 className="w-5 h-5" /> {isOnboarding ? "Lưu & Hoàn tất Bước 7" : "Lưu Địa chỉ Kho"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0b0820] border border-white/10 rounded-[2rem] p-8 w-full max-w-lg space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingId ? t("shipping.editTitle") : t("shipping.createTitle")}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">{t("shipping.nameLabel")}</label>
                <input
                  type="text"
                  placeholder={t("shipping.namePlaceholder")}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">{t("shipping.descLabel")}</label>
                <input
                  type="text"
                  placeholder={t("shipping.descPlaceholder")}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">{t("shipping.feeFieldLabel")}</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="30000"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={form.baseFee}
                    onChange={(e) => setForm({ ...form, baseFee: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">{t("shipping.freeThresholdLabel")}</label>
                  <input
                    type="number"
                    min={0}
                    placeholder={t("shipping.freeThresholdPlaceholder")}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={form.freeThreshold}
                    onChange={(e) => setForm({ ...form, freeThreshold: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">{t("shipping.etaLabel")}</label>
                <input
                  type="text"
                  placeholder={t("shipping.etaPlaceholder")}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={form.estimatedDays}
                  onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-5 h-5 rounded accent-indigo-500"
                />
                <span className="text-sm text-slate-300">{t("shipping.allowCustomer")}</span>
              </label>
            </div>

            <button
              onClick={handleSaveMethod}
              disabled={saving}
              className="w-full px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {t("shipping.saving")}</>
              ) : (
                <><Save className="w-5 h-5" /> {editingId ? t("shipping.update") : t("shipping.createMethod")}</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
