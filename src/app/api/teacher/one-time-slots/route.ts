import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { todayInIsrael } from '@/lib/dates';

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

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

  const { specific_date, start_time, duration_minutes, title, max_participants } = await request.json();
  if (!specific_date || !start_time) {
    return NextResponse.json({ error: 'Date and start time are required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  // Overlap check: other one-time slots on the same date
  const newStart = timeToMin(start_time);
  const newDur = duration_minutes ?? 45;
  const dayOfWeek = new Date(specific_date + 'T00:00:00').getDay();

  const [{ data: existingOneTime }, { data: existingTemplates }] = await Promise.all([
    supabase
      .from('one_time_slots')
      .select('start_time, duration_minutes')
      .eq('teacher_id', auth.user.id)
      .eq('specific_date', specific_date),
    supabase
      .from('slot_templates')
      .select('start_time, duration_minutes')
      .eq('teacher_id', auth.user.id)
      .eq('day_of_week', dayOfWeek)
      .or(`end_date.is.null,end_date.gte.${specific_date}`),
  ]);

  for (const s of [...(existingOneTime ?? []), ...(existingTemplates ?? [])]) {
    const es = timeToMin(s.start_time);
    const ed = s.duration_minutes ?? 45;
    if (newStart < es + ed && es < newStart + newDur) {
      return NextResponse.json(
        { error: `Overlaps with an existing slot at ${s.start_time}` },
        { status: 409 }
      );
    }
  }

  const { data, error } = await supabase
    .from('one_time_slots')
    .insert({
      specific_date,
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
      return NextResponse.json({ error: 'A slot already exists at this date and time' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
