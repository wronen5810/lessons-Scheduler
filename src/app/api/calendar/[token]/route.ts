// GET /api/calendar/[token]
// Public endpoint — no session auth, authenticated by the token in the URL.
// Returns an RFC 5545 iCalendar feed of the teacher's lessons.
// Subscribe to this URL in Google Calendar, Apple Calendar, or Outlook.

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

// Fold long lines per RFC 5545 (max 75 octets, continue with CRLF + space)
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

  // Resolve teacher from token
  const { data: settings } = await supabase
    .from('teacher_settings')
    .select('teacher_id')
    .eq('calendar_token', token)
    .single();

  if (!settings) return new Response('Not found', { status: 404 });

  const teacherId = settings.teacher_id as string;

  // Date window: 60 days past → 6 months future
  const now = new Date();
  const past = new Date(now); past.setDate(past.getDate() - 60);
  const future = new Date(now); future.setMonth(future.getMonth() + 6);
  const pastStr   = past.toISOString().slice(0, 10);
  const futureStr = future.toISOString().slice(0, 10);

  const [
    { data: otBookings },
    { data: recBookings },
    { data: templates },
    { data: groups },
  ] = await Promise.all([
    supabase
      .from('one_time_bookings')
      .select('id, student_name, group_id, specific_date, start_time, duration_minutes, status')
      .eq('teacher_id', teacherId)
      .gte('specific_date', pastStr)
      .lte('specific_date', futureStr)
      .neq('status', 'rejected'),
    supabase
      .from('recurring_bookings')
      .select('id, student_name, group_id, lesson_date, template_id, status')
      .eq('teacher_id', teacherId)
      .gte('lesson_date', pastStr)
      .lte('lesson_date', futureStr)
      .neq('status', 'rejected'),
    supabase
      .from('slot_templates')
      .select('id, start_time, duration_minutes')
      .eq('teacher_id', teacherId),
    supabase
      .from('student_groups')
      .select('id, name')
      .eq('teacher_id', teacherId),
  ]);

  const tplMap   = new Map((templates ?? []).map((t) => [t.id, t]));
  const groupMap = new Map((groups   ?? []).map((g) => [g.id, g.name as string]));
  const dtstamp  = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Saderot//Lessons Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Lessons',
    'X-WR-TIMEZONE:Asia/Jerusalem',
    'X-WR-CALDESC:Your lesson schedule',
  ];

  function addEvent(
    uid: string,
    date: string,
    startTime: string,
    durationMins: number,
    summary: string,
    status: string,
  ) {
    const start = icsDate(date, startTime);
    const end   = icsDate(date, addMinutes(startTime, durationMins));
    const cancelled = status === 'cancelled';
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}@saderot`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;TZID=Asia/Jerusalem:${start}`,
      `DTEND;TZID=Asia/Jerusalem:${end}`,
      `SUMMARY:${escICS(summary)}`,
      `STATUS:${cancelled ? 'CANCELLED' : 'CONFIRMED'}`,
      ...(cancelled ? ['CLASS:PRIVATE'] : []),
      'END:VEVENT',
    );
  }

  for (const b of otBookings ?? []) {
    const groupName = b.group_id ? groupMap.get(b.group_id) : null;
    const label = groupName ? `Group: ${groupName}` : `Lesson — ${b.student_name}`;
    addEvent(`ot-${b.id}`, b.specific_date, b.start_time, b.duration_minutes ?? 45, label, b.status);
  }

  for (const b of recBookings ?? []) {
    const tpl = tplMap.get(b.template_id);
    if (!tpl) continue;
    const groupName = b.group_id ? groupMap.get(b.group_id) : null;
    const label = groupName ? `Group: ${groupName}` : `Lesson — ${b.student_name}`;
    addEvent(`rec-${b.id}`, b.lesson_date, tpl.start_time, tpl.duration_minutes ?? 45, label, b.status);
  }

  lines.push('END:VCALENDAR');

  const ics = lines.map(foldLine).join('\r\n') + '\r\n';

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="lessons.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
