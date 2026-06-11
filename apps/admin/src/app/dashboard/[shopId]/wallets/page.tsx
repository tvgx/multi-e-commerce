"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Wallet,
  Loader2,
  Search,
  Check,
  X,
  PlusCircle,
  MinusCircle,
  History,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface CustomerLite {
  id: string;
  name?: string | null;
  email?: string | null;
}

interface WalletRow {
  id: string;
  customerId: string;
  balance: number;
  active: boolean;
  updatedAt: string;
  customer?: CustomerLite;
}

interface TopupRow {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  expiresAt: string;
  customer?: CustomerLite | null;
}

interface TxRow {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note?: string | null;
  createdBy: string;
  createdAt: string;
}

const TX_TYPE_LABELS: Record<string, string> = {
  deposit: "Nạp tiền",
  payment: "Thanh toán",
  refund: "Hoàn tiền",
  adjustment: "Điều chỉnh",
};

export default function WalletsPage() {
  const params = useParams();
  const shopId = params.shopId as string;

  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [topups, setTopups] = useState<TopupRow[]>([]);
  const [walletPaymentActive, setWalletPaymentActive] = useState<boolean | null>(null);
  const [search, setSearch] = useState("");
  const [resolving, setResolving] = useState<string | null>(null);

  // Adjust modal
  const [adjustTarget, setAdjustTarget] = useState<WalletRow | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDirection, setAdjustDirection] = useState<"credit" | "debit">("credit");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // Transactions drawer
  const [txWallet, setTxWallet] = useState<WalletRow | null>(null);
  const [txs, setTxs] = useState<TxRow[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  const fetchAll = useCallback(async (searchTerm = "") => {
    setLoading(true);
    try {
      const [walletsRes, topupsRes, pmRes] = await Promise.all([
        apiClient.get<any>(`/api/wallet/admin/wallets?search=${encodeURIComponent(searchTerm)}`, { shopId }),
        apiClient.get<any>(`/api/wallet/admin/topups?status=pending`, { shopId }),
        apiClient.get<any>(`/api/wallet/admin/payment-method`, { shopId }),
      ]);
      // API trả { data: [...] } trực tiếp (không có wrapper BaseResponse toàn cục)
      const walletItems: any = walletsRes.data;
      const topupItems: any = topupsRes.data;
      const pm: any = pmRes.data;
      setWallets(Array.isArray(walletItems) ? walletItems : walletItems?.data ?? []);
      setTopups(Array.isArray(topupItems) ? topupItems : topupItems?.data ?? []);
      setWalletPaymentActive(pm ? !!pm.active : false);
    } catch (err) {
      console.error("Failed to fetch wallets", err);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleToggleWalletPayment = async () => {
    const next = !walletPaymentActive;
    try {
      await apiClient.post(`/api/wallet/admin/payment-method`, { active: next }, { shopId });
      setWalletPaymentActive(next);
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleResolveTopup = async (id: string, action: "confirm" | "reject") => {
    if (action === "confirm" && !confirm("Xác nhận đã nhận được tiền chuyển khoản của khách?")) return;
    setResolving(id);
    try {
      await apiClient.post(`/api/wallet/admin/topups/${id}/resolve`, { action }, { shopId });
      await fetchAll(search);
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setResolving(null);
    }
  };

  const openAdjust = (w: WalletRow) => {
    setAdjustTarget(w);
    setAdjustAmount("");
    setAdjustDirection("credit");
    setAdjustNote("");
  };

  const handleAdjust = async () => {
    if (!adjustTarget || !adjustAmount || Number(adjustAmount) <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    setAdjusting(true);
    try {
      const amount = adjustDirection === "credit" ? Number(adjustAmount) : -Number(adjustAmount);
      await apiClient.post(`/api/wallet/admin/adjust`, {
        customerId: adjustTarget.customerId,
        amount,
        note: adjustNote.trim() || undefined,
      }, { shopId });
      setAdjustTarget(null);
      await fetchAll(search);
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setAdjusting(false);
    }
  };

  const openTransactions = async (w: WalletRow) => {
    setTxWallet(w);
    setTxLoading(true);
    try {
      const res = await apiClient.get<any>(`/api/wallet/admin/wallets/${w.id}/transactions?limit=50`, { shopId });
      const items: any = res.data;
      setTxs(Array.isArray(items) ? items : items?.data ?? []);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
      setTxs([]);
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Wallet className="w-9 h-9 text-indigo-400" /> Ví khách hàng
          </h1>
          <p className="text-slate-400 text-lg">
            Quản lý số dư ví, duyệt yêu cầu nạp tiền và bật thanh toán bằng ví.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAll(search)}
            className="p-3 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
            title="Tải lại"
          >
            <RefreshCw size={18} />
          </button>
          <label className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 cursor-pointer">
            <span className="text-sm font-medium text-slate-300">Thanh toán bằng ví</span>
            <button
              onClick={handleToggleWalletPayment}
              disabled={walletPaymentActive === null}
              className={`relative w-12 h-6 rounded-full transition-colors ${walletPaymentActive ? "bg-emerald-500" : "bg-slate-600"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${walletPaymentActive ? "left-6" : "left-0.5"}`} />
            </button>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          {/* Pending topups */}
          <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl space-y-4">
            <h2 className="text-xl font-bold text-white">
              Yêu cầu nạp tiền đang chờ
              {topups.length > 0 && (
                <span className="ml-3 text-sm font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400">{topups.length}</span>
              )}
            </h2>
            {topups.length === 0 ? (
              <p className="text-slate-400 text-sm">Không có yêu cầu nạp tiền nào đang chờ duyệt.</p>
            ) : (
              <div className="space-y-3">
                {topups.map((t) => (
                  <div key={t.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-black/30 border border-white/5 rounded-xl p-4">
                    <div>
                      <div className="text-white font-medium">
                        {t.customer?.name || t.customer?.email || t.id.substring(0, 8)}
                        <span className="text-slate-500 text-sm ml-2">{t.customer?.email}</span>
                      </div>
                      <div className="text-sm text-slate-400">
                        Yêu cầu lúc {new Date(t.createdAt).toLocaleString("vi-VN")} · Hết hạn {new Date(t.expiresAt).toLocaleString("vi-VN")}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-emerald-400">+{t.amount.toLocaleString("vi-VN")}đ</span>
                      <button
                        onClick={() => handleResolveTopup(t.id, "confirm")}
                        disabled={resolving === t.id}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {resolving === t.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Duyệt
                      </button>
                      <button
                        onClick={() => handleResolveTopup(t.id, "reject")}
                        disabled={resolving === t.id}
                        className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <X size={14} /> Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wallets table */}
          <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-white">Danh sách ví</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Tìm theo tên / email khách..."
                  className="bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none w-72"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchAll(search)}
                />
              </div>
            </div>

            {wallets.length === 0 ? (
              <p className="text-slate-400 text-sm">Chưa có ví nào. Ví được tạo tự động khi khách dùng tính năng ví lần đầu.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 uppercase text-xs tracking-wider border-b border-white/10">
                      <th className="pb-3 pr-4">Khách hàng</th>
                      <th className="pb-3 pr-4">Số dư</th>
                      <th className="pb-3 pr-4">Cập nhật</th>
                      <th className="pb-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallets.map((w) => (
                      <tr key={w.id} className="border-b border-white/5 last:border-0">
                        <td className="py-4 pr-4">
                          <div className="text-white font-medium">{w.customer?.name || "—"}</div>
                          <div className="text-slate-500">{w.customer?.email}</div>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="text-lg font-bold text-emerald-400">{w.balance.toLocaleString("vi-VN")}đ</span>
                        </td>
                        <td className="py-4 pr-4 text-slate-400">{new Date(w.updatedAt).toLocaleString("vi-VN")}</td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openTransactions(w)}
                              className="px-3 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-colors flex items-center gap-1.5"
                            >
                              <History size={14} /> Lịch sử
                            </button>
                            <button
                              onClick={() => openAdjust(w)}
                              className="px-3 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors flex items-center gap-1.5"
                            >
                              <PlusCircle size={14} /> Điều chỉnh
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Adjust modal */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0b0820] border border-white/10 rounded-[2rem] p-8 w-full max-w-md space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Điều chỉnh số dư</h2>
              <button onClick={() => setAdjustTarget(null)} className="text-slate-400 hover:text-white">
                <X size={22} />
              </button>
            </div>
            <div className="text-sm text-slate-400">
              {adjustTarget.customer?.name || adjustTarget.customer?.email} · Số dư hiện tại:{" "}
              <strong className="text-emerald-400">{adjustTarget.balance.toLocaleString("vi-VN")}đ</strong>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAdjustDirection("credit")}
                className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${adjustDirection === "credit" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" : "bg-white/5 text-slate-400 border border-transparent"}`}
              >
                <PlusCircle size={16} /> Cộng tiền
              </button>
              <button
                onClick={() => setAdjustDirection("debit")}
                className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${adjustDirection === "debit" ? "bg-rose-500/20 text-rose-400 border border-rose-500/50" : "bg-white/5 text-slate-400 border border-transparent"}`}
              >
                <MinusCircle size={16} /> Trừ tiền
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Số tiền (đ)</label>
              <input
                type="number"
                min={0}
                placeholder="VD: 50000"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Ghi chú</label>
              <input
                type="text"
                placeholder="VD: Đền bù đơn giao thiếu"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
              />
            </div>

            <button
              onClick={handleAdjust}
              disabled={adjusting}
              className="w-full px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              {adjusting ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</> : "Xác nhận điều chỉnh"}
            </button>
          </div>
        </div>
      )}

      {/* Transactions drawer */}
      {txWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0b0820] border border-white/10 rounded-[2rem] p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                Lịch sử giao dịch — {txWallet.customer?.name || txWallet.customer?.email}
              </h2>
              <button onClick={() => setTxWallet(null)} className="text-slate-400 hover:text-white">
                <X size={22} />
              </button>
            </div>

            {txLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
              </div>
            ) : txs.length === 0 ? (
              <p className="text-slate-400 text-sm">Chưa có giao dịch nào.</p>
            ) : (
              <div className="space-y-2">
                {txs.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between bg-black/30 border border-white/5 rounded-xl p-4">
                    <div>
                      <div className="text-white font-medium">
                        {TX_TYPE_LABELS[tx.type] || tx.type}
                        <span className="text-xs text-slate-500 ml-2">bởi {tx.createdBy}</span>
                      </div>
                      {tx.note && <div className="text-sm text-slate-400">{tx.note}</div>}
                      <div className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleString("vi-VN")}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${tx.amount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {tx.amount >= 0 ? "+" : ""}{tx.amount.toLocaleString("vi-VN")}đ
                      </div>
                      <div className="text-xs text-slate-500">Số dư: {tx.balanceAfter.toLocaleString("vi-VN")}đ</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
