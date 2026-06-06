// GET /api/student-calendar/[token]
// Public endpoint — authenticated by token only.
// Returns an RFC 5545 iCalendar feed of the student's lessons and events.

import { createServiceSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

function icsDate(date: string, time: string): string {
  const [y, mo, d] = date.split('-');
  const parts = (time + ':00:00').split(':');
  const h = parts[0].padStart(2, '0');
  const m = (parts[1] ?? '00').padStart(2, '0');
  const s = (parts[2] ?? '00').padStart(2, '0');
  return `${y}${mo}${d}T${h}${m}${s}`;
}

function icsDateOnly(date: string): string {
  return date.replace(/-/g, '');
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`;
}

function escICS(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  let out = '';
  let pos = 0;
  while (pos < line.length) {
    if (pos === 0) {
      out += line.slice(0, 75);
      pos = 75;
    } else {
      out += '\r\n ' + line.slice(pos, pos + 74);
      pos += 74;
    }
  }
  return out;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) return new Response('Not found', { status: 404 });

  const supabase = createServiceSupabase();

  // Resolve student from token
  const { data: student } = await supabase
    .from('students')
    .select('id, email, teacher_id, name')
    .eq('calendar_token', token)
    .single();

  if (!student) return new Response('Not found', { status: 404 });

  const { id: studentId, email: studentEmail, teacher_id: teacherId } = student;

  // Date window: 60 days past → 6 months future
  const now = new Date();
  const past = new Date(now); past.setDate(past.getDate() - 60);
  const future = new Date(now); future.setMonth(future.getMonth() + 6);
  const pastStr   = past.toISOString().slice(0, 10);
  const futureStr = future.toISOString().slice(0, 10);

  // Fetch student's group IDs
  const { data: memberships } = await supabase
    .from('student_group_members')
    .select('group_id')
    .eq('student_id', studentId);
  const groupIds = (memberships ?? []).map((m) => m.group_id);

  // Fetch bookings and events in parallel
  const [
    { data: otPersonal },
    { data: recPersonal },
    { data: otGroup },
    { data: recGroup },
    { data: templates },
    { data: groups },
    { data: myEvents },
    { data: assignedEventIds },
  ] = await Promise.all([
    supabase
      .from('one_time_bookings')
      .select('id, specific_date, start_time, duration_minutes, status')
      .eq('teacher_id', teacherId)
      .ilike('student_email', studentEmail)
      .in('status', ['pending', 'approved', 'cancellation_requested'])
      .gte('specific_date', pastStr)
      .lte('specific_date', futureStr),
    supabase
      .from('recurring_bookings')
      .select('id, lesson_date, template_id, status')
      .eq('teacher_id', teacherId)
      .ilike('student_email', studentEmail)
      .in('status', ['pending', 'approved', 'cancellation_requested'])
      .gte('lesson_date', pastStr)
      .lte('lesson_date', futureStr),
    groupIds.length
      ? supabase
          .from('one_time_bookings')
          .select('id, specific_date, start_time, duration_minutes, status, group_id')
          .eq('teacher_id', teacherId)
          .in('group_id', groupIds)
          .in('status', ['approved', 'cancellation_requested'])
          .gte('specific_date', pastStr)
          .lte('specific_date', futureStr)
      : Promise.resolve({ data: [] }),
    groupIds.length
      ? supabase
          .from('recurring_bookings')
          .select('id, lesson_date, template_id, status, group_id')
          .eq('teacher_id', teacherId)
          .in('group_id', groupIds)
          .in('status', ['approved', 'cancellation_requested'])
          .gte('lesson_date', pastStr)
          .lte('lesson_date', futureStr)
      : Promise.resolve({ data: [] }),
    supabase
      .from('slot_templates')
      .select('id, start_time, duration_minutes')
      .eq('teacher_id', teacherId),
    groupIds.length
      ? supabase.from('student_groups').select('id, name').in('id', groupIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from('calendar_events')
      .select('id, event_type, description, event_date, event_time, event_end_date')
      .eq('teacher_id', teacherId)
      .eq('student_id', studentId)
      .gte('event_date', pastStr),
    supabase
      .from('calendar_event_students')
      .select('event_id')
      .eq('student_id', studentId),
  ]);

  // Fetch assigned events
  const assignedIds = (assignedEventIds ?? []).map((r) => r.event_id);
  let assignedEvents: typeof myEvents = [];
  if (assignedIds.length > 0) {
    const { data: ae } = await supabase
      .from('calendar_events')
      .select('id, event_type, description, event_date, event_time, event_end_date')
      .eq('teacher_id', teacherId)
      .in('id', assignedIds)
      .gte('event_date', pastStr);
    assignedEvents = ae ?? [];
  }

  const tplMap   = new Map((templates ?? []).map((t) => [t.id, t]));
  const groupMap = new Map((groups ?? []).map((g) => [g.id, g.name as string]));
  const dtstamp  = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Saderot//Student Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escICS(student.name ?? 'My Lessons')}`,
    'X-WR-TIMEZONE:Asia/Jerusalem',
    'X-WR-CALDESC:Your lesson schedule',
  ];

  function addLesson(
    uid: string,
    date: string,
    startTime: string,
    durationMins: number,
    summary: string,
    status: string,
  ) {
    const start = icsDate(date, startTime);
    const end   = icsDate(date, addMinutes(startTime, durationMins));
    const cancelled = status === 'cancellation_requested';
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}@saderot-student`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;TZID=Asia/Jerusalem:${start}`,
      `DTEND;TZID=Asia/Jerusalem:${end}`,
      `SUMMARY:${escICS(summary)}`,
      `STATUS:${cancelled ? 'CANCELLED' : status === 'pending' ? 'TENTATIVE' : 'CONFIRMED'}`,
      'END:VEVENT',
    );
  }

  const eventTypeEmoji: Record<string, string> = {
    exam: '📝', task: '✅', paperwork: '📄', vacation: '🏖️', other: '📌',
  };

  function addCalEvent(e: {
    id: string;
    event_type: string;
    description: string;
    event_date: string;
    event_time: string | null;
    event_end_date: string | null;
  }) {
    const emoji = eventTypeEmoji[e.event_type] ?? '📌';
    const summary = `${emoji} ${e.description}`;
    const endDate = e.event_end_date ?? e.event_date;

    if (e.event_time) {
      // Timed event — single day
      const start = icsDate(e.event_date, e.event_time);
      const end   = icsDate(e.event_date, addMinutes(e.event_time, 60));
      lines.push(
        'BEGIN:VEVENT',
        `UID:evt-${e.id}@saderot-student`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;TZID=Asia/Jerusalem:${start}`,
        `DTEND;TZID=Asia/Jerusalem:${end}`,
        `SUMMARY:${escICS(summary)}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
      );
    } else {
      // All-day event (possibly multi-day)
      // DTEND for all-day is exclusive (next day after last day)
      const endExclusive = new Date(endDate);
      endExclusive.setDate(endExclusive.getDate() + 1);
      const endStr = endExclusive.toISOString().slice(0, 10).replace(/-/g, '');
      lines.push(
        'BEGIN:VEVENT',
        `UID:evt-${e.id}@saderot-student`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${icsDateOnly(e.event_date)}`,
        `DTEND;VALUE=DATE:${endStr}`,
        `SUMMARY:${escICS(summary)}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
      );
    }
  }

  // Personal lessons
  for (const b of otPersonal ?? []) {
    addLesson(`ot-${b.id}`, b.specific_date, b.start_time, b.duration_minutes ?? 45, 'Lesson', b.status);
  }
  for (const b of recPersonal ?? []) {
    const tpl = tplMap.get(b.template_id);
    if (!tpl) continue;
    addLesson(`rec-${b.id}`, b.lesson_date, tpl.start_time, tpl.duration_minutes ?? 45, 'Lesson', b.status);
  }

  // Group lessons
  for (const b of (otGroup as Array<{ id: string; specific_date: string; start_time: string; duration_minutes: number | null; status: string; group_id: string }> ?? [])) {
    const groupName = groupMap.get(b.group_id) ?? 'Group';
    addLesson(`otg-${b.id}`, b.specific_date, b.start_time, b.duration_minutes ?? 45, `Group: ${groupName}`, b.status);
  }
  for (const b of (recGroup as Array<{ id: string; lesson_date: string; template_id: string; status: string; group_id: string }> ?? [])) {
    const tpl = tplMap.get(b.template_id);
    if (!tpl) continue;
    const groupName = groupMap.get(b.group_id) ?? 'Group';
    addLesson(`recg-${b.id}`, b.lesson_date, tpl.start_time, tpl.duration_minutes ?? 45, `Group: ${groupName}`, b.status);
  }

  // Calendar events (deduplicated)
  const allEvents = [...(myEvents ?? []), ...assignedEvents];
  const uniqueEvents = Array.from(new Map(allEvents.map((e) => [e.id, e])).values());
  for (const e of uniqueEvents) {
    addCalEvent(e as { id: string; event_type: string; description: string; event_date: string; event_time: string | null; event_end_date: string | null });
  }

  lines.push('END:VCALENDAR');

  const ics = lines.map(foldLine).join('\r\n') + '\r\n';

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="my-lessons.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
