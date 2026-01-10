import { auth } from '@/auth';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 포인트 랭킹 조회
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createClient();

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('chzzk_id', session.user.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: points, error, count } = await supabase
      .from('viewer_points')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('points', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      points,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 포인트 수정
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { viewerId, points, action } = await request.json();

    if (!viewerId) {
      return NextResponse.json({ error: 'Viewer ID required' }, { status: 400 });
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

    const { data: existing } = await supabase
      .from('viewer_points')
      .select('*')
      .eq('user_id', user.id)
      .eq('viewer_id', viewerId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Viewer not found' }, { status: 404 });
    }

    let newPoints = existing.points;

    if (action === 'set') {
      newPoints = points;
    } else if (action === 'add') {
      newPoints = existing.points + points;
    } else if (action === 'subtract') {
      newPoints = Math.max(0, existing.points - points);
    }

    const { data: updated, error } = await supabase
      .from('viewer_points')
      .update({
        points: newPoints,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
