import { auth } from '@/auth';
import { createClient } from '@/lib/supabase/server';
import { getChzzkChannelInfo } from '@/lib/auth/chzzk-provider';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { channel_id } = await request.json();

    if (!channel_id) {
      return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 });
    }

    // 치지직 채널 정보 확인
    const channelInfo = await getChzzkChannelInfo(channel_id);
    if (!channelInfo) {
      return NextResponse.json({ error: 'Invalid channel ID' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: user, error } = await supabase
      .from('users')
      .update({
        channel_id: channelInfo.channelId,
        channel_name: channelInfo.channelName,
        profile_image: channelInfo.channelImageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('chzzk_id', session.user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
