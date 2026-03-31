// middleware.ts (في الـ root folder)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't need authentication
  const publicPaths = ['/login', '/'];
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith('/api/'));

  // Get token from cookies or check localStorage (server-side can't access localStorage)
  const token = request.cookies.get('dashboardToken')?.value;

  // If accessing protected route without token, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If already logged in and trying to access login page, redirect to dashboard
  if (pathname === '/login' && token) {
    // Try to detect role from token (basic JWT parsing)
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      const role = payload.role;
      
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else {
        return NextResponse.redirect(new URL('/salon', request.url));
      }
    } catch (error) {
      // If token is invalid, allow access to login
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};