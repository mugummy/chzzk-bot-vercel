import NextAuth from "next-auth";
import ChzzkProvider from "@/lib/auth/chzzk-provider";
import { createServiceClient } from "@/lib/supabase/server";

const redirectUri = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/api/auth/callback/chzzk`
  : "https://mugumchzzkbot.vercel.app/api/auth/callback/chzzk";

// 디버그 로그
console.log("[Auth] Config:", {
  clientId: process.env.CHZZK_CLIENT_ID ? "SET" : "MISSING",
  clientSecret: process.env.CHZZK_CLIENT_SECRET ? "SET" : "MISSING",
  redirectUri,
  nextauthUrl: process.env.NEXTAUTH_URL,
  authSecret: process.env.AUTH_SECRET ? "SET" : "MISSING",
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  providers: [
    ChzzkProvider({
      clientId: process.env.CHZZK_CLIENT_ID!,
      clientSecret: process.env.CHZZK_CLIENT_SECRET!,
      redirectUri: redirectUri,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "chzzk" && profile) {
        try {
          const supabase = createServiceClient();
          const chzzkProfile = profile as any;

          // 사용자 정보 저장 또는 업데이트
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('chzzk_id', chzzkProfile.content.channelId)
            .single();

          if (!existingUser) {
            // 새 사용자 생성
            await supabase.from('users').insert({
              chzzk_id: chzzkProfile.content.channelId,
              channel_id: chzzkProfile.content.channelId,
              channel_name: chzzkProfile.content.channelName || '새 사용자',
              profile_image: chzzkProfile.content.channelImageUrl,
            });

            // 기본 설정 생성
            const { data: newUser } = await supabase
              .from('users')
              .select('id')
              .eq('chzzk_id', chzzkProfile.content.channelId)
              .single();

            if (newUser) {
              await supabase.from('bot_settings').insert({
                user_id: newUser.id,
              });
            }
          } else {
            // 기존 사용자 정보 업데이트
            await supabase.from('users').update({
              channel_name: chzzkProfile.content.channelName,
              profile_image: chzzkProfile.content.channelImageUrl,
              updated_at: new Date().toISOString(),
            }).eq('chzzk_id', chzzkProfile.content.channelId);
          }
        } catch (error) {
          console.error('Error saving user:', error);
        }
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "chzzk" && profile) {
        const chzzkProfile = profile as any;
        token.channelId = chzzkProfile.content.channelId;
        token.channelName = chzzkProfile.content.channelName;
        token.channelImageUrl = chzzkProfile.content.channelImageUrl;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.channelId as string;
        session.user.name = token.channelName as string;
        session.user.image = token.channelImageUrl as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
