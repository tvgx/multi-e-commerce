"use client";

import React, { useState, useEffect } from "react";
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
import { usePriceFormatter } from '@ecommerce/ui-registry/src/lib/use-price';
import { useTranslations } from '@ecommerce/i18n/src/react';
import { NumberInput } from '@ecommerce/ui-registry/src/components/blocks/NumberInput';
import { useWallets, WalletRow, WalletTxRow } from '@/hooks/useWallets';

export default function WalletsPage() {
  const formatPrice = usePriceFormatter();
  const params = useParams();
  const shopId = params.shopId as string;
  const tr = useTranslations("admin");

  const {
    loading,
    wallets,
    topups,
    walletPaymentActive,
    summary,
    resolving,
    fetchAll,
    toggleWalletPayment,
    resolveTopup,
    adjustBalance,
    loadTransactions,
  } = useWallets(shopId);

  // ── Presentational state only ──
  const [search, setSearch] = useState("");

  // Adjust modal
  const [adjustTarget, setAdjustTarget] = useState<WalletRow | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDirection, setAdjustDirection] = useState<"credit" | "debit">("credit");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // Transactions drawer
  const [txWallet, setTxWallet] = useState<WalletRow | null>(null);
  const [txs, setTxs] = useState<WalletTxRow[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openAdjust = (w: WalletRow) => {
    setAdjustTarget(w);
    setAdjustAmount("");
    setAdjustDirection("credit");
    setAdjustNote("");
  };

  const handleAdjust = async () => {
    if (!adjustTarget) return;
    const magnitude = Number(adjustAmount);
    if (!adjustAmount || magnitude <= 0) {
      // hook surfaces the toast for empty/zero too, but guard the UI early
      setAdjustAmount("");
      return;
    }
    setAdjusting(true);
    const amount = adjustDirection === "credit" ? magnitude : -magnitude;
    const ok = await adjustBalance(adjustTarget.customerId, amount, adjustNote, search);
    setAdjusting(false);
    if (ok) setAdjustTarget(null);
  };

  const openTransactions = async (w: WalletRow) => {
    setTxWallet(w);
    setTxLoading(true);
    try {
      setTxs(await loadTransactions(w.id));
    } catch {
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
            <Wallet className="w-9 h-9 text-indigo-400" /> {tr("wallets.title")}
          </h1>
          <p className="text-slate-400 text-lg">
            {tr("wallets.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAll(search)}
            className="p-3 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
            title={tr("wallets.reload")}
          >
            <RefreshCw size={18} />
          </button>
          <label className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 cursor-pointer">
            <span className="text-sm font-medium text-slate-300">{tr("wallets.walletPayment")}</span>
            <button
              onClick={toggleWalletPayment}
              disabled={walletPaymentActive === null}
              className={`relative w-12 h-6 rounded-full transition-colors ${walletPaymentActive ? "bg-emerald-500" : "bg-slate-600"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${walletPaymentActive ? "left-6" : "left-0.5"}`} />
            </button>
          </label>
        </div>
      </div>

      {/* Summary metrics */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <div className="text-slate-400 text-xs uppercase tracking-wider">{tr("wallets.summaryWallets")}</div>
            <div className="text-2xl font-bold text-white mt-1">{summary.walletCount}</div>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <div className="text-slate-400 text-xs uppercase tracking-wider">{tr("wallets.summaryBalance")}</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{formatPrice(summary.totalBalance)}</div>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <div className="text-slate-400 text-xs uppercase tracking-wider">{tr("wallets.summaryPendingCount")}</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{summary.pendingTopupCount}</div>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <div className="text-slate-400 text-xs uppercase tracking-wider">{tr("wallets.summaryPendingAmount")}</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{formatPrice(summary.pendingTopupAmount)}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          {/* Pending topups */}
          <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl space-y-4">
            <h2 className="text-xl font-bold text-white">
              {tr("wallets.pendingTopups")}
              {topups.length > 0 && (
                <span className="ml-3 text-sm font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400">{topups.length}</span>
              )}
            </h2>
            {topups.length === 0 ? (
              <p className="text-slate-400 text-sm">{tr("wallets.noPendingTopups")}</p>
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
                        {tr("wallets.requestedAt")} {new Date(t.createdAt).toLocaleString("vi-VN")} · {tr("wallets.expiresAt")} {new Date(t.expiresAt).toLocaleString("vi-VN")}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-emerald-400">+{formatPrice(t.amount)}</span>
                      <button
                        onClick={() => resolveTopup(t.id, "confirm", search)}
                        disabled={resolving === t.id}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {resolving === t.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {tr("wallets.approve")}
                      </button>
                      <button
                        onClick={() => resolveTopup(t.id, "reject", search)}
                        disabled={resolving === t.id}
                        className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <X size={14} /> {tr("wallets.reject")}
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
              <h2 className="text-xl font-bold text-white">{tr("wallets.walletList")}</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder={tr("wallets.searchPlaceholder")}
                  className="bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none w-72"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchAll(search)}
                />
              </div>
            </div>

            {wallets.length === 0 ? (
              <p className="text-slate-400 text-sm">{tr("wallets.noWallets")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 uppercase text-xs tracking-wider border-b border-white/10">
                      <th className="pb-3 pr-4">{tr("wallets.colCustomer")}</th>
                      <th className="pb-3 pr-4">{tr("wallets.colBalance")}</th>
                      <th className="pb-3 pr-4">{tr("wallets.colUpdated")}</th>
                      <th className="pb-3 text-right">{tr("wallets.colActions")}</th>
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
                          <span className="text-lg font-bold text-emerald-400">{formatPrice(w.balance)}</span>
                        </td>
                        <td className="py-4 pr-4 text-slate-400">{new Date(w.updatedAt).toLocaleString("vi-VN")}</td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openTransactions(w)}
                              className="px-3 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-colors flex items-center gap-1.5"
                            >
                              <History size={14} /> {tr("wallets.history")}
                            </button>
                            <button
                              onClick={() => openAdjust(w)}
                              className="px-3 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors flex items-center gap-1.5"
                            >
                              <PlusCircle size={14} /> {tr("wallets.adjust")}
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
              <h2 className="text-xl font-bold text-white">{tr("wallets.adjustBalance")}</h2>
              <button onClick={() => setAdjustTarget(null)} className="text-slate-400 hover:text-white">
                <X size={22} />
              </button>
            </div>
            <div className="text-sm text-slate-400">
              {adjustTarget.customer?.name || adjustTarget.customer?.email} · {tr("wallets.currentBalance")}:{" "}
              <strong className="text-emerald-400">{formatPrice(adjustTarget.balance)}</strong>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAdjustDirection("credit")}
                className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${adjustDirection === "credit" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" : "bg-white/5 text-slate-400 border border-transparent"}`}
              >
                <PlusCircle size={16} /> {tr("wallets.addMoney")}
              </button>
              <button
                onClick={() => setAdjustDirection("debit")}
                className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${adjustDirection === "debit" ? "bg-rose-500/20 text-rose-400 border border-rose-500/50" : "bg-white/5 text-slate-400 border border-transparent"}`}
              >
                <MinusCircle size={16} /> {tr("wallets.subtractMoney")}
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">{tr("wallets.amountLabel")}</label>
              <NumberInput
                min={0}
                suffix="đ"
                placeholder={tr("wallets.amountPlaceholder")}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                value={Number(adjustAmount) || null}
                onValueChange={(v) => setAdjustAmount(v != null ? String(v) : "")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">{tr("wallets.noteLabel")}</label>
              <input
                type="text"
                placeholder={tr("wallets.notePlaceholder")}
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
              {adjusting ? <><Loader2 className="w-5 h-5 animate-spin" /> {tr("wallets.processing")}</> : tr("wallets.confirmAdjust")}
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
                {tr("wallets.txHistory")} — {txWallet.customer?.name || txWallet.customer?.email}
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
              <p className="text-slate-400 text-sm">{tr("wallets.noTransactions")}</p>
            ) : (
              <div className="space-y-2">
                {txs.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between bg-black/30 border border-white/5 rounded-xl p-4">
                    <div>
                      <div className="text-white font-medium">
                        {tr(`txTypes.${tx.type}`, { defaultValue: tx.type })}
                        <span className="text-xs text-slate-500 ml-2">{tr("wallets.by")} {tx.createdBy}</span>
                      </div>
                      {tx.note && <div className="text-sm text-slate-400">{tx.note}</div>}
                      <div className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleString("vi-VN")}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${tx.amount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {tx.amount >= 0 ? "+" : ""}{formatPrice(tx.amount)}
                      </div>
                      <div className="text-xs text-slate-500">{tr("wallets.balanceLabel")}: {formatPrice(tx.balanceAfter)}</div>
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
