'use client';

import { useEffect } from 'react';
import { useTranslations } from '@ecommerce/i18n/src/react';

/** Route-level error boundary for buyer pages: friendly message + retry. */
export default function BuyerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const te = useTranslations('errors');
  const tc = useTranslations('common');

  useEffect(() => {
    console.error('Storefront error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-24 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{te('general.unknownError')}</h1>
      <p className="text-slate-500 max-w-md mb-8">
        {te('general.loadFailed')}
      </p>
      <button
        onClick={reset}
        className="bg-brand text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand/90 transition-colors"
      >
        {tc('buttons.tryAgain')}
      </button>
    </div>
  );
}
