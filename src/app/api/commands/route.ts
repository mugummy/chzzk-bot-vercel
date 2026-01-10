import { auth } from '@/auth';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 명령어 목록 조회
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // 사용자 ID 가져오기
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('chzzk_id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: commands, error } = await supabase
      .from('commands')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(commands);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 명령어 추가
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { trigger, response, aliases, cooldown, user_level } = body;

    if (!trigger || !response) {
      return NextResponse.json(
        { error: 'Trigger and response are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 사용자 ID 가져오기
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('chzzk_id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 중복 체크
    const { data: existing } = await supabase
      .from('commands')
      .select('id')
      .eq('user_id', user.id)
      .eq('trigger', trigger)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Command with this trigger already exists' },
        { status: 400 }
      );
    }

    const { data: command, error } = await supabase
      .from('commands')
      .insert({
        user_id: user.id,
        trigger,
        response,
        aliases: aliases || [],
        cooldown: cooldown || 5,
        user_level: user_level || 'everyone',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(command, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
