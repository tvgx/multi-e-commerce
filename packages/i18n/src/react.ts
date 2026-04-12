/**
 * React hooks for i18n integration
 * For use in React applications (Storefront, Admin)
 * 
 * IMPORTANT: This file is optional and should only be imported in React apps.
 * It requires React to be installed as a peer dependency.
 * 
 * Import from '@ecommerce/i18n/react' instead of main package:
 * import { useTranslations, useLanguage } from '@ecommerce/i18n/react';
 */

import { useCallback, useState, useEffect } from 'react';
import { getI18nInstance } from './config';
import { Namespace, Language, TranslationOptions } from './types';

/**
 * Hook for accessing translated strings in React components
 * 
 * @example
 * const t = useTranslations('auth');
 * const loginLabel = t('login.email');
 * const withInterpolation = t('messages.welcome', { name: 'John' });
 */
export function useTranslations(namespace: Namespace): (key: string, options?: TranslationOptions | Record<string, any>) => string {
  const i18n = getI18nInstance();

  return useCallback(
    (key: string, options?: TranslationOptions | Record<string, any>) => {
      const fullKey = `${namespace}:${key}`;
      return i18n.t(fullKey, options as TranslationOptions) as string;
    },
    [namespace, i18n]
  );
}

/**
 * Hook for managing language state in React components
 * Triggers re-render when language changes
 * 
 * @example
 * const { language, setLanguage, availableLanguages } = useLanguage();
 * 
 * return (
 *   <select value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
 *     {availableLanguages.map(lang => (
 *       <option key={lang} value={lang}>{lang}</option>
 *     ))}
 *   </select>
 * );
 */
export function useLanguage() {
  const i18n = getI18nInstance();
  const [language, setLanguageState] = useState<Language>(i18n.language as Language);
  const [availableLanguages] = useState<Language[]>(i18n.languages as Language[]);

  const setLanguage = useCallback(async (lang: Language) => {
    await i18n.changeLanguage(lang);
    setLanguageState(lang);
  }, []);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setLanguageState(lng as Language);
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  return {
    language,
    setLanguage,
    availableLanguages,
    isRTL: false, // Both EN and VI are LTR languages
  };
}

/**
 * Hook for namespace-specific translations with auto language switching
 * 
 * @example
 * const { t, language, setLanguage } = useI18n('shop');
 */
export function useI18n(namespace: Namespace): {
  t: (key: string, options?: TranslationOptions | Record<string, any>) => string;
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  availableLanguages: Language[];
} {
  const t = useTranslations(namespace);
  const { language, setLanguage, availableLanguages } = useLanguage();

  return {
    t,
    language,
    setLanguage,
    availableLanguages,
  };
}

/**
 * Hook for translating multiple keys at once
 * Useful for translating arrays or lists
 * 
 * @example
 * const labels = useTranslateKeys('auth', ['buttons.login', 'buttons.register']);
 * // { 'buttons.login': 'Login', 'buttons.register': 'Register' }
 */
export function useTranslateKeys(
  namespace: Namespace,
  keys: string[]
): Record<string, string> {
  const t = useTranslations(namespace);

  return keys.reduce(
    (acc, key) => {
      acc[key] = t(key);
      return acc;
    },
    {} as Record<string, string>
  );
}

/**
 * Hook for format number according to language locale
 * 
 * @example
 * const formatNumber = useFormatNumber('en');
 * formatNumber(1234.56) // "1,234.56"
 */
export function useFormatNumber() {
  const { language } = useLanguage();

  return useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', options).format(value);
    },
    [language]
  );
}

/**
 * Hook for format date according to language locale
 * 
 * @example
 * const formatDate = useFormatDate('en');
 * formatDate(new Date()) // "4/6/2026" (EN) or "6/4/2026" (VI)
 */
export function useFormatDate() {
  const { language } = useLanguage();

  return useCallback(
    (value: Date | number, options?: Intl.DateTimeFormatOptions) => {
      return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        ...options,
      }).format(value);
    },
    [language]
  );
}

/**
 * Hook for format currency according to language locale
 * 
 * @example
 * const formatCurrency = useFormatCurrency('en');
 * formatCurrency(99.99, 'USD') // "$99.99"
 * formatCurrency(100000, 'VND') // "₫100,000"
 */
export function useFormatCurrency() {
  const { language } = useLanguage();

  return useCallback(
    (value: number, currency: string = 'USD', options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
        style: 'currency',
        currency,
        ...options,
      }).format(value);
    },
    [language]
  );
}
