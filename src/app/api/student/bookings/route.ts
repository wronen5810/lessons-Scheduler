import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase-server';
import { formatTime, getEndTime } from '@/lib/dates';

// GET /api/student/bookings?email=...&teacherId=...
// Returns the student's upcoming approved/cancellation_requested bookings
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.toLowerCase().trim();
  const teacherId = searchParams.get('teacherId');

  if (!email || !teacherId) {
    return NextResponse.json({ error: 'email and teacherId required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: recurring }, { data: oneTime }] = await Promise.all([
    supabase
      .from('recurring_bookings')
      .select('id, template_id, status, started_date, cancellation_reason')
      .eq('student_email', email)
      .eq('teacher_id', teacherId)
      .in('status', ['approved', 'cancellation_requested'])
      .is('ended_date', null),
    supabase
      .from('one_time_bookings')
      .select('id, specific_date, start_time, duration_minutes, status, cancellation_reason')
      .eq('student_email', email)
      .eq('teacher_id', teacherId)
      .in('status', ['approved', 'cancellation_requested'])
      .gte('specific_date', today),
  ]);

  // Enrich recurring with template info
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
      day_of_week: t?.day_of_week ?? 0,
      started_date: b.started_date,
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
