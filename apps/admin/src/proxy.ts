import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Admin Middleware — Route Protection
 *
 * Bảo vệ tất cả các routes trong dashboard.
 * Nếu không có session hợp lệ, redirect về /login.
 *
 * Chiến lược: Gọi /api/auth/verify-session tại api-core để kiểm tra
 * xem cookie session có hợp lệ không (owner session).
 */

// Các routes không cần xác thực
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];
// Routes chỉ có thể truy cập khi CHƯA đăng nhập (redirect về dashboard nếu đã login)
const AUTH_ONLY_ROUTES = ['/login', '/register'];

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // Lấy cookie từ request để forward tới api-core
  const cookieHeader = request.headers.get('cookie') || '';

  let isAuthenticated = false;

  try {
    const verifyRes = await fetch(`${API_URL}/api/auth/verify-session`, {
      headers: {
        cookie: cookieHeader,
        'x-auth-type': 'owner',
      },
    });
    isAuthenticated = verifyRes.ok;
  } catch {
    isAuthenticated = false;
  }

  // Nếu đã login và đang truy cập auth-only routes → redirect về dashboard
  if (isAuthenticated && AUTH_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Nếu chưa login và truy cập route cần bảo vệ → redirect về /login
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match tất cả paths ngoại trừ:
     * - _next/static (Next.js static files)
     * - _next/image (Next.js image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - Public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.png$|.*\\.svg$|.*\\.jpg$).*)',
  ],
};
