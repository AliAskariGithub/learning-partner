import { auth } from '@/lib/auth/server';
import { NextRequest, NextResponse } from 'next/server';

const authMiddleware = auth.middleware({
  loginUrl: '/sign-in',
});

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If already logged in and visiting auth pages, redirect to /app
  if (pathname === '/sign-in' || pathname === '/sign-up') {
    const { data: session } = await auth.getSession();
    if (session?.user) {
      return NextResponse.redirect(new URL('/app', request.url));
    }
    return NextResponse.next();
  }

  // Protect /app and /settings
  return authMiddleware(request);
}

export default proxy;

export const config = {
  matcher: ['/app/:path*', '/settings/:path*', '/sign-in', '/sign-up'],
};
