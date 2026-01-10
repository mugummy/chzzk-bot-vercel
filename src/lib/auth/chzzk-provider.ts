// 치지직 OAuth Provider for NextAuth
// 치지직 공식 개발자 센터 OAuth 사용

import type { OAuthUserConfig } from "next-auth/providers";

export interface ChzzkProfile {
  code: number;
  message: string;
  content: {
    channelId: string;
    channelName: string;
    channelImageUrl: string | null;
  };
}

export interface ChzzkTokenResponse {
  code: number;
  message: string;
  content: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
  };
}

// 치지직 OAuth Provider
export function ChzzkProvider(
  options: OAuthUserConfig<ChzzkProfile>
) {
  return {
    id: "chzzk",
    name: "Chzzk",
    type: "oauth" as const,
    checks: ["state"] as ("state" | "pkce" | "none")[],
    authorization: {
      url: "https://chzzk.naver.com/account-interlock",
      params: {
        clientId: options.clientId,
      },
    },
    token: {
      url: "https://openapi.chzzk.naver.com/auth/v1/token",
      async request({ params, provider }: any) {
        const response = await fetch("https://openapi.chzzk.naver.com/auth/v1/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            grantType: "authorization_code",
            clientId: provider.clientId,
            clientSecret: provider.clientSecret,
            code: params.code,
            state: params.state,
          }),
        });

        const data: ChzzkTokenResponse = await response.json();

        if (data.code !== 200) {
          throw new Error(data.message || "Token request failed");
        }

        return {
          tokens: {
            access_token: data.content.accessToken,
            refresh_token: data.content.refreshToken,
            token_type: data.content.tokenType,
            expires_in: data.content.expiresIn,
          },
        };
      },
    },
    userinfo: {
      url: "https://openapi.chzzk.naver.com/open/v1/users/me",
      async request({ tokens }: any) {
        const response = await fetch("https://openapi.chzzk.naver.com/open/v1/users/me", {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        });

        const data = await response.json();
        return data;
      },
    },
    profile(profile: ChzzkProfile) {
      return {
        id: profile.content.channelId,
        name: profile.content.channelName,
        image: profile.content.channelImageUrl,
      };
    },
    ...options,
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
