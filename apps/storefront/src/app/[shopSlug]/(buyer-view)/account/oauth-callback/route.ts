import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { resolveShopContext } from '@/lib/api/storefront.api';

const API_BASE_URL =
  process.env.API_CORE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

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

  if (!token) {
    return NextResponse.redirect(new URL(`/${shopSlug}/account/login?error=google`, request.url));
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
  return NextResponse.redirect(new URL(dest, request.url));
}
