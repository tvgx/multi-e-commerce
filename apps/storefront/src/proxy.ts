import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROOTS = ['/home', '/payment', '/api', '/_next', '/favicon.ico'];

function shouldSkip(pathname: string): boolean {
  if (pathname.includes('.')) return true;
  return PUBLIC_ROOTS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function resolveShopIdentifier(hostname: string): string | null {
  const host = hostname.toLowerCase();

  if (host === 'localhost' || host === '127.0.0.1') {
    return null;
  }

  if (host.endsWith('.localhost')) {
    const subdomain = host.replace('.localhost', '').split('.')[0];
    return subdomain || null;
  }

  // For custom domains, use full host as identifier and let api-core resolve it.
  return host;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
