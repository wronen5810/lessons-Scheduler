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

  // Find this student's record to look up group memberships
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('teacher_id', teacherId)
    .ilike('email', email)
    .single();

  const studentId = student?.id ?? null;

  // Fetch group IDs this student belongs to (for this teacher)
  const groupIds: string[] = [];
  if (studentId) {
    const { data: memberships } = await supabase
      .from('student_group_members')
      .select('group_id, student_groups!inner(teacher_id)')
      .eq('student_id', studentId);
    for (const m of memberships ?? []) {
      const g = (Array.isArray(m.student_groups) ? m.student_groups[0] : m.student_groups) as { teacher_id: string } | null;
      if (g?.teacher_id === teacherId) groupIds.push(m.group_id);
    }
  }

  const [{ data: recurring }, { data: oneTime }, { data: groupRecurring }, { data: groupOneTime }, { data: groupRows }] = await Promise.all([
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
    groupIds.length
      ? supabase
          .from('recurring_bookings')
          .select('id, template_id, status, lesson_date, group_id')
          .eq('teacher_id', teacherId)
          .in('group_id', groupIds)
          .in('status', ['approved', 'cancellation_requested'])
          .gte('lesson_date', today)
          .order('lesson_date')
      : Promise.resolve({ data: [] }),
    groupIds.length
      ? supabase
          .from('one_time_bookings')
          .select('id, specific_date, start_time, duration_minutes, status, group_id')
          .eq('teacher_id', teacherId)
          .in('group_id', groupIds)
          .in('status', ['approved', 'cancellation_requested'])
          .gte('specific_date', today)
          .order('specific_date')
      : Promise.resolve({ data: [] }),
    groupIds.length
      ? supabase.from('student_groups').select('id, name').in('id', groupIds)
      : Promise.resolve({ data: [] }),
  ]);

  const allTemplateIds = [
    ...new Set([
      ...(recurring ?? []).map((b) => b.template_id),
      ...(groupRecurring ?? []).map((b) => b.template_id),
    ]),
  ];
  const { data: templates } = allTemplateIds.length
    ? await supabase.from('slot_templates').select('id, day_of_week, start_time, duration_minutes').in('id', allTemplateIds)
    : { data: [] };
  const templateMap = new Map((templates ?? []).map((t) => [t.id, t]));
  const groupNameMap = new Map((groupRows ?? []).map((g) => [g.id, g.name]));

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
      is_group: false,
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
      is_group: false,
    };
  });

  const groupRecurringOut = (groupRecurring ?? []).map((b) => {
    const t = templateMap.get(b.template_id);
    const startTime = t ? formatTime(t.start_time) : '';
    return {
      id: b.id,
      booking_type: 'recurring' as const,
      status: b.status,
      start_time: startTime,
      end_time: getEndTime(startTime, t?.duration_minutes ?? 45),
      specific_date: b.lesson_date,
      is_group: true,
      group_name: groupNameMap.get(b.group_id) ?? 'Group',
    };
  });

  const groupOneTimeOut = (groupOneTime ?? []).map((b) => {
    const startTime = formatTime(b.start_time);
    return {
      id: b.id,
      booking_type: 'one_time' as const,
      status: b.status,
      start_time: startTime,
      end_time: getEndTime(startTime, b.duration_minutes ?? 45),
      specific_date: b.specific_date,
      is_group: true,
      group_name: groupNameMap.get(b.group_id) ?? 'Group',
    };
  });

  return NextResponse.json([...recurringOut, ...oneTimeOut, ...groupRecurringOut, ...groupOneTimeOut]);
}
