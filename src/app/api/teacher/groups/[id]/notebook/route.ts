import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';
import { createServiceSupabase } from '@/lib/supabase-server';

const TABLE_MAP: Record<string, string> = {
  homework: 'notebook_group_homework',
  notes: 'notebook_group_notes',
  resources: 'notebook_group_resources',
};

async function resolveGroup(groupId: string, teacherId: string) {
  const supabase = createServiceSupabase();
  const { data } = await supabase
    .from('student_groups')
    .select('id')
    .eq('id', groupId)
    .eq('teacher_id', teacherId)
    .single();
  return data;
}

// GET /api/teacher/groups/[id]/notebook?type=homework|notes|resources
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { id } = await params;
  const type = new URL(request.url).searchParams.get('type');
  if (!type || !TABLE_MAP[type]) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

  const group = await resolveGroup(id, auth.user.id);
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  const supabase = createServiceSupabase();
  const query = supabase.from(TABLE_MAP[type]).select('*').eq('teacher_id', auth.user.id).eq('group_id', id);

  if (type === 'homework') {
    query.order('due_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true });
  } else {
    query.order('created_at', { ascending: true });
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/teacher/groups/[id]/notebook — add item to group notebook
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const { type, ...fields } = body;
  if (!type || !TABLE_MAP[type]) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

  const group = await resolveGroup(id, auth.user.id);
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from(TABLE_MAP[type])
    .insert({ teacher_id: auth.user.id, group_id: id, ...fields })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
