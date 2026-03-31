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
  cancellation_reason?: string;
}

// GET /api/teacher/requests
// Returns all pending lesson requests and cancellation requests for the teacher.
export async function GET() {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();
  const teacherId = auth.user.id;

  const [{ data: pendingRecurring }, { data: cancelRecurring }, { data: pendingOt }, { data: cancelOt }] =
    await Promise.all([
      supabase
        .from('recurring_bookings')
        .select('id, template_id, student_name, student_email, started_date')
        .eq('teacher_id', teacherId)
        .eq('status', 'pending'),
      supabase
        .from('recurring_bookings')
        .select('id, template_id, student_name, student_email, started_date, cancellation_reason')
        .eq('teacher_id', teacherId)
        .eq('status', 'cancellation_requested'),
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

  // Collect template IDs needed for recurring bookings
  const templateIds = [
    ...(pendingRecurring ?? []).map((b) => b.template_id),
    ...(cancelRecurring ?? []).map((b) => b.template_id),
  ];
  const uniqueTemplateIds = [...new Set(templateIds)];
  const { data: templates } = uniqueTemplateIds.length
    ? await supabase.from('slot_templates').select('id, day_of_week, start_time, duration_minutes').in('id', uniqueTemplateIds)
    : { data: [] };
  const templateMap = new Map((templates ?? []).map((t) => [t.id, t]));

  const results: PendingRequest[] = [];

  for (const b of pendingRecurring ?? []) {
    const t = templateMap.get(b.template_id);
    const startTime = t ? formatTime(t.start_time) : '';
    results.push({
      id: b.id,
      booking_type: 'recurring',
      request_type: 'lesson_request',
      student_name: b.student_name,
      student_email: b.student_email,
      date: b.started_date,
      start_time: startTime,
      end_time: getEndTime(startTime, t?.duration_minutes ?? 45),
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
      date: b.started_date,
      start_time: startTime,
      end_time: getEndTime(startTime, t?.duration_minutes ?? 45),
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

  // Sort by date then time
  results.sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));

  return NextResponse.json(results);
}
