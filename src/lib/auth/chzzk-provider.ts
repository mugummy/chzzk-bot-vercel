// 치지직 OAuth Provider for NextAuth v5
// 치지직 공식 개발자 센터 OAuth 사용

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

export interface ChzzkProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
}

// 치지직 OAuth Provider
export default function ChzzkProvider(options: ChzzkProviderConfig) {
  const redirectUri = options.redirectUri || `${process.env.NEXTAUTH_URL}/api/auth/callback/chzzk`;

  return {
    id: "chzzk",
    name: "Chzzk",
    type: "oauth" as const,

    authorization: {
      url: "https://chzzk.naver.com/account-interlock",
      params: {
        clientId: options.clientId,
        redirectUri: redirectUri,
      },
    },

    // NextAuth v5: token endpoint 설정
    token: {
      url: "https://openapi.chzzk.naver.com/auth/v1/token",
      conform: async (response: Response) => {
        const text = await response.text();
        console.log("[Chzzk] Raw token response:", text);

        try {
          const data = JSON.parse(text) as ChzzkTokenResponse;

          if (data.code !== 200) {
            console.error("[Chzzk] Token error:", data);
            // 에러를 표준 OAuth 에러로 변환
            return new Response(JSON.stringify({
              error: "server_error",
              error_description: data.message || "Token request failed",
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          // 성공: 표준 OAuth 응답으로 변환
          const standardResponse = {
            access_token: data.content.accessToken,
            refresh_token: data.content.refreshToken,
            token_type: data.content.tokenType || "Bearer",
            expires_in: data.content.expiresIn,
          };

          console.log("[Chzzk] Transformed token response:", standardResponse);

          return new Response(JSON.stringify(standardResponse), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.error("[Chzzk] Failed to parse token response:", e);
          throw e;
        }
      },
    },

    userinfo: {
      url: "https://openapi.chzzk.naver.com/open/v1/users/me",
      request: async ({ tokens }: { tokens: { access_token?: string } }) => {
        console.log("[Chzzk] Fetching userinfo...");

        const response = await fetch("https://openapi.chzzk.naver.com/open/v1/users/me", {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        });

        const data = await response.json();
        console.log("[Chzzk] Userinfo response:", JSON.stringify(data));
        return data;
      },
    },

    profile(profile: ChzzkProfile) {
      console.log("[Chzzk] Profile:", JSON.stringify(profile));
      return {
        id: profile.content.channelId,
        name: profile.content.channelName,
        image: profile.content.channelImageUrl,
      };
    },

    clientId: options.clientId,
    clientSecret: options.clientSecret,

    // Chzzk는 JSON body로 토큰 요청
    client: {
      token_endpoint_auth_method: "client_secret_post",
    },
  };
}

// Named export
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
