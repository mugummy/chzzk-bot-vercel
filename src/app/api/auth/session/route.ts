// 현재 세션 정보 API
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: session.userId,
      channelId: session.channelId,
      name: session.channelName,
      image: session.channelImageUrl,
    },
  });
}
