import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/admin/teacher-subscriptions?teacher_id=
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const teacherId = new URL(request.url).searchParams.get('teacher_id');
  if (!teacherId) return NextResponse.json({ error: 'teacher_id required' }, { status: 400 });

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('teacher_subscriptions')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('start_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/admin/teacher-subscriptions
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { teacher_id, start_date, end_date, cost, notes } = await request.json();
  if (!teacher_id || !start_date) {
    return NextResponse.json({ error: 'teacher_id and start_date are required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('teacher_subscriptions')
    .insert({
      teacher_id,
      start_date,
      end_date: end_date || null,
      cost: cost ?? 0,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
