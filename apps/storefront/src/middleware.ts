import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Storefront Middleware — Customer Session Guard
 *
 * Bảo vệ các routes cần đăng nhập (profile, checkout, orders, v.v.)
 * Redirect unauthenticated customers về /account/login.
 *
 * Các route được bảo vệ:
 *  - /account/* (trừ /account/login và /account/register)
 *  - /checkout/*
 *
 * Routes hoàn toàn public (không check):
 *  - / (homepage)
 *  - /products/*
 *  - /collections/*
 */

// Routes cần đăng nhập
const PROTECTED_ROUTES = ['/account/profile', '/account/orders', '/checkout'];
// Routes chỉ xem được khi CHƯA đăng nhập
const GUEST_ONLY_ROUTES = ['/account/login', '/account/register'];

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isGuestOnly = GUEST_ONLY_ROUTES.some((r) => pathname.startsWith(r));

  // Skip nếu không phải route cần xử lý
  if (!isProtected && !isGuestOnly) {
    return NextResponse.next();
  }

  const cookieHeader = request.headers.get('cookie') || '';

  let isAuthenticated = false;
  try {
    const verifyRes = await fetch(`${API_URL}/api/auth/verify-session`, {
      headers: {
        cookie: cookieHeader,
        'x-auth-type': 'customer',
      },
    });
    isAuthenticated = verifyRes.ok;
  } catch {
    isAuthenticated = false;
  }

  // Customer đã login → redirect khỏi login/register page
  if (isAuthenticated && isGuestOnly) {
    return NextResponse.redirect(new URL('/account/profile', request.url));
  }

  // Customer chưa login → redirect về login
  if (!isAuthenticated && isProtected) {
    const loginUrl = new URL('/account/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/checkout/:path*'],
};
