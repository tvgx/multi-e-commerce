import { ensureI18n } from '@ecommerce/i18n/src/config';
import type { Language } from '@ecommerce/i18n/src/types';

/**
 * Translator cho SERVER component trong ui-registry (Hero, FeaturedProducts…),
 * nơi không dùng được hook useTranslations. Locale truyền qua props/pageContext
 * (storefront đọc cookie NEXT_LOCALE ở page). Key truyền dạng đầy đủ namespace:
 * tFor(locale)('shop:products.addToCart').
 */
export function tFor(locale?: string) {
    const lng: Language = locale === 'en' ? 'en' : 'vi';
    const i18n = ensureI18n(lng);
    return (key: string, options?: Record<string, any>) =>
        i18n.t(key, { lng, ...options }) as string;
}
