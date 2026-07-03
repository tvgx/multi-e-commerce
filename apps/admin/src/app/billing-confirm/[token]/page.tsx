'use client';

import { useState, useEffect, use } from 'react';
import { CheckCircle2, XCircle, Loader2, AlertCircle, QrCode } from 'lucide-react';
import { formatPrice } from '@ecommerce/ui-registry/src/lib/format';

/**
 * Trang xác nhận thanh toán subscription — đích của QR trên trang Billing.
 * Public (ngoài dashboard): token trong URL là credential, mirror trang
 * /payment/confirm/[token] của storefront. Quét bằng điện thoại → xem số tiền
 * → "Đã thanh toán" → Invoice PAID + Subscription ACTIVE.
 */
export default function BillingConfirmPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/billing/token-info/${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Token không hợp lệ hoặc đã hết hạn');
        setInfo(data.data);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [token, apiUrl]);

  const handleAction = async (action: 'confirm' | 'reject') => {
    setActionLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/billing/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Xác nhận thất bại');
      setStatus('success');
      setMessage(
        action === 'confirm'
          ? 'Thanh toán đã được xác nhận — gói của bạn đã kích hoạt.'
          : 'Đã từ chối thanh toán. Hoá đơn bị huỷ.',
      );
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#030014]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (status !== 'idle') {
    const ok = status === 'success';
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#030014] p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          {ok ? (
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          ) : (
            <XCircle className="w-16 h-16 text-rose-400 mx-auto mb-4" />
          )}
          <h1 className={`text-2xl font-bold mb-2 ${ok ? 'text-emerald-300' : 'text-rose-300'}`}>
            {ok ? 'Thành công!' : 'Lỗi'}
          </h1>
          <p className="text-slate-400">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#030014] p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <h1 className="text-2xl font-bold text-white text-center flex items-center justify-center gap-2 mb-1">
          <QrCode className="w-6 h-6 text-indigo-400" /> Xác nhận thanh toán
        </h1>
        <p className="text-slate-400 text-center text-sm mb-6">
          Gói <strong className="text-white">{info?.planName ?? '—'}</strong> · Hoá đơn{' '}
          <span className="font-mono">{info?.invoiceNumber}</span>
        </p>

        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6 text-center mb-6">
          <p className="text-sm text-indigo-300 font-medium mb-1">Số tiền cần thanh toán</p>
          <p className="text-4xl font-bold text-white">{formatPrice(info?.amount ?? 0)}</p>
        </div>

        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 p-4 rounded-xl mb-6 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          Chỉ bấm &quot;Đã thanh toán&quot; sau khi bạn đã chuyển khoản thành công.
        </div>

        <div className="flex gap-4">
          <button
            disabled={actionLoading}
            onClick={() => handleAction('reject')}
            className="w-full py-3 rounded-xl border border-white/10 text-rose-400 hover:bg-rose-500/10 text-sm font-semibold transition-colors disabled:opacity-60"
          >
            Từ chối
          </button>
          <button
            disabled={actionLoading}
            onClick={() => handleAction('confirm')}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold transition-all hover:shadow-[0_0_16px_rgba(99,102,241,0.35)] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Đã thanh toán
          </button>
        </div>
      </div>
    </div>
  );
}
