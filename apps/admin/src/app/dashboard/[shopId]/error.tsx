'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from '@ecommerce/i18n/src/react';

/** Route-level error boundary for shop dashboard pages. */
export default function ShopDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('admin');
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center text-center py-24">
      <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-rose-500" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">{t('shopError.title')}</h1>
      <p className="text-slate-400 max-w-md mb-8">
        {t('shopError.desc')}
      </p>
      <button
        onClick={reset}
        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
      >
        {t('shopError.retry')}
      </button>
    </div>
  );
}
