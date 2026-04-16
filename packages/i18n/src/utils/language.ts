/**
 * Language detection and management utilities
 */

import { Language, SUPPORTED_LANGUAGES } from '../types';

const LANGUAGE_STORAGE_KEY = 'preferred-language';

/**
 * Get language from different sources with fallback chain
 * Priority: URL param > localStorage > Accept-Language header > browser locale > default
 */
export function detectLanguage(defaultLang: Language = 'en'): Language {
  // Check if running in browser
  if (typeof window === 'undefined') {
    return defaultLang;
  }

  // 1. Check URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang') as Language;
  if (urlLang && SUPPORTED_LANGUAGES.includes(urlLang)) {
    return urlLang;
  }

  // 2. Check localStorage
  const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
  if (storedLang && SUPPORTED_LANGUAGES.includes(storedLang)) {
    return storedLang;
  }

  // 3. Check browser locale
  const browserLang = getBrowserLanguage();
  if (browserLang && SUPPORTED_LANGUAGES.includes(browserLang)) {
    return browserLang;
  }

  return defaultLang;
}

/**
 * Get browser's preferred language (from Accept-Language header or navigator)
 */
export function getBrowserLanguage(): Language | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Get from navigator.language
  const navLang = navigator.language || navigator.languages?.[0];
  if (navLang) {
    const langCode = navLang.split('-')[0].toLowerCase() as Language;
    if (SUPPORTED_LANGUAGES.includes(langCode)) {
      return langCode;
    }
  }

  return null;
}

/**
 * Save language preference to localStorage
 */
export function setLanguagePreference(language: Language): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);

    // Also update document lang attribute
    document.documentElement.lang = language;
  }
}

/**
 * Get saved language preference from localStorage
 */
export function getLanguagePreference(): Language | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
}

/**
 * Clear language preference and revert to default
 */
export function clearLanguagePreference(): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  }
}

/**
 * Check if language is supported
 */
export function isLanguageSupported(language: string): language is Language {
  return SUPPORTED_LANGUAGES.includes(language as Language);
}

/**
 * Get language code from full locale (e.g., 'en-US' -> 'en')
 */
export function getLanguageCode(locale: string): Language | null {
  const code = locale.split('-')[0].toLowerCase();
  return isLanguageSupported(code) ? code : null;
}
