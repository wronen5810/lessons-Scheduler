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
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('teacher_id', teacherId)
    .gte('event_date', new Date().toISOString().slice(0, 10))
    .or(`student_id.eq.${studentId},id.in.(${
      // Subquery is not directly supported; we do a separate query and filter
      'null'
    })`)
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
      .gte('event_date', new Date().toISOString().slice(0, 10))
      .order('event_date')
      .order('event_time', { nullsFirst: true });
    assignedEvents = ae ?? [];
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Merge and deduplicate by id, sort by date
  const ownEvents = (data ?? []).filter((e) => e.student_id === studentId);
  const all = [...ownEvents, ...assignedEvents];
  const unique = Array.from(new Map(all.map((e) => [e.id, e])).values());
  unique.sort((a, b) => (a.event_date < b.event_date ? -1 : a.event_date > b.event_date ? 1 : 0));

  return NextResponse.json(unique);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, teacherId, event_type, description, event_date, event_time } = body as {
    email: string;
    teacherId: string;
    event_type: string;
    description: string;
    event_date: string;
    event_time?: string;
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
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
