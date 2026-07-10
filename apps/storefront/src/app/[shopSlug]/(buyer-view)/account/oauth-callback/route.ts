import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { resolveShopContext } from '@/lib/api/storefront.api';

const API_BASE_URL =
  process.env.API_CORE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * External origin the buyer actually reached us on. `request.url` is unsafe for
 * building redirect `Location`s: Next standalone binds `HOSTNAME=0.0.0.0`, so
 * when the reverse proxy doesn't forward a usable host the internal bind address
 * (`0.0.0.0:3002`) leaks into the redirect and the browser dies with
 * ERR_ADDRESS_INVALID. Trust Caddy's `x-forwarded-*` (set per request, so it
 * preserves subdomain / custom-domain hosts), then the Host header, and only
 * fall back to the configured platform URL — never to `0.0.0.0`.
 */
function externalOrigin(request: NextRequest): string {
  const xfHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = xfHost || request.headers.get('host')?.trim() || '';
  const proto =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
    (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  if (host && !/^(0\.0\.0\.0|127\.0\.0\.1|\[::)/.test(host)) {
    return `${proto}://${host}`;
  }
  return (process.env.STOREFRONT_URL ?? 'http://localhost:3002').replace(/\/+$/, '');
}

/**
 * OAuth handoff landing. api-core (Google callback) redirects here with a signed
 * customer JWT; we set the httpOnly `shop_session_{shopSlug}` cookie on the
 * storefront origin (so it's path-scoped correctly), merge any guest cart, and
 * forward the buyer on. Setting the cookie must happen here, not on api-core,
 * because it belongs to the storefront origin.
 */
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ shopSlug: string }> },
): Promise<NextResponse> {
  const { shopSlug } = await ctx.params;
  const token = request.nextUrl.searchParams.get('token');
  const redirect = request.nextUrl.searchParams.get('redirect');

  const origin = externalOrigin(request);

  if (!token) {
    return NextResponse.redirect(new URL(`/${shopSlug}/account/login?error=google`, origin));
  }

  const cookieStore = await cookies();
  cookieStore.set(`shop_session_${shopSlug}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: `/${shopSlug}`,
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  // Merge any anonymous guest cart into this customer, then drop the guest token.
  const guestToken = cookieStore.get(`cart_token_${shopSlug}`)?.value;
  if (guestToken) {
    try {
      const shop = await resolveShopContext(shopSlug);
      if (shop?.id) {
        await fetch(`${API_BASE_URL}/api/cart/merge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-shop-id': shop.id,
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ guestToken }),
        });
      }
    } catch (err) {
      console.error('Guest cart merge (oauth) failed:', err);
    }
    cookieStore.delete(`cart_token_${shopSlug}`);
  }

  const dest = redirect && redirect.startsWith(`/${shopSlug}`) ? redirect : `/${shopSlug}/profile`;
  return NextResponse.redirect(new URL(dest, origin));
}
