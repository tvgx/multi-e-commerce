"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
  QrCode,
  X,
  Store,
  Package,
} from "lucide-react";
import { formatPrice } from "@ecommerce/ui-registry/src/lib/format";
import { toast, confirmDialog } from "@ecommerce/ui-registry/src/store/toast-store";
import { useTranslations } from "@ecommerce/i18n/src/react";
import {
  usePlatformBilling,
  Plan,
  SubscribeResult,
} from "@/hooks/usePlatformBilling";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  TRIALING: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  PAST_DUE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  CANCELED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  EXPIRED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  PAID: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  VOID: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        STATUS_BADGE[value] ?? STATUS_BADGE.CANCELED
      }`}
    >
      {value}
    </span>
  );
}

export default function BillingPage() {
  const t = useTranslations("admin");
  const { plans, subscription, invoices, loading, error, refresh, subscribe } =
    usePlatformBilling();
  const [subscribing, setSubscribing] = useState<string | null>(null);
  // Kết quả subscribe gói trả phí — hiện modal QR chờ xác nhận.
  const [pending, setPending] = useState<SubscribeResult | null>(null);

  const currentPlanId = subscription?.plan?.id;

  const handleSubscribe = async (plan: Plan) => {
    const isPaid = plan.priceMonthly > 0;
    const ok = await confirmDialog({
      title: t("billing.subscribeTitle", { plan: plan.name }),
      message: isPaid
        ? t("billing.subscribePaidMsg", { plan: plan.name, price: formatPrice(plan.priceMonthly) })
        : t("billing.subscribeFreeMsg", { plan: plan.name }),
      confirmText: t("billing.subscribeConfirm"),
    });
    if (!ok) return;

    setSubscribing(plan.key);
    try {
      const res = await subscribe(plan.key);
      if (res.qrCodeUrl) {
        setPending(res); // paid plan → show QR, wait for confirm
      } else {
        toast.success(t("billing.switchedTo", { plan: plan.name }));
        refresh();
      }
    } catch (err: any) {
      toast.error(err.message || t("billing.subscribeFailed"));
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 flex items-center gap-3 text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button onClick={refresh} className="ml-auto flex items-center gap-2 text-sm hover:text-rose-300">
            <RefreshCw className="w-4 h-4" /> {t("billing.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-indigo-400" />
            {t("billing.title")}
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            {t("billing.subtitle")}
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> {t("billing.reload")}
        </button>
      </div>

      {/* Gói hiện tại */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          {t("billing.currentPlan")}
        </h2>
        {subscription ? (
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-2xl font-bold text-white flex items-center gap-3">
                {subscription.plan.name}
                <StatusBadge value={subscription.status} />
                {subscription.cancelAtPeriodEnd && (
                  <span className="text-xs text-amber-400 font-medium">{t("billing.cancelAtPeriodEnd")}</span>
                )}
              </div>
              <div className="text-zinc-400 text-sm mt-1">
                {subscription.plan.priceMonthly > 0
                  ? `${formatPrice(subscription.plan.priceMonthly)}${t("billing.perMonth")}`
                  : t("billing.free")}
                {t("billing.renews")}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString("vi-VN")}
              </div>
            </div>
            <div className="flex gap-6 ml-auto text-sm">
              <div className="flex items-center gap-2 text-zinc-300">
                <Store className="w-4 h-4 text-indigo-400" />
                {t("billing.maxShops", { count: subscription.plan.maxShops })}
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Package className="w-4 h-4 text-indigo-400" />
                {t("billing.productsPerShop", { count: subscription.plan.maxProductsPerShop })}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">
            {t("billing.noPlan1")} <code className="text-zinc-300">npm run seed:plans</code> {t("billing.noPlan2")}
          </p>
        )}
      </div>

      {/* Danh sách gói */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          {t("billing.plans")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            return (
              <div
                key={plan.id}
                className={`rounded-xl border p-6 flex flex-col ${
                  isCurrent
                    ? "border-indigo-500/50 bg-indigo-500/5"
                    : "border-zinc-800 bg-zinc-900/50"
                }`}
              >
                <div className="text-lg font-bold text-white">{plan.name}</div>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-white">
                    {plan.priceMonthly > 0 ? formatPrice(plan.priceMonthly) : "0đ"}
                  </span>
                  <span className="text-zinc-500 text-sm"> {t("billing.perMonth")}</span>
                </div>
                {plan.description && (
                  <p className="text-zinc-400 text-sm mt-3">{plan.description}</p>
                )}
                <ul className="mt-4 space-y-2 text-sm text-zinc-300 flex-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" /> {t("billing.featShops", { count: plan.maxShops })}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" /> {t("billing.featProducts", { count: plan.maxProductsPerShop })}
                  </li>
                </ul>
                <button
                  disabled={isCurrent || subscribing !== null}
                  onClick={() => handleSubscribe(plan)}
                  className={`mt-6 w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    isCurrent
                      ? "bg-zinc-800 text-zinc-500 cursor-default"
                      : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-[0_0_16px_rgba(99,102,241,0.35)] disabled:opacity-60"
                  }`}
                >
                  {subscribing === plan.key && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isCurrent ? t("billing.currentPlanBtn") : plan.priceMonthly > 0 ? t("billing.upgrade") : t("billing.downgradeFree")}
                </button>
              </div>
            );
          })}
          {plans.length === 0 && (
            <div className="col-span-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-500 text-sm">
              {t("billing.noPlansSeed1")} <code className="text-zinc-300">npm run seed:plans</code>.
            </div>
          )}
        </div>
      </div>

      {/* Lịch sử hoá đơn */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider px-6 pt-6 pb-4">
          {t("billing.invoiceHistory")}
        </h2>
        {invoices.length === 0 ? (
          <p className="text-zinc-500 text-sm px-6 pb-6">{t("billing.noInvoices")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-800">
                  <th className="px-6 py-3 font-medium">{t("billing.colNumber")}</th>
                  <th className="px-6 py-3 font-medium">{t("billing.colDate")}</th>
                  <th className="px-6 py-3 font-medium">{t("billing.colDesc")}</th>
                  <th className="px-6 py-3 font-medium text-right">{t("billing.colAmount")}</th>
                  <th className="px-6 py-3 font-medium text-right">{t("billing.colStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-zinc-800/60 last:border-0">
                    <td className="px-6 py-3 font-mono text-zinc-300">{inv.number}</td>
                    <td className="px-6 py-3 text-zinc-400">
                      {new Date(inv.issuedAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-3 text-zinc-400">{inv.description ?? "—"}</td>
                    <td className="px-6 py-3 text-right text-zinc-200 font-medium">
                      {formatPrice(inv.amount)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <StatusBadge value={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal QR thanh toán */}
      {pending?.qrCodeUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8 relative">
            <button
              onClick={() => {
                setPending(null);
                refresh();
              }}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200"
              aria-label={t("billing.close")}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
              <QrCode className="w-5 h-5 text-indigo-400" /> {t("billing.qrTitle")}
            </h3>
            <p className="text-zinc-400 text-sm mb-6">
              {t("billing.qrBody1")} <span className="font-mono text-zinc-200">{pending.invoice?.number}</span> —{" "}
              <span className="font-bold text-white">{formatPrice(pending.invoice?.amount ?? 0)}</span>.
              {" "}{t("billing.qrBody2")}
            </p>
            <div className="flex justify-center mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pending.qrCodeUrl}
                alt="Billing payment QR"
                className="w-56 h-56 rounded-xl border border-zinc-800 bg-white p-2"
              />
            </div>
            {pending.confirmUrl && (
              <a
                href={pending.confirmUrl}
                target="_blank"
                rel="noreferrer"
                className="block text-center text-xs text-indigo-400 hover:text-indigo-300 break-all mb-4"
              >
                {pending.confirmUrl}
              </a>
            )}
            <button
              onClick={() => {
                setPending(null);
                refresh();
              }}
              className="w-full py-3 rounded-xl bg-zinc-800 text-zinc-200 text-sm font-semibold hover:bg-zinc-700 transition-colors"
            >
              {t("billing.confirmedRefresh")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
