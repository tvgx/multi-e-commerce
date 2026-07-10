import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Admin Middleware — Route Protection
 *
 * Bảo vệ tất cả các routes trong dashboard.
 * Nếu không có session hợp lệ, redirect về /login.
 *
 * Hiệu năng: chỉ gọi /api/auth/verify-session khi request CÓ mang cookie
 * session. Khách vãng lai / crawler (không có cookie) được xử lý cục bộ, bỏ
 * hẳn round-trip tới api-core — đây chính là đường đi của trang /login nên
 * cắt được phần lớn response time (trước đây ~1.3s do luôn fetch verify).
 *
 * Đây là kiểm tra "optimistic" theo đúng khuyến nghị của better-auth cho
 * middleware: chỉ xét sự hiện diện của cookie để định tuyến, còn việc xác thực
 * thật (chữ ký, hết hạn, thu hồi) do page/API thực thi authoritative.
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

// Tên cookie session của owner (cookiePrefix 'owner' ở api-core owner-auth.config).
// Production bật useSecureCookies nên có thêm tiền tố '__Secure-'; khớp theo hậu
// tố để phủ cả hai môi trường (và cả cookie bị chunk như '...session_token.0').
const OWNER_SESSION_COOKIE = 'owner.session_token';

function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((c) => c.name.includes(OWNER_SESSION_COOKIE));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Các route hoàn toàn public không cần check gì cả
  const isFullyPublic = FULLY_PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  if (isFullyPublic) return NextResponse.next();

  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some(
    (route) => pathname === route || (route !== '/' && pathname.startsWith(route)),
  );

  // ── Fast-path: KHÔNG có cookie session ⇒ chắc chắn chưa đăng nhập ──
  // Không gọi api-core. Đây là đường đi của khách/crawler trên /login, /, ...
  if (!hasSessionCookie(request)) {
    if (isAuthOnlyRoute) return NextResponse.next(); // cho xem onboarding/login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Có cookie ⇒ xác thực authoritative với api-core ──
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

  // Đã login + đang ở auth-only route (/, /login, /register...) → vào dashboard
  if (isAuthenticated && isAuthOnlyRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Cookie có nhưng không hợp lệ + đang ở auth-only route → để qua (xem onboarding/login)
  if (!isAuthenticated && isAuthOnlyRoute) {
    return NextResponse.next();
  }

  // Cookie không hợp lệ + đang truy cập route cần bảo vệ → redirect về /login
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
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|opengraph-image|manifest.webmanifest|robots.txt|sitemap.xml|api/|.*\\.png$|.*\\.svg$|.*\\.jpg$).*)',
  ],
};
