import { NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { todayInIsrael, TZ } from '@/lib/dates';
import { fromZonedTime } from 'date-fns-tz';

export async function GET() {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const today = todayInIsrael();
  const nowMs = Date.now();
  const supabase = createServiceSupabase();

  const [{ data: recurring }, { data: oneTime }] = await Promise.all([
    supabase
      .from('recurring_bookings')
      .select('lesson_date, start_time')
      .eq('teacher_id', auth.user.id)
      .in('status', ['pending', 'approved'])
      .gte('lesson_date', today)
      .order('lesson_date')
      .order('start_time')
      .limit(10),
    supabase
      .from('one_time_bookings')
      .select('specific_date, start_time')
      .eq('teacher_id', auth.user.id)
      .in('status', ['pending', 'approved'])
      .gte('specific_date', today)
      .order('specific_date')
      .order('start_time')
      .limit(10),
  ]);

  const candidates = [
    ...(recurring ?? []).map((r) => ({ date: r.lesson_date as string, start_time: r.start_time as string })),
    ...(oneTime ?? []).map((o) => ({ date: o.specific_date as string, start_time: o.start_time as string })),
  ].sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.start_time.localeCompare(b.start_time));

  for (const c of candidates) {
    const lessonUtc = fromZonedTime(`${c.date}T${c.start_time}`, TZ);
    if (lessonUtc.getTime() > nowMs) {
      const diffMs = lessonUtc.getTime() - nowMs;
      const totalMinutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return NextResponse.json({
        date: c.date,
        start_time: c.start_time,
        formatted: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      });
    }
  }

  return NextResponse.json({ date: null });
}
