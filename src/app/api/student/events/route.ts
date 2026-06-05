// GET  /api/student/events?email=...&teacherId=...
// POST /api/student/events

import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { claimsFromRequest } from '@/lib/student-token';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email    = searchParams.get('email')?.toLowerCase().trim();
  const teacherId = searchParams.get('teacherId');

  if (!email || !teacherId) {
    return NextResponse.json({ error: 'email and teacherId required' }, { status: 400 });
  }

  const claims = claimsFromRequest(request);
  if (!claims || claims.email !== email || claims.teacherId !== teacherId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceSupabase();

  // Resolve student ID
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('teacher_id', teacherId)
    .ilike('email', email)
    .single();

  const studentId = student?.id ?? null;
  if (!studentId) return NextResponse.json([]);

  // Fetch events: student-created OR assigned via calendar_event_students
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('student_id', studentId)
    .order('event_date')
    .order('event_time', { nullsFirst: true });

  // Separate query for assigned events (via calendar_event_students)
  const { data: assigned } = await supabase
    .from('calendar_event_students')
    .select('event_id')
    .eq('student_id', studentId);

  const assignedIds = (assigned ?? []).map((r) => r.event_id);

  // Fetch those events too
  let assignedEvents: typeof data = [];
  if (assignedIds.length > 0) {
    const { data: ae } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('teacher_id', teacherId)
      .in('id', assignedIds)
      .order('event_date')
      .order('event_time', { nullsFirst: true });
    assignedEvents = ae ?? [];
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Merge, deduplicate, then filter to events that end today or later
  const all = [...(data ?? []), ...assignedEvents];
  const unique = Array.from(new Map(all.map((e) => [e.id, e])).values());
  const upcoming = unique.filter((e) => (e.event_end_date ?? e.event_date) >= today);
  upcoming.sort((a, b) => (a.event_date < b.event_date ? -1 : a.event_date > b.event_date ? 1 : 0));

  return NextResponse.json(upcoming);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, teacherId, event_type, description, event_date, event_time, event_end_date, event_end_time } = body as {
    email: string;
    teacherId: string;
    event_type: string;
    description: string;
    event_date: string;
    event_time?: string;
    event_end_date?: string;
    event_end_time?: string;
  };

  if (!email || !teacherId) {
    return NextResponse.json({ error: 'email and teacherId required' }, { status: 400 });
  }

  const claims = claimsFromRequest(request);
  if (!claims || claims.email !== email.toLowerCase().trim() || claims.teacherId !== teacherId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!event_type || !description?.trim() || !event_date) {
    return NextResponse.json({ error: 'event_type, description, and event_date are required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('teacher_id', teacherId)
    .ilike('email', email.toLowerCase().trim())
    .single();

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      teacher_id: teacherId,
      created_by: 'student',
      student_id: student.id,
      event_type,
      description: description.trim(),
      event_date,
      event_time: event_time || null,
      event_end_date: event_end_date || null,
      event_end_time: event_end_time || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
