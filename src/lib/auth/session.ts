// 세션 관리 유틸리티
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export interface Session {
  userId: string;
  channelId: string;
  channelName: string;
  channelImageUrl: string | null;
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      return null;
    }

    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(sessionToken, secret);

    return {
      userId: payload.userId as string,
      channelId: payload.channelId as string,
      channelName: payload.channelName as string,
      channelImageUrl: payload.channelImageUrl as string | null,
    };
  } catch (error) {
    console.error("Session verification failed:", error);
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
