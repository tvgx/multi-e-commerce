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
import enAdmin from '../locales/en/admin.json';

import viCommon from '../locales/vi/common.json';
import viAuth from '../locales/vi/auth.json';
import viShop from '../locales/vi/shop.json';
import viOrder from '../locales/vi/order.json';
import viErrors from '../locales/vi/errors.json';
import viValidation from '../locales/vi/validation.json';
import viAdmin from '../locales/vi/admin.json';

const DEFAULT_CONFIG: I18nConfig = {
  defaultLanguage: 'en',
  fallbackLanguage: 'en',
  supportedLanguages: ['en', 'vi'],
  namespaces: ['common', 'auth', 'shop', 'order', 'errors', 'validation', 'admin'],
  resources: {
    en: {
      common: enCommon,
      auth: enAuth,
      shop: enShop,
      order: enOrder,
      errors: enErrors,
      validation: enValidation,
      admin: enAdmin,
    },
    vi: {
      common: viCommon,
      auth: viAuth,
      shop: viShop,
      order: viOrder,
      errors: viErrors,
      validation: viValidation,
      admin: viAdmin,
    },
  },
};

/**
 * Synchronously ensure i18next is initialized and return the shared instance.
 *
 * Safe to call on every render: initialization happens once (guarded by
 * `isInitialized`). Because all resources are bundled inline we initialize with
 * `initImmediate: false`, which makes `init()` complete synchronously — this
 * avoids a "translation key flashes before resources load" hydration gap.
 *
 * IMPORTANT (server): the i18next singleton is shared across requests in a
 * long-running Node process, so callers on the server MUST pass an explicit
 * `{ lng }` to every `t()` call instead of relying on `i18n.language` (and must
 * never call `changeLanguage`, which mutates global state). See `getT` helpers
 * in the apps. On the client the instance is per-tab, so changing language +
 * reloading is fine.
 */
export function ensureI18n(lng: Language = 'vi') {
  if (!i18next.isInitialized) {
    i18next.init({
      lng,
      fallbackLng: DEFAULT_CONFIG.fallbackLanguage,
      ns: DEFAULT_CONFIG.namespaces,
      defaultNS: 'common',
      resources: DEFAULT_CONFIG.resources,
      interpolation: { escapeValue: false },
      initImmediate: false,
      react: { useSuspense: false },
    });
  }
  return i18next;
}

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
