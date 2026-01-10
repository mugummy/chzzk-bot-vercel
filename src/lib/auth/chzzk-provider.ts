// 치지직 OAuth Provider for NextAuth
// 참고: 치지직은 공식 OAuth를 제공하지 않으므로
// 네이버 로그인을 통해 치지직 계정 정보를 가져오는 방식 사용

import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";

export interface ChzzkProfile {
  resultCode: string;
  message: string;
  content: {
    userIdHash: string;
    nickname: string;
    profileImageUrl: string | null;
    channelId: string;
    channelName: string;
  };
}

export interface NaverProfile {
  resultcode: string;
  message: string;
  response: {
    id: string;
    nickname: string;
    profile_image: string;
    email: string;
    name: string;
  };
}

// 네이버 OAuth Provider (치지직 연동용)
export function NaverProvider(
  options: OAuthUserConfig<NaverProfile>
) {
  return {
    ...options,
    id: "naver",
    name: "Naver",
    type: "oauth" as const,
    checks: ["state"] as ("state" | "pkce" | "none")[],
    authorization: {
      url: "https://nid.naver.com/oauth2.0/authorize",
      params: { response_type: "code" },
    },
    token: "https://nid.naver.com/oauth2.0/token",
    userinfo: "https://openapi.naver.com/v1/nid/me",
    profile(profile: NaverProfile) {
      return {
        id: profile.response.id,
        name: profile.response.nickname || profile.response.name,
        email: profile.response.email,
        image: profile.response.profile_image,
      };
    },
  };
}

// 치지직 채널 정보 가져오기
export async function getChzzkChannelInfo(channelId: string): Promise<{
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
  followerCount: number;
} | null> {
  try {
    const response = await fetch(
      `https://api.chzzk.naver.com/service/v1/channels/${channelId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return {
      channelId: data.content.channelId,
      channelName: data.content.channelName,
      channelImageUrl: data.content.channelImageUrl,
      followerCount: data.content.followerCount,
    };
  } catch (error) {
    console.error('Failed to fetch Chzzk channel info:', error);
    return null;
  }
}

// 치지직 유저 검색 (닉네임으로)
export async function searchChzzkUser(keyword: string): Promise<{
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
}[]> {
  try {
    const response = await fetch(
      `https://api.chzzk.naver.com/service/v1/search/channels?keyword=${encodeURIComponent(keyword)}&size=5`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.content.data || [];
  } catch (error) {
    console.error('Failed to search Chzzk user:', error);
    return [];
  }
}
