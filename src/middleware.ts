import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = request.cookies.get('token');
    
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    } else if (request.nextUrl.pathname === '/admin') {
      // Redirect to /admin/dashboard if accessing /admin
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  // Prevent authenticated users from accessing login page
  if (request.nextUrl.pathname === '/auth/login') {
    const token = request.cookies.get('token');
    
    if (token) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/auth/login']
};