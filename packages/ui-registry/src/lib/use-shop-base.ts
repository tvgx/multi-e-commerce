'use client';

import { useParams } from 'next/navigation';

/**
 * Base path của shop hiện tại cho link nội bộ.
 *
 * Storefront phục vụ shop dưới `/[shopSlug]/...` (kể cả khi vào bằng subdomain /
 * custom domain — middleware rewrite về path này và chấp nhận URL đã prefix slug),
 * nên mọi link nội bộ trong section dùng chung PHẢI prefix `/${shopSlug}`.
 * Trong builder canvas (admin, route không có shopSlug) trả về '' — link ở đó
 * đã bị chặn điều hướng nên vô hại.
 */
export function useShopBase(): string {
    const params = useParams();
    const slug = params?.shopSlug as string | undefined;
    return slug ? `/${slug}` : '';
}

/** Ghép base + link nội bộ; link ngoài (http…) và link đã prefix giữ nguyên. */
export function shopHref(base: string, link?: string): string {
    const l = (link || '/').trim();
    if (!l.startsWith('/')) return l;
    if (base && (l === base || l.startsWith(`${base}/`))) return l;
    return `${base}${l === '/' ? '' : l}` || '/';
}
