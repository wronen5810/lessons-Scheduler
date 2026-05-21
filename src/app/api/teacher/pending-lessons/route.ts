import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { formatTime, getEndTime, todayInIsrael } from '@/lib/dates';

export interface PendingLesson {
  date: string;
  start_time: string;
  end_time: string;
  type: 'one_time' | 'recurring';
  status: string;
}

export interface PendingStudentRow {
  student_name: string;
  student_email: string;
  count: number;
  lessons: PendingLesson[];
}

export interface PendingGroupRow {
  group_name: string;
  group_id: string;
  count: number;
  lessons: PendingLesson[];
}

export interface PendingLessonsResponse {
  students: PendingStudentRow[];
  groups: PendingGroupRow[];
}

export async function GET(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const teacherId = auth.user.id;
  const supabase = createServiceSupabase();
  const today = todayInIsrael();
  const includePast = request.nextUrl.searchParams.get('includePast') === '1';

  // Build individual student queries
  let otQuery = supabase
    .from('one_time_bookings')
    .select('student_name, student_email, specific_date, start_time, duration_minutes, status, group_id')
    .eq('teacher_id', teacherId)
    .in('status', ['pending', 'approved'])
    .order('specific_date')
    .order('start_time');

  let recQuery = supabase
    .from('recurring_bookings')
    .select('student_name, student_email, lesson_date, template_id, status, group_id')
    .eq('teacher_id', teacherId)
    .in('status', ['pending', 'approved'])
    .order('lesson_date');

  if (!includePast) {
    otQuery = otQuery.gte('specific_date', today);
    recQuery = recQuery.gte('lesson_date', today);
  }

  const [{ data: allOT }, { data: allRec }, { data: templates }, { data: groups }] = await Promise.all([
    otQuery,
    recQuery,
    supabase.from('slot_templates').select('id, start_time, duration_minutes').eq('teacher_id', teacherId),
    supabase.from('student_groups').select('id, name').eq('teacher_id', teacherId),
  ]);

  const tplMap = new Map((templates ?? []).map((t) => [t.id, t]));
  const groupMap = new Map((groups ?? []).map((g) => [g.id, g]));

  // ── Individual students ──────────────────────────────────────────────────────
  const byStudent = new Map<string, PendingStudentRow>();

  function getOrCreateStudent(email: string, name: string): PendingStudentRow {
    const key = email.toLowerCase();
    if (!byStudent.has(key)) {
      byStudent.set(key, { student_name: name, student_email: key, count: 0, lessons: [] });
    }
    return byStudent.get(key)!;
  }

  for (const b of (allOT ?? []).filter((b) => !b.group_id)) {
    const row = getOrCreateStudent(b.student_email, b.student_name);
    const st = formatTime(b.start_time);
    row.lessons.push({ date: b.specific_date, start_time: st, end_time: getEndTime(st, b.duration_minutes ?? 45), type: 'one_time', status: b.status });
    row.count++;
  }

  for (const b of (allRec ?? []).filter((b) => !b.group_id)) {
    const tpl = tplMap.get(b.template_id);
    const st = tpl ? formatTime(tpl.start_time) : '';
    const row = getOrCreateStudent(b.student_email, b.student_name);
    row.lessons.push({ date: b.lesson_date, start_time: st, end_time: getEndTime(st, tpl?.duration_minutes ?? 45), type: 'recurring', status: b.status });
    row.count++;
  }

  for (const row of byStudent.values()) {
    row.lessons.sort((a, b) => a.date.localeCompare(b.date));
  }

  // ── Groups ───────────────────────────────────────────────────────────────────
  const byGroup = new Map<string, PendingGroupRow>();

  function getOrCreateGroup(groupId: string): PendingGroupRow {
    if (!byGroup.has(groupId)) {
      byGroup.set(groupId, { group_name: groupMap.get(groupId)?.name ?? groupId, group_id: groupId, count: 0, lessons: [] });
    }
    return byGroup.get(groupId)!;
  }

  for (const b of (allOT ?? []).filter((b) => !!b.group_id)) {
    const row = getOrCreateGroup(b.group_id!);
    const st = formatTime(b.start_time);
    row.lessons.push({ date: b.specific_date, start_time: st, end_time: getEndTime(st, b.duration_minutes ?? 45), type: 'one_time', status: b.status });
    row.count++;
  }

  for (const b of (allRec ?? []).filter((b) => !!b.group_id)) {
    const tpl = tplMap.get(b.template_id);
    const st = tpl ? formatTime(tpl.start_time) : '';
    const row = getOrCreateGroup(b.group_id!);
    row.lessons.push({ date: b.lesson_date, start_time: st, end_time: getEndTime(st, tpl?.duration_minutes ?? 45), type: 'recurring', status: b.status });
    row.count++;
  }

  for (const row of byGroup.values()) {
    row.lessons.sort((a, b) => a.date.localeCompare(b.date));
  }

  return NextResponse.json({
    students: [...byStudent.values()].sort((a, b) => a.student_name.localeCompare(b.student_name)),
    groups: [...byGroup.values()].sort((a, b) => a.group_name.localeCompare(b.group_name)),
  } satisfies PendingLessonsResponse);
}
