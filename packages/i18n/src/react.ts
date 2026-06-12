'use client';

/**
 * React integration for i18n (Storefront, Admin, shared ui-registry).
 *
 * Design notes — why this is safe for the Next.js App Router:
 *   - The active locale comes from a React context (`LocaleContext`), seeded by
 *     `<I18nProvider locale>` which the server layouts feed from the
 *     `NEXT_LOCALE` cookie. Client components rendered during SSR therefore read
 *     the *request's* locale, not the process-global `i18next.language`.
 *   - Every `t()` call passes an explicit `{ lng }`. We never call
 *     `i18next.changeLanguage()` (which mutates global state and would race
 *     across concurrent SSR requests). Switching language is done by writing the
 *     cookie and reloading — see the LanguageSwitcher components.
 */

import React, { createContext, useCallback, useContext } from 'react';
import { ensureI18n } from './config';
import { Namespace, Language, TranslationOptions } from './types';

const LocaleContext = createContext<Language>('vi');

/**
 * Wrap the app once (near the root) so every client component can translate
 * using the request's locale.
 */
export function I18nProvider({
  locale,
  children,
}: {
  locale: Language;
  children: React.ReactNode;
}) {
  // Idempotent; guarantees resources are loaded before any consumer renders.
  ensureI18n(locale);
  return React.createElement(LocaleContext.Provider, { value: locale }, children);
}

/** Current locale as seen by this part of the tree. */
export function useLocale(): Language {
  return useContext(LocaleContext);
}

/**
 * Hook for accessing translated strings in client components.
 *
 * @example
 * const t = useTranslations('shop');
 * t('cart.title');                       // "Shopping Cart" / "Giỏ hàng"
 * t('messages.welcome', { name: 'An' }); // interpolation
 */
export function useTranslations(
  namespace: Namespace = 'common'
): (key: string, options?: TranslationOptions | Record<string, any>) => string {
  const locale = useContext(LocaleContext);
  const i18n = ensureI18n(locale);

  return useCallback(
    (key: string, options?: TranslationOptions | Record<string, any>) =>
      i18n.t(`${namespace}:${key}`, {
        lng: locale,
        ...(options as Record<string, any>),
      }) as string,
    [namespace, locale, i18n]
  );
}

/**
 * Convenience hook returning the locale together with a bound translator.
 *
 * @example
 * const { t, locale } = useI18n('order');
 */
export function useI18n(namespace: Namespace = 'common'): {
  t: (key: string, options?: TranslationOptions | Record<string, any>) => string;
  locale: Language;
} {
  return { t: useTranslations(namespace), locale: useLocale() };
}

/** Format a number using the current locale. */
export function useFormatNumber() {
  const locale = useLocale();
  return useCallback(
    (value: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', options).format(value),
    [locale]
  );
}

/** Format a date using the current locale. */
export function useFormatDate() {
  const locale = useLocale();
  return useCallback(
    (value: Date | number, options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        ...options,
      }).format(value),
    [locale]
  );
}

/** Format a currency value using the current locale. */
export function useFormatCurrency() {
  const locale = useLocale();
  return useCallback(
    (value: number, currency: string = 'USD', options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
        style: 'currency',
        currency,
        ...options,
      }).format(value),
    [locale]
  );
}
