import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/account/profile', '/account/orders', '/checkout'];
const GUEST_ONLY_ROUTES = ['/account/login', '/account/register'];
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const PUBLIC_ROOTS = ['/home', '/payment', '/api', '/_next', '/favicon.ico'];

function shouldSkip(pathname: string): boolean {
  if (pathname.includes('.')) return true;
  return PUBLIC_ROOTS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function resolveShopIdentifier(hostname: string): string | null {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1') return null;
  if (host.endsWith('.localhost')) return host.replace('.localhost', '').split('.')[0] || null;
  return host;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Auth Guard Logic
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isGuestOnly = GUEST_ONLY_ROUTES.some((r) => pathname.startsWith(r));

  if (isProtected || isGuestOnly) {
    const cookieHeader = request.headers.get('cookie') || '';
    let isAuthenticated = false;
    try {
      const verifyRes = await fetch(`${API_URL}/api/auth/verify-session`, {
        headers: { cookie: cookieHeader, 'x-auth-type': 'customer' },
      });
      isAuthenticated = verifyRes.ok;
    } catch {
      isAuthenticated = false;
    }

    if (isAuthenticated && isGuestOnly) {
      return NextResponse.redirect(new URL('/account/profile', request.url));
    }
    if (!isAuthenticated && isProtected) {
      const loginUrl = new URL('/account/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Multi-tenant Rewrite Logic
  if (shouldSkip(pathname)) {
    return NextResponse.next();
  }

  const hostname = request.headers.get('host')?.split(':')[0] ?? '';
  const shopIdentifier = resolveShopIdentifier(hostname);

  if (!shopIdentifier) {
    return NextResponse.next();
  }

  if (pathname === `/${shopIdentifier}` || pathname.startsWith(`/${shopIdentifier}/`)) {
    return NextResponse.next();
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = `/${shopIdentifier}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
