import { NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';
import { formatTime, getEndTime } from '@/lib/dates';

export interface BillingRow {
  student_id: string | null;
  student_email: string;
  student_name: string;
  rate: number | null;
  completed_lessons: number;
  balance: number | null;
  unallocated_credits: number;
  net_balance: number | null;
  last_reminder_at: string | null;
  lessons: { date: string; start_time: string; end_time: string; booking_type: string; status: string }[];
  payments: { id: string; amount: number; note: string | null; paid_at: string; booking_id: string | null }[];
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
  members: { student_id: string; student_name: string; student_email: string; unpaid_lessons: number; unpaid_balance: number | null; last_reminder_at: string | null }[];
  lessons: { date: string; start_time: string; end_time: string; booking_type: string; booking_id: string; status: string }[];
}

export async function GET() {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  try {
    return await getBillingData(auth.user.id);
  } catch (err) {
    console.error('Billing route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getBillingData(teacherId: string) {
  const supabase = createServiceSupabase();

  const [
    { data: students },
    { data: otDone },
    { data: recDone },
    { data: groups },
    { data: templates },
    { data: allStudentPayments, error: paymentsError },
  ] = await Promise.all([
    supabase.from('students').select('id, email, name, rate').eq('teacher_id', teacherId),
    supabase
      .from('one_time_bookings')
      .select('id, student_email, student_name, specific_date, start_time, duration_minutes, status, group_id')
      .eq('teacher_id', teacherId)
      .eq('status', 'completed'),
    supabase
      .from('recurring_bookings')
      .select('id, student_email, student_name, lesson_date, template_id, status, group_id')
      .eq('teacher_id', teacherId)
      .eq('status', 'completed'),
    supabase.from('student_groups').select('id, name, rate').eq('teacher_id', teacherId),
    supabase.from('slot_templates').select('id, start_time, duration_minutes').eq('teacher_id', teacherId),
    supabase
      .from('student_payments')
      .select('id, student_id, amount, note, booking_id, paid_at')
      .eq('teacher_id', teacherId)
      .is('booking_id', null)
      .order('paid_at', { ascending: false }),
  ]);

  if (paymentsError) {
    console.error('student_payments query error:', paymentsError.message);
    // Surface the error so UI can detect missing migration
    return NextResponse.json({ error: `student_payments: ${paymentsError.message}`, individual: [], groups: [] }, { status: 200 });
  }

  const tplMap = new Map((templates ?? []).map((t) => [t.id, t]));

  // Build unallocated credits per student_id
  const unallocatedByStudentId = new Map<string, { id: string; amount: number; note: string | null; paid_at: string; booking_id: string | null }[]>();
  for (const p of allStudentPayments ?? []) {
    if (!unallocatedByStudentId.has(p.student_id)) unallocatedByStudentId.set(p.student_id, []);
    unallocatedByStudentId.get(p.student_id)!.push({ id: p.id, amount: Number(p.amount), note: p.note, paid_at: p.paid_at, booking_id: p.booking_id });
  }

  // Fetch group members and payment records
  const groupIds = (groups ?? []).map((g) => g.id);
  const groupBookingIds = [
    ...(otDone ?? []).filter((b) => b.group_id).map((b) => b.id),
    ...(recDone ?? []).filter((b) => b.group_id).map((b) => b.id),
  ];

  const [{ data: allMembers }, { data: allPayments }, { data: allMessages }] = await Promise.all([
    groupIds.length
      ? supabase.from('student_group_members').select('group_id, student_id, students(name, email)').in('group_id', groupIds)
      : Promise.resolve({ data: [] }),
    groupBookingIds.length
      ? supabase.from('group_booking_payments').select('booking_type, booking_id, student_id').eq('teacher_id', teacherId).in('booking_id', groupBookingIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from('messages')
      .select('student_email, sent_at')
      .eq('teacher_id', teacherId)
      .eq('direction', 'to_student')
      .order('sent_at', { ascending: false }),
  ]);

  // Map: student_email → latest sent_at
  const lastReminderMap = new Map<string, string>();
  for (const msg of allMessages ?? []) {
    const key = msg.student_email.toLowerCase();
    if (!lastReminderMap.has(key)) lastReminderMap.set(key, msg.sent_at);
  }

  // Map: booking_id → Set of paid student_ids
  const paidByBooking = new Map<string, Set<string>>();
  for (const p of allPayments ?? []) {
    if (!paidByBooking.has(p.booking_id)) paidByBooking.set(p.booking_id, new Set());
    paidByBooking.get(p.booking_id)!.add(p.student_id);
  }

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
  const studentMap = new Map(
    (students ?? [])
      .filter((s): s is typeof s & { email: string } => s.email != null)
      .map((s) => [s.email.toLowerCase(), s])
  );
  const studentById = new Map((students ?? []).map((s) => [s.id, s]));

  // ── Individual student billing ──────────────────────────────────
  const byStudent = new Map<string, BillingRow>();

  function getOrCreate(email: string, nameFromBooking: string): BillingRow {
    const key = email.toLowerCase();
    if (!byStudent.has(key)) {
      const s = studentMap.get(key);
      byStudent.set(key, {
        student_id: s?.id ?? null,
        student_email: key,
        student_name: s?.name ?? nameFromBooking,
        rate: s?.rate ?? null,
        completed_lessons: 0,
        balance: null,
        unallocated_credits: 0,
        net_balance: null,
        last_reminder_at: null,
        lessons: [],
        payments: [],
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

  // Ensure students with unallocated payments appear even if they have no completed lessons
  for (const [studentId, credits] of unallocatedByStudentId.entries()) {
    const s = studentById.get(studentId);
    // Use email as key if available, else fall back to student_id so no-email students still appear
    const key = s?.email ? s.email.toLowerCase() : `sid:${studentId}`;
    if (!byStudent.has(key)) {
      byStudent.set(key, {
        student_id: studentId,
        student_email: s?.email?.toLowerCase() ?? '',
        student_name: s?.name ?? '',
        rate: s?.rate ?? null,
        completed_lessons: 0,
        balance: null,
        unallocated_credits: credits.reduce((sum, p) => sum + p.amount, 0),
        net_balance: null,
        last_reminder_at: s?.email ? (lastReminderMap.get(s.email.toLowerCase()) ?? null) : null,
        lessons: [],
        payments: credits,
      });
    }
  }

  for (const row of byStudent.values()) {
    row.balance = row.rate != null ? row.completed_lessons * row.rate : null;
    row.last_reminder_at = lastReminderMap.get(row.student_email) ?? null;
    row.lessons.sort((a, b) => a.date.localeCompare(b.date));
    if (row.student_id) {
      const credits = unallocatedByStudentId.get(row.student_id) ?? [];
      row.unallocated_credits = credits.reduce((s, p) => s + p.amount, 0);
      row.payments = credits;
      row.net_balance = row.balance != null ? Math.max(0, row.balance - row.unallocated_credits) : null;
    } else {
      row.net_balance = row.balance;
    }
  }

  const individualBilling = [...byStudent.values()]
    .filter((r) => r.completed_lessons > 0 || r.unallocated_credits > 0)
    .sort((a, b) => a.student_name.localeCompare(b.student_name));

  // ── Group billing ───────────────────────────────────────────────
  const byGroup = new Map<string, { lessons: { date: string; start_time: string; end_time: string; booking_type: string; booking_id: string; status: string }[] }>();

  for (const b of otDone ?? []) {
    if (!b.group_id) continue;
    if (!byGroup.has(b.group_id)) byGroup.set(b.group_id, { lessons: [] });
    const st = formatTime(b.start_time);
    byGroup.get(b.group_id)!.lessons.push({ date: b.specific_date, start_time: st, end_time: getEndTime(st, b.duration_minutes ?? 45), booking_type: 'one_time', booking_id: b.id, status: b.status });
  }

  for (const b of recDone ?? []) {
    if (!b.group_id) continue;
    if (!byGroup.has(b.group_id)) byGroup.set(b.group_id, { lessons: [] });
    const tpl = tplMap.get(b.template_id);
    const st = tpl ? formatTime(tpl.start_time) : '';
    byGroup.get(b.group_id)!.lessons.push({ date: b.lesson_date, start_time: st, end_time: getEndTime(st, tpl?.duration_minutes ?? 45), booking_type: 'recurring', booking_id: b.id, status: b.status });
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

    // Count unpaid lessons per student
    const membersWithBalance = members.map((m) => {
      const unpaidLessons = lessons.filter((l) => !paidByBooking.get(l.booking_id)?.has(m.student_id)).length;
      return {
        ...m,
        unpaid_lessons: unpaidLessons,
        unpaid_balance: perStudentRate != null ? unpaidLessons * perStudentRate : null,
        last_reminder_at: lastReminderMap.get(m.student_email.toLowerCase()) ?? null,
      };
    });

    const totalUnpaidLessons = membersWithBalance.reduce((sum, m) => sum + m.unpaid_lessons, 0);
    const totalUnpaidBalance = perStudentRate != null ? totalUnpaidLessons * perStudentRate : null;

    groupBilling.push({
      group_id: groupId,
      group_name: group.name,
      rate: group.rate,
      member_count: memberCount,
      per_student_rate: perStudentRate,
      completed_lessons: lessons.length,
      balance_per_student: perStudentRate != null ? lessons.length * perStudentRate : null,
      total_balance: totalUnpaidBalance,
      members: membersWithBalance,
      lessons,
    });
  }

  groupBilling.sort((a, b) => a.group_name.localeCompare(b.group_name));

  return NextResponse.json({
    individual: individualBilling,
    groups: groupBilling,
    _debug: {
      paymentsFound: (allStudentPayments ?? []).length,
      unallocatedStudentIds: [...unallocatedByStudentId.keys()],
      studentsInMap: students?.length ?? 0,
    },
  });
}
