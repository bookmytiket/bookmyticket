import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host');

  // Check if the hostname starts with 'www.'
  if (hostname && hostname.startsWith('www.')) {
    // Remove 'www.' from the hostname
    const newHostname = hostname.replace(/^www\./, '');
    
    // Construct the new URL
    const newUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${newHostname}`);
    
    // Redirect to the non-www version
    return NextResponse.redirect(newUrl, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
