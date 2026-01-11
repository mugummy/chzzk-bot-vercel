// 치지직 OAuth 시작 - 로그인 버튼 클릭 시 여기로 리다이렉트
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const clientId = process.env.CHZZK_CLIENT_ID!;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/chzzk/callback`;

  // state 생성 (CSRF 방지)
  const state = crypto.randomUUID();

  // state를 쿠키에 저장
  const cookieStore = await cookies();
  cookieStore.set("chzzk_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600, // 10분
  });

  // 치지직 인증 페이지로 리다이렉트
  const authUrl = new URL("https://chzzk.naver.com/account-interlock");
  authUrl.searchParams.set("clientId", clientId);
  authUrl.searchParams.set("redirectUri", redirectUri);
  authUrl.searchParams.set("state", state);

  console.log("[Chzzk OAuth] Redirecting to:", authUrl.toString());

  return NextResponse.redirect(authUrl.toString());
}
