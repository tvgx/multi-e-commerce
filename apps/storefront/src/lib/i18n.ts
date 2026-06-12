/**
 * Server-side i18n helpers for the storefront.
 *
 * Reads the buyer's chosen language from the `NEXT_LOCALE` cookie and returns a
 * translator bound to that locale. Every call passes an explicit `{ lng }`, so
 * this is safe under concurrent SSR (we never mutate the shared i18next
 * instance's global language).
 *
 * Server components:  const t = await getT('shop'); t('cart.title')
 * Client components:  import { useTranslations } from '@ecommerce/i18n/src/react'
 */
import { cookies } from 'next/headers';
import { ensureI18n } from '@ecommerce/i18n/src/config';
import type { Namespace, Language } from '@ecommerce/i18n/src/types';

const DEFAULT_LOCALE: Language = 'vi';

export async function getLocale(): Promise<Language> {
  const value = (await cookies()).get('NEXT_LOCALE')?.value;
  return value === 'en' ? 'en' : DEFAULT_LOCALE;
}

export type TFunc = (key: string, options?: Record<string, unknown>) => string;

export async function getT(namespace: Namespace = 'common'): Promise<TFunc> {
  const locale = await getLocale();
  const i18n = ensureI18n(locale);
  return (key, options) =>
    i18n.t(`${namespace}:${key}`, { lng: locale, ...options }) as string;
}
