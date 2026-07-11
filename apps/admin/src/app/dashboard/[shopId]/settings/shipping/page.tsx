"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
import Link from "next/link";
import { usePriceFormatter } from '@ecommerce/ui-registry/src/lib/use-price';
import { toast } from '@ecommerce/ui-registry/src/store/toast-store';
import { useTranslations } from '@ecommerce/i18n/src/react';
import { NumberInput } from '@ecommerce/ui-registry/src/components/blocks/NumberInput';
import { useOnboardingAutoNav } from "@/hooks/useOnboardingAutoNav";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useGeo } from "@/hooks/useGeo";
import { useShippingSettings, ShippingMethod, MethodFormValues } from "@/hooks/useShippingSettings";

const EMPTY_FORM: MethodFormValues = {
  name: "",
  description: "",
  baseFee: "",
  freeThreshold: "",
  estimatedDays: "",
  active: true,
};

export default function ShippingSettingsPage() {
  const formatPrice = usePriceFormatter();
  const params = useParams();
  const shopId = params.shopId as string;
  const t = useTranslations("admin");

  const {
    methods,
    warehouse,
    loading,
    savingMethod: saving,
    savingWarehouse,
    saveMethod,
    deleteMethod: handleDelete,
    toggleMethod: toggleActive,
    saveWarehouse,
  } = useShippingSettings(shopId);

  // ── Method form (presentational) ──
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MethodFormValues>(EMPTY_FORM);

  // ── Onboarding ──
  const { status } = useOnboarding(shopId);
  const isOnboarding = status && status.steps.step6?.status !== "COMPLETED";

  const { completeAndNavigate } = useOnboardingAutoNav({
    shopId,
    currentStep: 6,
    // Shipping là bước cuối của onboarding (đã bỏ "Verify Domain") → quay về Dashboard.
    nextRoute: `/dashboard/${shopId}`,
    isLastStep: true,
  });

  // ── Warehouse form (presentational) — seeded from loaded warehouse ──
  const { provinces, wards, loadWards, loadingWards } = useGeo();
  const [provinceCode, setProvinceCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!warehouse) return;
    setAddressLine(warehouse.addressLine || "");
    setPhone(warehouse.phone || "");
    if (warehouse.provinceCode) {
      setProvinceCode(warehouse.provinceCode);
      loadWards(warehouse.provinceCode);
    }
    if (warehouse.wardCode) setWardCode(warehouse.wardCode);
  }, [warehouse, loadWards]);

  const onProvinceChange = (code: string) => {
    setProvinceCode(code);
    setWardCode("");
    loadWards(code);
  };

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
    const ok = await saveMethod(form, editingId);
    if (ok) setShowForm(false);
  };

  const handleSaveWarehouse = async () => {
    const ok = await saveWarehouse({ addressLine, provinceCode, wardCode, phone });
    if (!ok) return;
    if (isOnboarding) {
      await completeAndNavigate();
    } else {
      toast.success(t("shipping.warehouseSaved"));
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
              Step 6 of 7
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
              <h2 className="text-xl font-bold text-white">{t("shipping.methodsHeading")}</h2>
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
              <MapPin size={22} className="text-amber-400" /> {t("shipping.warehouseTitle")}
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              {t("shipping.warehouseDesc")}
            </p>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">{t("shipping.provinceLabel")}</label>
                <select
                  value={provinceCode}
                  onChange={(e) => onProvinceChange(e.target.value)}
                  className={inputCls}
                >
                  <option value="">{t("shipping.provincePlaceholder")}</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">{t("shipping.wardLabel")}</label>
                <select
                  value={wardCode}
                  onChange={(e) => setWardCode(e.target.value)}
                  disabled={!provinceCode || loadingWards}
                  className={`${inputCls} disabled:opacity-50`}
                >
                  <option value="">{loadingWards ? t("shipping.wardLoading") : t("shipping.wardPlaceholder")}</option>
                  {wards.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">{t("shipping.addressLabel")}</label>
                <input
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder={t("shipping.addressPlaceholder")}
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">{t("shipping.phoneLabel")}</label>
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
                  <><Loader2 className="w-5 h-5 animate-spin" /> {t("shipping.savingWarehouse")}</>
                ) : (
                  <><CheckCircle2 className="w-5 h-5" /> {isOnboarding ? t("shipping.saveAndContinue") : t("shipping.saveWarehouseBtn")}</>
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
                  <NumberInput
                    min={0}
                    suffix="đ"
                    placeholder="30.000"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={Number(form.baseFee) || null}
                    onValueChange={(v) => setForm({ ...form, baseFee: v != null ? String(v) : "" })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">{t("shipping.freeThresholdLabel")}</label>
                  <NumberInput
                    min={0}
                    suffix="đ"
                    placeholder={t("shipping.freeThresholdPlaceholder")}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={Number(form.freeThreshold) || null}
                    onValueChange={(v) => setForm({ ...form, freeThreshold: v != null ? String(v) : "" })}
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
