import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

// GET /api/teacher/groups — list all groups with members
export async function GET() {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const supabase = createServiceSupabase();
  const teacherId = auth.user.id;

  const { data: groups, error } = await supabase
    .from('student_groups')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const groupIds = (groups ?? []).map((g) => g.id);
  if (groupIds.length === 0) return NextResponse.json([]);

  const { data: members } = await supabase
    .from('student_group_members')
    .select('id, group_id, student_id, added_at, students(name, email)')
    .in('group_id', groupIds);

  const membersByGroup = new Map<string, { id: string; group_id: string; student_id: string; student_name: string; student_email: string; added_at: string }[]>();
  for (const m of members ?? []) {
    const s = (Array.isArray(m.students) ? m.students[0] : m.students) as { name: string; email: string } | null;
    if (!membersByGroup.has(m.group_id)) membersByGroup.set(m.group_id, []);
    membersByGroup.get(m.group_id)!.push({
      id: m.id,
      group_id: m.group_id,
      student_id: m.student_id,
      student_name: s?.name ?? '',
      student_email: s?.email ?? '',
      added_at: m.added_at,
    });
  }

  const result = (groups ?? []).map((g) => ({
    ...g,
    members: membersByGroup.get(g.id) ?? [],
  }));

  return NextResponse.json(result);
}

// POST /api/teacher/groups — create a group
export async function POST(request: NextRequest) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { name, rate } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from('student_groups')
    .insert({ name: name.trim(), rate: rate ?? null, teacher_id: auth.user.id })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A group with this name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ...data, members: [] }, { status: 201 });
}
