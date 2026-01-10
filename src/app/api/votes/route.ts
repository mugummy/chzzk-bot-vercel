import { auth } from '@/auth';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 투표 목록 조회
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

    const { data: votes, error } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(votes);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 새 투표 생성
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question, options, duration_seconds } = await request.json();

    if (!question || !options || options.length < 2) {
      return NextResponse.json(
        { error: 'Question and at least 2 options are required' },
        { status: 400 }
      );
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

    // 기존 활성 투표 비활성화
    await supabase
      .from('votes')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true);

    const formattedOptions = options.map((opt: string, idx: number) => ({
      id: `opt_${idx}`,
      text: opt,
    }));

    const initialResults: Record<string, number> = {};
    formattedOptions.forEach((opt: any) => {
      initialResults[opt.id] = 0;
    });

    const { data: vote, error } = await supabase
      .from('votes')
      .insert({
        user_id: user.id,
        question,
        options: formattedOptions,
        results: initialResults,
        duration_seconds: duration_seconds || 60,
        is_active: true,
        start_time: new Date().toISOString(),
        voters: [],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(vote, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
