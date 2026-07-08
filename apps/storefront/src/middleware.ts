import { NextRequest, NextResponse } from 'next/server';

/**
 * Host-based routing: subdomain nền tảng + custom domain (P0-2).
 *
 * Storefront phục vụ shop theo path: `/[shopSlug]/...`. Hai kiểu host được
 * rewrite về path đó:
 *
 * 1. Subdomain nền tảng `<slug>.tvgx1.id.vn` — label chính là `shop.domain`
 *    (trùng path slug) nên rewrite thẳng, không cần gọi API.
 * 2. Tên miền riêng của người bán (đã xác thực TXT) — resolve Host → slug qua
 *    api-core `/api/shops/by-host` rồi rewrite.
 *
 * Apex/`www` (và host lạ không resolve được) đi thẳng theo routing path-based.
 */

const API_BASE =
  process.env.API_CORE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3000';

// Hosts do nền tảng tự phục vụ (routing [shopSlug]). Tên miền riêng là mọi thứ
// KHÔNG nằm trong tập này. Cấu hình host production qua NEXT_PUBLIC_STOREFRONT_HOST
// (phân tách bằng dấu phẩy, vd: "omnicommerce.com"). Image prod không được build
// với biến NEXT_PUBLIC_* nên fallback thêm ROOT_DOMAIN (runtime, từ deploy/.env).
const PLATFORM_HOSTS = (
  process.env.NEXT_PUBLIC_STOREFRONT_HOST ||
  process.env.ROOT_DOMAIN ||
  'localhost,127.0.0.1'
)
  .split(',')
  // Bỏ port (dev khai "localhost:3002") — hostname so sánh luôn không có port.
  .map((h) => h.trim().toLowerCase().replace(/:\d+$/, ''))
  .filter(Boolean);

// Subdomain hạ tầng, không bao giờ là slug shop.
const RESERVED_SUBDOMAINS = new Set(['www', 'api', 'admin', 'cdn', 'images']);

function isPlatformHost(hostname: string): boolean {
  if (!hostname) return true; // an toàn: coi host rỗng là nền tảng
  if (hostname.endsWith('.vercel.app')) return true;
  return PLATFORM_HOSTS.some(
    (ph) => hostname === ph || hostname.endsWith(`.${ph}`),
  );
}

/**
 * `<slug>.tvgx1.id.vn` → "slug"; apex, `www.`, subdomain hạ tầng hoặc
 * label nhiều cấp (a.b.tvgx1.id.vn) → null (đi routing path-based).
 */
function platformSubdomain(hostname: string): string | null {
  for (const ph of PLATFORM_HOSTS) {
    if (hostname !== ph && hostname.endsWith(`.${ph}`)) {
      const label = hostname.slice(0, hostname.length - ph.length - 1);
      if (label && !label.includes('.') && !RESERVED_SUBDOMAINS.has(label)) {
        return label;
      }
    }
  }
  return null;
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

function rewriteToSlug(req: NextRequest, slug: string): NextResponse {
  const url = req.nextUrl.clone();
  // Tránh prefix trùng nếu path đã nằm dưới slug.
  if (url.pathname === `/${slug}` || url.pathname.startsWith(`/${slug}/`)) {
    return NextResponse.next();
  }
  url.pathname = `/${slug}${url.pathname === '/' ? '' : url.pathname}`;
  return NextResponse.rewrite(url);
}

export async function middleware(req: NextRequest) {
  const hostname = (req.headers.get('host') || '').split(':')[0].toLowerCase();

  if (isPlatformHost(hostname)) {
    const label = platformSubdomain(hostname);
    if (label) return rewriteToSlug(req, label);
    return NextResponse.next();
  }

  const slug = await resolveSlug(hostname);
  if (!slug) {
    // Tên miền lạ/chưa xác thực → để routing bình thường xử lý (thường 404).
    return NextResponse.next();
  }

  return rewriteToSlug(req, slug);
}

export const config = {
  // Bỏ qua nội bộ Next, API routes, favicon và mọi path có phần mở rộng file.
  matcher: ['/((?!_next/|api/|favicon.ico|.*\\..*).*)'],
};
