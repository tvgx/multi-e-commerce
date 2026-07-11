'use client';

import { useParams } from 'next/navigation';
import { shopHref } from './href';

// Re-export để giữ import cũ `import { shopHref } from '../lib/use-shop-base'`;
// bản thân hàm sống ở ./href (module thuần) cho server component dùng được.
export { shopHref };

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
