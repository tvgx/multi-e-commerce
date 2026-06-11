"use client";

import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";

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

  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchMethods = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ data: ShippingMethod[] }>(`/api/shipping/methods/all`, { shopId });
      setMethods((res.data as any).data ?? (res.data as any));
    } catch (err) {
      console.error("Failed to fetch shipping methods", err);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

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

  const handleSave = async () => {
    if (!form.name.trim() || form.baseFee === "") {
      alert("Vui lòng nhập tên và phí vận chuyển");
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
      await fetchMethods();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: ShippingMethod) => {
    if (!confirm(`Xoá phương thức "${m.name}"? Nếu đã có đơn hàng sử dụng, phương thức sẽ chỉ bị tắt.`)) return;
    try {
      await apiClient.delete(`/api/shipping/methods/${m.id}`, { shopId });
      await fetchMethods();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const toggleActive = async (m: ShippingMethod) => {
    try {
      await apiClient.patch(`/api/shipping/methods/${m.id}`, { active: !m.active }, { shopId });
      setMethods(prev => prev.map(x => x.id === m.id ? { ...x, active: !m.active } : x));
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link
        href={`/dashboard/${shopId}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Quay lại Dashboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Truck className="w-9 h-9 text-indigo-400" /> Vận chuyển
          </h1>
          <p className="text-slate-400 text-lg">
            Cấu hình các phương thức giao hàng mà khách có thể chọn khi thanh toán.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Thêm phương thức
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : methods.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-12 text-center text-slate-400">
          Chưa có phương thức vận chuyển nào. Thêm phương thức đầu tiên để khách có thể chọn giao hàng khi checkout.
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
                    {m.active ? "Đang bật" : "Đã tắt"}
                  </span>
                </div>
                {m.description && <p className="text-sm text-slate-400">{m.description}</p>}
                <div className="text-sm text-slate-300 flex flex-wrap gap-4 pt-1">
                  <span>Phí: <strong className="text-emerald-400">{m.baseFee.toLocaleString("vi-VN")}đ</strong></span>
                  {m.freeThreshold != null && (
                    <span>Freeship từ: <strong className="text-amber-400">{m.freeThreshold.toLocaleString("vi-VN")}đ</strong></span>
                  )}
                  {m.estimatedDays && <span>Thời gian: <strong>{m.estimatedDays}</strong></span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(m)}
                  className={`px-3 py-2 rounded-xl text-sm font-bold transition-colors ${m.active ? "bg-slate-500/10 text-slate-300 hover:bg-slate-500/20" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`}
                >
                  {m.active ? "Tắt" : "Bật"}
                </button>
                <button
                  onClick={() => openEdit(m)}
                  className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                  title="Sửa"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(m)}
                  className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Xoá"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0b0820] border border-white/10 rounded-[2rem] p-8 w-full max-w-lg space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingId ? "Sửa phương thức vận chuyển" : "Thêm phương thức vận chuyển"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Tên phương thức *</label>
                <input
                  type="text"
                  placeholder="VD: Giao hàng tiêu chuẩn"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Mô tả</label>
                <input
                  type="text"
                  placeholder="VD: Giao trong giờ hành chính"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Phí vận chuyển (đ) *</label>
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
                  <label className="text-sm font-medium text-slate-300">Freeship cho đơn từ (đ)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Bỏ trống nếu không áp dụng"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={form.freeThreshold}
                    onChange={(e) => setForm({ ...form, freeThreshold: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Thời gian dự kiến</label>
                <input
                  type="text"
                  placeholder="VD: 2-4 ngày"
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
                <span className="text-sm text-slate-300">Cho phép khách chọn phương thức này</span>
              </label>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...</>
              ) : (
                <><Save className="w-5 h-5" /> {editingId ? "Cập nhật" : "Tạo phương thức"}</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
