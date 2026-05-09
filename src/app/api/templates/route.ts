import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

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
  const { day_of_week, start_time, duration_minutes, title, max_participants, end_date } = body;

  if (day_of_week === undefined || !start_time) {
    return NextResponse.json({ error: 'day_of_week and start_time are required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  // Overlap check: reject if new slot's time range intersects any existing template on the same day_of_week
  const newStart = timeToMin(start_time);
  const newDur = duration_minutes ?? 45;
  const { data: existing } = await supabase
    .from('slot_templates')
    .select('start_time, duration_minutes')
    .eq('teacher_id', auth.user.id)
    .eq('day_of_week', day_of_week);
  for (const s of existing ?? []) {
    const es = timeToMin(s.start_time);
    const ed = (s.duration_minutes ?? 45);
    if (newStart < es + ed && es < newStart + newDur) {
      return NextResponse.json(
        { error: `Overlaps with an existing slot at ${s.start_time}` },
        { status: 409 }
      );
    }
  }

  const { data, error } = await supabase
    .from('slot_templates')
    .insert({
      day_of_week,
      start_time,
      duration_minutes: duration_minutes ?? 45,
      teacher_id: auth.user.id,
      title: title?.trim() || null,
      max_participants: max_participants ?? 1,
      end_date: end_date || null,
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
