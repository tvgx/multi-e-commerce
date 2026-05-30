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

// Routes chỉ có thể truy cập khi CHƯA đăng nhập (redirect về dashboard nếu đã login)
// Bao gồm cả '/' — Onboarding/Landing page:
//   - Chưa login → hiển thị Onboarding
//   - Đã login   → redirect về /dashboard
const AUTH_ONLY_ROUTES = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

// Routes hoàn toàn public, không cần kiểm tra session (static assets, v.v.)
// Lưu ý: '/' KHÔNG có ở đây — nó cần verify để biết có redirect dashboard hay không
const FULLY_PUBLIC_ROUTES: string[] = [];

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Các route hoàn toàn public không cần check gì cả
  const isFullyPublic = FULLY_PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  if (isFullyPublic) return NextResponse.next();

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

  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some(
    (route) => pathname === route || (route !== '/' && pathname.startsWith(route)),
  );

  // Đã login + đang ở auth-only route (/, /login, /register...) → vào dashboard
  if (isAuthenticated && isAuthOnlyRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Chưa login + đang ở auth-only route (/, /login, /register...) → để qua (xem onboarding/login)
  if (!isAuthenticated && isAuthOnlyRoute) {
    return NextResponse.next();
  }

  // Chưa login + đang truy cập route cần bảo vệ → redirect về /login
  if (!isAuthenticated) {
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
     * - api/* (API routes tự xử lý auth — không đi qua middleware redirect)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/|.*\\.png$|.*\\.svg$|.*\\.jpg$).*)',
  ],
};
