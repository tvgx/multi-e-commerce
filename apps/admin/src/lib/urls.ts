/**
 * Storefront URL helpers.
 *
 * The storefront host used to be hardcoded as `localhost:3002` in many UI
 * strings/links, which leaked into production. Host + protocol now come from
 * env so the same code works in dev and prod:
 *   NEXT_PUBLIC_STOREFRONT_HOST     e.g. "localhost:3002" | "shopvolo.com"
 *   NEXT_PUBLIC_STOREFRONT_PROTOCOL e.g. "http" | "https"
 *   NEXT_PUBLIC_STOREFRONT_URL      optional path-based base, e.g. "https://shop.app"
 */
const HOST = process.env.NEXT_PUBLIC_STOREFRONT_HOST || 'localhost:3002';
const PROTOCOL = process.env.NEXT_PUBLIC_STOREFRONT_PROTOCOL || 'http';
const BASE = process.env.NEXT_PUBLIC_STOREFRONT_URL?.replace(/\/$/, '');

/** Subdomain-style storefront URL, e.g. http://my-shop.localhost:3002. */
export function storefrontUrl(subdomain: string, pathOrQuery = ''): string {
  return `${PROTOCOL}://${subdomain}.${HOST}${pathOrQuery}`;
}

/** Host-only label for display (no protocol), e.g. my-shop.localhost:3002. */
export function storefrontHost(subdomain: string): string {
  return `${subdomain}.${HOST}`;
}

/** Public URL for a shop, honoring a custom domain or a path-based base URL. */
export function shopPublicUrl(shop: { id?: string; domain?: string | null }): string {
  if (shop.domain?.includes('.')) return `https://${shop.domain}`;
  if (BASE) return `${BASE}/${shop.domain || shop.id}`;
  return storefrontUrl(shop.domain || shop.id || '');
}
