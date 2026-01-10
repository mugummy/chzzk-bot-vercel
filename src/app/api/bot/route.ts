import { auth } from '@/auth';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 봇 상태 조회
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: user } = await supabase
      .from('users')
      .select('id, channel_id')
      .eq('chzzk_id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 현재 봇 세션 상태 확인
    const { data: botSession } = await supabase
      .from('bot_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    return NextResponse.json({
      isRunning: !!botSession,
      session: botSession,
      channelId: user.channel_id,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 봇 시작/중지
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();
    const supabase = await createClient();

    const { data: user } = await supabase
      .from('users')
      .select('id, channel_id')
      .eq('chzzk_id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.channel_id) {
      return NextResponse.json(
        { error: 'Channel not connected' },
        { status: 400 }
      );
    }

    if (action === 'start') {
      // 기존 세션 비활성화
      await supabase
        .from('bot_sessions')
        .update({ is_active: false, disconnected_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_active', true);

      // 새 세션 생성
      const { data: newSession, error } = await supabase
        .from('bot_sessions')
        .insert({
          user_id: user.id,
          channel_id: user.channel_id,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // 실제 봇 연결은 별도의 서버리스 함수 또는 Edge Function에서 처리
      // Vercel에서는 WebSocket을 직접 사용할 수 없으므로
      // 외부 서비스(예: Supabase Edge Functions)를 활용해야 함

      return NextResponse.json({
        success: true,
        message: 'Bot session created',
        session: newSession,
      });
    } else if (action === 'stop') {
      // 세션 비활성화
      await supabase
        .from('bot_sessions')
        .update({ is_active: false, disconnected_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_active', true);

      return NextResponse.json({
        success: true,
        message: 'Bot session stopped',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
