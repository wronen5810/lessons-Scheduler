import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { todayInIsrael } from '@/lib/dates';

// GET /api/teacher/one-time-slots?from=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') ?? todayInIsrael();

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('one_time_slots')
    .select('*')
    .eq('teacher_id', auth.user.id)
    .gte('specific_date', from)
    .order('specific_date')
    .order('start_time');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/teacher/one-time-slots
export async function POST(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { specific_date, start_time, duration_minutes } = await request.json();
  if (!specific_date || !start_time) {
    return NextResponse.json({ error: 'Date and start time are required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('one_time_slots')
    .insert({ specific_date, start_time, duration_minutes: duration_minutes ?? 45, teacher_id: auth.user.id })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A slot already exists at this date and time' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
