'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useTranslations } from '@ecommerce/i18n/src/react';

interface OrderActionsProps {
  shopSlug: string;
  order: {
    id: string;
    state: string;
    paymentState?: string;
    shipments?: { state: string }[];
  };
}

/**
 * Buyer-facing order actions (cancel / confirm-received / reorder / pay again).
 * Calls the storefront BFF so the customer's Bearer token is attached
 * server-side. Which buttons show depends on the order state; the backend is the
 * source of truth and rejects illegal transitions, surfaced here as an alert.
 */
export function OrderActions({ shopSlug, order }: OrderActionsProps) {
  const t = useTranslations('order');
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const terminal = order.state === 'complete' || order.state === 'canceled';
  const hasShipped = (order.shipments ?? []).some(
    (s) => s.state === 'shipped' || s.state === 'delivered',
  );
  const unpaid = order.paymentState === 'balance_due';

  const call = async (action: string, path: string, opts?: { confirm?: string; redirectField?: string }) => {
    if (opts?.confirm && !window.confirm(opts.confirm)) return;
    setBusy(action);
    try {
      const res = await fetch(`/${shopSlug}/api/store/orders/${order.id}/${path}`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(data?.message || t('actions.failed', { defaultValue: 'Thao tác thất bại' }));
        return;
      }
      // resend-payment returns a fresh confirm URL — send the buyer straight to it.
      const redirectUrl = opts?.redirectField ? data?.data?.[opts.redirectField] ?? data?.[opts.redirectField] : null;
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }
      router.refresh();
    } catch {
      window.alert(t('actions.failed', { defaultValue: 'Thao tác thất bại' }));
    } finally {
      setBusy(null);
    }
  };

  const btn =
    'px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 flex items-center gap-2';

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-3">
      {unpaid && !terminal && (
        <button
          type="button"
          disabled={!!busy}
          onClick={() => call('pay', 'resend-payment', { redirectField: 'confirmUrl' })}
          className={`${btn} bg-brand text-white hover:bg-brand/90`}
        >
          {busy === 'pay' && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('actions.payAgain', { defaultValue: 'Thanh toán lại' })}
        </button>
      )}

      {hasShipped && !terminal && (
        <button
          type="button"
          disabled={!!busy}
          onClick={() =>
            call('received', 'received', {
              confirm: t('actions.confirmReceivedPrompt', { defaultValue: 'Xác nhận bạn đã nhận được hàng?' }),
            })
          }
          className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}
        >
          {busy === 'received' && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('actions.confirmReceived', { defaultValue: 'Đã nhận hàng' })}
        </button>
      )}

      <button
        type="button"
        disabled={!!busy}
        onClick={() => call('reorder', 'reorder')}
        className={`${btn} border border-slate-200 text-slate-700 hover:bg-slate-50`}
      >
        {busy === 'reorder' && <Loader2 className="w-4 h-4 animate-spin" />}
        {t('actions.reorder', { defaultValue: 'Mua lại' })}
      </button>

      {!terminal && !hasShipped && (
        <button
          type="button"
          disabled={!!busy}
          onClick={() =>
            call('cancel', 'cancel', {
              confirm: t('actions.cancelPrompt', { defaultValue: 'Huỷ đơn hàng này?' }),
            })
          }
          className={`${btn} text-red-600 hover:bg-red-50`}
        >
          {busy === 'cancel' && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('actions.cancel', { defaultValue: 'Huỷ đơn' })}
        </button>
      )}
    </div>
  );
}
