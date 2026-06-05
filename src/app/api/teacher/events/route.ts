// GET  /api/teacher/events?from=YYYY-MM-DD&to=YYYY-MM-DD
// POST /api/teacher/events

import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to   = searchParams.get('to');
  if (!from || !to) {
    return NextResponse.json({ error: 'from and to are required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*, calendar_event_students(student_id, students(id, name, email))')
    .eq('teacher_id', auth.user.id)
    .gte('event_date', from)
    .lte('event_date', to)
    .order('event_date')
    .order('event_time', { nullsFirst: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach student_name for student-created events so the calendar can show it
  const enriched = (data ?? []).map((ev) => {
    if (ev.created_by === 'student' && ev.student_id) {
      const row = (ev.calendar_event_students as { students: { name: string } }[] | null)?.find(
        (r) => r.students
      );
      return { ...ev, student_name: row?.students?.name ?? null };
    }
    return ev;
  });

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const body = await request.json();
  const {
    event_type, description, event_date, event_time,
    student_ids, grade,
    reminder_days, reminder_channels,
  } = body as {
    event_type: string;
    description: string;
    event_date: string;
    event_time?: string;
    student_ids?: string[];
    grade?: number;
    reminder_days?: number;
    reminder_channels?: { email: boolean; whatsapp: boolean; push: boolean };
  };

  if (!event_type || !description?.trim() || !event_date) {
    return NextResponse.json({ error: 'event_type, description, and event_date are required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  // Insert the event
  const { data: event, error } = await supabase
    .from('calendar_events')
    .insert({
      teacher_id: auth.user.id,
      created_by: 'teacher',
      event_type,
      description: description.trim(),
      event_date,
      event_time: event_time || null,
      reminder_days: reminder_days ?? null,
      reminder_channels: reminder_channels ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Resolve student IDs to assign
  let assignIds: string[] = student_ids ?? [];

  if (grade != null) {
    const { data: gradeStudents } = await supabase
      .from('students')
      .select('id')
      .eq('teacher_id', auth.user.id)
      .eq('grade', grade);
    const gradeIds = (gradeStudents ?? []).map((s) => s.id);
    assignIds = [...new Set([...assignIds, ...gradeIds])];
  }

  if (assignIds.length > 0) {
    await supabase
      .from('calendar_event_students')
      .insert(assignIds.map((sid) => ({ event_id: event.id, student_id: sid })));
  }

  return NextResponse.json(event, { status: 201 });
}
