/**
 * Main export file for @ecommerce/i18n
 */

// Re-export types
export type { I18nConfig, I18nService, TranslationOptions, Namespace, Language } from './types';
export { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, NAMESPACES } from './types';

// Re-export language utilities
export {
  detectLanguage,
  getBrowserLanguage,
  setLanguagePreference,
  getLanguagePreference,
  clearLanguagePreference,
  isLanguageSupported,
  getLanguageCode,
} from './utils/language';

// Re-export translation utilities
export {
  interpolate,
  getNestedValue,
  parseTranslationKey,
  isValidNamespace,
  formatLanguageName,
  pluralize,
  mergeResources,
} from './utils';

// Re-export config utilities
export { initializeI18n, ensureI18n, getI18nInstance, getI18nConfig } from './config';

// Re-export Node.js/NestJS service
export {
  TranslationService,
  createTranslator,
  getTranslator,
  resetTranslator,
} from './service';

// Import all functions for default export
import { initializeI18n, getI18nInstance, getI18nConfig } from './config';
import {
  detectLanguage,
  getBrowserLanguage,
  setLanguagePreference,
  getLanguagePreference,
  clearLanguagePreference,
  isLanguageSupported,
  getLanguageCode,
} from './utils/language';
import {
  interpolate,
  getNestedValue,
  parseTranslationKey,
  isValidNamespace,
  formatLanguageName,
  pluralize,
  mergeResources,
} from './utils';
import {
  TranslationService,
  createTranslator,
  getTranslator,
} from './service';

// Default export with all utilities
export default {
  // Config
  initializeI18n,
  getI18nInstance,
  getI18nConfig,

  // Language utilities
  detectLanguage,
  getBrowserLanguage,
  setLanguagePreference,
  getLanguagePreference,
  clearLanguagePreference,
  isLanguageSupported,
  getLanguageCode,

  // Translation utilities
  interpolate,
  getNestedValue,
  parseTranslationKey,
  isValidNamespace,
  formatLanguageName,
  pluralize,
  mergeResources,

  // Services
  TranslationService,
  createTranslator,
  getTranslator,
};
