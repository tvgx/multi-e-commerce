"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  CreditCard, 
  ArrowLeft, 
  Save, 
  Building2, 
  User, 
  Hash, 
  MapPin,
  CheckCircle2,
  Loader2,
  QrCode,
  Wallet
} from "lucide-react";
import Link from "next/link";
import { useOnboardingAutoNav } from "@/hooks/useOnboardingAutoNav";
import { usePaymentSetup, BankAccount } from "@/hooks/usePaymentSetup";
import { useTranslations } from "@ecommerce/i18n/src/react";

const EMPTY_BANK: BankAccount = { bankName: "", accountNumber: "", accountHolder: "", branch: "" };

export default function PaymentSetupPage() {
  const params = useParams();
  const shopId = params.shopId as string;
  const t = useTranslations("admin");

  const { completeAndNavigate } = useOnboardingAutoNav({
    shopId,
    currentStep: 5,
    nextRoute: `/dashboard/${shopId}/settings/shipping`,
  });

  const { loading, saving, initialBankAccount, save } = usePaymentSetup(shopId);

  // Form state (presentational) — seeded from the server values once they load.
  const [bankAccount, setBankAccount] = useState<BankAccount>(EMPTY_BANK);
  useEffect(() => {
    if (initialBankAccount) setBankAccount(initialBankAccount);
  }, [initialBankAccount]);

  const handleSave = async () => {
    const ok = await save(bankAccount);
    if (ok) await completeAndNavigate();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link 
        href={`/dashboard/${shopId}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        {t("payments.backToDashboard")}
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-500/20">
            {t("payments.stepBadge")}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">{t("payments.title")}</h1>
          <p className="text-slate-400 text-lg">{t("payments.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl shadow-2xl space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Building2 size={16} className="text-indigo-400" /> {t("payments.bankName")}
                </label>
                <input
                  type="text"
                  placeholder={t("payments.bankNamePlaceholder")}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={bankAccount.bankName}
                  onChange={(e) => setBankAccount({ ...bankAccount, bankName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Hash size={16} className="text-emerald-400" /> {t("payments.accountNumber")}
                </label>
                <input
                  type="text"
                  placeholder={t("payments.accountNumberPlaceholder")}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={bankAccount.accountNumber}
                  onChange={(e) => setBankAccount({ ...bankAccount, accountNumber: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <User size={16} className="text-amber-400" /> {t("payments.accountHolder")}
                </label>
                <input
                  type="text"
                  placeholder={t("payments.accountHolderPlaceholder")}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={bankAccount.accountHolder}
                  onChange={(e) => setBankAccount({ ...bankAccount, accountHolder: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <MapPin size={16} className="text-rose-400" /> {t("payments.branch")}
                </label>
                <input
                  type="text"
                  placeholder={t("payments.branchPlaceholder")}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={bankAccount.branch}
                  onChange={(e) => setBankAccount({ ...bankAccount, branch: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSave}
                disabled={saving || !bankAccount.bankName || !bankAccount.accountNumber || !bankAccount.accountHolder}
                className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> {t("payments.saving")}</>
                ) : (
                  <><Save className="w-5 h-5" /> {t("payments.saveContinue")}</>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 rounded-[2rem] p-6 space-y-4">
            <h2 className="font-bold text-white flex items-center gap-2">
              <QrCode size={18} className="text-indigo-400" /> {t("payments.howItWorks")}
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t("payments.howItWorksDesc")}
            </p>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm text-slate-300">
                <div className="mt-1"><CheckCircle2 size={14} className="text-emerald-500" /></div>
                <span><strong>QRPAY:</strong> {t("payments.qrpayDesc")}</span>
              </li>
              <li className="flex gap-3 text-sm text-slate-300">
                <div className="mt-1"><CheckCircle2 size={14} className="text-emerald-500" /></div>
                <span><strong>COD:</strong> {t("payments.codDesc")}</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6">
             <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-amber-500/20 text-amber-500 rounded-xl">
                   <Wallet size={20} />
                </div>
                <h2 className="font-bold text-white">{t("payments.securityNote")}</h2>
             </div>
             <p className="text-xs text-slate-500 leading-relaxed">
                {t("payments.securityDesc")}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
