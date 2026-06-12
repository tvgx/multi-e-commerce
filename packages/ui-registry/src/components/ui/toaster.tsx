'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore, type ToastType } from '../../store/toast-store';

const ICONS: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const ACCENT: Record<ToastType, string> = {
  success: 'text-emerald-600',
  error: 'text-red-600',
  info: 'text-slate-600',
};

/**
 * Renders queued toasts (top-right) and the active confirm dialog.
 * Mount once per app in the root layout. Neutral light styling so it reads well
 * on both the light storefront and the dark admin.
 */
export function Toaster() {
  const { toasts, dismiss, confirmReq, resolveConfirm } = useToastStore();

  React.useEffect(() => {
    if (!confirmReq) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resolveConfirm(false);
      if (e.key === 'Enter') resolveConfirm(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmReq, resolveConfirm]);

  return (
    <>
      <div
        className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-[min(92vw,360px)]"
        role="region"
        aria-label="Thông báo"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              role={t.type === 'error' ? 'alert' : 'status'}
              className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 animate-in slide-in-from-right-4 fade-in duration-200"
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${ACCENT[t.type]}`} />
              <p className="flex-1 text-sm text-slate-700 leading-snug break-words">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Đóng"
                className="text-slate-400 hover:text-slate-700 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {confirmReq && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-slate-900/50"
          onClick={() => resolveConfirm(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={confirmReq.title || 'Xác nhận'}
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {confirmReq.title && (
              <h2 className="text-lg font-bold text-slate-900 mb-2">{confirmReq.title}</h2>
            )}
            <p className="text-sm text-slate-600 leading-relaxed">{confirmReq.message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => resolveConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {confirmReq.cancelText || 'Huỷ'}
              </button>
              <button
                autoFocus
                onClick={() => resolveConfirm(true)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                  confirmReq.danger
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {confirmReq.confirmText || 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
