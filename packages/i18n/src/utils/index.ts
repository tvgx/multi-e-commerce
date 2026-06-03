/**
 * Translation utility functions
 */

import { Language, Namespace } from '../types';

/**
 * Interpolate variables in translation string
 * Example: "Hello {{name}}" with { name: 'John' } -> "Hello John"
 */
export function interpolate(text: string, variables?: Record<string, unknown>): string {
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
  obj: Record<string, unknown>,
  path: string,
  defaultValue?: string
): unknown {
  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (typeof result === 'object' && result !== null) {
      const record = result as Record<string, unknown>;
      if (record[key] === undefined) {
        return defaultValue ?? path;
      }
      result = record[key];
    } else {
      return defaultValue ?? path;
    }
  }

  return result !== undefined ? result : (defaultValue ?? path);
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
  resources: Record<string, unknown>,
  key: string,
  count: number
): string {
  const pluralKey = count === 1 ? key : `${key}_plural`;
  const value = getNestedValue(resources, pluralKey);

  if (typeof value === 'string') {
    return interpolate(value, { count });
  }

  return key;
}

/**
 * Deep merge translation resources
 */
export function mergeResources(
  base: Record<string, unknown>,
  override: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };

  for (const key in override) {
    if (Object.prototype.hasOwnProperty.call(override, key)) {
      const val = override[key];
      if (
        typeof val === 'object' &&
        val !== null &&
        !Array.isArray(val)
      ) {
        result[key] = mergeResources(
          (result[key] as Record<string, unknown>) || {}, 
          val as Record<string, unknown>
        );
      } else {
        result[key] = val;
      }
    }
  }

  return result;
}
