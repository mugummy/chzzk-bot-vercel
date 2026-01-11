import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

async function verifySession(request: NextRequest): Promise<boolean> {
  const sessionToken = request.cookies.get("session")?.value;

  if (!sessionToken) {
    return false;
  }

  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    await jwtVerify(sessionToken, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const isLoggedIn = await verifySession(request);
  const pathname = request.nextUrl.pathname;

  const isAuthPage = pathname.startsWith('/login');
  const isDashboard = pathname.startsWith('/dashboard');
  const isApiRoute = pathname.startsWith('/api');
  const isPublicRoute = pathname === '/' ||
                        pathname.startsWith('/overlay') ||
                        pathname.startsWith('/_next') ||
                        pathname.includes('.');

  // API 라우트는 통과
  if (isApiRoute) {
    return NextResponse.next();
  }

  // 공개 페이지는 통과
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 로그인 페이지
  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 대시보드 접근 시 로그인 필요
  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
