/**
 * Translation utility functions
 */

import { Language, Namespace } from '../types';

/**
 * Interpolate variables in translation string
 * Example: "Hello {{name}}" with { name: 'John' } -> "Hello John"
 */
export function interpolate(text: string, variables?: Record<string, any>): string {
  if (!variables || !text) {
    return text;
  }

  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return String(variables[key] ?? match);
  });
}

/**
 * Get nested value from object using dot notation
 * Example: getNestedValue({ a: { b: { c: 'value' } } }, 'a.b.c') -> 'value'
 */
export function getNestedValue(
  obj: Record<string, any>,
  path: string,
  defaultValue?: string
): any {
  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result?.[key] === undefined) {
      return defaultValue ?? path;
    }
    result = result[key];
  }

  return result;
}

/**
 * Extract namespace from translation key
 * Example: 'auth.login.title' with default namespace 'common' -> { ns: 'auth', key: 'login.title' }
 */
export function parseTranslationKey(
  key: string,
  defaultNamespace: Namespace = 'common'
): { ns: Namespace; key: string } {
  const parts = key.split('.');

  // If first part looks like a namespace, use it
  if (parts.length > 1 && isValidNamespace(parts[0])) {
    return {
      ns: parts[0] as Namespace,
      key: parts.slice(1).join('.'),
    };
  }

  return {
    ns: defaultNamespace,
    key,
  };
}

/**
 * Check if a string is a valid namespace
 */
export function isValidNamespace(value: string): boolean {
  const validNamespaces = ['common', 'auth', 'shop', 'order', 'errors', 'validation'];
  return validNamespaces.includes(value);
}

/**
 * Format language code for display
 * Example: 'en' -> 'English', 'vi' -> 'Tiếng Việt'
 */
export function formatLanguageName(language: Language): string {
  const names: Record<Language, string> = {
    en: 'English',
    vi: 'Tiếng Việt',
  };
  return names[language] || language;
}

/**
 * Pluralize translation result based on count
 * Example: pluralize(resources, 'item', 2) -> 'items' (if plural key exists)
 */
export function pluralize(
  resources: Record<string, any>,
  key: string,
  count: number
): string {
  const pluralKey = count === 1 ? key : `${key}_plural`;
  const value = getNestedValue(resources, pluralKey);

  if (typeof value === 'string') {
    return interpolate(value, { count });
  }

  return value || key;
}

/**
 * Deep merge translation resources
 */
export function mergeResources(
  base: Record<string, any>,
  override: Record<string, any>
): Record<string, any> {
  const result = { ...base };

  for (const key in override) {
    if (override.hasOwnProperty(key)) {
      if (
        typeof override[key] === 'object' &&
        override[key] !== null &&
        !Array.isArray(override[key])
      ) {
        result[key] = mergeResources(result[key] || {}, override[key]);
      } else {
        result[key] = override[key];
      }
    }
  }

  return result;
}
