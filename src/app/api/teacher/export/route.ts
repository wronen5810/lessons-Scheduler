import { NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase, createAuthSupabase } from '@/lib/supabase-server';
import { formatTime, getEndTime } from '@/lib/dates';

export async function GET() {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const teacherId = auth.user.id;
  const supabase = createServiceSupabase();
  const authClient = await createAuthSupabase();

  const { data: { user } } = await authClient.auth.getUser();
  const email = user?.email ?? '';

  // First batch: everything except group members (which needs group IDs)
  const [
    { data: profile },
    { data: students },
    { data: groups },
    { data: oneTimeBookings },
    { data: recurringBookings },
    { data: templates },
    { data: notesRows },
    { data: homeworkRows },
    { data: gradesRows },
    { data: resourcesRows },
  ] = await Promise.all([
    supabase.from('profiles').select('display_name, phone, tutoring_area, quote').eq('id', teacherId).single(),
    supabase.from('students').select('id, name, email, phone, rate, notes, is_active, created_at').eq('teacher_id', teacherId).order('name'),
    supabase.from('student_groups').select('id, name, rate').eq('teacher_id', teacherId).order('name'),
    supabase.from('one_time_bookings').select('id, student_name, student_email, specific_date, start_time, duration_minutes, status, group_id, created_at').eq('teacher_id', teacherId).order('specific_date'),
    supabase.from('recurring_bookings').select('id, student_name, student_email, lesson_date, template_id, status, group_id, created_at').eq('teacher_id', teacherId).order('lesson_date'),
    supabase.from('slot_templates').select('id, start_time, duration_minutes').eq('teacher_id', teacherId),
    supabase.from('notebook_notes').select('student_email, note, created_at').eq('teacher_id', teacherId).order('created_at'),
    supabase.from('notebook_homework').select('student_email, due_date, notes, created_at').eq('teacher_id', teacherId).order('due_date'),
    supabase.from('notebook_grades').select('student_email, test_date, grade, comments, created_at').eq('teacher_id', teacherId).order('test_date'),
    supabase.from('notebook_resources').select('student_email, description, url, created_at').eq('teacher_id', teacherId).order('created_at'),
  ]);

  // Second batch: group members filtered by actual group IDs (table has no teacher_id column)
  const groupIds = (groups ?? []).map((g) => g.id);
  const { data: groupMembers } = groupIds.length > 0
    ? await supabase.from('student_group_members').select('group_id, student_id, students(id, name, email)').in('group_id', groupIds)
    : { data: [] };

  const p = (profile ?? {}) as Record<string, unknown>;
  const tplMap = new Map((templates ?? []).map((t) => [t.id, t]));
  const groupMap = new Map((groups ?? []).map((g) => [g.id, g]));

  // email → student id lookup
  const emailToId = new Map((students ?? []).map((s) => [s.email?.toLowerCase() ?? '', s.id]));

  // Build lessons list
  const lessons: {
    date: string; start_time: string; end_time: string; type: string;
    student_or_group: string; student_id: string; email: string; status: string; created_at: string;
  }[] = [];

  for (const b of oneTimeBookings ?? []) {
    const st = formatTime(b.start_time);
    const groupName = b.group_id ? (groupMap.get(b.group_id)?.name ?? b.group_id) : null;
    lessons.push({
      date: b.specific_date,
      start_time: st,
      end_time: getEndTime(st, b.duration_minutes ?? 45),
      type: 'one_time',
      student_or_group: groupName ?? b.student_name,
      student_id: groupName ? '' : (emailToId.get(b.student_email?.toLowerCase() ?? '') ?? ''),
      email: groupName ? '' : b.student_email,
      status: b.status,
      created_at: b.created_at,
    });
  }

  for (const b of recurringBookings ?? []) {
    const tpl = tplMap.get(b.template_id);
    const st = tpl ? formatTime(tpl.start_time) : '';
    const groupName = b.group_id ? (groupMap.get(b.group_id)?.name ?? b.group_id) : null;
    lessons.push({
      date: b.lesson_date,
      start_time: st,
      end_time: getEndTime(st, tpl?.duration_minutes ?? 45),
      type: 'recurring',
      student_or_group: groupName ?? b.student_name,
      student_id: groupName ? '' : (emailToId.get(b.student_email?.toLowerCase() ?? '') ?? ''),
      email: groupName ? '' : b.student_email,
      status: b.status,
      created_at: b.created_at,
    });
  }

  lessons.sort((a, b) => a.date.localeCompare(b.date));

  // Build billing (completed lessons only)
  const billingMap = new Map<string, { name: string; email: string; id: string; rate: number | null; completed: number }>();
  const studentRateMap = new Map((students ?? []).map((s) => [s.email?.toLowerCase() ?? '', s.rate]));
  const studentNameMap = new Map((students ?? []).map((s) => [s.email?.toLowerCase() ?? '', s.name]));

  for (const b of (oneTimeBookings ?? []).filter((x) => x.status === 'completed' && !x.group_id)) {
    const key = b.student_email.toLowerCase();
    if (!billingMap.has(key)) billingMap.set(key, { name: studentNameMap.get(key) ?? b.student_name, email: key, id: emailToId.get(key) ?? '', rate: studentRateMap.get(key) ?? null, completed: 0 });
    billingMap.get(key)!.completed++;
  }
  for (const b of (recurringBookings ?? []).filter((x) => x.status === 'completed' && !x.group_id)) {
    const key = b.student_email.toLowerCase();
    if (!billingMap.has(key)) billingMap.set(key, { name: studentNameMap.get(key) ?? b.student_name, email: key, id: emailToId.get(key) ?? '', rate: studentRateMap.get(key) ?? null, completed: 0 });
    billingMap.get(key)!.completed++;
  }

  const billing = [...billingMap.values()].map((r) => ({
    student_id: r.id,
    student_name: r.name,
    student_email: r.email,
    rate: r.rate,
    completed_lessons: r.completed,
    balance: r.rate != null ? r.completed * r.rate : null,
  })).sort((a, b) => a.student_name.localeCompare(b.student_name));

  // Build group members list
  const resolvedGroupMembers = (groupMembers ?? []).map((m) => {
    const s = (Array.isArray(m.students) ? m.students[0] : m.students) as { id: string; name: string; email: string } | null;
    const g = groupMap.get(m.group_id);
    return {
      group_name: g?.name ?? m.group_id,
      student_id: s?.id ?? m.student_id ?? '',
      student_name: s?.name ?? '',
      student_email: s?.email ?? '',
    };
  }).sort((a, b) => a.group_name.localeCompare(b.group_name));

  return NextResponse.json({
    teacher: {
      name: (p.display_name as string) ?? '',
      email,
      phone: (p.phone as string) ?? '',
      tutoring_area: (p.tutoring_area as string) ?? '',
      quote: (p.quote as string) ?? '',
    },
    students: (students ?? []).map((s) => ({
      student_id: s.id,
      name: s.name,
      email: s.email ?? '',
      phone: s.phone ?? '',
      rate: s.rate ?? '',
      notes: s.notes ?? '',
      is_active: s.is_active,
      created_at: s.created_at,
    })),
    groups: (groups ?? []).map((g) => ({
      name: g.name,
      rate: g.rate ?? '',
      member_count: resolvedGroupMembers.filter((m) => m.group_name === g.name).length,
    })),
    groupMembers: resolvedGroupMembers,
    lessons,
    billing,
    notes: (notesRows ?? []).map((r) => ({
      student_id: emailToId.get(r.student_email?.toLowerCase() ?? '') ?? '',
      student_email: r.student_email,
      note: r.note,
      created_at: r.created_at,
    })),
    homework: (homeworkRows ?? []).map((r) => ({
      student_id: emailToId.get(r.student_email?.toLowerCase() ?? '') ?? '',
      student_email: r.student_email,
      due_date: r.due_date ?? '',
      notes: r.notes,
      created_at: r.created_at,
    })),
    grades: (gradesRows ?? []).map((r) => ({
      student_id: emailToId.get(r.student_email?.toLowerCase() ?? '') ?? '',
      student_email: r.student_email,
      test_date: r.test_date,
      grade: r.grade,
      comments: r.comments ?? '',
      created_at: r.created_at,
    })),
    resources: (resourcesRows ?? []).map((r) => ({
      student_id: emailToId.get(r.student_email?.toLowerCase() ?? '') ?? '',
      student_email: r.student_email,
      description: r.description,
      url: r.url,
      created_at: r.created_at,
    })),
  });
}
