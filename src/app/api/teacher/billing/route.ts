import { NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { formatTime, getEndTime } from '@/lib/dates';

export interface BillingRow {
  student_email: string;
  student_name: string;
  rate: number | null;
  completed_lessons: number;
  balance: number | null;
  lessons: { date: string; start_time: string; end_time: string; booking_type: string; status: string }[];
}

// GET /api/teacher/billing
// Returns students with completed or paid lessons and their total balance.
export async function GET() {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();
  const teacherId = auth.user.id;

  const [{ data: students }, { data: otCompleted }, { data: recCompleted }] = await Promise.all([
    supabase.from('students').select('email, name, rate').eq('teacher_id', teacherId),
    supabase
      .from('one_time_bookings')
      .select('student_email, specific_date, start_time, duration_minutes, status')
      .eq('teacher_id', teacherId)
      .in('status', ['completed', 'paid']),
    supabase
      .from('recurring_bookings')
      .select('student_email, started_date, template_id, status')
      .eq('teacher_id', teacherId)
      .in('status', ['completed', 'paid']),
  ]);

  // Fetch templates needed for recurring
  const templateIds = [...new Set((recCompleted ?? []).map((b) => b.template_id))];
  const { data: templates } = templateIds.length
    ? await supabase.from('slot_templates').select('id, start_time, duration_minutes').in('id', templateIds)
    : { data: [] };
  const tplMap = new Map((templates ?? []).map((t) => [t.id, t]));

  const studentMap = new Map((students ?? []).map((s) => [s.email.toLowerCase(), s]));

  const byStudent = new Map<string, BillingRow>();

  function getOrCreate(email: string): BillingRow {
    const key = email.toLowerCase();
    if (!byStudent.has(key)) {
      const s = studentMap.get(key);
      byStudent.set(key, {
        student_email: key,
        student_name: s?.name ?? email,
        rate: s?.rate ?? null,
        completed_lessons: 0,
        balance: null,
        lessons: [],
      });
    }
    return byStudent.get(key)!;
  }

  for (const b of otCompleted ?? []) {
    const row = getOrCreate(b.student_email);
    const st = formatTime(b.start_time);
    row.lessons.push({ date: b.specific_date, start_time: st, end_time: getEndTime(st, b.duration_minutes ?? 45), booking_type: 'one_time', status: b.status });
    row.completed_lessons++;
  }

  for (const b of recCompleted ?? []) {
    const row = getOrCreate(b.student_email);
    const tpl = tplMap.get(b.template_id);
    const st = tpl ? formatTime(tpl.start_time) : '';
    row.lessons.push({ date: b.started_date, start_time: st, end_time: getEndTime(st, tpl?.duration_minutes ?? 45), booking_type: 'recurring', status: b.status });
    row.completed_lessons++;
  }

  for (const row of byStudent.values()) {
    row.balance = row.rate != null ? row.completed_lessons * row.rate : null;
    row.lessons.sort((a, b) => a.date.localeCompare(b.date));
  }

  const result = [...byStudent.values()]
    .filter((r) => r.completed_lessons > 0)
    .sort((a, b) => a.student_name.localeCompare(b.student_name));

  return NextResponse.json(result);
}
