/**
 * Translation Service for Node.js/NestJS backends
 * Provides synchronous translation API for server-side usage
 */

import { getI18nInstance } from './config';
import { Namespace, Language, TranslationOptions } from './types';

/**
 * TranslationService - Main service for server-side translations
 * Used in NestJS controllers, services, and CLI commands
 * 
 * @example
 * const translationService = new TranslationService('en');
 * const message = translationService.translate('auth:login.email', 'en');
 * const withInterpolation = translationService.translate('messages.welcome', 'en', { name: 'John' });
 */
export class TranslationService {
  private currentLanguage: Language;

  constructor(language: Language = 'en') {
    this.currentLanguage = language;
  }

  /**
   * Get translation for a key with optional interpolation
   */
  translate(
    key: string,
    language?: Language,
    options?: TranslationOptions | Record<string, any>
  ): string {
    const i18n = getI18nInstance();
    const lang = language || this.currentLanguage;

    return i18n.t(key, {
      lng: lang,
      ...(typeof options === 'object' ? options : {}),
    } as TranslationOptions) as string;
  }

  /**
   * Get translation by namespace and key
   * @example
   * service.t('auth', 'buttons.login')
   */
  t(namespace: Namespace, key: string, options?: TranslationOptions | Record<string, any>): string {
    const fullKey = `${namespace}:${key}`;
    return this.translate(fullKey, undefined, options);
  }

  /**
   * Get an array of translations
   * @example
   * const messages = service.translateMultiple('auth', ['buttons.login', 'buttons.register'])
   */
  translateMultiple(namespace: Namespace, keys: string[], language?: Language): Record<string, string> {
    return keys.reduce(
      (acc, key) => {
        acc[key] = this.t(namespace, key, language ? { lng: language } : undefined);
        return acc;
      },
      {} as Record<string, string>
    );
  }

  /**
   * Set the current language for this service instance
   */
  setLanguage(language: Language): void {
    this.currentLanguage = language;
  }

  /**
   * Get the current language
   */
  getLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Check if a translation key exists
   */
  hasKey(key: string, language?: Language): boolean {
    const i18n = getI18nInstance();
    const lang = language || this.currentLanguage;
    return i18n.exists(key, { lng: lang });
  }

  /**
   * Get all translations for a namespace
   */
  getNamespaceTranslations(namespace: Namespace, language?: Language): Record<string, any> {
    const i18n = getI18nInstance();
    const lang = language || this.currentLanguage;
    return i18n.getResourceBundle(lang, namespace) || {};
  }

  /**
   * Translate with plural support
   * @example
   * service.pluralTranslate('shop', 'items', 5) // "items"
   * service.pluralTranslate('shop', 'items', 1) // "item"
   */
  pluralTranslate(
    namespace: Namespace,
    key: string,
    count: number,
    language?: Language
  ): string {
    const options: any = {
      count,
      ...(language && { lng: language }),
    };
    return this.t(namespace, key, options);
  }

  /**
   * Translate error message
   * Convenient method for error handling across the app
   * @example
   * throw new ValidationException(
   *   service.translateError('validation.required')
   * );
   */
  translateError(key: string, language?: Language): string {
    const fullKey = `errors:${key}`;
    return this.translate(fullKey, language);
  }

  /**
   * Translate validation message
   * Useful in form validators and schema validation
   * @example
   * if (!email) {
   *   errors.push(service.translateValidation('email.required'))
   * }
   */
  translateValidation(key: string, language?: Language, interpolation?: Record<string, any>): string {
    const fullKey = `validation:${key}`;
    return this.translate(fullKey, language, {
      interpolate: interpolation,
    });
  }
}

/**
 * Create a translation service with a specific language
 * Shorthand function
 * 
 * @example
 * const translator = createTranslator('vi');
 * console.log(translator.t('common', 'welcome'));
 */
export function createTranslator(language: Language = 'en'): TranslationService {
  return new TranslationService(language);
}

/**
 * Global singleton translator instance
 * Use when you don't want to create new instances
 */
let globalTranslator: TranslationService | null = null;

export function getTranslator(language?: Language): TranslationService {
  if (!globalTranslator) {
    globalTranslator = new TranslationService(language);
  } else if (language) {
    globalTranslator.setLanguage(language);
  }
  return globalTranslator;
}

/**
 * Reset global translator (mainly for testing)
 */
export function resetTranslator(): void {
  globalTranslator = null;
}
