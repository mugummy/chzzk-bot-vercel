// 치지직 OAuth Provider for NextAuth v5
// 치지직 공식 개발자 센터 OAuth 사용

import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";

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

export interface ChzzkProviderConfig extends OAuthUserConfig<ChzzkProfile> {
  redirectUri?: string;
}

// 치지직 OAuth Provider
export default function ChzzkProvider(options: ChzzkProviderConfig): OAuthConfig<ChzzkProfile> {
  const redirectUri = options.redirectUri || `${process.env.NEXTAUTH_URL}/api/auth/callback/chzzk`;

  return {
    id: "chzzk",
    name: "Chzzk",
    type: "oauth",

    authorization: {
      url: "https://chzzk.naver.com/account-interlock",
      params: {
        clientId: options.clientId,
        redirectUri: redirectUri,
        state: crypto.randomUUID(),
      },
    },

    token: {
      url: "https://openapi.chzzk.naver.com/auth/v1/token",
      conform: async (response: Response) => {
        // Chzzk API는 항상 200을 반환하고 내부 code로 성공/실패 구분
        // NextAuth가 response를 처리할 수 있도록 변환
        const data = await response.json() as ChzzkTokenResponse;

        if (data.code !== 200) {
          console.error("Chzzk token error:", data);
          throw new Error(data.message || "Token request failed");
        }

        // NextAuth가 기대하는 표준 OAuth 응답 형식으로 변환
        const standardResponse = new Response(JSON.stringify({
          access_token: data.content.accessToken,
          refresh_token: data.content.refreshToken,
          token_type: data.content.tokenType || "Bearer",
          expires_in: data.content.expiresIn,
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

        return standardResponse;
      },
    },

    userinfo: {
      url: "https://openapi.chzzk.naver.com/open/v1/users/me",
      async request({ tokens }: { tokens: { access_token: string } }) {
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

    client: {
      token_endpoint_auth_method: "client_secret_post",
    },

    clientId: options.clientId,
    clientSecret: options.clientSecret,
  };
}

// Named export도 추가
export { ChzzkProvider };

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
