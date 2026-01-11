// 치지직 OAuth 콜백 - 인증 후 여기로 돌아옴
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { SignJWT } from "jose";

interface ChzzkTokenResponse {
  code: number;
  message: string;
  content?: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
  };
}

interface ChzzkUserResponse {
  code: number;
  message: string;
  content?: {
    channelId: string;
    channelName: string;
    nickname?: string;
    channelImageUrl?: string | null;
    profileImageUrl?: string | null;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  console.log("[Chzzk Callback] Received code:", code?.substring(0, 10) + "...");
  console.log("[Chzzk Callback] Received state:", state?.substring(0, 20) + "...");

  // state 검증
  const cookieStore = await cookies();
  const savedState = cookieStore.get("chzzk_oauth_state")?.value;

  if (!savedState || savedState !== state) {
    console.error("[Chzzk Callback] State mismatch:", { savedState, state });
    return NextResponse.redirect(new URL("/login?error=state_mismatch", request.url));
  }

  // state 쿠키 삭제
  cookieStore.delete("chzzk_oauth_state");

  if (!code) {
    console.error("[Chzzk Callback] No code received");
    return NextResponse.redirect(new URL("/login?error=no_code", request.url));
  }

  try {
    // 1. 토큰 요청
    const clientId = process.env.CHZZK_CLIENT_ID!;
    const clientSecret = process.env.CHZZK_CLIENT_SECRET!;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/chzzk/callback`;

    const tokenRequestBody = {
      grantType: "authorization_code",
      clientId,
      clientSecret,
      code,
      state,
    };

    console.log("[Chzzk Callback] Token request body:", JSON.stringify(tokenRequestBody, null, 2));

    const tokenResponse = await fetch("https://openapi.chzzk.naver.com/auth/v1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tokenRequestBody),
    });

    const tokenData: ChzzkTokenResponse = await tokenResponse.json();
    console.log("[Chzzk Callback] Token response:", JSON.stringify(tokenData, null, 2));

    if (tokenData.code !== 200 || !tokenData.content) {
      console.error("[Chzzk Callback] Token error:", tokenData);
      return NextResponse.redirect(new URL(`/login?error=token_failed&message=${encodeURIComponent(tokenData.message)}`, request.url));
    }

    const accessToken = tokenData.content.accessToken;

    // 2. 사용자 정보 요청
    const userResponse = await fetch("https://openapi.chzzk.naver.com/open/v1/users/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userData: ChzzkUserResponse = await userResponse.json();
    console.log("[Chzzk Callback] User response:", JSON.stringify(userData, null, 2));

    if (userData.code !== 200 || !userData.content) {
      console.error("[Chzzk Callback] User info error:", userData);
      return NextResponse.redirect(new URL("/login?error=user_info_failed", request.url));
    }

    const { channelId, channelName, channelImageUrl, profileImageUrl } = userData.content;
    const imageUrl = channelImageUrl || profileImageUrl || null;

    // 3. Supabase에 사용자 저장/업데이트
    const supabase = createServiceClient();

    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("chzzk_id", channelId)
      .single();

    let userId: string;

    if (!existingUser) {
      // 새 사용자 생성
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          chzzk_id: channelId,
          channel_id: channelId,
          channel_name: channelName || "새 사용자",
          profile_image: imageUrl,
        })
        .select("id")
        .single();

      if (insertError || !newUser) {
        console.error("[Chzzk Callback] Failed to create user:", insertError);
        return NextResponse.redirect(new URL("/login?error=db_error", request.url));
      }

      userId = newUser.id;

      // 기본 봇 설정 생성
      await supabase.from("bot_settings").insert({
        user_id: userId,
      });

      // 기본 봇 세션 생성
      await supabase.from("bot_sessions").insert({
        user_id: userId,
        is_active: false,
      });
    } else {
      // 기존 사용자 업데이트
      await supabase
        .from("users")
        .update({
          channel_name: channelName,
          profile_image: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("chzzk_id", channelId);

      userId = existingUser.id;
    }

    // 4. JWT 세션 토큰 생성
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const sessionToken = await new SignJWT({
      userId,
      channelId,
      channelName,
      channelImageUrl: imageUrl,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    // 5. 세션 쿠키 설정 및 대시보드로 리다이렉트
    const baseUrl = process.env.NEXTAUTH_URL || "https://mugumchzzkbot.vercel.app";
    const response = NextResponse.redirect(`${baseUrl}/dashboard`);

    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: "/",
    });

    console.log("[Chzzk Callback] Login successful for:", channelName);
    console.log("[Chzzk Callback] Redirecting to:", `${baseUrl}/dashboard`);
    console.log("[Chzzk Callback] Session token set:", sessionToken.substring(0, 20) + "...");

    return response;
  } catch (error) {
    console.error("[Chzzk Callback] Error:", error);
    return NextResponse.redirect(new URL("/login?error=unknown", request.url));
  }
}
