import { NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { formatTime, getEndTime } from '@/lib/dates';

export interface PendingRequest {
  id: string;
  booking_type: 'recurring' | 'one_time';
  request_type: 'lesson_request' | 'cancellation_request';
  student_name: string;
  student_email: string;
  date: string;
  start_time: string;
  end_time: string;
  series_id?: string;
  cancellation_reason?: string;
}

export async function GET() {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();
  const teacherId = auth.user.id;

  const [{ data: pendingRecurring }, { data: cancelRecurring }, { data: pendingOt }, { data: cancelOt }] =
    await Promise.all([
      supabase
        .from('recurring_bookings')
        .select('id, template_id, student_name, student_email, lesson_date, series_id')
        .eq('teacher_id', teacherId)
        .eq('status', 'pending')
        .order('lesson_date'),
      supabase
        .from('recurring_bookings')
        .select('id, template_id, student_name, student_email, lesson_date, series_id, cancellation_reason')
        .eq('teacher_id', teacherId)
        .eq('status', 'cancellation_requested')
        .order('lesson_date'),
      supabase
        .from('one_time_bookings')
        .select('id, specific_date, start_time, duration_minutes, student_name, student_email')
        .eq('teacher_id', teacherId)
        .eq('status', 'pending'),
      supabase
        .from('one_time_bookings')
        .select('id, specific_date, start_time, duration_minutes, student_name, student_email, cancellation_reason')
        .eq('teacher_id', teacherId)
        .eq('status', 'cancellation_requested'),
    ]);

  const templateIds = [
    ...(pendingRecurring ?? []).map((b) => b.template_id),
    ...(cancelRecurring ?? []).map((b) => b.template_id),
  ];
  const { data: templates } = [...new Set(templateIds)].length
    ? await supabase.from('slot_templates').select('id, start_time, duration_minutes').in('id', [...new Set(templateIds)])
    : { data: [] };
  const templateMap = new Map((templates ?? []).map((t) => [t.id, t]));

  const results: PendingRequest[] = [];

  // Group pending recurring by series_id — show one entry per series (first lesson date)
  const pendingSeriesSeen = new Set<string>();
  for (const b of pendingRecurring ?? []) {
    const seriesKey = b.series_id ?? b.id;
    if (pendingSeriesSeen.has(seriesKey)) continue;
    pendingSeriesSeen.add(seriesKey);
    const t = templateMap.get(b.template_id);
    const startTime = t ? formatTime(t.start_time) : '';
    results.push({
      id: b.id,
      booking_type: 'recurring',
      request_type: 'lesson_request',
      student_name: b.student_name,
      student_email: b.student_email,
      date: b.lesson_date,
      start_time: startTime,
      end_time: getEndTime(startTime, t?.duration_minutes ?? 45),
      series_id: b.series_id ?? undefined,
    });
  }

  for (const b of cancelRecurring ?? []) {
    const t = templateMap.get(b.template_id);
    const startTime = t ? formatTime(t.start_time) : '';
    results.push({
      id: b.id,
      booking_type: 'recurring',
      request_type: 'cancellation_request',
      student_name: b.student_name,
      student_email: b.student_email,
      date: b.lesson_date,
      start_time: startTime,
      end_time: getEndTime(startTime, t?.duration_minutes ?? 45),
      series_id: b.series_id ?? undefined,
      cancellation_reason: b.cancellation_reason ?? undefined,
    });
  }

  for (const b of pendingOt ?? []) {
    const startTime = formatTime(b.start_time);
    results.push({
      id: b.id,
      booking_type: 'one_time',
      request_type: 'lesson_request',
      student_name: b.student_name,
      student_email: b.student_email,
      date: b.specific_date,
      start_time: startTime,
      end_time: getEndTime(startTime, b.duration_minutes ?? 45),
    });
  }

  for (const b of cancelOt ?? []) {
    const startTime = formatTime(b.start_time);
    results.push({
      id: b.id,
      booking_type: 'one_time',
      request_type: 'cancellation_request',
      student_name: b.student_name,
      student_email: b.student_email,
      date: b.specific_date,
      start_time: startTime,
      end_time: getEndTime(startTime, b.duration_minutes ?? 45),
      cancellation_reason: b.cancellation_reason ?? undefined,
    });
  }

  results.sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));
  return NextResponse.json(results);
}
