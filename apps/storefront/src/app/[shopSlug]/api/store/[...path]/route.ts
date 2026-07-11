import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { resolveShopContext } from '@/lib/api/storefront.api';

/**
 * Storefront BFF proxy.
 *
 * The customer session lives in an httpOnly cookie (`shop_session_{shopSlug}`)
 * that JS can't read, so client components can't attach the Bearer token to
 * api-core calls themselves. This route runs on the server, reads that cookie,
 * and forwards the request to api-core with `Authorization` + `x-shop-id`.
 *
 * It lives UNDER `[shopSlug]` on purpose: the session cookie is path-scoped to
 * `/{shopSlug}`, so only a route at `/{shopSlug}/api/store/...` receives it.
 *
 * Guests (no session) get an anonymous `cart_token_{shopSlug}` cookie, forwarded
 * as `x-cart-token`, so the cart works before login and merges in on login.
 */

const API_BASE_URL =
  process.env.API_CORE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

// Only these api-core path prefixes may be reached through the proxy.
const ALLOWED_PREFIXES = [
  'cart',
  'orders',
  'wallet',
  'payments',
  'shipping',
  'promotions',
  'interactions',
  'storefront-auth',
  'chat',
];

async function handle(
  request: NextRequest,
  ctx: { params: Promise<{ shopSlug: string; path: string[] }> },
): Promise<NextResponse> {
  const { shopSlug, path } = await ctx.params;
  const segments = path ?? [];

  if (segments.length === 0 || !ALLOWED_PREFIXES.includes(segments[0])) {
    return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
  }

  const resolvedShop = await resolveShopContext(shopSlug);
  if (!resolvedShop?.id) {
    return NextResponse.json({ success: false, message: 'Shop not found' }, { status: 404 });
  }
  const shopId = resolvedShop.id;

  const cookieStore = await cookies();
  const token = cookieStore.get(`shop_session_${shopSlug}`)?.value;

  // Guest cart identity — created lazily on the first cart call for anonymous users.
  let guestToken = cookieStore.get(`cart_token_${shopSlug}`)?.value;
  let newGuestToken: string | null = null;
  if (!token && segments[0] === 'cart' && !guestToken) {
    guestToken = randomUUID();
    newGuestToken = guestToken;
  }

  const headers: Record<string, string> = { 'x-shop-id': shopId };
  const contentType = request.headers.get('content-type');
  if (contentType) headers['content-type'] = contentType;
  if (token) headers['authorization'] = `Bearer ${token}`;
  else if (guestToken) headers['x-cart-token'] = guestToken;

  const method = request.method.toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD' && method !== 'DELETE';
  const body = hasBody ? await request.text() : undefined;

  const search = request.nextUrl.search; // preserves query string
  const targetUrl = `${API_BASE_URL}/api/${segments.map(encodeURIComponent).join('/')}${search}`;

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, { method, headers, body, cache: 'no-store' });
  } catch (err) {
    console.error(`[store-bff] upstream fetch failed for ${targetUrl}`, err);
    return NextResponse.json({ success: false, message: 'Upstream unavailable' }, { status: 502 });
  }

  const text = await upstream.text();
  const res = new NextResponse(text, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
    },
  });

  if (newGuestToken) {
    res.cookies.set(`cart_token_${shopSlug}`, newGuestToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: `/${shopSlug}`,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return res;
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
