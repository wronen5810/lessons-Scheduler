import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

const TABLE_MAP: Record<string, string> = {
  homework: 'notebook_homework',
  notes: 'notebook_notes',
  resources: 'notebook_resources',
  grades: 'notebook_grades',
};

const GROUP_TABLE_MAP: Record<string, string> = {
  homework: 'notebook_group_homework',
  notes: 'notebook_group_notes',
  resources: 'notebook_group_resources',
};

async function resolveIdentity(
  request: NextRequest,
): Promise<{ teacherId: string; studentEmail: string } | NextResponse> {
  const url = new URL(request.url);
  const auth = await requireTeacher();

  if (!auth.error) {
    const email = url.searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
    return { teacherId: auth.user.id, studentEmail: email.toLowerCase() };
  }

  const email = url.searchParams.get('email');
  const teacherId = url.searchParams.get('teacherId');
  if (!email || !teacherId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return { teacherId, studentEmail: email.toLowerCase() };
}

export async function GET(request: NextRequest) {
  const identity = await resolveIdentity(request);
  if (identity instanceof NextResponse) return identity;

  const type = new URL(request.url).searchParams.get('type');
  if (!type || !TABLE_MAP[type]) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  // Find student record to look up group memberships
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('teacher_id', identity.teacherId)
    .ilike('email', identity.studentEmail)
    .single();

  // Fetch individual items and group memberships in parallel
  const indivQuery = supabase
    .from(TABLE_MAP[type])
    .select('*')
    .eq('teacher_id', identity.teacherId)
    .ilike('student_email', identity.studentEmail);

  if (type === 'homework') {
    indivQuery.order('due_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true });
  } else if (type === 'grades') {
    indivQuery.order('test_date', { ascending: false });
  } else {
    indivQuery.order('created_at', { ascending: true });
  }

  const [{ data: indivItems, error }, memberships] = await Promise.all([
    indivQuery,
    student
      ? supabase
          .from('student_group_members')
          .select('group_id, student_groups(id, name)')
          .eq('student_id', student.id)
      : Promise.resolve({ data: [] as { group_id: string; student_groups: unknown }[] }),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Build group items if the student belongs to any groups
  const groupRows = (memberships.data ?? []).map((m) => {
    const g = (Array.isArray(m.student_groups) ? m.student_groups[0] : m.student_groups) as { id: string; name: string } | null;
    return g ? { group_id: g.id, group_name: g.name } : null;
  }).filter(Boolean) as { group_id: string; group_name: string }[];

  let groupItems: unknown[] = [];
  if (groupRows.length > 0 && GROUP_TABLE_MAP[type]) {
    const groupIds = groupRows.map((g) => g.group_id);
    const groupNameById = new Map(groupRows.map((g) => [g.group_id, g.group_name]));

    const groupQuery = supabase
      .from(GROUP_TABLE_MAP[type])
      .select('*')
      .eq('teacher_id', identity.teacherId)
      .in('group_id', groupIds);

    if (type === 'homework') {
      groupQuery.order('due_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true });
    } else {
      groupQuery.order('created_at', { ascending: true });
    }

    const { data: gItems } = await groupQuery;
    groupItems = (gItems ?? []).map((item) => ({
      ...item,
      scope: 'group' as const,
      group_name: groupNameById.get(item.group_id) ?? 'Group',
    }));
  }

  const individualItems = (indivItems ?? []).map((item) => ({ ...item, scope: 'individual' as const }));

  // Merge: individual first, then group items
  return NextResponse.json([...individualItems, ...groupItems]);
}

export async function POST(request: NextRequest) {
  const identity = await resolveIdentity(request);
  if (identity instanceof NextResponse) return identity;

  const body = await request.json();
  const { type, ...fields } = body;
  if (!type || !TABLE_MAP[type]) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from(TABLE_MAP[type])
    .insert({ teacher_id: identity.teacherId, student_email: identity.studentEmail, ...fields })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
