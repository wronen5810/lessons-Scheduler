import { NextRequest, NextResponse } from 'next/server';

// Subdomain → internal path mapping for policy pages
const POLICY_SUBDOMAINS: Record<string, string> = {
  refundpolicy: '/refund-policy',
  termsofservice: '/terms-of-service',
  privacy: '/privacy',
};

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? '';
  const subdomain = hostname.split('.')[0].toLowerCase();

  const policyPath = POLICY_SUBDOMAINS[subdomain];
  if (policyPath) {
    const url = request.nextUrl.clone();
    url.pathname = policyPath;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all paths except Next.js internals and static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
