import { NextRequest, NextResponse } from 'next/server';

/**
 * Custom-domain routing (P0-2).
 *
 * Storefront phục vụ shop theo path: `/[shopSlug]/...`. Khi người bán trỏ tên
 * miền riêng (đã xác thực TXT) về nền tảng, request tới với Host là tên miền đó
 * và KHÔNG có slug trong path. Middleware này resolve Host → slug rồi rewrite
 * `store.example.com/products/x` thành nội bộ `/<slug>/products/x`.
 *
 * Host của chính nền tảng (localhost dev, apex production trong
 * NEXT_PUBLIC_STOREFRONT_HOST) đi thẳng theo routing path-based như cũ.
 */

const API_BASE =
  process.env.API_CORE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3000';

// Hosts do nền tảng tự phục vụ (routing [shopSlug]). Tên miền riêng là mọi thứ
// KHÔNG nằm trong tập này. Cấu hình host production qua NEXT_PUBLIC_STOREFRONT_HOST
// (phân tách bằng dấu phẩy, vd: "omnicommerce.com").
const PLATFORM_HOSTS = (process.env.NEXT_PUBLIC_STOREFRONT_HOST || 'localhost,127.0.0.1')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

function isPlatformHost(hostname: string): boolean {
  if (!hostname) return true; // an toàn: coi host rỗng là nền tảng
  if (hostname.endsWith('.vercel.app')) return true;
  return PLATFORM_HOSTS.some(
    (ph) => hostname === ph || hostname.endsWith(`.${ph}`),
  );
}

// Cache theo từng edge instance: host → slug | null (cache cả kết quả âm để
// tránh gọi API lặp lại). TTL 5 phút.
const CACHE_TTL_MS = 5 * 60 * 1000;
const slugCache = new Map<string, { slug: string | null; expires: number }>();

async function resolveSlug(hostname: string): Promise<string | null> {
  const now = Date.now();
  const hit = slugCache.get(hostname);
  if (hit && hit.expires > now) return hit.slug;

  let slug: string | null = null;
  try {
    const res = await fetch(
      `${API_BASE}/api/shops/by-host?host=${encodeURIComponent(hostname)}`,
      { headers: { accept: 'application/json' } },
    );
    if (res.ok) {
      const json = await res.json();
      slug = json?.data?.slug ?? null;
    }
  } catch {
    slug = null;
  }

  slugCache.set(hostname, { slug, expires: now + CACHE_TTL_MS });
  return slug;
}

export async function middleware(req: NextRequest) {
  const hostname = (req.headers.get('host') || '').split(':')[0].toLowerCase();

  if (isPlatformHost(hostname)) {
    return NextResponse.next();
  }

  const slug = await resolveSlug(hostname);
  if (!slug) {
    // Tên miền lạ/chưa xác thực → để routing bình thường xử lý (thường 404).
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  // Tránh prefix trùng nếu path đã nằm dưới slug.
  if (url.pathname === `/${slug}` || url.pathname.startsWith(`/${slug}/`)) {
    return NextResponse.next();
  }
  url.pathname = `/${slug}${url.pathname === '/' ? '' : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Bỏ qua nội bộ Next, API routes, favicon và mọi path có phần mở rộng file.
  matcher: ['/((?!_next/|api/|favicon.ico|.*\\..*).*)'],
};
