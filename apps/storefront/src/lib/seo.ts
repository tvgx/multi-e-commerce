/**
 * seo.ts — SEO helpers for the multi-tenant storefront.
 *
 * Canonical strategy: shops are reachable three ways (path `tvgx1.id.vn/<slug>`,
 * platform subdomain `<slug>.tvgx1.id.vn`, and verified custom domains). To
 * avoid duplicate-content penalties we declare ONE canonical per URL — the
 * path-based form on the platform root — so search engines consolidate signals.
 *
 * Base URL comes from runtime env (NEXT_PUBLIC_* is NOT baked into the prod
 * image — see deploy/.env), so we read the plain `STOREFRONT_URL` server-side.
 */

const SITE_URL = (
    process.env.STOREFRONT_URL ??
    process.env.NEXT_PUBLIC_STOREFRONT_URL ??
    'http://localhost:3002'
).replace(/\/+$/, '');

/** Absolute origin of the storefront platform (no trailing slash). */
export function getSiteUrl(): string {
    return SITE_URL;
}

/** Absolute URL for a platform-root-relative path. */
export function absoluteUrl(path = ''): string {
    if (!path) return SITE_URL;
    return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Canonical absolute URL for a shop-relative path (path-based form). */
export function shopUrl(shopSlug: string, path = ''): string {
    const suffix = path ? (path.startsWith('/') ? path : `/${path}`) : '';
    return `${SITE_URL}/${shopSlug}${suffix}`;
}

/**
 * Strips HTML/whitespace and clamps a string to a meta-description-friendly
 * length (~160 chars) at a word boundary.
 */
export function metaText(input: unknown, max = 160): string {
    const text = String(input ?? '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (text.length <= max) return text;
    const clipped = text.slice(0, max);
    const lastSpace = clipped.lastIndexOf(' ');
    return `${(lastSpace > 40 ? clipped.slice(0, lastSpace) : clipped).trim()}…`;
}
