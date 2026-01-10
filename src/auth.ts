import NextAuth from "next-auth";
import { NaverProvider } from "@/lib/auth/chzzk-provider";
import { createServiceClient } from "@/lib/supabase/server";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID!,
      clientSecret: process.env.NAVER_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "naver" && profile) {
        try {
          const supabase = createServiceClient();
          const naverProfile = profile as any;

          // 사용자 정보 저장 또는 업데이트
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('chzzk_id', naverProfile.response.id)
            .single();

          if (!existingUser) {
            // 새 사용자 생성
            await supabase.from('users').insert({
              chzzk_id: naverProfile.response.id,
              channel_id: naverProfile.response.id, // 나중에 치지직 채널 연동 시 업데이트
              channel_name: naverProfile.response.nickname || '새 사용자',
              profile_image: naverProfile.response.profile_image,
            });

            // 기본 설정 생성
            const { data: newUser } = await supabase
              .from('users')
              .select('id')
              .eq('chzzk_id', naverProfile.response.id)
              .single();

            if (newUser) {
              await supabase.from('bot_settings').insert({
                user_id: newUser.id,
              });
            }
          }
        } catch (error) {
          console.error('Error saving user:', error);
        }
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "naver" && profile) {
        const naverProfile = profile as any;
        token.naverId = naverProfile.response.id;
        token.nickname = naverProfile.response.nickname;
        token.profileImage = naverProfile.response.profile_image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.naverId as string;
        session.user.name = token.nickname as string;
        session.user.image = token.profileImage as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
