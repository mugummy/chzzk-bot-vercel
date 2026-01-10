import { auth } from '@/auth';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 명령어 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { trigger, response, aliases, cooldown, user_level, enabled } = body;

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

    // 명령어 소유권 확인
    const { data: existingCommand } = await supabase
      .from('commands')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existingCommand) {
      return NextResponse.json({ error: 'Command not found' }, { status: 404 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (trigger !== undefined) updateData.trigger = trigger;
    if (response !== undefined) updateData.response = response;
    if (aliases !== undefined) updateData.aliases = aliases;
    if (cooldown !== undefined) updateData.cooldown = cooldown;
    if (user_level !== undefined) updateData.user_level = user_level;
    if (enabled !== undefined) updateData.enabled = enabled;

    const { data: command, error } = await supabase
      .from('commands')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(command);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 명령어 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
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

    // 명령어 소유권 확인 및 삭제
    const { error } = await supabase
      .from('commands')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
