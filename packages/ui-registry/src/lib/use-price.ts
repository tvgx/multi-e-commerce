'use client';

import { useCallback } from 'react';
import { useLocale } from '@ecommerce/i18n/src/react';
import { formatPrice, FormatPriceOptions } from './format';

/**
 * Hook cho client component: format giá theo ngôn ngữ hiện tại (I18nProvider).
 * vi → "26.000đ", en → "$1.00" (quy đổi theo NEXT_PUBLIC_USD_RATE). Server
 * component không dùng được hook — gọi thẳng formatPrice(n, { locale }).
 */
export function usePriceFormatter() {
  const locale = useLocale();
  return useCallback(
    (amount: number | null | undefined, opts?: Omit<FormatPriceOptions, 'locale'>) =>
      formatPrice(amount, { ...opts, locale }),
    [locale],
  );
}
