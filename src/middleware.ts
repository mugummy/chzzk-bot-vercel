import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login');
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard');
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');
  const isPublicRoute = req.nextUrl.pathname === '/' ||
                        req.nextUrl.pathname.startsWith('/overlay');

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
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // 대시보드 접근 시 로그인 필요
  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
