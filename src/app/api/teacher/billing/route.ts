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

export interface GroupBillingRow {
  group_id: string;
  group_name: string;
  rate: number | null;
  member_count: number;
  per_student_rate: number | null;
  completed_lessons: number;
  balance_per_student: number | null;
  total_balance: number | null;
  members: { student_id: string; student_name: string; student_email: string }[];
  lessons: { date: string; start_time: string; end_time: string; booking_type: string; status: string }[];
}

export async function GET() {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();
  const teacherId = auth.user.id;

  const [{ data: students }, { data: otDone }, { data: recDone }, { data: groups }] = await Promise.all([
    supabase.from('students').select('email, name, rate').eq('teacher_id', teacherId),
    supabase
      .from('one_time_bookings')
      .select('student_email, student_name, specific_date, start_time, duration_minutes, status, group_id')
      .eq('teacher_id', teacherId)
      .eq('status', 'completed'),
    supabase
      .from('recurring_bookings')
      .select('student_email, student_name, lesson_date, template_id, status, group_id')
      .eq('teacher_id', teacherId)
      .eq('status', 'completed'),
    supabase
      .from('student_groups')
      .select('id, name, rate')
      .eq('teacher_id', teacherId),
  ]);

  const templateIds = [...new Set((recDone ?? []).map((b) => b.template_id))];
  const { data: templates } = templateIds.length
    ? await supabase.from('slot_templates').select('id, start_time, duration_minutes').in('id', templateIds)
    : { data: [] };
  const tplMap = new Map((templates ?? []).map((t) => [t.id, t]));

  // Fetch group members for groups that have completed lessons
  const groupIds = (groups ?? []).map((g) => g.id);
  const { data: allMembers } = groupIds.length
    ? await supabase
        .from('student_group_members')
        .select('group_id, student_id, students(name, email)')
        .in('group_id', groupIds)
    : { data: [] };

  const membersByGroup = new Map<string, { student_id: string; student_name: string; student_email: string }[]>();
  for (const m of allMembers ?? []) {
    const s = (Array.isArray(m.students) ? m.students[0] : m.students) as { name: string; email: string } | null;
    if (!membersByGroup.has(m.group_id)) membersByGroup.set(m.group_id, []);
    membersByGroup.get(m.group_id)!.push({
      student_id: m.student_id,
      student_name: s?.name ?? '',
      student_email: s?.email ?? '',
    });
  }

  const groupMap = new Map((groups ?? []).map((g) => [g.id, g]));
  const studentMap = new Map((students ?? []).map((s) => [s.email.toLowerCase(), s]));

  // ── Individual student billing ──────────────────────────────────
  const byStudent = new Map<string, BillingRow>();

  function getOrCreate(email: string, nameFromBooking: string): BillingRow {
    const key = email.toLowerCase();
    if (!byStudent.has(key)) {
      const s = studentMap.get(key);
      byStudent.set(key, {
        student_email: key,
        student_name: s?.name ?? nameFromBooking,
        rate: s?.rate ?? null,
        completed_lessons: 0,
        balance: null,
        lessons: [],
      });
    }
    return byStudent.get(key)!;
  }

  for (const b of otDone ?? []) {
    if (b.group_id) continue; // handled separately
    const row = getOrCreate(b.student_email, b.student_name);
    const st = formatTime(b.start_time);
    row.lessons.push({ date: b.specific_date, start_time: st, end_time: getEndTime(st, b.duration_minutes ?? 45), booking_type: 'one_time', status: b.status });
    row.completed_lessons++;
  }

  for (const b of recDone ?? []) {
    if (b.group_id) continue; // handled separately
    const row = getOrCreate(b.student_email, b.student_name);
    const tpl = tplMap.get(b.template_id);
    const st = tpl ? formatTime(tpl.start_time) : '';
    row.lessons.push({ date: b.lesson_date, start_time: st, end_time: getEndTime(st, tpl?.duration_minutes ?? 45), booking_type: 'recurring', status: b.status });
    row.completed_lessons++;
  }

  for (const row of byStudent.values()) {
    row.balance = row.rate != null ? row.completed_lessons * row.rate : null;
    row.lessons.sort((a, b) => a.date.localeCompare(b.date));
  }

  const individualBilling = [...byStudent.values()]
    .filter((r) => r.completed_lessons > 0)
    .sort((a, b) => a.student_name.localeCompare(b.student_name));

  // ── Group billing ───────────────────────────────────────────────
  const byGroup = new Map<string, { lessons: { date: string; start_time: string; end_time: string; booking_type: string; status: string }[] }>();

  for (const b of otDone ?? []) {
    if (!b.group_id) continue;
    if (!byGroup.has(b.group_id)) byGroup.set(b.group_id, { lessons: [] });
    const st = formatTime(b.start_time);
    byGroup.get(b.group_id)!.lessons.push({ date: b.specific_date, start_time: st, end_time: getEndTime(st, b.duration_minutes ?? 45), booking_type: 'one_time', status: b.status });
  }

  for (const b of recDone ?? []) {
    if (!b.group_id) continue;
    if (!byGroup.has(b.group_id)) byGroup.set(b.group_id, { lessons: [] });
    const tpl = tplMap.get(b.template_id);
    const st = tpl ? formatTime(tpl.start_time) : '';
    byGroup.get(b.group_id)!.lessons.push({ date: b.lesson_date, start_time: st, end_time: getEndTime(st, tpl?.duration_minutes ?? 45), booking_type: 'recurring', status: b.status });
  }

  const groupBilling: GroupBillingRow[] = [];
  for (const [groupId, { lessons }] of byGroup.entries()) {
    if (lessons.length === 0) continue;
    const group = groupMap.get(groupId);
    if (!group) continue;
    const members = membersByGroup.get(groupId) ?? [];
    const memberCount = members.length;
    const perStudentRate = group.rate != null && memberCount > 0 ? group.rate / memberCount : null;
    lessons.sort((a, b) => a.date.localeCompare(b.date));
    groupBilling.push({
      group_id: groupId,
      group_name: group.name,
      rate: group.rate,
      member_count: memberCount,
      per_student_rate: perStudentRate,
      completed_lessons: lessons.length,
      balance_per_student: perStudentRate != null ? lessons.length * perStudentRate : null,
      total_balance: group.rate != null ? lessons.length * group.rate : null,
      members,
      lessons,
    });
  }

  groupBilling.sort((a, b) => a.group_name.localeCompare(b.group_name));

  return NextResponse.json({ individual: individualBilling, groups: groupBilling });
}
