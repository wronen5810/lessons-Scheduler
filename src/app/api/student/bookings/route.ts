import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { formatTime, getEndTime, todayInIsrael } from '@/lib/dates';

// GET /api/student/bookings?email=...&teacherId=...
// Returns the student's upcoming approved/pending/cancellation_requested bookings
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.toLowerCase().trim();
  const teacherId = searchParams.get('teacherId');

  if (!email || !teacherId) {
    return NextResponse.json({ error: 'email and teacherId required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const today = todayInIsrael();

  const [{ data: recurring }, { data: oneTime }] = await Promise.all([
    supabase
      .from('recurring_bookings')
      .select('id, template_id, status, lesson_date, series_id, cancellation_reason')
      .ilike('student_email', email)
      .eq('teacher_id', teacherId)
      .in('status', ['pending', 'approved', 'cancellation_requested'])
      .gte('lesson_date', today)
      .order('lesson_date'),
    supabase
      .from('one_time_bookings')
      .select('id, specific_date, start_time, duration_minutes, status, cancellation_reason')
      .ilike('student_email', email)
      .eq('teacher_id', teacherId)
      .in('status', ['pending', 'approved', 'cancellation_requested'])
      .gte('specific_date', today)
      .order('specific_date'),
  ]);

  const templateIds = [...new Set((recurring ?? []).map((b) => b.template_id))];
  const { data: templates } = templateIds.length
    ? await supabase.from('slot_templates').select('id, day_of_week, start_time, duration_minutes').in('id', templateIds)
    : { data: [] };
  const templateMap = new Map((templates ?? []).map((t) => [t.id, t]));

  const recurringOut = (recurring ?? []).map((b) => {
    const t = templateMap.get(b.template_id);
    const startTime = t ? formatTime(t.start_time) : '';
    return {
      id: b.id,
      booking_type: 'recurring' as const,
      status: b.status,
      start_time: startTime,
      end_time: getEndTime(startTime, t?.duration_minutes ?? 45),
      specific_date: b.lesson_date,
      series_id: b.series_id,
      cancellation_reason: b.cancellation_reason,
    };
  });

  const oneTimeOut = (oneTime ?? []).map((b) => {
    const startTime = formatTime(b.start_time);
    return {
      id: b.id,
      booking_type: 'one_time' as const,
      status: b.status,
      start_time: startTime,
      end_time: getEndTime(startTime, b.duration_minutes ?? 45),
      specific_date: b.specific_date,
      cancellation_reason: b.cancellation_reason,
    };
  });

  return NextResponse.json([...recurringOut, ...oneTimeOut]);
}
