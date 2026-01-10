import { auth } from '@/auth';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// 노래 대기열 조회
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('chzzk_id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 대기 중인 노래 (재생되지 않은 것)
    const { data: queue } = await supabase
      .from('song_queue')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_played', false)
      .order('created_at', { ascending: true });

    // 현재 재생 중인 노래 (가장 최근에 재생으로 표시된 것)
    const { data: current } = await supabase
      .from('song_queue')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_played', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      queue: queue || [],
      current: current || null,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
