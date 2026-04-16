/**
 * i18next configuration
 */

import i18next, { InitOptions } from 'i18next';

import { Language, I18nConfig } from './types';
import { detectLanguage } from './utils/language';

// Import locale files
import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enShop from '../locales/en/shop.json';
import enOrder from '../locales/en/order.json';
import enErrors from '../locales/en/errors.json';
import enValidation from '../locales/en/validation.json';

import viCommon from '../locales/vi/common.json';
import viAuth from '../locales/vi/auth.json';
import viShop from '../locales/vi/shop.json';
import viOrder from '../locales/vi/order.json';
import viErrors from '../locales/vi/errors.json';
import viValidation from '../locales/vi/validation.json';

const DEFAULT_CONFIG: I18nConfig = {
  defaultLanguage: 'en',
  fallbackLanguage: 'en',
  supportedLanguages: ['en', 'vi'],
  namespaces: ['common', 'auth', 'shop', 'order', 'errors', 'validation'],
  resources: {
    en: {
      common: enCommon,
      auth: enAuth,
      shop: enShop,
      order: enOrder,
      errors: enErrors,
      validation: enValidation,
    },
    vi: {
      common: viCommon,
      auth: viAuth,
      shop: viShop,
      order: viOrder,
      errors: viErrors,
      validation: viValidation,
    },
  },
};

/**
 * Initialize i18next with configuration
 */
export async function initializeI18n(config: Partial<I18nConfig> = {}): Promise<void> {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const detectedLanguage = detectLanguage(finalConfig.defaultLanguage as Language);

  const options: InitOptions = {
    lng: detectedLanguage,
    fallbackLng: finalConfig.fallbackLanguage,
    ns: finalConfig.namespaces,
    defaultNS: 'common',
    resources: finalConfig.resources,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  };

  if (!i18next.isInitialized) {
    await i18next.init(options);
  }
}

/**
 * Get i18next instance for direct usage
 */
export function getI18nInstance() {
  return i18next;
}

/**
 * Get current configuration
 */
export function getI18nConfig(): I18nConfig {
  return DEFAULT_CONFIG;
}
