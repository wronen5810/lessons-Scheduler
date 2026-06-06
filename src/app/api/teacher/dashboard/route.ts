// GET /api/teacher/dashboard
// Returns all data needed for the teacher dashboard in a single request.
// Replaces 6 separate calls: me/subscription, next-lesson, requests,
// students, messages/inbox, slots.

import { NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { todayInIsrael, TZ } from '@/lib/dates';
import { fromZonedTime } from 'date-fns-tz';

export async function GET() {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const teacherId = auth.user.id;
  const today = todayInIsrael();
  const nowMs = Date.now();
  const supabase = createServiceSupabase();

  // All queries run in parallel — single DB round-trip cost.
  const [
    { data: profile },
    { data: futureRecurring },
    { data: futureOneTime },
    { count: pendingRecurring },
    { count: pendingOneTime },
    { count: todayRecurring },
    { count: todayOneTime },
    { count: studentCount },
    { count: unreadCount },
  ] = await Promise.all([
    // Teacher display name
    supabase.from('profiles').select('display_name').eq('id', teacherId).single(),

    // Future recurring bookings (for next-lesson computation)
    supabase.from('recurring_bookings')
      .select('lesson_date, start_time')
      .eq('teacher_id', teacherId)
      .in('status', ['pending', 'approved'])
      .gte('lesson_date', today)
      .order('lesson_date').order('start_time')
      .limit(20),

    // Future one-time bookings (for next-lesson computation)
    supabase.from('one_time_bookings')
      .select('specific_date, start_time')
      .eq('teacher_id', teacherId)
      .in('status', ['pending', 'approved'])
      .gte('specific_date', today)
      .order('specific_date').order('start_time')
      .limit(20),

    // Pending recurring bookings count (all dates)
    supabase.from('recurring_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .eq('status', 'pending'),

    // Pending one-time bookings count (all dates)
    supabase.from('one_time_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .eq('status', 'pending'),

    // Today's recurring bookings count
    supabase.from('recurring_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .eq('lesson_date', today)
      .in('status', ['pending', 'approved', 'completed']),

    // Today's one-time bookings count
    supabase.from('one_time_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .eq('specific_date', today)
      .in('status', ['pending', 'approved', 'completed']),

    // Active students count
    supabase.from('students')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .eq('is_active', true),

    // Unread messages count
    supabase.from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .eq('direction', 'to_teacher')
      .is('read_at', null),
  ]);

  // Compute next lesson from sorted candidates
  const candidates = [
    ...(futureRecurring ?? []).map((r) => ({ date: r.lesson_date as string, start_time: r.start_time as string })),
    ...(futureOneTime ?? []).map((o) => ({ date: o.specific_date as string, start_time: o.start_time as string })),
  ].sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.start_time.localeCompare(b.start_time));

  let nextLesson: { hours: number; minutes: number } | null = null;
  for (const c of candidates) {
    const lessonUtc = fromZonedTime(`${c.date}T${c.start_time}`, TZ);
    if (lessonUtc.getTime() > nowMs) {
      const diffMs = lessonUtc.getTime() - nowMs;
      const totalMinutes = Math.floor(diffMs / 60000);
      nextLesson = { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
      break;
    }
  }

  return NextResponse.json({
    teacherName: profile?.display_name ?? '',
    nextLesson,
    pendingCount: (pendingRecurring ?? 0) + (pendingOneTime ?? 0),
    todayCount: (todayRecurring ?? 0) + (todayOneTime ?? 0),
    studentCount: studentCount ?? 0,
    unreadCount: unreadCount ?? 0,
  });
}
