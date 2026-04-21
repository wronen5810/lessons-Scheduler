import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/templates — list all slot templates for this teacher
export async function GET() {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('slot_templates')
    .select('*')
    .eq('teacher_id', auth.user.id)
    .order('day_of_week')
    .order('start_time');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/templates — create a new slot template
export async function POST(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const body = await request.json();
  const { day_of_week, start_time, duration_minutes, title, max_participants } = body;

  if (day_of_week === undefined || !start_time) {
    return NextResponse.json({ error: 'day_of_week and start_time are required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('slot_templates')
    .insert({
      day_of_week,
      start_time,
      duration_minutes: duration_minutes ?? 45,
      teacher_id: auth.user.id,
      title: title?.trim() || null,
      max_participants: max_participants ?? 1,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A slot at this day and time already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
