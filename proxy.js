import { NextResponse } from 'next/server';

// First gate for the Studio: no login cookie at all means a straight redirect to the login page.
// (The pages and every /api/admin route still verify the signed cookie themselves.)
export function proxy(request) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/admin/login') && !request.cookies.get('mg_admin')) {
    return NextResponse.redirect(new URL('/admin/login/', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin', '/admin/:path*'] };
