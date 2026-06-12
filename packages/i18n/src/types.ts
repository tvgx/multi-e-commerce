/**
 * Type definitions for i18n module
 */

export type Language = 'en' | 'vi';

export const SUPPORTED_LANGUAGES: Language[] = ['en', 'vi'];

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
};

export type Namespace = 'common' | 'auth' | 'shop' | 'order' | 'errors' | 'validation' | 'admin';

export const NAMESPACES: Namespace[] = ['common', 'auth', 'shop', 'order', 'errors', 'validation', 'admin'];

export interface I18nConfig {
  defaultLanguage: Language;
  fallbackLanguage: Language;
  supportedLanguages: Language[];
  namespaces: Namespace[];
  resources?: Record<Language, Record<Namespace, Record<string, any>>>;
}

export interface TranslationOptions {
  lng?: Language;
  ns?: Namespace | Namespace[];
  defaultValue?: string;
  [key: string]: any;
}

export interface I18nService {
  initialize(config?: Partial<I18nConfig>): Promise<void>;
  t(key: string, options?: TranslationOptions): string;
  changeLanguage(language: Language): Promise<void>;
  getLanguage(): Language;
  getSupportedLanguages(): Language[];
  getNamespaces(): Namespace[];
}
