/**
 * Ghép base path của shop + link nội bộ — bản thuần (không hook) để cả server
 * component (Hero…) lẫn client component dùng chung. Link ngoài (http…) và
 * link đã prefix base giữ nguyên, tránh double-prefix kiểu /all-products/all-products.
 */
export function shopHref(base: string, link?: string): string {
    const l = (link || '/').trim();
    if (!l.startsWith('/')) return l;
    if (base && (l === base || l.startsWith(`${base}/`))) return l;
    return `${base}${l === '/' ? '' : l}` || '/';
}
